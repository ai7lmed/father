import { supabaseServer } from "@/lib/auth/supabase-server";
import { supabaseAdmin } from "@/lib/auth/customers";

/** GET /api/account/orders — طلبات العميل الحالي من قاعدة البيانات */
export async function GET() {
  const supabase = await supabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return Response.json({ ok: false, error: "unauthenticated" }, { status: 401 });

  const admin = supabaseAdmin();
  const { data: orders, error } = await admin
    .from("orders")
    .select("id, status, total, delivery_method, payment_method, placed_at, receipt_attached")
    .eq("customer_id", user.id)
    .order("placed_at", { ascending: false })
    .limit(50);

  if (error) {
    console.error("[account/orders] list:", error.message);
    return Response.json({ ok: false, error: "db_unavailable" }, { status: 503 });
  }

  /* الأصناف لكل طلب (استعلام واحد ثم تجميع) */
  const ids = (orders ?? []).map((o: { id: string }) => o.id);
  const itemsByOrder = new Map<string, { product_id: string; name: string; qty: number; unit_price: number }[]>();

  if (ids.length > 0) {
    const { data: items } = await admin
      .from("order_items")
      .select("order_id, product_id, name, qty, unit_price")
      .in("order_id", ids);

    for (const it of (items ?? []) as { order_id: string; product_id: string; name: string; qty: number; unit_price: number }[]) {
      const list = itemsByOrder.get(it.order_id) ?? [];
      list.push({ product_id: it.product_id, name: it.name, qty: it.qty, unit_price: Number(it.unit_price) });
      itemsByOrder.set(it.order_id, list);
    }
  }

  return Response.json({
    ok: true,
    orders: (orders ?? []).map((o: { id: string } & Record<string, unknown>) => ({
      ...o,
      items: itemsByOrder.get(o.id) ?? [],
    })),
  });
}
