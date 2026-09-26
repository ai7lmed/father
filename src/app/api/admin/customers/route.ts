import { requireAdmin } from "@/lib/auth/admin";
import { supabaseAdmin } from "@/lib/auth/customers";

/** GET /api/admin/customers — العملاء + عدد الطلبات + إجمالي المشتريات */
export async function GET() {
  const denied = await requireAdmin();
  if (denied) return denied;

  const admin = supabaseAdmin();
  const [custRes, ordRes] = await Promise.all([
    admin
      .from("customers")
      .select("id, email, phone, full_name, created_at")
      .order("created_at", { ascending: false })
      .limit(500),
    admin.from("orders").select("customer_id, total, status"),
  ]);

  if (custRes.error || ordRes.error) {
    console.error("[admin/customers]:", custRes.error?.message ?? ordRes.error?.message);
    return Response.json({ ok: false, error: "db_unavailable" }, { status: 503 });
  }

  /* تجميع الطلبات لكل عميل */
  const agg = new Map<string, { count: number; spent: number }>();
  for (const o of (ordRes.data ?? []) as { customer_id: string | null; total: number; status: string }[]) {
    if (!o.customer_id) continue;
    const cur = agg.get(o.customer_id) ?? { count: 0, spent: 0 };
    cur.count += 1;
    if (o.status !== "cancelled") cur.spent += Number(o.total);
    agg.set(o.customer_id, cur);
  }

  return Response.json({
    ok: true,
    customers: (custRes.data ?? []).map((c: { id: string } & Record<string, unknown>) => ({
      ...c,
      orders_count: agg.get(c.id)?.count ?? 0,
      total_spent: agg.get(c.id)?.spent ?? 0,
    })),
  });
}
