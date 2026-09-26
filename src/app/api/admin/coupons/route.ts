import { type NextRequest } from "next/server";
import { requireAdmin } from "@/lib/auth/admin";
import { supabaseAdmin } from "@/lib/auth/customers";

/* ============================================================
 * /api/admin/coupons
 * GET  — كل الكوبونات
 * POST — إنشاء كوبون (قيمة، حد أدنى، انتهاء)
 * ============================================================ */

export async function GET() {
  const denied = await requireAdmin();
  if (denied) return denied;

  const admin = supabaseAdmin();
  const { data, error } = await admin
    .from("coupons")
    .select("id, code, customer_id, discount_amount, minimum_product_price, used_at, expires_at, order_id, created_at")
    .order("created_at", { ascending: false })
    .limit(500);

  if (error) {
    console.error("[admin/coupons] list:", error.message);
    return Response.json({ ok: false, error: "db_unavailable" }, { status: 503 });
  }

  return Response.json({ ok: true, coupons: data ?? [] });
}

export async function POST(request: NextRequest) {
  const denied = await requireAdmin();
  if (denied) return denied;

  let body: {
    code?: string;
    discount_amount?: number;
    minimum_product_price?: number;
    expires_at?: string | null;
    customer_id?: string | null;
  };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return Response.json({ ok: false, error: "invalid_body" }, { status: 400 });
  }

  const code = body.code?.trim().toUpperCase();
  const discount = Number(body.discount_amount);
  const minPrice = Number(body.minimum_product_price ?? 0);

  if (!code || !(discount > 0)) {
    return Response.json({ ok: false, error: "missing_fields" }, { status: 400 });
  }

  const admin = supabaseAdmin();
  const { error } = await admin.from("coupons").insert({
    code,
    discount_amount: discount,
    minimum_product_price: minPrice,
    expires_at: body.expires_at || null,
    customer_id: body.customer_id || null,
  } as never);

  if (error) {
    const conflict = error.message.includes("duplicate key");
    return Response.json(
      { ok: false, error: conflict ? "duplicate_code" : "insert_failed" },
      { status: conflict ? 409 : 503 }
    );
  }

  return Response.json({ ok: true, code });
}
