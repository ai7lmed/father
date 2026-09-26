import { type NextRequest } from "next/server";
import { requireAdmin } from "@/lib/auth/admin";
import { supabaseAdmin } from "@/lib/auth/customers";

type Receipt = {
  order_id: string;
  id: string;
  data_url: string | null;
  storage_key: string | null;
  created_at: string;
};

export async function GET() {
  const denied = await requireAdmin();
  if (denied) return denied;

  const admin = supabaseAdmin();
  const { data: orders, error } = await admin
    .from("orders")
    .select("id, status, total, ship_name, ship_phone, ship_city, placed_at, receipt_attached")
    .eq("payment_method", "bank_transfer")
    .order("placed_at", { ascending: false })
    .limit(200);

  if (error) {
    console.error("[admin/receipts] list:", error.message);
    return Response.json({ ok: false, error: "db_unavailable" }, { status: 503 });
  }

  const ids = (orders ?? []).map((o: { id: string }) => o.id);
  const map = new Map<string, Receipt>();

  if (ids.length > 0) {
    const { data: receipts } = await admin
      .from("bank_transfer_receipts")
      .select("id, order_id, data_url, storage_key, created_at")
      .in("order_id", ids);
    for (const r of (receipts ?? []) as Receipt[]) map.set(r.order_id, r);
  }

  return Response.json({ ok: true, orders: orders ?? [], receipts: Object.fromEntries(map) });
}

export async function PATCH(request: NextRequest) {
  const denied = await requireAdmin();
  if (denied) return denied;

  let body: { orderId?: string; action?: "approve" | "reject" };
  try {
    body = (await request.json()) as { orderId?: string; action?: "approve" | "reject" };
  } catch {
    return Response.json({ ok: false, error: "invalid_body" }, { status: 400 });
  }

  const { orderId, action } = body;
  if (!orderId || (action !== "approve" && action !== "reject")) {
    return Response.json({ ok: false, error: "invalid_input" }, { status: 400 });
  }

  const status = action === "approve" ? "confirmed" : "cancelled";
  const admin = supabaseAdmin();
  const { error } = await admin.from("orders").update({ status } as never).eq("id", orderId);
  if (error) {
    console.error("[admin/receipts] update:", error.message);
    return Response.json({ ok: false, error: "update_failed" }, { status: 503 });
  }

  return Response.json({ ok: true, status });
}
