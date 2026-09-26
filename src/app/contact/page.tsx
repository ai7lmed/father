"use client";

import { useState } from "react";
import { Mail, Phone, MapPin, Clock, Check } from "lucide-react";
import { Reveal } from "@/components/motion";

export default function ContactPage() {
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [sent, setSent] = useState(false);

  const set = (k: keyof typeof form, v: string) => {
    setForm((f) => ({ ...f, [k]: v }));
    setErrors((e) => ({ ...e, [k]: "" }));
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const next: Record<string, string> = {};
    if (form.name.trim().length < 2) next.name = "أدخل اسمك";
    if (!/^\S+@\S+\.\S+$/.test(form.email.trim()))
      next.email = "بريد إلكتروني غير صحيح";
    if (form.message.trim().length < 10) next.message = "اكتب رسالتك (10 أحرف على الأقل)";
    setErrors(next);
    if (Object.keys(next).length === 0) setSent(true);
  };

  const cards = [
    {
      icon: Mail,
      title: "البريد الإلكتروني",
      value: "support@qaven.om",
      href: "mailto:support@qaven.om",
    },
    {
      icon: Phone,
      title: "الهاتف / واتساب",
      value: "+968 9XXX XXXX",
      href: "tel:+96890000000",
    },
    {
      icon: MapPin,
      title: "الموقع",
      value: "مسقط، سلطنة عُمان",
    },
    {
      icon: Clock,
      title: "ساعات العمل",
      value: "الأحد – الخميس، 9ص – 6م",
    },
  ];

  const inputCls =
    "h-11 w-full rounded-lg border border-mist bg-white px-4 text-sm text-ink outline-none transition-colors placeholder:text-steel focus:border-graphite";

  return (
    <div className="shell py-12 sm:py-16">
      <p className="eyebrow">CONTACT</p>
      <h1 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">
        تواصل معنا
      </h1>
      <p className="mt-3 max-w-md text-sm leading-7 text-steel">
        سؤال عن منتج، طلب، أو شراكة — راسلنا وسنرد خلال يوم عمل واحد.
      </p>

      <div className="mt-10 grid gap-12 lg:grid-cols-[380px_1fr] lg:gap-16">
        {/* Info cards */}
        <div className="space-y-3">
          {cards.map((c, i) => {
            const inner = (
              <>
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-mist text-graphite">
                  <c.icon size={18} strokeWidth={1.6} />
                </span>
                <div className="min-w-0">
                  <p className="text-xs text-steel">{c.title}</p>
                  <p dir="auto" className="mt-0.5 text-sm font-medium text-ink">
                    {c.value}
                  </p>
                </div>
              </>
            );
            return (
              <Reveal key={c.title} delay={i * 60}>
                {c.href ? (
                  <a
                    href={c.href}
                    className="flex items-center gap-4 rounded-xl border border-mist bg-white p-4 transition-colors hover:border-graphite"
                  >
                    {inner}
                  </a>
                ) : (
                  <div className="flex items-center gap-4 rounded-xl border border-mist bg-white p-4">
                    {inner}
                  </div>
                )}
              </Reveal>
            );
          })}
        </div>

        {/* Form */}
        <div>
          {sent ? (
            <div className="flex h-full min-h-72 flex-col items-center justify-center rounded-2xl border border-mist bg-paper p-10 text-center">
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-ink text-white badge-pop">
                <Check size={22} strokeWidth={2} />
              </span>
              <h2 className="mt-5 text-lg font-semibold text-ink">
                وصلت رسالتك
              </h2>
              <p className="mt-2 text-sm text-steel">
                سنرد عليك خلال يوم عمل واحد.
              </p>
              <button
                type="button"
                onClick={() => {
                  setForm({ name: "", email: "", message: "" });
                  setSent(false);
                }
                }
                className="mt-6 text-sm text-steel underline-offset-4 transition-colors hover:text-ink hover:underline"
              >
                إرسال رسالة أخرى
              </button>
            </div>
          ) : (
            <form onSubmit={submit} noValidate className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className="mb-1.5 block text-xs font-medium text-graphite">
                    الاسم
                  </span>
                  <input
                    className={inputCls}
                    value={form.name}
                    onChange={(e) => set("name", e.target.value)}
                    placeholder="اسمك الكامل"
                    autoComplete="name"
                  />
                  {errors.name && (
                    <span className="mt-1 block text-xs text-graphite">
                      {errors.name}
                    </span>
                  )}
                </label>
                <label className="block">
                  <span className="mb-1.5 block text-xs font-medium text-graphite">
                    البريد الإلكتروني
                  </span>
                  <input
                    className={inputCls}
                    value={form.email}
                    onChange={(e) => set("email", e.target.value)}
                    placeholder="you@example.com"
                    inputMode="email"
                    autoComplete="email"
                  />
                  {errors.email && (
                    <span className="mt-1 block text-xs text-graphite">
                      {errors.email}
                    </span>
                  )}
                </label>
              </div>

              <label className="block">
                <span className="mb-1.5 block text-xs font-medium text-graphite">
                  الرسالة
                </span>
                <textarea
                  value={form.message}
                  onChange={(e) => set("message", e.target.value)}
                  rows={6}
                  placeholder="كيف نساعدك؟"
                  className="w-full rounded-lg border border-mist bg-white px-4 py-3 text-sm text-ink outline-none transition-colors placeholder:text-steel focus:border-graphite"
                />
                {errors.message && (
                  <span className="mt-1 block text-xs text-graphite">
                    {errors.message}
                  </span>
                )}
              </label>

              <button
                type="submit"
                className="inline-flex h-12 items-center rounded-lg bg-ink px-8 text-sm font-medium text-white transition-all duration-200 hover:bg-carbon active:scale-[0.98]"
              >
                إرسال الرسالة
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
