import { type NextRequest } from "next/server";
import { supabaseAdmin } from "@/lib/auth/customers";
import { categories, gamingSubs, products } from "@/lib/products";

/* ============================================================
 * POST /api/admin/seed — زرع الكتالوج في قاعدة البيانات
 * محمي بمفتاح الخادم (x-seed-key = SUPABASE_SERVICE_ROLE_KEY)
 * Idempotent: upsert على كل جدول — آمن لإعادة التشغيل
 * ============================================================ */

export async function POST(request: NextRequest) {
  const key = request.headers.get("x-seed-key");
  if (!key || key !== process.env.SUPABASE_SERVICE_ROLE_KEY)
    return Response.json({ ok: false, error: "forbidden" }, { status: 403 });

  const admin = supabaseAdmin();

  /* ——— 1) التصنيفات ——— */
  const catRows = categories.map((c) => ({
    slug: c.slug,
    name: c.name,
    name_ar: c.nameAr,
    img: c.img,
    active: c.active,
    sort_order: c.sortOrder,
  }));
  const { error: catErr } = await admin
    .from("categories")
    .upsert(catRows as never, { onConflict: "slug" });
  if (catErr) return fail("categories", catErr);

  /* ——— 2) التصنيفات الفرعية (Gaming hub) ——— */
  const subRows = gamingSubs.map((s) => ({
    slug: s.slug,
    parent: s.parent,
    name: s.name,
    name_ar: s.nameAr,
    img: s.img ?? null,
    active: s.active,
    sort_order: s.sortOrder,
  }));
  const { error: subErr } = await admin
    .from("subcategories")
    .upsert(subRows as never, { onConflict: "slug" });
  if (subErr) return fail("subcategories", subErr);

  /* ——— 3) المنتجات ——— */
  const prodRows = products.map((p) => ({
    id: p.id,
    name: p.name,
    brand: p.brand,
    category: p.category,
    subcategory: p.subcategory ?? null,
    price: p.price,
    old_price: p.oldPrice ?? null,
    img: p.img,
    desc: p.desc,
    specs: p.specs ?? [],
    rating: p.rating,
    reviews: p.reviews,
    sold: p.sold,
    badge: p.badge ?? null,
    is_featured: Boolean(p.isFeatured),
    is_new: Boolean(p.isNew),
  }));
  const { error: prodErr } = await admin
    .from("products")
    .upsert(prodRows as never, { onConflict: "id" });
  if (prodErr) return fail("products", prodErr);

  /* ——— 4) الوسوم ——— */
  const tagRows = products.flatMap((p) =>
    (p.tags ?? []).map((t) => ({ product_id: p.id, tag: t }))
  );
  if (tagRows.length) {
    const { error: tagErr } = await admin
      .from("product_tags")
      .upsert(tagRows as never, { onConflict: "product_id,tag" });
    if (tagErr) return fail("product_tags", tagErr);
  }

  /* ——— 5) المخزون ——— */
  const invRows = products.map((p) => ({
    product_id: p.id,
    qty: Math.max(0, p.stock ?? 0),
    updated_at: new Date().toISOString(),
  }));
  const { error: invErr } = await admin
    .from("inventory")
    .upsert(invRows as never, { onConflict: "product_id" });
  if (invErr) return fail("inventory", invErr);

  /* ——— 6) تحقق نهائي بالعدّ ——— */
  const count = async (t: string) => {
    const { count } = await admin
      .from(t)
      .select("*", { count: "exact", head: true });
    return count ?? 0;
  };
  const [c, s, p, tg, inv] = await Promise.all([
    count("categories"),
    count("subcategories"),
    count("products"),
    count("product_tags"),
    count("inventory"),
  ]);

  return Response.json({ ok: true, counts: { categories: c, subcategories: s, products: p, tags: tg, inventory: inv } });
}

function fail(step: string, err: { message: string }) {
  console.error(`[seed] ${step}:`, err.message);
  return Response.json({ ok: false, error: "seed_failed", step, message: err.message }, { status: 503 });
}
