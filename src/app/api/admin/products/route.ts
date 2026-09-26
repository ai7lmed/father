import { type NextRequest } from "next/server";
import { requireAdmin } from "@/lib/auth/admin";
import { supabaseAdmin } from "@/lib/auth/customers";

/* ============================================================
 * /api/admin/products
 * GET   — قائمة المنتجات (مع المخزون)
 * POST  — إضافة منتج جديد
 * ============================================================ */

type ProductInput = {
  id?: string;
  name?: string;
  brand?: string;
  category?: string;
  subcategory?: string | null;
  price?: number;
  old_price?: number | null;
  img?: string;
  desc?: string;
  specs?: [string, string][];
  rating?: number;
  reviews?: number;
  badge?: string | null;
  is_featured?: boolean;
  is_new?: boolean;
  stock?: number;
};

export async function GET() {
  const denied = await requireAdmin();
  if (denied) return denied;

  const admin = supabaseAdmin();
  const { data: products, error } = await admin
    .from("products")
    .select("id, name, brand, category, subcategory, price, old_price, img, badge, is_featured, is_new, created_at")
    .order("created_at", { ascending: false })
    .limit(500);

  if (error) {
    console.error("[admin/products] list:", error.message);
    return Response.json({ ok: false, error: "db_unavailable" }, { status: 503 });
  }

  const { data: inv } = await admin.from("inventory").select("product_id, qty");
  const qtyMap = new Map((inv ?? []).map((r: { product_id: string; qty: number }) => [r.product_id, Number(r.qty)]));

  return Response.json({
    ok: true,
    products: (products ?? []).map((p: Record<string, unknown>) => ({
      ...p,
      stock: qtyMap.get(String(p.id)) ?? 0,
    })),
  });
}

export async function POST(request: NextRequest) {
  const denied = await requireAdmin();
  if (denied) return denied;

  let body: ProductInput;
  try {
    body = (await request.json()) as ProductInput;
  } catch {
    return Response.json({ ok: false, error: "invalid_body" }, { status: 400 });
  }

  /* تحقق أساسي */
  if (!body.name?.trim() || !body.category?.trim() || !(Number(body.price) >= 0) || !body.img?.trim()) {
    return Response.json({ ok: false, error: "missing_fields" }, { status: 400 });
  }

  const admin = supabaseAdmin();
  const id = body.id?.trim() || `QVN-SKU-${Date.now().toString(36).toUpperCase()}`;

  const row = {
    id,
    name: body.name.trim(),
    brand: body.brand?.trim() || "Generic",
    category: body.category.trim(),
    subcategory: body.subcategory?.trim() || null,
    price: Number(body.price),
    old_price: body.old_price != null && Number(body.old_price) > Number(body.price) ? Number(body.old_price) : null,
    img: body.img.trim(),
    desc: body.desc?.trim() || "",
    specs: body.specs ?? [],
    rating: Math.min(5, Math.max(0, Number(body.rating) || 0)),
    reviews: Math.max(0, Number(body.reviews) || 0),
    badge: body.badge || null,
    is_featured: Boolean(body.is_featured),
    is_new: body.is_new ?? true,
  };

  const { error } = await admin.from("products").insert(row as never);
  if (error) {
    console.error("[admin/products] insert:", error.message);
    const conflict = error.message.includes("duplicate key");
    return Response.json(
      { ok: false, error: conflict ? "duplicate_id" : "insert_failed" },
      { status: conflict ? 409 : 503 }
    );
  }

  /* المخزون الابتدائي */
  await admin
    .from("inventory")
    .upsert({ product_id: id, qty: Math.max(0, Number(body.stock) || 0) } as never, { onConflict: "product_id" });

  return Response.json({ ok: true, id });
}
