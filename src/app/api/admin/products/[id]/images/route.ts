import { type NextRequest } from "next/server";
import { requireAdmin } from "@/lib/auth/admin";
import { supabaseAdmin } from "@/lib/auth/customers";

/* ============================================================
 * /api/admin/products/[id]/images — مدير صور المنتج
 * GET    — قائمة صور المنتج (مرتبة)
 * POST   — تسجيل صور (روابط خارجية أو نواتج رفع) — body: { images: [{url, alt?}] }
 * PATCH  — تعيين الصورة الرئيسية أو إعادة الترتيب
 *          • { setMain: url }  → تجعل الصورة أولاً + تحدّث products.img
 *          • { order: [url, …] } → تعيد ترتيب كل الصور
 * DELETE — حذف صورة (?url=…) من DB + من Storage إن كان مساراً داخلياً
 * ملاحظة: products.img يظل مرآة لأول صورة (main) ليتغير الموقع
 *         تلقائياً دون لمس نظام الطلبات.
 * ============================================================ */

function extractStoragePath(url: string): string | null {
  /* تُقبل فقط المسارات داخل bucket product-media — حماية من حذف روابط خارجية */
  const marker = "/storage/v1/object/public/product-media/";
  const i = url.indexOf(marker);
  if (i === -1) return null;
  return url.slice(i + marker.length).split("?")[0];
}

async function syncMain(admin: ReturnType<typeof supabaseAdmin>, productId: string) {
  const { data: rows } = await admin
    .from("product_images")
    .select("url")
    .eq("product_id", productId)
    .order("sort_order", { ascending: true })
    .limit(1);
  const main = ((rows ?? []) as unknown as { url: string }[])[0]?.url;
  if (main) {
    await admin.from("products").update({ img: main } as never).eq("id", productId);
  }
  return main ?? null;
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const { id } = await params;

  const admin = supabaseAdmin();
  const { data, error } = await admin
    .from("product_images")
    .select("id, url, alt, sort_order")
    .eq("product_id", id)
    .order("sort_order", { ascending: true });

  if (error) {
    console.error("[admin/images] list:", error.message);
    return Response.json({ ok: false, error: "db_unavailable" }, { status: 503 });
  }
  return Response.json({ ok: true, images: data ?? [] });
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const { id } = await params;

  let body: { images?: { url?: string; alt?: string }[] };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return Response.json({ ok: false, error: "invalid_body" }, { status: 400 });
  }

  const images = (body.images ?? [])
    .map((x) => ({ url: String(x.url ?? "").trim(), alt: x.alt?.trim() || null }))
    .filter((x) => /^https?:\/\//.test(x.url));
  if (images.length === 0) {
    return Response.json({ ok: false, error: "no_valid_images" }, { status: 400 });
  }

  const admin = supabaseAdmin();
  const { data: existing } = await admin
    .from("product_images")
    .select("url")
    .eq("product_id", id);
  const known = new Set((existing ?? []).map((r: { url: string }) => r.url));
  const fresh = images.filter((x) => !known.has(x.url));
  if (fresh.length === 0) {
    return Response.json({ ok: true, added: 0, images: existing ?? [] });
  }

  const startAt = (existing ?? []).length;
  const rows = fresh.map((x, i) => ({
    product_id: id,
    url: x.url,
    alt: x.alt,
    sort_order: startAt + i,
  }));

  const { error } = await admin.from("product_images").insert(rows as never);
  if (error) {
    console.error("[admin/images] insert:", error.message);
    return Response.json({ ok: false, error: "insert_failed" }, { status: 503 });
  }

  /* أول صورة تُضاف لأول مرة تصبح الرئيسية تلقائياً */
  const { data: product } = await admin
    .from("products")
    .select("img")
    .eq("id", id)
    .maybeSingle<{ img: string }>();
  if (product && !product.img) {
    await syncMain(admin, id);
  }

  return Response.json({ ok: true, added: fresh.length });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const { id } = await params;

  let body: { setMain?: string; order?: string[] };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return Response.json({ ok: false, error: "invalid_body" }, { status: 400 });
  }

  const admin = supabaseAdmin();
  const { data: current } = await admin
    .from("product_images")
    .select("id, url")
    .eq("product_id", id);
  const rows = (current ?? []) as unknown as { id: string; url: string }[];
  if (rows.length === 0) {
    return Response.json({ ok: false, error: "no_images" }, { status: 404 });
  }

  if (typeof body.setMain === "string" && body.setMain) {
    const target = rows.find((r) => r.url === body.setMain);
    if (!target) return Response.json({ ok: false, error: "url_not_found" }, { status: 404 });
    const others = rows
      .filter((r) => r.url !== body.setMain)
      .map((r, i) => ({ id: r.id, sort_order: i + 1 }));
    await admin.from("product_images").upsert(
      [{ id: target.id, sort_order: 0 }, ...others] as never,
      { onConflict: "id" }
    );
    await syncMain(admin, id);
    return Response.json({ ok: true, main: body.setMain });
  }

  if (Array.isArray(body.order) && body.order.length > 0) {
    const wanted = body.order.filter((u) => typeof u === "string" && rows.some((r) => r.url === u));
    const missing = rows
      .filter((r) => !wanted.includes(r.url))
      .map((r) => r.url);
    const finalOrder = [...wanted, ...missing];
    const updates = finalOrder
      .map((url) => rows.find((r) => r.url === url))
      .filter((r): r is { id: string; url: string } => Boolean(r))
      .map((r, i) => ({ id: r.id, sort_order: i }));
    await admin.from("product_images").upsert(updates as never, { onConflict: "id" });
    await syncMain(admin, id);
    return Response.json({ ok: true, order: finalOrder });
  }

  return Response.json({ ok: false, error: "nothing_to_do" }, { status: 400 });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const { id } = await params;

  const url = new URL(request.url).searchParams.get("url");
  if (!url) return Response.json({ ok: false, error: "missing_url" }, { status: 400 });

  const admin = supabaseAdmin();
  const { data: row } = await admin
    .from("product_images")
    .select("id, url")
    .eq("product_id", id)
    .eq("url", url)
    .maybeSingle<{ id: string; url: string }>();

  if (!row) return Response.json({ ok: false, error: "url_not_found" }, { status: 404 });

  const { error } = await admin.from("product_images").delete().eq("id", row.id);
  if (error) {
    console.error("[admin/images] delete:", error.message);
    return Response.json({ ok: false, error: "delete_failed" }, { status: 503 });
  }

  /* إن كانت المحذوفة هي الرئيسية → الصورة التالية ترث الرئيسية */
  const main = await syncMain(admin, id);

  /* حذف الملف من Storage إن كان مرفوعاً داخلياً (وليس رابطاً خارجياً) */
  const path = extractStoragePath(url);
  if (path) {
    const { error: rmErr } = await admin.storage.from("product-media").remove([path]);
    if (rmErr) console.warn("[admin/images] storage remove:", rmErr.message);
  }

  return Response.json({ ok: true, newMain: main });
}
