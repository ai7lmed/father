import { requireAdmin } from "@/lib/auth/admin";
import { supabaseAdmin } from "@/lib/auth/customers";

/** GET /api/admin/stats — مؤشرات Overview + آخر الطلبات */
export async function GET() {
  const denied = await requireAdmin();
  if (denied) return denied;

  const admin = supabaseAdmin();

  const [ordersRes, todayRes, prodRes, invRes, recentRes] = await Promise.all([
    admin.from("orders").select("id", { count: "exact", head: true }),
    admin
      .from("orders")
      .select("id", { count: "exact", head: true })
      .gte("placed_at", new Date(new Date().setHours(0, 0, 0, 0)).toISOString()),
    admin.from("products").select("id", { count: "exact", head: true }),
    admin.from("inventory").select("product_id, qty"),
    admin
      .from("orders")
      .select("id, status, total, payment_method, delivery_method, ship_name, placed_at")
      .order("placed_at", { ascending: false })
      .limit(8),
  ]);

  /* إجمالي المبيعات: الطلبات غير الملغاة */
  const { data: totals } = await admin
    .from("orders")
    .select("total, status")
    .neq("status", "cancelled");

  const sales = ((totals ?? []) as { total: number }[]).reduce((s, o) => s + Number(o.total), 0);

  /* المنتجات منخفضة المخزون (qty <= 5) */
  const lowStock = ((invRes.data ?? []) as { product_id: string; qty: number }[])
    .filter((r) => Number(r.qty) <= 5)
    .map((r) => ({ product_id: r.product_id, qty: Number(r.qty) }));

  /* إشارة نجاح منخفضة المخزون فقط إن وُجدت منتجات */
  if (prodRes.error || ordersRes.error) {
    return Response.json({ ok: false, error: "db_unavailable" }, { status: 503 });
  }

  return Response.json({
    ok: true,
    stats: {
      totalOrders: ordersRes.count ?? 0,
      todayOrders: todayRes.count ?? 0,
      totalSales: sales,
      totalProducts: prodRes.count ?? 0,
      lowStock,
    },
    recentOrders: recentRes.data ?? [],
  });
}
