import type { Metadata } from "next";
import Link from "next/link";
import { Truck, ShieldCheck, Headphones } from "lucide-react";
import { AuthExperience } from "@/components/auth-experience";

export const metadata: Metadata = {
  title: "تسجيل الدخول",
};

export default function LoginPage() {
  return (
    <div className="shell py-10 sm:py-14">
      <div className="mx-auto grid max-w-5xl overflow-hidden rounded-2xl border border-mist bg-white shadow-sm lg:grid-cols-[1.05fr_1fr]">
        {/* ——— اللوحة البصرية (الجوال: أعلى، الكمبيوتر: يمين) ——— */}
        <div className="relative hidden min-h-[560px] overflow-hidden bg-night lg:block lg:order-2">
          <div className="absolute inset-0 bg-gradient-to-t from-night via-night/70 to-night/30" />
          <div className="relative flex h-full flex-col justify-between p-10">
            <Link href="/" className="text-xl font-bold tracking-[0.35em] text-white">
              QAVEN
            </Link>
            <div className="stagger-in">
              <p className="eyebrow text-silver">QAVEN ACCOUNT</p>
              <h2 className="mt-3 text-2xl font-semibold leading-relaxed text-white">
                تقنيتك، بأقل خطوة.
              </h2>
              <p className="mt-3 max-w-xs text-sm leading-7 text-silver">
                حساب واحد يفتح لك كل شيء — عناوين محفوظة، طلبات متتبعة، وسلة
                تنتظرك بين الجلسات.
              </p>

              <ul className="mt-8 space-y-4">
                {[
                  { icon: Truck, t: "توصيل لكل محافظات عُمان — العادي مجاني" },
                  { icon: ShieldCheck, t: "دفع آمن: عند الاستلام أو تحويل بنكي" },
                  { icon: Headphones, t: "دعم مباشر يتابع طلبك حتى الاستلام" },
                ].map(({ icon: Icon, t }) => (
                  <li key={t} className="flex items-center gap-3 text-[13px] text-white/85">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/10 ring-1 ring-white/15">
                      <Icon size={16} strokeWidth={1.6} />
                    </span>
                    {t}
                  </li>
                ))}
              </ul>
            </div>
            <p className="text-[11px] text-white/40">
              Technology. Simplified.
            </p>
          </div>
        </div>

        {/* ——— النموذج ——— */}
        <div className="p-7 sm:p-10 lg:order-1">
          <div className="mb-7 flex items-center justify-between">
            <Link href="/" className="text-lg font-bold tracking-[0.35em] text-ink lg:hidden">
              QAVEN
            </Link>
            <Link
              href="/"
              className="ms-auto text-xs text-steel transition-colors hover:text-ink"
            >
              متابعة التسوق ←
            </Link>
          </div>

          <h1 className="text-2xl font-semibold tracking-tight text-ink">
            مرحباً بك في QAVEN
          </h1>
          <p className="mt-2 text-sm text-steel">
            سجّل دخولك أو أنشئ حساباً جديداً — التجربة نفسها في الحالتين.
          </p>

          <div className="mt-7">
            <AuthExperience />
          </div>

          <p className="mt-7 text-[11px] leading-5 text-steel">
            بالمتابعة أنت توافق على{" "}
            <Link href="/policies/terms" className="text-graphite underline underline-offset-4 hover:text-ink">
              الشروط والأحكام
            </Link>{" "}
            و
            <Link href="/policies/privacy" className="text-graphite underline underline-offset-4 hover:text-ink">
              سياسة الخصوصية
            </Link>
            .
          </p>
        </div>
      </div>
    </div>
  );
}
