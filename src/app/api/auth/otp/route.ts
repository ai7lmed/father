import { NextResponse, type NextRequest } from "next/server";
import { supabaseServer } from "@/lib/auth/supabase-server";
import { upsertCustomer } from "@/lib/auth/customers";

/* ============================================================
 * OTP — عبر Supabase Auth
 *   phone → SMS (Phone Auth — عادة 6 أرقام)
 *   email → رمز بريدي (Supabase الحالي: 8 أرقام — قالب {{ .Token }})
 *   لا افتراض ثابت للطول: الخادم يقبل 6–8 والواجهة تتكيّف عبر OTP_LENGTH
 * Rate limiting خادمي: نافذة منزلقة في الذاكرة (لكل instance)
 * الإنتاج الموزّع: استبدلها بـ Upstash Redis — النقطة موثقة
 * ============================================================ */

type Bucket = { hits: number[] };
const buckets = new Map<string, Bucket>();

const OTP_SEND_LIMIT = 3; // أقصى 3 رموز
const OTP_SEND_WINDOW = 10 * 60 * 1000; // لكل 10 دقائق
const VERIFY_LIMIT = 5; // أقصى 5 محاولات تحقق
const VERIFY_WINDOW = 10 * 60 * 1000;

function rateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const bucket = buckets.get(key) ?? { hits: [] };
  bucket.hits = bucket.hits.filter((t) => now - t < windowMs);
  if (bucket.hits.length >= limit) {
    buckets.set(key, bucket);
    return false;
  }
  bucket.hits.push(now);
  buckets.set(key, bucket);
  return true;
}

function normalizeOmaniPhone(raw: string): string | null {
  const digits = raw.replace(/\D/g, "");
  const local = digits.replace(/^(?:968|00968)/, "");
  return /^9\d{7}$/.test(local) ? local : null;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** التنسيق الدولي الذي يتوقعه Supabase: +9689XXXXXXX */
const E164 = (local: string) => `+968${local}`;

type Body = {
  action: "send" | "verify" | "resend";
  phone?: string;
  email?: string;
  code?: string;
};

export async function POST(request: NextRequest) {
  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return Response.json({ ok: false, error: "طلب غير صالح" }, { status: 400 });
  }

  const supabase = await supabaseServer();

  const email = body.email?.trim().toLowerCase() ?? "";
  const phone = body.phone ? normalizeOmaniPhone(body.phone) : null;

  /* يجب إرسال معرّف واحد صالح: بريد أو هاتف */
  if (!phone && !EMAIL_RE.test(email)) {
    return Response.json(
      { ok: false, error: phone === null && body.phone ? "invalid_phone" : "invalid_email" },
      { status: 400 }
    );
  }

  /* ——— إرسال الرمز ——— */
  if (body.action === "send" || body.action === "resend") {
    if (!rateLimit(`send:${email || phone}`, OTP_SEND_LIMIT, OTP_SEND_WINDOW)) {
      return Response.json({ ok: false, error: "otp_rate_limited" }, { status: 429 });
    }

    /* بريد إلكتروني → OTP بريدي بحساب تلقائي للمستخدم الجديد */
    if (!phone) {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: { shouldCreateUser: true },
      });
      if (error) return mapSendError(error, "email");
      return Response.json({ ok: true });
    }

    /* هاتف → SMS */
    const { error } = await supabase.auth.signInWithOtp({
      phone: E164(phone),
      options: { shouldCreateUser: true },
    });
    if (error) return mapSendError(error, "sms");
    return Response.json({ ok: true });
  }

  /* ——— التحقق ——— */
  if (body.action === "verify") {
    /* الرمز يُمرَّر كما هو — نص كامل بلا قصّ أو تحويل (Supabase email = 8، SMS = 6) */
    if (!body.code || !/^\d{6,8}$/.test(body.code)) {
      return Response.json({ ok: false, error: "invalid_otp" }, { status: 400 });
    }

    if (!rateLimit(`verify:${email || phone}`, VERIFY_LIMIT, VERIFY_WINDOW)) {
      return Response.json({ ok: false, error: "too_many_attempts" }, { status: 429 });
    }

    /* حسب توثيق Supabase الحالي: Email OTP يُتحقق بـ type: "email" مباشرة،
       حتى للمستخدم الجديد الذي أنشأه signInWithOtp */
    const { data, error } = phone
      ? await supabase.auth.verifyOtp({ phone: E164(phone), token: body.code, type: "sms" })
      : await supabase.auth.verifyOtp({ email, token: body.code, type: "email" });

    if (error) {
      const code = (error as { code?: string }).code ?? "";
      const msg = error.message.toLowerCase();
      if (code === "otp_expired" || msg.includes("expired"))
        return Response.json({ ok: false, error: "otp_expired" }, { status: 400 });
      if (code.includes("rate_limit") || msg.includes("rate limit") || msg.includes("too many"))
        return Response.json({ ok: false, error: "too_many_attempts" }, { status: 429 });
      return Response.json({ ok: false, error: "invalid_otp" }, { status: 400 });
    }

    // نجاح: إنشاء/تحديث العميل في قاعدة البيانات
    if (data.user) {
      await upsertCustomer({
        id: data.user.id,
        phone: phone ?? (data.user.phone || null),
        email: email || (data.user.email ?? null),
      });
    }
    return Response.json({ ok: true });
  }

  return Response.json({ ok: false, error: "unknown_action" }, { status: 400 });
}

/* أخطاء الإرسال → رموز تُترجم للعربية في الواجهة */
function mapSendError(
  error: { message: string; code?: string },
  channel: "email" | "sms"
) {
  const code = error.code ?? "";
  const msg = error.message.toLowerCase();
  if (code.includes("rate_limit") || msg.includes("rate limit") || msg.includes("too frequent") || msg.includes("too many"))
    return Response.json({ ok: false, error: "otp_rate_limited" }, { status: 429 });
  if (channel === "sms" && (msg.includes("sms") || msg.includes("provider")))
    return Response.json({ ok: false, error: "sms_unavailable" }, { status: 502 });
  if (msg.includes("smtp") || msg.includes("sending") || msg.includes("failed to send"))
    return Response.json({ ok: false, error: "otp_send_failed" }, { status: 502 });
  return Response.json({ ok: false, error: "otp_send_failed" }, { status: 500 });
}
