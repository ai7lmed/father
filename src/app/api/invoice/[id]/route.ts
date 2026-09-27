import { type NextRequest } from "next/server";
import { supabaseServer } from "@/lib/auth/supabase-server";
import { supabaseAdmin } from "@/lib/auth/customers";
import { getAdminUser } from "@/lib/auth/admin";
import { renderInvoiceHtml, toInvoiceData } from "@/lib/invoice";

/* ============================================================
 * GET /api/invoice/[id] — الفاتورة المستضافة
 * ------------------------------------------------------------
 * • مالك الطلب (جلسة كوكيز) أو مدير → وصول كامل
 * • الضيف → يتطلب ?t= توقيعاً من (رقم الطلب + الهاتف + الإجمالي + سر الخادم)
 *   لا يمكن تخمينه — يُرسل عبر واتساب/بريد العميل حصراً
 * • ?lang=en لنسخة إنجليزية (افتراضي عربي RTL)
 * • الطباعة من المتصفح = PDF احترافي (@page A4)
 * ============================================================ */

export const dynamic = "force-dynamic";

/* توقيع الضيف — SHA-256 عبر Web Crypto (متوافق مع Workers) */
async function guestSig(orderId: string, phone: string, total: string): Promise<string> {
  const secret = (process.env.SUPABASE_SERVICE_ROLE_KEY ?? "").slice(0, 32);
  const data = new TextEncoder().encode(`${orderId}|${phone}|${total}|${secret}`);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")
    .slice(0, 32);
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const orderId = decodeURIComponent(id ?? "").trim().toUpperCase();
  if (!/^QVN-[A-Z0-9]{4,20}$/.test(orderId))
    return new Response("Not found", { status: 404 });

  /* ——— الجلسة: مالك الطلب أو مدير؟ ——— */
  const supabase = await supabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const adminUser = await getAdminUser();

  const admin = supabaseAdmin();
  const { data: order } = await admin
    .from("orders")
    .select("*")
    .eq("id", orderId)
    .maybeSingle<Record<string, unknown>>();

  if (!order) return new Response("Not found", { status: 404 });

  const isOwner = Boolean(user && order.customer_id === user.id);
  let authorized = isOwner || Boolean(adminUser);

  /* ——— الضيف: توقيع من بيانات الطلب نفسها + سر الخادم ——— */
  if (!authorized) {
    const token = request.nextUrl.searchParams.get("t") ?? "";
    const phone = String(order.ship_phone ?? "");
    const total = Number(order.total ?? 0).toFixed(3);
    const expected = await guestSig(orderId, phone, total);
    authorized = token.length > 0 && token === expected;
  }

  if (!authorized) {
    return new Response(
      `<!DOCTYPE html><html lang="ar" dir="rtl"><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width, initial-scale=1"/><title>غير مصرح — ALDIRXON</title></head>
<body style="margin:0; font-family:Segoe UI,Tahoma,Arial,sans-serif; background:#f4f5f7; display:flex; align-items:center; justify-content:center; min-height:100vh;">
<div style="background:#fff; border:1px solid #e4e4e7; border-radius:14px; padding:36px 40px; max-width:420px; text-align:center;">
<p style="letter-spacing:.3em; font-weight:800; margin:0;">ALDIRXON</p>
<h1 style="font-size:18px; margin:18px 0 8px;">هذه الفاتورة محمية 🔒</h1>
<p style="font-size:13.5px; color:#52525b; line-height:1.9; margin:0;">
الفاتورة متاحة لصاحب الطلب فقط. سجّل الدخول بالحساب نفسه الذي أتمّ به الطلب، أو افتح الرابط المباشر المرسل لك عبر واتساب أو البريد الإلكتروني.
</p>
<a href="/login" style="display:inline-block; margin-top:22px; background:#0b0b0d; color:#fff; text-decoration:none; padding:11px 26px; border-radius:10px; font-size:13.5px; font-weight:600;">تسجيل الدخول</a>
</div></body></html>`,
      { status: 403, headers: { "content-type": "text/html; charset=utf-8" } }
    );
  }

  /* ——— بنود الطلب + رمز الكوبون إن وُجد ——— */
  const [{ data: items }, couponRes] = await Promise.all([
    admin.from("order_items").select("name, qty, unit_price").eq("order_id", orderId),
    admin.from("coupons").select("code").eq("order_id", orderId).maybeSingle<{ code: string }>(),
  ]);

  /* ——— بريد العميل (للعرض إن وُجد) ——— */
  let customerEmail: string | null = null;
  if (order.customer_id) {
    const { data: c } = await admin
      .from("customers")
      .select("email")
      .eq("id", String(order.customer_id))
      .maybeSingle<{ email: string | null }>();
    customerEmail = c?.email ?? null;
  }

  const lang = request.nextUrl.searchParams.get("lang") === "en" ? "en" : "ar";
  const html = renderInvoiceHtml(
    toInvoiceData({
      order: order,
      items: (items ?? []) as { name: string; qty: number; unit_price: number }[],
      customerName: String(order.ship_name ?? "—"),
      customerPhone: String(order.ship_phone ?? "—"),
      customerEmail,
      couponCode: couponRes.data?.code ?? null,
    }),
    lang
  );

  return new Response(html, {
    status: 200,
    headers: {
      "content-type": "text/html; charset=utf-8",
      "cache-control": "private, no-store",
    },
  });
}
