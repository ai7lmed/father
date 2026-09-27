import { supabaseAdmin } from "@/lib/auth/customers";

/* ============================================================
 * ALDIRXON — Notifications (server-only)
 * ------------------------------------------------------------
 * • بريد العميل (Resend) + واتساب العميل (Meta Cloud API)
 * • إشعار الإدارة (بريد + واتساب اختياري)
 * • تسجيل كل إرسال في notification_logs لإعادة الإرسال من Dashboard
 * • فشل الإرسال لا يفشل الطلب أبداً — يُسجَّل فقط
 * • الأسرار من env فقط — لا شيء يلمس client-side
 * ============================================================ */

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const MAIL_FROM = process.env.MAIL_FROM ?? "ALDIRXON <onboarding@resend.dev>";
const ADMIN_EMAILS_NOTIFY = (process.env.ADMIN_EMAILS ?? "myhome2003ah@gmail.com")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

const WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN;
const WHATSAPP_PHONE_ID = process.env.WHATSAPP_PHONE_NUMBER_ID;
const WHATSAPP_ADMIN_TO = process.env.WHATSAPP_ADMIN_TO;

const STORE_WA = "96895535100";

const OMR = (n: number) => `${Number(n).toFixed(3)} ر.ع`;
const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/* ——— حالة الجاهزية (تُستخدم في الرد والتقارير) ——— */
export function notificationsStatus() {
  return {
    email: Boolean(RESEND_API_KEY),
    whatsapp: Boolean(WHATSAPP_TOKEN && WHATSAPP_PHONE_ID),
    admin: Boolean(RESEND_API_KEY || (WHATSAPP_TOKEN && WHATSAPP_PHONE_ID)),
  };
}

/* ——— بيانات الطلب الممرَّرة من /api/orders ——— */
export type OrderNotification = {
  id: string;
  status: string;
  customerName: string;
  customerEmail: string | null;
  customerPhone: string;
  items: { name: string; qty: number; unitPrice: number }[];
  subtotal: number;
  discount: number;
  deliveryMethod: "standard" | "fast";
  deliveryFee: number;
  paymentMethod: "cod" | "bank_transfer";
  total: number;
  city: string;
  address: string;
  placedAt: string;
  invoiceUrl?: string | null;
};

const PAYMENT_AR: Record<string, string> = {
  cod: "الدفع عند الاستلام",
  bank_transfer: "تحويل بنكي",
};
const DELIVERY_AR: Record<string, string> = {
  standard: "توصيل عادي (3 – 5 أيام عمل)",
  fast: "توصيل سريع (24 – 48 ساعة)",
};
const STATUS_AR: Record<string, string> = {
  pending: "بانتظار تأكيد التحويل",
  confirmed: "مؤكد — قيد التجهيز",
};

/* ——— تسجيل حالة الإرسال في قاعدة البيانات (لا يرمي خطأ أبداً) ——— */
export async function logNotification(
  orderId: string,
  channel: "email" | "whatsapp" | "admin_email" | "admin_whatsapp",
  ok: boolean,
  error?: string
) {
  try {
    await supabaseAdmin()
      .from("notification_logs")
      .insert({ order_id: orderId, channel, status: ok ? "sent" : "failed", error: error ?? null } as never);
  } catch (e) {
    console.warn("[notify] log failed:", e instanceof Error ? e.message : e);
  }
}

/* ============================================================
 * 1) بريد العميل — تأكيد الطلب + الفاتورة عبر Resend HTTP API
 * ============================================================ */
export async function sendOrderEmail(o: OrderNotification): Promise<{ ok: boolean; error?: string }> {
  if (!RESEND_API_KEY) {
    console.warn("[notify] RESEND_API_KEY غير مضبوط — تخطّي بريد الفاتورة");
    return { ok: false, error: "email_not_configured" };
  }
  if (!o.customerEmail) return { ok: false, error: "no_customer_email" };

  const rows = o.items
    .map(
      (it) => `
        <tr>
          <td style="padding:10px 0; font-size:13px; color:#3f3f46;">${esc(it.name)}</td>
          <td style="padding:10px 0; text-align:center; font-size:13px; color:#3f3f46;">${it.qty}</td>
          <td dir="ltr" style="padding:10px 0; text-align:left; font-size:13px; color:#3f3f46;">${OMR(it.unitPrice)}</td>
          <td dir="ltr" style="padding:10px 0; text-align:left; font-size:13px; font-weight:600; color:#0b0b0d;">${OMR(it.unitPrice * it.qty)}</td>
        </tr>`
    )
    .join("");

  const discountRow =
    o.discount > 0
      ? `<tr>
          <td colspan="3" style="padding:6px 0; text-align:left; font-size:13px; color:#3f3f46;">الخصم (كوبون)</td>
          <td dir="ltr" style="padding:6px 0; text-align:left; font-size:13px; font-weight:600; color:#0b0b0d;">- ${OMR(o.discount)}</td>
        </tr>`
      : "";

  const invoiceBtn =
    o.invoiceUrl
      ? `<tr><td style="padding:20px 36px 0; text-align:center;">
          <a href="${o.invoiceUrl}" style="display:inline-block; background-color:#0b0b0d; color:#ffffff; text-decoration:none; font-size:13.5px; font-weight:600; padding:12px 28px; border-radius:10px;">عرض الفاتورة (PDF) 🧾</a>
          <p style="margin:10px 0 0; font-size:11px; color:#a1a1aa;">الفاتورة متاحة فقط لصاحب الطلب — تُفتح في المتصفح ويمكن طباعتها PDF</p>
        </td></tr>`
      : "";

  const html = `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<body style="margin:0; padding:0; background-color:#f4f5f7;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f4f5f7; padding:32px 16px;">
<tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:560px; background-color:#ffffff; border:1px solid #e4e4e7; border-radius:12px;">
  <tr><td style="padding:32px 36px 4px; text-align:center;">
    <p style="margin:0; font-size:18px; font-weight:700; letter-spacing:8px; color:#0b0b0d;">ALDIRXON</p>
    <h1 style="margin:14px 0 0; font-size:19px; font-weight:700; color:#0b0b0d;">تأكيد الطلب</h1>
    <p style="margin:10px 0 0; font-size:13px; line-height:1.8; color:#3f3f46;">شكراً ${esc(o.customerName)} — طلبك وصلنا وسنبدأ بتجهيزه فوراً.</p>
  </td></tr>

  <tr><td style="padding:22px 36px 0;">
    <table role="presentation" width="100%" style="background-color:#f4f5f7; border-radius:10px;">
      <tr>
        <td style="padding:12px 16px; font-size:12px; color:#71717a;">رقم الطلب</td>
        <td dir="ltr" style="padding:12px 16px; text-align:left; font-size:13px; font-weight:700; color:#0b0b0d;">${esc(o.id)}</td>
      </tr>
      <tr>
        <td style="padding:0 16px 12px; font-size:12px; color:#71717a;">تاريخ الطلب</td>
        <td dir="ltr" style="padding:0 16px 12px; text-align:left; font-size:12px; color:#3f3f46;">${new Date(o.placedAt).toLocaleString("ar-OM", { dateStyle: "long", timeStyle: "short" })}</td>
      </tr>
      <tr>
        <td style="padding:0 16px 12px; font-size:12px; color:#71717a;">حالة الطلب</td>
        <td style="padding:0 16px 12px; text-align:left; font-size:12px; font-weight:600; color:#0b0b0d;">${STATUS_AR[o.status] ?? esc(o.status)}</td>
      </tr>
    </table>
  </td></tr>

  <tr><td style="padding:8px 36px 0;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
      <tr style="border-bottom:1px solid #e4e4e7;">
        <th align="right" style="padding:12px 0 6px; font-size:11px; font-weight:600; color:#71717a; border-bottom:1px solid #e4e4e7;">المنتج</th>
        <th style="padding:12px 0 6px; font-size:11px; font-weight:600; color:#71717a; border-bottom:1px solid #e4e4e7;">الكمية</th>
        <th align="left" style="padding:12px 0 6px; font-size:11px; font-weight:600; color:#71717a; border-bottom:1px solid #e4e4e7;">السعر</th>
        <th align="left" style="padding:12px 0 6px; font-size:11px; font-weight:600; color:#71717a; border-bottom:1px solid #e4e4e7;">الإجمالي</th>
      </tr>
      ${rows}
    </table>
  </td></tr>

  <tr><td style="padding:10px 36px 0;">
    <table role="presentation" width="100%">
      <tr>
        <td colspan="3" style="padding:6px 0; text-align:left; font-size:13px; color:#3f3f46;">المجموع الفرعي</td>
        <td dir="ltr" style="padding:6px 0; text-align:left; font-size:13px; color:#0b0b0d;">${OMR(o.subtotal)}</td>
      </tr>
      ${discountRow}
      <tr>
        <td colspan="3" style="padding:6px 0; text-align:left; font-size:13px; color:#3f3f46;">${DELIVERY_AR[o.deliveryMethod] ?? esc(o.deliveryMethod)}</td>
        <td dir="ltr" style="padding:6px 0; text-align:left; font-size:13px; color:#0b0b0d;">${o.deliveryFee === 0 ? "مجاني" : OMR(o.deliveryFee)}</td>
      </tr>
      <tr>
        <td colspan="3" style="padding:6px 0; text-align:left; font-size:13px; color:#3f3f46;">طريقة الدفع</td>
        <td style="padding:6px 0; text-align:left; font-size:13px; color:#0b0b0d;">${PAYMENT_AR[o.paymentMethod] ?? esc(o.paymentMethod)}</td>
      </tr>
      <tr>
        <td colspan="3" style="padding:14px 0 0; text-align:left; font-size:15px; font-weight:700; color:#0b0b0d; border-top:1px solid #e4e4e7;">الإجمالي النهائي</td>
        <td dir="ltr" style="padding:14px 0 0; text-align:left; font-size:15px; font-weight:700; color:#0b0b0d; border-top:1px solid #e4e4e7;">${OMR(o.total)}</td>
      </tr>
    </table>
  </td></tr>

  ${invoiceBtn}

  <tr><td style="padding:18px 36px 0;">
    <p style="margin:0; font-size:12px; line-height:1.9; color:#71717a;">
      عنوان التوصيل: ${esc(o.city)} — ${esc(o.address)}
    </p>
  </td></tr>

  <tr><td style="padding:22px 36px 34px; text-align:center;">
    <p style="margin:0; font-size:12px; line-height:1.9; color:#71717a;">للاستفسار تواصل معنا على واتساب <a dir="ltr" href="https://wa.me/${STORE_WA}" style="color:#0b0b0d; font-weight:600;">+968 9553 5100</a></p>
    <p style="margin:12px 0 0; font-size:11px; color:#a1a1aa;">ALDIRXON — متجر الإلكترونيات والأجهزة الذكية · سلطنة عُمان</p>
  </td></tr>
</table>
</td></tr>
</table>
</body>
</html>`;

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        authorization: `Bearer ${RESEND_API_KEY}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        from: MAIL_FROM,
        to: [o.customerEmail],
        subject: `تأكيد طلبك ${o.id} | ALDIRXON`,
        html,
      }),
    });
    if (!res.ok) {
      const body = await res.text();
      console.error("[notify] Resend invoice failed:", res.status, body.slice(0, 200));
      return { ok: false, error: `resend_${res.status}` };
    }
    return { ok: true };
  } catch (e) {
    console.error("[notify] Resend invoice error:", e instanceof Error ? e.message : e);
    return { ok: false, error: "email_network" };
  }
}

/* ============================================================
 * 2) واتساب العميل — WhatsApp Cloud API (Meta)
 * ============================================================ */
async function waSend(toE164: string, text: string): Promise<{ ok: boolean; error?: string }> {
  const res = await fetch(`https://graph.facebook.com/v20.0/${WHATSAPP_PHONE_ID}/messages`, {
    method: "POST",
    headers: {
      authorization: `Bearer ${WHATSAPP_TOKEN}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      to: toE164,
      type: "text",
      text: { preview_url: true, body: text },
    }),
  });
  if (!res.ok) {
    const body = await res.text();
    console.error("[notify] WhatsApp failed:", res.status, body.slice(0, 200));
    return { ok: false, error: `wa_${res.status}` };
  }
  return { ok: true };
}

export async function sendOrderWhatsApp(o: OrderNotification): Promise<{ ok: boolean; error?: string }> {
  if (!WHATSAPP_TOKEN || !WHATSAPP_PHONE_ID) {
    console.warn("[notify] WhatsApp غير مضبوط (WHATSAPP_TOKEN / WHATSAPP_PHONE_NUMBER_ID) — تخطّي");
    return { ok: false, error: "whatsapp_not_configured" };
  }

  const lines = o.items.map((it) => `• ${it.name} × ${it.qty} — ${OMR(it.unitPrice * it.qty)}`).join("\n");
  const text =
    `مرحباً ${o.customerName} 👋\n` +
    `تم استلام طلبك في ALDIRXON بنجاح ✅\n\n` +
    `رقم الطلب: ${o.id}\n` +
    `الحالة: ${STATUS_AR[o.status] ?? o.status}\n\n` +
    `${lines}\n\n` +
    (o.discount > 0 ? `الخصم: - ${OMR(o.discount)}\n` : "") +
    `${DELIVERY_AR[o.deliveryMethod] ?? o.deliveryMethod}\n` +
    `طريقة الدفع: ${PAYMENT_AR[o.paymentMethod] ?? o.paymentMethod}\n` +
    `الإجمالي: ${OMR(o.total)}\n` +
    `التوصيل إلى: ${o.city}\n` +
    (o.invoiceUrl ? `\nفاتورة طلبك: ${o.invoiceUrl}\n` : "") +
    `\nللتواصل معنا: wa.me/${STORE_WA}`;

  try {
    return await waSend(`968${o.customerPhone}`, text);
  } catch (e) {
    console.error("[notify] WhatsApp error:", e instanceof Error ? e.message : e);
    return { ok: false, error: "wa_network" };
  }
}

/* ============================================================
 * 3) إشعار الإدارة — بريد (لوحة تحكم جديدة) + واتساب اختياري
 * ============================================================ */
export async function sendAdminEmail(o: OrderNotification): Promise<{ ok: boolean; error?: string }> {
  if (!RESEND_API_KEY) return { ok: false, error: "email_not_configured" };

  const rows = o.items
    .map((it) => `<li>${esc(it.name)} × ${it.qty} — ${OMR(it.unitPrice * it.qty)}</li>`)
    .join("");

  const html = `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<body style="margin:0; background:#f4f5f7; padding:24px 12px;">
<div style="max-width:560px; margin:0 auto; background:#fff; border:1px solid #e4e4e7; border-radius:12px; padding:28px 32px; font-family:Segoe UI,Tahoma,Arial,sans-serif;">
  <p style="margin:0; font-size:16px; font-weight:700; letter-spacing:6px;">ALDIRXON</p>
  <h2 style="margin:14px 0 0; font-size:17px;">🛒 طلب جديد ${esc(o.id)}</h2>
  <p style="margin:8px 0 0; font-size:12px; color:#71717a;">${new Date(o.placedAt).toLocaleString("ar-OM", { dateStyle: "long", timeStyle: "short" })}</p>
  <table width="100%" style="margin-top:18px; font-size:13px; color:#3f3f46; border-collapse:collapse;">
    <tr><td style="padding:5px 0; color:#71717a;">العميل</td><td style="font-weight:600;">${esc(o.customerName)}</td></tr>
    <tr><td style="padding:5px 0; color:#71717a;">الهاتف</td><td dir="ltr" style="text-align:left; font-weight:600;">+968 ${esc(o.customerPhone)}</td></tr>
    ${o.customerEmail ? `<tr><td style="padding:5px 0; color:#71717a;">البريد</td><td dir="ltr" style="text-align:left;">${esc(o.customerEmail)}</td></tr>` : ""}
    <tr><td style="padding:5px 0; color:#71717a;">العنوان</td><td>${esc(o.city)} — ${esc(o.address)}</td></tr>
    <tr><td style="padding:5px 0; color:#71717a;">الدفع</td><td>${PAYMENT_AR[o.paymentMethod] ?? esc(o.paymentMethod)}</td></tr>
    <tr><td style="padding:5px 0; color:#71717a;">الحالة</td><td>${STATUS_AR[o.status] ?? esc(o.status)}</td></tr>
  </table>
  <ul style="margin:16px 0 0; padding-inline-start:20px; font-size:13px; color:#3f3f46; line-height:2;">${rows}</ul>
  ${o.discount > 0 ? `<p style="margin:8px 0 0; font-size:13px; color:#047857;">خصم كوبون: - ${OMR(o.discount)}</p>` : ""}
  <p style="margin:14px 0 0; font-size:16px; font-weight:700;">الإجمالي: ${OMR(o.total)}</p>
  <p style="margin:20px 0 0;">
    <a href="https://aldirxon.myhome2003ah.workers.dev/dashboard/orders" style="background:#0b0b0d; color:#fff; text-decoration:none; padding:10px 22px; border-radius:9px; font-size:13px; font-weight:600;">فتح لوحة التحكم</a>
    ${o.invoiceUrl ? ` &nbsp; <a href="${o.invoiceUrl}" style="background:#fff; color:#0b0b0d; border:1px solid #d4d4d8; text-decoration:none; padding:10px 22px; border-radius:9px; font-size:13px; font-weight:600;">الفاتورة</a>` : ""}
  </p>
</div>
</body>
</html>`;

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { authorization: `Bearer ${RESEND_API_KEY}`, "content-type": "application/json" },
      body: JSON.stringify({
        from: MAIL_FROM,
        to: ADMIN_EMAILS_NOTIFY,
        subject: `🛒 طلب جديد ${o.id} — ${OMR(o.total)} | ALDIRXON`,
        html,
      }),
    });
    if (!res.ok) {
      const body = await res.text();
      console.error("[notify] admin email failed:", res.status, body.slice(0, 200));
      return { ok: false, error: `resend_${res.status}` };
    }
    return { ok: true };
  } catch (e) {
    console.error("[notify] admin email error:", e instanceof Error ? e.message : e);
    return { ok: false, error: "email_network" };
  }
}

export async function sendAdminWhatsApp(o: OrderNotification): Promise<{ ok: boolean; error?: string }> {
  if (!WHATSAPP_TOKEN || !WHATSAPP_PHONE_ID || !WHATSAPP_ADMIN_TO)
    return { ok: false, error: "whatsapp_admin_not_configured" };

  const lines = o.items.map((it) => `• ${it.name} × ${it.qty} — ${OMR(it.unitPrice * it.qty)}`).join("\n");
  const text =
    `🔔 طلب جديد في ALDIRXON\n\n` +
    `رقم الطلب: ${o.id}\n` +
    `العميل: ${o.customerName}\n` +
    `الهاتف: +968 ${o.customerPhone}\n` +
    `العنوان: ${o.city} — ${o.address}\n\n` +
    `${lines}\n` +
    (o.discount > 0 ? `خصم: - ${OMR(o.discount)}\n` : "") +
    `طريقة الدفع: ${PAYMENT_AR[o.paymentMethod] ?? o.paymentMethod}\n` +
    `الإجمالي: ${OMR(o.total)}\n` +
    `الوقت: ${new Date(o.placedAt).toLocaleString("ar-OM", { dateStyle: "short", timeStyle: "short" })}`;

  try {
    return await waSend(WHATSAPP_ADMIN_TO, text);
  } catch (e) {
    console.error("[notify] admin WA error:", e instanceof Error ? e.message : e);
    return { ok: false, error: "wa_network" };
  }
}

/* ============================================================
 * المنسّق: يُنفَّذ بعد نجاح الطلب — يسجل كل قناة ولا يرمي خطأ
 * ============================================================ */
export async function sendOrderNotifications(o: OrderNotification) {
  const [email, whatsapp, adminEmail, adminWa] = await Promise.allSettled([
    sendOrderEmail(o),
    sendOrderWhatsApp(o),
    sendAdminEmail(o),
    sendAdminWhatsApp(o),
  ]);

  const emailRes = email.status === "fulfilled" ? email.value : { ok: false, error: "email_promise_failed" };
  const waRes = whatsapp.status === "fulfilled" ? whatsapp.value : { ok: false, error: "wa_promise_failed" };
  const adminEmailRes = adminEmail.status === "fulfilled" ? adminEmail.value : { ok: false, error: "admin_email_promise_failed" };
  const adminWaRes = adminWa.status === "fulfilled" ? adminWa.value : { ok: false, error: "admin_wa_promise_failed" };

  await Promise.allSettled([
    logNotification(o.id, "email", emailRes.ok, emailRes.error),
    logNotification(o.id, "whatsapp", waRes.ok, waRes.error),
    logNotification(o.id, "admin_email", adminEmailRes.ok, adminEmailRes.error),
    logNotification(o.id, "admin_whatsapp", adminWaRes.ok, adminWaRes.error),
  ]);

  return { email: emailRes, whatsapp: waRes, adminEmail: adminEmailRes, adminWhatsApp: adminWaRes };
}

/* ——— جلب إيميل العميل من جدول customers عند غيابه ——— */
export async function customerEmailFor(userId: string): Promise<string | null> {
  try {
    const admin = supabaseAdmin();
    const { data } = await admin.from("customers").select("email").eq("id", userId).maybeSingle<{ email: string | null }>();
    return data?.email ?? null;
  } catch {
    return null;
  }
}
