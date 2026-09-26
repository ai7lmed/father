import { requireAdmin } from "@/lib/auth/admin";
import { supabaseAdmin } from "@/lib/auth/customers";

/* ============================================================
 * GET /api/admin/stats — مؤشرات Overview + آخر الطلبات + الأكثر طلباً
 * • جودة البيانات: sources.dataQuality = "db" | "static" | "mixed"
 * • dataQuality تعني جودة مصدر بيانات المتجر (كتالوج المنتجات)،
 *   بينما كل مؤشرات الطلبات والمبيعات في هذه الصفحة حقيقية من DB.
 * ============================================================ */

export async function GET() {
  const denied = await requireAdmin();
  if (denied) return denied;

  const admin = supabaseAdmin();

  const [ordersRes, todayRes, prodRes, invRes, recentRes, catRes, subRes, itemRes, qtyAllRes, catCountRes] =
    await Promise.all([
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
      admin.from("categories").select("slug", { count: "exact", head: true }),
      admin.from("subcategories").select("slug", { count: "exact", head: true }),
      admin.from("order_items").select("product_id, name, qty, unit_price"),
      admin.from("inventory").select("product_id, qty"),
      admin.from("categories").select("slug"),
    ]);

  if (ordersRes.error || prodRes.error) {
    console.error("[admin/stats]:", ordersRes.error?.message ?? prodRes.error?.message);
    return Response.json({ ok: false, error: "db_unavailable" }, { status: 503 });
  }

  /* إجمالي المبيعات: الطلبات غير الملغاة */
  const { data: totals } = await admin
    .from("orders")
    .select("total, status")
    .neq("status", "cancelled");
  const sales = ((totals ?? []) as { total: number }[]).reduce((s, o) => s + Number(o.total), 0);

  const inv = (invRes.data ?? []) as { product_id: string; qty: number }[];
  const lowStock = inv
    .filter((r) => Number(r.qty) > 0 && Number(r.qty) <= 5)
    .map((r) => ({ product_id: r.product_id, qty: Number(r.qty) }));
  const outOfStock = inv.filter((r) => Number(r.qty) <= 0).length;

  /* الأكثر طلباً: تجميع كمية المنتجات المبيعة فعلياً من order_items */
  const soldMap = new Map<string, { name: string; qty: number; revenue: number }>();
  for (const r of (itemRes.data ?? []) as { product_id: string; name: string; qty: number; unit_price: number }[]) {
    const cur = soldMap.get(r.product_id) ?? { name: r.name, qty: 0, revenue: 0 };
    cur.qty += Number(r.qty);
    cur.revenue += Number(r.qty) * Number(r.unit_price);
    soldMap.set(r.product_id, cur);
  }
  const topProducts = [...soldMap.entries()]
    .map(([product_id, v]) => ({ product_id, ...v }))
    .sort((a, b) => b.qty - a.qty)
    .slice(0, 5);

  /* جودة مصدر بيانات الكتالوج (تُعرض فقط في اللوحة) */
  const dbSlugs = new Set(((catCountRes.data ?? []) as { slug: string }[]).map((c) => c.slug));
  const seedSlugs = [
    "phones", "wearables", "audio", "gaming", "accessories",
    "charging", "smart-home", "solar-cameras", "car-gps",
  ];
  const seedPresent = seedSlugs.some((s) => dbSlugs.has(s));
  const sources = {
    dataQuality: (seedPresent ? "mixed" : "db") as "db" | "static" | "mixed",
    message: seedPresent
      ? "بيانات الطلبات والمبيعات حقيقية من قاعدة البيانات. بعض منتجات الكتالوج لا تزال تُقرأ من الملف المحلي — حدّث الكتالوج من صفحة المنتجات لتصبح كل البيانات حية."
      : "كل بيانات المتجر تُقرأ مباشرة من قاعدة البيانات.",
  };

  return Response.json({
    ok: true,
    stats: {
      totalOrders: ordersRes.count ?? 0,
      todayOrders: todayRes.count ?? 0,
      totalSales: sales,
      totalProducts: prodRes.count ?? 0,
      outOfStock,
      totalCategories: catRes.count ?? 0,
      totalSubcategories: subRes.count ?? 0,
      lowStock,
      topProducts,
    },
    recentOrders: recentRes.data ?? [],
    sources,
  });
}
