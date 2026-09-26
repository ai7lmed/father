import { type NextRequest } from "next/server";
import { requireAdmin } from "@/lib/auth/admin";
import { supabaseAdmin } from "@/lib/auth/customers";

/* ============================================================
 * /api/admin/categories — إدارة كاملة للأقسام والفرعية
 * GET    — الأقسام + الفرعية + عدد المنتجات في كل قسم
 * POST   — إضافة category أو subcategory (حسب body.type)
 * PATCH  — تعديل (اسم/صورة/ترتيب/تفعيل): body {type, slug, …fields}
 * DELETE — حذف (?type=&slug=) — يفشل بأمان إن كان القسم عليه منتجات
 * ============================================================ */

export async function GET() {
  const denied = await requireAdmin();
  if (denied) return denied;

  const admin = supabaseAdmin();
  const [cats, subs, prodCounts, subCounts] = await Promise.all([
    admin.from("categories").select("*").order("sort_order", { ascending: true }),
    admin.from("subcategories").select("*").order("sort_order", { ascending: true }),
    admin.from("products").select("category"),
    admin.from("products").select("subcategory").not("subcategory", "is", null),
  ]);

  if (cats.error || subs.error) {
    console.error("[admin/categories] list:", cats.error?.message ?? subs.error?.message);
    return Response.json({ ok: false, error: "db_unavailable" }, { status: 503 });
  }

  const catCount = new Map<string, number>();
  for (const r of (prodCounts.data ?? []) as { category: string }[]) {
    catCount.set(r.category, (catCount.get(r.category) ?? 0) + 1);
  }
  const subCount = new Map<string, number>();
  for (const r of (subCounts.data ?? []) as { subcategory: string | null }[]) {
    if (r.subcategory) subCount.set(r.subcategory, (subCount.get(r.subcategory) ?? 0) + 1);
  }

  return Response.json({
    ok: true,
    categories: (cats.data ?? []).map((c: Record<string, unknown>) => ({
      ...c,
      products_count: catCount.get(String(c.slug)) ?? 0,
    })),
    subcategories: (subs.data ?? []).map((s: Record<string, unknown>) => ({
      ...s,
      products_count: subCount.get(String(s.slug)) ?? 0,
    })),
  });
}

export async function POST(request: NextRequest) {
  const denied = await requireAdmin();
  if (denied) return denied;

  let body: {
    type?: "category" | "subcategory";
    slug?: string;
    parent?: string;
    name?: string;
    name_ar?: string;
    img?: string;
  };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return Response.json({ ok: false, error: "invalid_body" }, { status: 400 });
  }

  const slug = body.slug?.trim().toLowerCase().replace(/[^a-z0-9-]/g, "-");
  const name = body.name?.trim();
  const nameAr = body.name_ar?.trim();
  if (!slug || !name || !nameAr) return Response.json({ ok: false, error: "missing_fields" }, { status: 400 });

  const admin = supabaseAdmin();

  if (body.type === "subcategory") {
    if (!body.parent?.trim()) return Response.json({ ok: false, error: "missing_parent" }, { status: 400 });
    const { count } = await admin
      .from("subcategories")
      .select("slug", { count: "exact", head: true })
      .eq("parent", body.parent.trim());
    const { error } = await admin.from("subcategories").insert({
      slug,
      parent: body.parent.trim(),
      name,
      name_ar: nameAr,
      img: body.img?.trim() || null,
      sort_order: (count ?? 0) + 1,
    } as never);
    if (error) {
      const conflict = error.message.includes("duplicate key");
      return Response.json({ ok: false, error: conflict ? "duplicate_slug" : "insert_failed" }, { status: conflict ? 409 : 503 });
    }
    return Response.json({ ok: true, slug });
  }

  const { count } = await admin.from("categories").select("slug", { count: "exact", head: true });
  const { error } = await admin.from("categories").insert({
    slug,
    name,
    name_ar: nameAr,
    img: body.img?.trim() || null,
    sort_order: (count ?? 0) + 1,
  } as never);
  if (error) {
    const conflict = error.message.includes("duplicate key");
    return Response.json({ ok: false, error: conflict ? "duplicate_slug" : "insert_failed" }, { status: conflict ? 409 : 503 });
  }
  return Response.json({ ok: true, slug });
}

export async function PATCH(request: NextRequest) {
  const denied = await requireAdmin();
  if (denied) return denied;

  let body: {
    type?: "category" | "subcategory";
    slug?: string;
    name?: string;
    name_ar?: string;
    img?: string | null;
    active?: boolean;
    sort_order?: number;
    order?: string[];
    parent?: string;
  };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return Response.json({ ok: false, error: "invalid_body" }, { status: 400 });
  }

  const admin = supabaseAdmin();
  const table = body.type === "subcategory" ? "subcategories" : "categories";

  /* إعادة ترتيب دفعة واحدة */
  if (Array.isArray(body.order) && body.order.length > 0) {
    const updates = body.order.map((slug, i) => ({ slug, sort_order: i + 1 }));
    const { error } = await admin.from(table).upsert(updates as never, { onConflict: "slug" });
    if (error) {
      console.error("[admin/categories] reorder:", error.message);
      return Response.json({ ok: false, error: "update_failed" }, { status: 503 });
    }
    return Response.json({ ok: true });
  }

  const slug = body.slug?.trim();
  if (!slug) return Response.json({ ok: false, error: "missing_slug" }, { status: 400 });

  const patch: Record<string, unknown> = {};
  if (typeof body.name === "string" && body.name.trim()) patch.name = body.name.trim();
  if (typeof body.name_ar === "string" && body.name_ar.trim()) patch.name_ar = body.name_ar.trim();
  if (body.img !== undefined) patch.img = body.img?.trim() || null;
  if (typeof body.active === "boolean") patch.active = body.active;
  if (typeof body.sort_order === "number") patch.sort_order = body.sort_order;
  if (body.type === "subcategory" && typeof body.parent === "string" && body.parent.trim()) {
    patch.parent = body.parent.trim();
  }
  if (Object.keys(patch).length === 0) {
    return Response.json({ ok: false, error: "nothing_to_do" }, { status: 400 });
  }

  const { error } = await admin.from(table).update(patch as never).eq("slug", slug);
  if (error) {
    console.error("[admin/categories] update:", error.message);
    return Response.json({ ok: false, error: "update_failed" }, { status: 503 });
  }
  return Response.json({ ok: true });
}

export async function DELETE(request: NextRequest) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const sp = new URL(request.url).searchParams;
  const type = sp.get("type");
  const slug = sp.get("slug");
  if (!slug) return Response.json({ ok: false, error: "missing_slug" }, { status: 400 });

  const admin = supabaseAdmin();

  /* حماية البيانات: لا حذف قسم عليه منتجات — يُقترح الإخفاء بدلاً منه */
  if (type !== "subcategory") {
    const { count } = await admin
      .from("products")
      .select("id", { count: "exact", head: true })
      .eq("category", slug);
    if ((count ?? 0) > 0) {
      return Response.json(
        { ok: false, error: "category_has_products", count },
        { status: 409 }
      );
    }
  }

  const { error } =
    type === "subcategory"
      ? await admin.from("subcategories").delete().eq("slug", slug)
      : await admin.from("categories").delete().eq("slug", slug);

  if (error) {
    console.error("[admin/categories] delete:", error.message);
    return Response.json({ ok: false, error: "delete_failed" }, { status: 503 });
  }
  return Response.json({ ok: true });
}
