import { type NextRequest } from "next/server";
import { requireAdmin } from "@/lib/auth/admin";
import { supabaseAdmin } from "@/lib/auth/customers";

/* ============================================================
 * /api/admin/orders/[id]
 * GET  — تفاصيل الطلب (أصناف + عنوان + إيصال)
 * PATCH — تحديث حالة الطلب
 * ============================================================ */

const VALID_STATUSES = ["pending", "confirmed", "processing", "shipped", "delivered", "cancelled"] as const;

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const { id } = await params;
  const admin = supabaseAdmin();

  const { data: order, error } = await admin
    .from("orders")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error || !order) {
    return Response.json({ ok: false, error: "not_found" }, { status: 404 });
  }

  const [{ data: items }, { data: receipt }] = await Promise.all([
    admin.from("order_items").select("product_id, name, qty, unit_price").eq("order_id", id),
    admin
      .from("bank_transfer_receipts")
      .select("id, data_url, storage_key, created_at")
      .eq("order_id", id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  return Response.json({ ok: true, order, items: items ?? [], receipt: receipt ?? null });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const { id } = await params;
  let body: { status?: string };
  try {
    body = (await request.json()) as { status?: string };
  } catch {
    return Response.json({ ok: false, error: "invalid_body" }, { status: 400 });
  }

  const status = body.status;
  if (!status || !(VALID_STATUSES as readonly string[]).includes(status)) {
    return Response.json({ ok: false, error: "invalid_status" }, { status: 400 });
  }

  const admin = supabaseAdmin();
  const { error } = await admin.from("orders").update({ status } as never).eq("id", id);
  if (error) {
    console.error("[admin/orders] update:", error.message);
    return Response.json({ ok: false, error: "update_failed" }, { status: 503 });
  }

  return Response.json({ ok: true, status });
}
