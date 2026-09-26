"use client";

/* ============================================================
 * ALDIRXON — Auth Experience (مربوطة بـ Supabase)
 * ------------------------------------------------------------
 * Google OAuth · Email+Password (دخول/تسجيل/استعادة) · Phone OTP
 * الجلسة كوكيز HttpOnly عبر @supabase/ssr — لا localStorage إطلاقاً
 * نقاط النداء: /api/auth/{google,callback,password,otp,signout,me}
 * ============================================================ */

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ChevronLeft,
  Eye,
  EyeOff,
  ArrowRight,
  Loader2,
  ShieldCheck,
  AlertCircle,
  MailCheck,
  KeyRound,
} from "lucide-react";

/* طول رمز OTP — Supabase مضبوط على 6 أرقام (mailer_otp_length)؛ يتكيّف تلقائيًا لو تغيّر */
const OTP_LENGTH = 6;
import { GoogleG } from "@/components/google-g";

type Mode = "login" | "register" | "forgot";
type Step = "identifier" | "password" | "otp" | "details";

/* أخطاء الخادم → رسائل عربية */
const API_ERROR: Record<string, string> = {
  invalid_phone: "رقم عُماني غير صحيح — 8 أرقام تبدأ بـ 9.",
  invalid_email: "البريد الإلكتروني غير صحيح.",
  invalid_otp: "الرمز غير صحيح — تحقق وحاول مجدداً.",
  otp_expired: "الرمز غير صحيح أو انتهت صلاحيته — اطلب رمزاً جديداً وحاول مجدداً.",
  otp_rate_limited: "طلبات كثيرة — انتظر قليلاً قبل طلب رمز جديد.",
  too_many_attempts: "محاولات كثيرة خاطئة — حاول بعد 10 دقائق.",
  sms_unavailable: "خدمة SMS غير مفعّلة بعد — تُفعّل عند ربط مزوّد SMS.",
  otp_send_failed: "تعذّر إرسال الرمز — تأكد من بريدك وحاول مجدداً.",
  weak_password: "كلمة المرور 6 أحرف على الأقل.",
  wrong_credentials: "البريد أو كلمة المرور غير صحيحة.",
  email_not_confirmed: "أكّد بريدك أولاً — تحقق من وصلك الإلكتروني.",
  email_taken: "هذا البريد مسجّل مسبقاً — جرّب تسجيل الدخول.",
  rate_limited: "طلبات كثيرة — انتظر قليلاً وحاول مجدداً.",
  missing_fields: "أكمل الحقول المطلوبة.",
  generic: "حدث خطأ — حاول مجدداً.",
};

/* تحقق محلي (نفس منطق الخادم) */
function isEmail(v: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());
}
function isOmaniPhone(v: string) {
  return /^9\d{7}$/.test(v.replace(/[\s-]/g, "").replace(/^(?:\+968|00968|968)/, ""));
}

export function AuthExperience({
  redirectTo = "/account",
  initialMode = "login",
}: {
  redirectTo?: string;
  initialMode?: Mode;
}) {
  const router = useRouter();

  const [mode, setMode] = useState<Mode>(initialMode);
  const [step, setStep] = useState<Step>(
    initialMode === "login" ? "identifier" : "details"
  );

  /* الحقول */
  const [identifier, setIdentifier] = useState(""); // بريد أو هاتف
  const [password, setPassword] = useState("");
  const [regName, setRegName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPhone, setRegPhone] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [resetEmail, setResetEmail] = useState("");

  /* حالات */
  const [showPw, setShowPw] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null); // رسالة عربية جاهزة
  const [notice, setNotice] = useState<string | null>(null);

  /* OTP */
  const [otp, setOtp] = useState<string[]>(() => Array(OTP_LENGTH).fill(""));
  const otpRefs = useRef<Array<HTMLInputElement | null>>([]);
  const [otpCountdown, setOtpCountdown] = useState(0);
  const [otpChannel, setOtpChannel] = useState<"sms" | "email">("sms");
  const [otpTarget, setOtpTarget] = useState(""); // الرقم/البريد المُرسل إليه
  const [otpLength, setOtpLength] = useState(OTP_LENGTH); // يتكيّف مع طول الرمز الفعلي

  /* النمط المكتشف من المعرّف: بريد → كلمة مرور، هاتف → OTP مباشرة */
  const identifierIsPhone = isOmaniPhone(identifier);

  const otpValue = otp.join("");
  const identifierValid = isEmail(identifier) || identifierIsPhone;

  /* طول الرمز لا يُفترض ثابتاً — يُتحقق حسب otpLength الفعلي */
  const isOtpComplete = (v: string, len: number) => v.length === len && /^\d+$/.test(v);

  useEffect(() => {
    if (otpCountdown <= 0) return;
    const t = setTimeout(() => setOtpCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [otpCountdown]);

  const fail = (apiCode: string) => setError(API_ERROR[apiCode] ?? API_ERROR.generic);
  const resetError = () => setError(null);

  /* ————— Google ————— */

  const continueWithGoogle = () => {
    setBusy("google");
    // redirect كامل — العودة عبر /api/auth/callback
    window.location.href = `/api/auth/google?next=${encodeURIComponent(redirectTo)}`;
  };

  /* ————— دخول: المعرّف ————— */

  const submitIdentifier = () => {
    if (!identifierValid) {
      setError(API_ERROR.invalid_email);
      return;
    }
    resetError();
    if (identifierIsPhone) {
      sendOtp(identifier, "sms");
    } else {
      sendOtp(identifier, "email");
    }
  };

  /* ————— دخول: كلمة المرور ————— */

  const submitPassword = async () => {
    if (password.length < 6) return setError(API_ERROR.weak_password);
    resetError();
    setBusy("login");
    try {
      const res = await fetch("/api/auth/password", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action: "signin", email: identifier, password }),
      });
      const json = (await res.json()) as { ok: boolean; error?: string };
      if (!json.ok) {
        fail(json.error ?? "generic");
        return;
      }
      router.push(redirectTo);
      router.refresh(); // تحديث جلسة RSC
    } catch {
      setError(API_ERROR.generic);
    } finally {
      setBusy(null);
    }
  };

  /* ————— OTP ————— */

  const sendOtp = async (target: string, channel: "sms" | "email") => {
    setBusy("otp-send");
    resetError();
    try {
      const res = await fetch("/api/auth/otp", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(
          channel === "sms" ? { action: "send", phone: target } : { action: "send", email: target }
        ),
      });
      const json = (await res.json()) as { ok: boolean; error?: string };
      if (!json.ok) {
        fail(json.error ?? "generic");
        return;
      }
      setOtpChannel(channel);
      setOtpTarget(target);
      setOtpLength(OTP_LENGTH);
      setOtp(Array(OTP_LENGTH).fill(""));
      setStep("otp");
      setOtpCountdown(channel === "email" ? 60 : 45);
    } catch {
      setError(API_ERROR.generic);
    } finally {
      setBusy(null);
    }
  };

  const resendOtp = async () => {
    if (otpCountdown > 0) return;
    setBusy("otp-send");
    try {
      const res = await fetch("/api/auth/otp", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(
          otpChannel === "sms"
            ? { action: "resend", phone: otpTarget }
            : { action: "resend", email: otpTarget }
        ),
      });
      const json = (await res.json()) as { ok: boolean; error?: string };
      if (!json.ok) {
        fail(json.error ?? "generic");
        return;
      }
      setOtpCountdown(otpChannel === "email" ? 60 : 45);
    } catch {
      setError(API_ERROR.generic);
    } finally {
      setBusy(null);
    }
  };

  const submitOtp = async () => {
    if (!isOtpComplete(otpValue, otpLength)) return setError(API_ERROR.invalid_otp);
    resetError();
    setBusy("otp");
    try {
      const res = await fetch("/api/auth/otp", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(
          otpChannel === "sms"
            ? { action: "verify", phone: otpTarget, code: otpValue }
            : { action: "verify", email: otpTarget, code: otpValue }
        ),
      });
      const json = (await res.json()) as { ok: boolean; error?: string };
      if (!json.ok) {
        fail(json.error ?? "generic");
        return;
      }
      router.push(redirectTo);
      router.refresh();
    } catch {
      setError(API_ERROR.generic);
    } finally {
      setBusy(null);
    }
  };

  /* ————— تسجيل ————— */

  const submitRegister = async () => {
    if (regName.trim().length < 2) return setError("أدخل اسمك الكامل.");
    if (!isEmail(regEmail)) return setError(API_ERROR.invalid_email);
    if (!isOmaniPhone(regPhone)) return setError(API_ERROR.invalid_phone);
    if (regPassword.length < 6) return setError(API_ERROR.weak_password);
    resetError();
    setBusy("register");
    try {
      const res = await fetch("/api/auth/password", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          action: "signup",
          email: regEmail,
          password: regPassword,
          fullName: regName.trim(),
        }),
      });
      const json = (await res.json()) as {
        ok: boolean;
        error?: string;
        needsEmailConfirm?: boolean;
      };
      if (!json.ok) {
        fail(json.error ?? "generic");
        return;
      }
      if (json.needsEmailConfirm) {
        setNotice("أُرسل رابط تأكيد إلى بريدك — أكّده ثم سجّل دخولك.");
        setMode("login");
        setStep("identifier");
      } else {
        router.push(redirectTo);
        router.refresh();
      }
    } catch {
      setError(API_ERROR.generic);
    } finally {
      setBusy(null);
    }
  };

  /* ————— استعادة كلمة المرور ————— */

  const submitReset = async () => {
    if (!isEmail(resetEmail)) return setError(API_ERROR.invalid_email);
    resetError();
    setBusy("reset");
    try {
      const res = await fetch("/api/auth/password", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action: "reset", email: resetEmail }),
      });
      const json = (await res.json()) as { ok: boolean; error?: string };
      if (!json.ok) {
        fail(json.error ?? "generic");
        return;
      }
      setNotice(`أُرسل رابط الاستعادة إلى ${resetEmail} — افحص بريدك.`);
      setMode("login");
      setStep("identifier");
    } catch {
      setError(API_ERROR.generic);
    } finally {
      setBusy(null);
    }
  };

  /* ————— OTP boxes helpers ————— */

  const setOtpAt = (i: number, v: string) => {
    const digit = v.replace(/\D/g, "").slice(-1);
    setOtp((prev) => {
      const next = [...prev];
      next[i] = digit;
      return next;
    });
    if (digit && i < otpLength - 1) otpRefs.current[i + 1]?.focus();
  };

  const onOtpKeyDown = (i: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otp[i] && i > 0) otpRefs.current[i - 1]?.focus();
    if (e.key === "ArrowRight") otpRefs.current[Math.min(otpLength - 1, i + 1)]?.focus();
    if (e.key === "ArrowLeft") otpRefs.current[Math.max(0, i - 1)]?.focus();
  };

  const switchMode = (m: Mode) => {
    setMode(m);
    setStep(m === "login" ? "identifier" : m === "register" ? "details" : "identifier");
    setError(null);
    setNotice(null);
    setOtp(Array(OTP_LENGTH).fill(""));
  };

  const stepIndex = step === "otp" ? 2 : step === "password" ? 1 : 0;

  return (
    <div className="w-full" dir="rtl">
      {/* التبويب دخول/تسجيل */}
      {mode !== "forgot" && (
        <div className="grid grid-cols-2 gap-1 rounded-xl bg-cloud p-1" role="tablist">
          {(["login", "register"] as const).map((m) => (
            <button
              key={m}
              type="button"
              role="tab"
              aria-selected={mode === m}
              onClick={() => switchMode(m)}
              className={`h-10 rounded-lg text-sm font-medium transition-all duration-200 active:scale-[0.98] ${
                mode === m ? "bg-white text-ink shadow-sm" : "text-steel hover:text-ink"
              }`}
            >
              {m === "login" ? "تسجيل الدخول" : "إنشاء حساب"}
            </button>
          ))}
        </div>
      )}

      {/* شريط الخطوات (دخول) */}
      {mode === "login" && (
        <div className="mt-5 flex items-start gap-1.5" aria-label="خطوات تسجيل الدخول">
          {["الحساب", "كلمة المرور", "التحقق"].map((label, i) => {
            const reached = stepIndex >= i;
            return (
              <div key={label} className="flex flex-1 flex-col gap-1.5">
                <span
                  className={`h-1 rounded-full transition-colors duration-300 ${
                    reached ? "bg-ink" : "bg-mist"
                  }`}
                />
                <span
                  className={`text-[10px] transition-colors duration-300 ${
                    reached ? "font-medium text-ink" : "text-steel"
                  }`}
                >
                  {label}
                </span>
              </div>
            );
          })}
        </div>
      )}

      {/* ——— خطأ / تنبيه ——— */}
      {error && (
        <div
          key={error}
          className="shake mt-4 flex items-start gap-2 rounded-lg bg-red-50 p-3 text-[13px] text-red-700 ring-1 ring-red-100"
        >
          <AlertCircle size={15} strokeWidth={1.9} className="mt-0.5 shrink-0" />
          {error}
        </div>
      )}
      {notice && (
        <div className="stagger-in mt-4 flex items-start gap-2 rounded-lg bg-paper p-3 text-[13px] leading-6 text-graphite ring-1 ring-mist">
          <MailCheck size={15} strokeWidth={1.8} className="mt-0.5 shrink-0 text-accent" />
          {notice}
        </div>
      )}

      {/* ————— دخول: المعرّف ————— */}
      {mode === "login" && step === "identifier" && (
        <div key="identifier" className="stagger-in mt-5">
          <button
            type="button"
            onClick={continueWithGoogle}
            disabled={busy !== null}
            className={googleBtn}
          >
            {busy === "google" ? (
              <Loader2 className="spin-ring" size={17} />
            ) : (
              <GoogleG size={17} />
            )}
            {busy === "google" ? "جارٍ التحويل إلى جوجل…" : "المتابعة باستخدام Google"}
          </button>

          <div className="my-5 flex items-center gap-3 text-[11px] text-steel">
            <span className="h-px flex-1 bg-mist" />
            أو
            <span className="h-px flex-1 bg-mist" />
          </div>

          <label className="block">
            <span className="mb-1.5 block text-xs font-medium text-graphite">
              البريد الإلكتروني أو رقم الهاتف
            </span>
            <input
              className={authInput}
              value={identifier}
              onChange={(e) => {
                setIdentifier(e.target.value);
                resetError();
              }}
              onKeyDown={(e) => e.key === "Enter" && submitIdentifier()}
              placeholder="you@gmail.com أو 9XXXXXXX"
              dir="auto"
              autoComplete="username"
              autoFocus
            />
          </label>
          {identifier && !identifierValid && (
            <p className="mt-1.5 text-xs text-accent-deep">{API_ERROR.invalid_email}</p>
          )}
          <p className="mt-1.5 text-[11px] text-steel">
            الهاتف أو البريد → رمز تحقق يصلك فوراً
          </p>

          <button
            type="button"
            onClick={submitIdentifier}
            disabled={!identifierValid || busy !== null}
            className={primaryBtn}
          >
            {busy === "otp-send" && <Loader2 className="spin-ring" size={16} />}
            متابعة
            <ChevronLeft size={16} strokeWidth={1.9} />
          </button>

          <button
            type="button"
            onClick={() => switchMode("forgot")}
            className="mt-4 text-xs text-steel transition-colors hover:text-ink"
          >
            نسيت كلمة المرور؟
          </button>
        </div>
      )}

      {/* ————— دخول: كلمة المرور ————— */}
      {mode === "login" && step === "password" && (
        <div key="password" className="stagger-in mt-5">
          <p className="text-[13px] text-steel">
            مرحباً بعودتك،{" "}
            <span className="font-medium text-ink" dir="auto">
              {identifier}
            </span>
          </p>
          <label className="mt-3 block">
            <span className="mb-1.5 block text-xs font-medium text-graphite">كلمة المرور</span>
            <div className="relative">
              <input
                type={showPw ? "text" : "password"}
                className={authInput}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  resetError();
                }}
                onKeyDown={(e) => e.key === "Enter" && submitPassword()}
                placeholder="••••••••"
                autoComplete="current-password"
                autoFocus
              />
              <button
                type="button"
                onClick={() => setShowPw((v) => !v)}
                aria-label={showPw ? "إخفاء كلمة المرور" : "إظهار كلمة المرور"}
                className="absolute end-3 top-1/2 -translate-y-1/2 text-steel hover:text-ink"
              >
                {showPw ? (
                  <EyeOff size={16} strokeWidth={1.75} />
                ) : (
                  <Eye size={16} strokeWidth={1.75} />
                )}
              </button>
            </div>
          </label>
          <button
            type="button"
            onClick={submitPassword}
            disabled={busy === "login" || password.length < 6}
            className={primaryBtn}
          >
            {busy === "login" && <Loader2 className="spin-ring" size={16} />}
            {busy === "login" ? "جارٍ التحقق…" : "تسجيل الدخول"}
          </button>
          <button
            type="button"
            onClick={() => setStep("identifier")}
            className="mt-3 inline-flex items-center gap-1 text-xs text-steel transition-colors hover:text-ink"
          >
            <ArrowRight size={13} strokeWidth={1.9} />
            تغيير الحساب
          </button>
        </div>
      )}

      {/* ————— OTP ————— */}
      {step === "otp" && (
        <div key="otp" className="stagger-in mt-5">
          <p className="text-[13px] leading-6 text-steel">
            {otpChannel === "email" ? "أرسلنا رمز التحقق إلى بريدك " : "أرسلنا رمز التحقق إلى "}
            <span className="font-medium text-ink" dir="ltr">
              {otpChannel === "email" ? otpTarget : `+968 ${otpTarget}`}
            </span>
          </p>

          <div
            className="mt-4 flex justify-center gap-2"
            dir="ltr"
            onPaste={(e) => {
              e.preventDefault();
              const digits = e.clipboardData.getData("text").replace(/\D/g, "");
              if (!digits) return;
              setOtp((prev) => {
                const next = [...prev];
                for (let k = 0; k < Math.min(digits.length, otpLength); k++) next[k] = digits[k];
                return next;
              });
              otpRefs.current[Math.min(digits.length, otpLength - 1)]?.focus();
            }}
          >
            {otp.map((d, i) => (
              <input
                key={i}
                ref={(el) => {
                  otpRefs.current[i] = el;
                }}
                value={d}
                onChange={(e) => setOtpAt(i, e.target.value)}
                onKeyDown={(e) => onOtpKeyDown(i, e)}
                inputMode="numeric"
                maxLength={1}
                aria-label={`رقم ${i + 1}`}
                className={`otp-cell h-12 w-12 rounded-lg border border-mist bg-white text-center text-xl font-semibold text-ink outline-none transition-colors focus:border-accent focus:ring-2 focus:ring-accent/25 sm:h-[52px] sm:w-[52px] ${
                  d ? "filled" : ""
                }`}
              />
            ))}
          </div>

          <button
            type="button"
            onClick={submitOtp}
            disabled={!isOtpComplete(otpValue, otpLength) || busy !== null}
            className={primaryBtn}
          >
            {busy === "otp" ? (
              <Loader2 className="spin-ring" size={16} />
            ) : (
              <ShieldCheck size={16} strokeWidth={1.9} />
            )}
            {busy === "otp" ? "جارٍ التحقق…" : "تأكيد الرمز"}
          </button>

          <p className="mt-3 text-xs text-steel">
            لم يصلك الرمز؟{" "}
            {otpCountdown > 0 ? (
              <span dir="ltr">أعد الإرسال خلال {otpCountdown}s</span>
            ) : (
              <button
                type="button"
                onClick={resendOtp}
                disabled={busy !== null}
                className="font-medium text-accent hover:underline"
              >
                إعادة الإرسال
              </button>
            )}
          </p>

          <button
            type="button"
            onClick={() => {
              setOtp(Array(otpLength).fill(""));
              setStep(mode === "login" ? "identifier" : "details");
            }}
            className="mt-4 text-xs text-steel underline-offset-4 hover:text-ink hover:underline"
          >
            العودة والبدء من جديد
          </button>
        </div>
      )}

      {/* ————— تسجيل ————— */}
      {mode === "register" && step === "details" && (
        <div key="details" className="stagger-in mt-5">
          <button
            type="button"
            onClick={continueWithGoogle}
            disabled={busy !== null}
            className={googleBtn}
          >
            {busy === "google" ? (
              <Loader2 className="spin-ring" size={17} />
            ) : (
              <GoogleG size={17} />
            )}
            {busy === "google" ? "جارٍ التحويل إلى جوجل…" : "المتابعة باستخدام Google"}
          </button>

          <div className="my-5 flex items-center gap-3 text-[11px] text-steel">
            <span className="h-px flex-1 bg-mist" />
            أو أنشئ حساباً جديداً
            <span className="h-px flex-1 bg-mist" />
          </div>

          <div className="space-y-3.5">
            <label className="block">
              <span className="mb-1.5 block text-xs font-medium text-graphite">الاسم الكامل</span>
              <input
                className={authInput}
                value={regName}
                onChange={(e) => {
                  setRegName(e.target.value);
                  resetError();
                }}
                placeholder="محمد العامري"
                autoComplete="name"
                autoFocus
              />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-xs font-medium text-graphite">
                البريد الإلكتروني
              </span>
              <input
                className={authInput}
                value={regEmail}
                onChange={(e) => {
                  setRegEmail(e.target.value);
                  resetError();
                }}
                placeholder="you@gmail.com"
                dir="ltr"
                type="email"
                autoComplete="email"
              />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-xs font-medium text-graphite">رقم الهاتف</span>
              <input
                className={authInput}
                value={regPhone}
                onChange={(e) => {
                  setRegPhone(e.target.value);
                  resetError();
                }}
                placeholder="9XXXXXXX"
                dir="ltr"
                inputMode="numeric"
                autoComplete="tel"
              />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-xs font-medium text-graphite">كلمة المرور</span>
              <input
                type="password"
                className={authInput}
                value={regPassword}
                onChange={(e) => {
                  setRegPassword(e.target.value);
                  resetError();
                }}
                placeholder="6 أحرف على الأقل"
                autoComplete="new-password"
              />
            </label>
          </div>

          <button
            type="button"
            onClick={submitRegister}
            disabled={busy !== null}
            className={primaryBtn}
          >
            {busy === "register" && <Loader2 className="spin-ring" size={16} />}
            {busy === "register" ? "جارٍ إنشاء الحساب…" : "إنشاء الحساب"}
          </button>
        </div>
      )}

      {/* ————— استعادة كلمة المرور ————— */}
      {mode === "forgot" && (
        <div key="forgot" className="stagger-in mt-5">
          <p className="flex items-center gap-2 text-sm font-medium text-ink">
            <KeyRound size={16} strokeWidth={1.8} className="text-accent" />
            استعادة كلمة المرور
          </p>
          <p className="mt-2 text-[13px] leading-6 text-steel">
            أدخل بريدك الإلكتروني وسنرسل لك رابط تعيين كلمة مرور جديدة.
          </p>
          <label className="mt-4 block">
            <span className="mb-1.5 block text-xs font-medium text-graphite">
              البريد الإلكتروني
            </span>
            <input
              className={authInput}
              value={resetEmail}
              onChange={(e) => {
                setResetEmail(e.target.value);
                resetError();
              }}
              onKeyDown={(e) => e.key === "Enter" && submitReset()}
              placeholder="you@gmail.com"
              dir="ltr"
              type="email"
              autoComplete="email"
              autoFocus
            />
          </label>
          <button
            type="button"
            onClick={submitReset}
            disabled={busy !== null || !isEmail(resetEmail)}
            className={primaryBtn}
          >
            {busy === "reset" && <Loader2 className="spin-ring" size={16} />}
            {busy === "reset" ? "جارٍ الإرسال…" : "إرسال رابط الاستعادة"}
          </button>
          <button
            type="button"
            onClick={() => switchMode("login")}
            className="mt-3 inline-flex items-center gap-1 text-xs text-steel transition-colors hover:text-ink"
          >
            <ArrowRight size={13} strokeWidth={1.9} />
            العودة لتسجيل الدخول
          </button>
        </div>
      )}
    </div>
  );
}

/* ————— مشتركات ————— */

const authInput =
  "h-12 w-full rounded-lg border border-mist bg-white px-4 text-sm text-ink outline-none transition-colors placeholder:text-steel focus:border-accent";

const primaryBtn =
  "mt-5 flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-ink text-sm font-medium text-white transition-all duration-200 hover:bg-accent active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50";

const googleBtn =
  "flex h-12 w-full items-center justify-center gap-2.5 rounded-lg border border-mist bg-white text-sm font-medium text-ink transition-all duration-200 hover:border-steel hover:bg-cloud active:scale-[0.98] disabled:opacity-60";
