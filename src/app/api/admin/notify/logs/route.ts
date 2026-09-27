import { supabaseAdmin } from "@/lib/auth/customers";
import { requireAdmin } from "@/lib/auth/admin";

/* ============================================================
 * GET /api/admin/notify/logs — سجل الإشعارات مع آخر 20 طلباً
 * • مدير فقط
 * ============================================================ */

export const dynamic = "force-dynamic";

type OrderRow = {
  id: string;
  ship_name: string;
  ship_phone: string;
  total: number | string;
  status: string;
  placed_at: string;
};

type LogRow = {
  channel: string;
  status: string;
  error: string | null;
  created_at: string;
};

type InvoiceLink = { order_id: string; url: string };

export async function GET() {
  const guard = await requireAdmin();
  if (guard) return guard;

  const admin = supabaseAdmin();

  const [{ data: orders, error: oErr }, { data: logs }, { data: links }] = await Promise.all([
    admin
      .from("orders")
      .select("id, ship_name, ship_phone, total, status, placed_at")
      .order("placed_at", { ascending: false })
      .limit(20),
    admin
      .from("notification_logs")
      .select("order_id, channel, status, error, created_at")
      .order("created_at", { ascending: false })
      .limit(300),
    admin.from("invoice_links").select("order_id, url"),
  ]);

  if (oErr) {
    console.error("[notify-logs] orders:", oErr.message);
    return Response.json({ ok: false, error: "db_error" }, { status: 503 });
  }

  const logMap = new Map<string, LogRow[]>();
  for (const l of (logs ?? []) as (LogRow & { order_id: string })[]) {
    const arr = logMap.get(l.order_id) ?? [];
    if (!arr.some((x) => x.channel === l.channel)) arr.push(l);
    logMap.set(l.order_id, arr);
  }

  const linkMap = new Map<string, string>();
  for (const l of (links ?? []) as InvoiceLink[]) linkMap.set(l.order_id, l.url);

  const rows = ((orders ?? []) as OrderRow[]).map((o) => ({
    order: o,
    logs: logMap.get(o.id) ?? [],
    invoiceUrl: linkMap.get(o.id) ?? null,
  }));

  return Response.json({ ok: true, rows });
}
