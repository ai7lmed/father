import { type NextRequest } from "next/server";
import { requireAdmin } from "@/lib/auth/admin";
import { supabaseAdmin } from "@/lib/auth/customers";
import {
  sendOrderEmail,
  sendOrderWhatsApp,
  sendAdminEmail,
  sendAdminWhatsApp,
  logNotification,
} from "@/lib/notifications";

/* ============================================================
 * POST /api/admin/notify/resend — إعادة إرسال إشعارات الطلب
 * • مدير فقط (requireAdmin)
 * • بريد العميل من جدول customers — رابط الفاتورة محفوظ أو يُعاد توليده
 * ============================================================ */

export const dynamic = "force-dynamic";

async function guestToken(orderId: string, phone: string, total: number): Promise<string> {
  const secret = (process.env.SUPABASE_SERVICE_ROLE_KEY ?? "").slice(0, 32);
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(`${orderId}|${phone}|${total.toFixed(3)}|${secret}`)
  );
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")
    .slice(0, 32);
}

export async function POST(request: NextRequest) {
  const guard = await requireAdmin();
  if (guard) return guard;

  const body = (await request.json().catch(() => ({}))) as {
    orderId?: string;
    channel?: string;
  };

  const orderId = String(body.orderId ?? "").trim().toUpperCase();
  const channel = String(body.channel ?? "all");

  if (!/^QVN-[A-Z0-9]{4,20}$/.test(orderId))
    return Response.json({ ok: false, error: "invalid_order_id" }, { status: 400 });

  const admin = supabaseAdmin();
  const { data: order } = await admin
    .from("orders")
    .select("*")
    .eq("id", orderId)
    .maybeSingle<Record<string, unknown>>();
  if (!order) return Response.json({ ok: false, error: "not_found" }, { status: 404 });

  /* ——— بريد العميل من جدول customers ——— */
  let customerEmail: string | null = null;
  if (order.customer_id) {
    const { data: c } = await admin
      .from("customers")
      .select("email")
      .eq("id", String(order.customer_id))
      .maybeSingle<{ email: string | null }>();
    customerEmail = c?.email ?? null;
  }

  /* ——— رابط الفاتورة: المحفوظ أو يُعاد توليده ——— */
  const { data: link } = await admin
    .from("invoice_links")
    .select("url")
    .eq("order_id", orderId)
    .maybeSingle<{ url: string }>();

  let invoiceUrl = link?.url ?? null;
  if (!invoiceUrl) {
    const phone = String(order.ship_phone ?? "");
    const total = Number(order.total ?? 0);
    const token = await guestToken(orderId, phone, total);
    const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://aldirxon.myhome2003ah.workers.dev").replace(/\/$/, "");
    invoiceUrl = `${siteUrl}/api/invoice/${orderId}?t=${token}`;
    try {
      await admin
        .from("invoice_links")
        .upsert({ order_id: orderId, url: invoiceUrl, method: "hosted_html" } as never, { onConflict: "order_id" });
    } catch {
      /* غير حاجز */
    }
  }

  const { data: items } = await admin
    .from("order_items")
    .select("name, qty, unit_price")
    .eq("order_id", orderId);

  const payload = {
    id: orderId,
    status: String(order.status ?? "pending"),
    customerName: String(order.ship_name ?? "—"),
    customerEmail,
    customerPhone: String(order.ship_phone ?? ""),
    items: (items ?? []).map((it: { name: string; qty: number; unit_price: number }) => ({
      name: it.name,
      qty: it.qty,
      unitPrice: Number(it.unit_price),
    })),
    subtotal: Number(order.subtotal ?? 0),
    discount: Number(order.discount ?? 0),
    deliveryMethod: (String(order.delivery_method ?? "standard") as "standard" | "fast"),
    deliveryFee: Number(order.delivery_fee ?? 0),
    paymentMethod: (String(order.payment_method ?? "cod") as "cod" | "bank_transfer"),
    total: Number(order.total ?? 0),
    city: String(order.ship_city ?? ""),
    address: String(order.ship_address ?? ""),
    placedAt: String(order.placed_at ?? new Date().toISOString()),
    invoiceUrl,
  };

  /* ——— إعادة الإرسال حسب القناة المطلوبة ——— */
  const results: Record<string, { ok: boolean; error?: string }> = {};
  const channels: string[] =
    channel === "all" ? ["email", "whatsapp", "admin_email", "admin_whatsapp"] : [channel];

  for (const ch of channels) {
    let r: { ok: boolean; error?: string };
    if (ch === "email") r = await sendOrderEmail(payload);
    else if (ch === "whatsapp") r = await sendOrderWhatsApp(payload);
    else if (ch === "admin_email") r = await sendAdminEmail(payload);
    else if (ch === "admin_whatsapp") r = await sendAdminWhatsApp(payload);
    else r = { ok: false, error: "invalid_channel" };
    results[ch] = r;
    await logNotification(orderId, ch as "email" | "whatsapp" | "admin_email" | "admin_whatsapp", r.ok, r.error);
  }

  return Response.json({ ok: true, results });
}
