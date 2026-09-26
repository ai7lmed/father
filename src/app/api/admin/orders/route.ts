import { type NextRequest } from "next/server";
import { requireAdmin } from "@/lib/auth/admin";
import { supabaseAdmin } from "@/lib/auth/customers";

/** GET /api/admin/orders — كل الطلبات (فلاتر اختيارية: status / q / limit) */
export async function GET(request: NextRequest) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const sp = new URL(request.url).searchParams;
  const status = sp.get("status");
  const q = sp.get("q")?.trim();
  const limit = Math.min(Number(sp.get("limit")) || 100, 200);

  const admin = supabaseAdmin();
  let query = admin
    .from("orders")
    .select(
      "id, customer_id, status, subtotal, delivery_method, delivery_fee, total, payment_method, ship_name, ship_phone, ship_city, receipt_attached, placed_at"
    )
    .order("placed_at", { ascending: false })
    .limit(limit);

  if (status && status !== "all") query = query.eq("status", status);

  const { data: orders, error } = await query;
  if (error) {
    console.error("[admin/orders] list:", error.message);
    return Response.json({ ok: false, error: "db_unavailable" }, { status: 503 });
  }

  let list = (orders ?? []) as Record<string, unknown>[];

  /* بحث بسيط: رقم الطلب أو اسم أو هاتف العميل */
  if (q) {
    const needle = q.toLowerCase();
    list = list.filter(
      (o) =>
        String(o.id).toLowerCase().includes(needle) ||
        String(o.ship_name ?? "").toLowerCase().includes(needle) ||
        String(o.ship_phone ?? "").includes(needle)
    );
  }

  return Response.json({ ok: true, orders: list });
}
