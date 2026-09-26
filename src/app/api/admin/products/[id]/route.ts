import { type NextRequest } from "next/server";
import { requireAdmin } from "@/lib/auth/admin";
import { supabaseAdmin } from "@/lib/auth/customers";

/* ============================================================
 * /api/admin/products/[id]
 * PATCH  — تعديل منتج (+ المخزون)
 * DELETE — حذف منتج
 * ============================================================ */

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const { id } = await params;
  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return Response.json({ ok: false, error: "invalid_body" }, { status: 400 });
  }

  const patch: Record<string, unknown> = {};
  if (typeof body.name === "string" && body.name.trim()) patch.name = body.name.trim();
  if (typeof body.brand === "string" && body.brand.trim()) patch.brand = body.brand.trim();
  if (typeof body.category === "string" && body.category.trim()) patch.category = body.category.trim();
  if (body.subcategory !== undefined) patch.subcategory = body.subcategory || null;
  if (body.price !== undefined && Number(body.price) >= 0) patch.price = Number(body.price);
  if (body.old_price !== undefined)
    patch.old_price = body.old_price != null && Number(body.old_price) > Number(body.price ?? 0) ? Number(body.old_price) : null;
  if (typeof body.img === "string" && body.img.trim()) patch.img = body.img.trim();
  if (typeof body.desc === "string") patch.desc = body.desc;
  if (Array.isArray(body.specs)) patch.specs = body.specs;
  if (body.badge !== undefined) patch.badge = body.badge || null;
  if (body.is_featured !== undefined) patch.is_featured = Boolean(body.is_featured);
  if (body.is_new !== undefined) patch.is_new = Boolean(body.is_new);

  const admin = supabaseAdmin();

  if (Object.keys(patch).length > 0) {
    const { error } = await admin.from("products").update(patch as never).eq("id", id);
    if (error) {
      console.error("[admin/products] update:", error.message);
      return Response.json({ ok: false, error: "update_failed" }, { status: 503 });
    }
  }

  if (body.stock !== undefined && Number(body.stock) >= 0) {
    await admin
      .from("inventory")
      .upsert({ product_id: id, qty: Number(body.stock), updated_at: new Date().toISOString() } as never, {
        onConflict: "product_id",
      });
  }

  return Response.json({ ok: true });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const { id } = await params;
  const admin = supabaseAdmin();
  const { error } = await admin.from("products").delete().eq("id", id);

  if (error) {
    console.error("[admin/products] delete:", error.message);
    /* مفاتيح أجنبية من الطلبات السابقة قد تمنع الحذف */
    return Response.json({ ok: false, error: "delete_failed" }, { status: 503 });
  }

  return Response.json({ ok: true });
}
