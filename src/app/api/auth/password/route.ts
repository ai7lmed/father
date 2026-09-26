import { NextResponse, type NextRequest } from "next/server";
import { supabaseServer } from "@/lib/auth/supabase-server";
import { upsertCustomer } from "@/lib/auth/customers";

type Body = {
  action: "signup" | "signin" | "reset" | "update-password";
  email?: string;
  password?: string;
  fullName?: string;
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** POST /api/auth/password — إنشاء/دخول/استعادة عبر البريد وكلمة المرور */
export async function POST(request: NextRequest) {
  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return Response.json({ ok: false, error: "طلب غير صالح" }, { status: 400 });
  }

  const supabase = await supabaseServer();
  const { origin } = new URL(request.url);

  switch (body.action) {
    /* ——— إنشاء حساب ——— */
    case "signup": {
      if (!body.email || !EMAIL_RE.test(body.email))
        return Response.json({ ok: false, error: "invalid_email" }, { status: 400 });
      if (!body.password || body.password.length < 6)
        return Response.json({ ok: false, error: "weak_password" }, { status: 400 });

      const { data, error } = await supabase.auth.signUp({
        email: body.email,
        password: body.password,
        options: {
          data: { full_name: body.fullName ?? "" },
          emailRedirectTo: `${origin}/api/auth/callback?next=/account`,
        },
      });

      if (error) return mapAuthError(error);
      if (data.user && !data.session) {
        // تأكيد البريد مفعّل في المشروع
        return Response.json({ ok: true, needsEmailConfirm: true });
      }
      if (data.user) {
        await upsertCustomer({
          id: data.user.id,
          email: data.user.email,
          fullName: body.fullName ?? null,
        });
      }
      return Response.json({ ok: true });
    }

    /* ——— تسجيل الدخول ——— */
    case "signin": {
      if (!body.email || !body.password)
        return Response.json({ ok: false, error: "missing_fields" }, { status: 400 });

      const { data, error } = await supabase.auth.signInWithPassword({
        email: body.email,
        password: body.password,
      });
      if (error) return mapAuthError(error);

      if (data.user) {
        await upsertCustomer({
          id: data.user.id,
          email: data.user.email,
          phone: data.user.phone || null,
          fullName: (data.user.user_metadata?.full_name as string | undefined) ?? null,
        });
      }
      return Response.json({ ok: true });
    }

    /* ——— استعادة كلمة المرور ——— */
    case "reset": {
      if (!body.email || !EMAIL_RE.test(body.email))
        return Response.json({ ok: false, error: "invalid_email" }, { status: 400 });

      const { error } = await supabase.auth.resetPasswordForEmail(body.email, {
        redirectTo: `${origin}/login?mode=reset`,
      });
      if (error) return mapAuthError(error);
      return Response.json({ ok: true });
    }

    /* ——— تعيين كلمة مرور جديدة (بعد رابط الاستعادة) ——— */
    case "update-password": {
      if (!body.password || body.password.length < 6)
        return Response.json({ ok: false, error: "weak_password" }, { status: 400 });

      const { error } = await supabase.auth.updateUser({ password: body.password });
      if (error) return mapAuthError(error);
      return Response.json({ ok: true });
    }

    default:
      return Response.json({ ok: false, error: "unknown_action" }, { status: 400 });
  }
}

/* أخطاء Supabase → رموز تُترجم للعربية في الواجهة */
function mapAuthError(error: { message: string; status?: number }) {
  const msg = error.message.toLowerCase();
  let code = "generic";
  if (msg.includes("invalid login credentials")) code = "wrong_credentials";
  else if (msg.includes("email not confirmed")) code = "email_not_confirmed";
  else if (msg.includes("already registered")) code = "email_taken";
  else if (msg.includes("rate limit")) code = "rate_limited";
  else if (msg.includes("not found") || error.status === 422) code = "wrong_credentials";

  /* status من Supabase قد يكون 0/غير صالح — يجب أن يكون ضمن 200-599 */
  const status =
    typeof error.status === "number" && error.status >= 200 && error.status <= 599
      ? error.status
      : 400;
  return Response.json({ ok: false, error: code }, { status });
}
