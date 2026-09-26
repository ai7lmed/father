"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import {
  MapPin,
  Package,
  LogIn,
  LogOut,
  ShieldCheck,
  Zap,
  Loader2,
  Plus,
  Trash2,
  LayoutDashboard,
} from "lucide-react";
import { useAuth } from "@/lib/auth";
import { formatPrice } from "@/lib/products";

const STATUS_LABEL: Record<string, string> = {
  pending: "بانتظار تأكيد التحويل",
  confirmed: "مؤكد — قيد التجهيز",
  processing: "قيد التجهيز",
  shipped: "تم الشحن",
  delivered: "تم التوصيل",
  cancelled: "ملغي",
};

type SavedAddress = {
  id: string;
  label: string;
  full_name: string;
  phone: string;
  city: string;
  address: string;
  notes: string | null;
  is_default: boolean;
};

type SavedOrder = {
  id: string;
  status: string;
  total: number;
  delivery_method: string;
  payment_method: string;
  placed_at: string;
  items?: { product_id: string; name: string; qty: number; unit_price: number }[];
};

export default function AccountPage() {
  const { customer, ready, signOut, isAdmin } = useAuth();

  /* ——— تحميل الجلسة ——— */
  if (!ready) {
    return (
      <div className="shell flex min-h-[50vh] items-center justify-center py-20">
        <Loader2 className="spin-ring text-steel" size={26} />
      </div>
    );
  }

  /* ——— غير مسجل ——— */
  if (!customer) {
    return (
      <div className="shell py-12 sm:py-16">
        <div className="mx-auto max-w-md">
          <p className="eyebrow">ACCOUNT</p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight">حسابي</h1>
          <p className="mt-3 text-sm leading-7 text-graphite">
            سجّل دخولك مرة واحدة — تُحفظ بياناتك وتُعبّأ تلقائياً عند الشراء،
            مع سجل طلباتك دائماً في متناولك.
          </p>

          <div className="mt-7 space-y-2.5">
            {[
              {
                icon: Zap,
                t: "شراء أسرع",
                d: "بياناتك معبأة تلقائياً — تختار التوصيل والدفع وتؤكد فقط.",
              },
              {
                icon: MapPin,
                t: "عناوين محفوظة",
                d: "أضف عناوينك مرة واحدة واستخدمها في كل طلب.",
              },
              {
                icon: Package,
                t: "سجل الطلبات",
                d: "تابع حالة كل طلب: تأكيد، تجهيز، شحن، توصيل.",
              },
              {
                icon: ShieldCheck,
                t: "دخول آمن",
                d: "Google أو البريد أو رمز تحقق OTP لرقمك العُماني.",
              },
            ].map(({ icon: Icon, t, d }, i) => (
              <div
                key={t}
                className="stagger-in flex gap-3.5 rounded-xl border border-mist bg-white p-4"
                style={{ animationDelay: `${i * 60}ms` }}
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-paper ring-1 ring-mist">
                  <Icon size={16} strokeWidth={1.6} className="text-accent" />
                </span>
                <div>
                  <p className="text-sm font-medium text-ink">{t}</p>
                  <p className="mt-0.5 text-xs leading-6 text-steel">{d}</p>
                </div>
              </div>
            ))}
          </div>

          <Link
            href="/login?next=/account"
            className="mt-7 flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-ink text-sm font-medium text-white transition-all duration-200 hover:bg-accent active:scale-[0.98]"
          >
            <LogIn size={16} strokeWidth={1.9} />
            تسجيل الدخول / إنشاء حساب
          </Link>
        </div>
      </div>
    );
  }

  return <SignedIn customer={customer} signOut={signOut} />;
}

/* ——— مسجل: عناوين وطلبات حقيقية من قاعدة البيانات ——— */

function SignedIn({
  customer,
  signOut,
}: {
  customer: NonNullable<ReturnType<typeof useAuth>["customer"]>;
  signOut: () => Promise<void>;
}) {
  const { isAdmin } = useAuth();
  const [tab, setTab] = useState<"addresses" | "orders">("orders");
  const [addresses, setAddresses] = useState<SavedAddress[]>([]);
  const [orders, setOrders] = useState<SavedOrder[]>([]);
  const [coupon, setCoupon] = useState<{ code: string; used_at: string | null; expires_at: string | null } | null>(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    label: "المنزل",
    fullName: customer.name ?? "",
    phone: customer.phone ?? "",
    city: "",
    address: "",
    isDefault: false,
  });
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [addrRes, ordRes, cpnRes] = await Promise.all([
        fetch("/api/addresses", { cache: "no-store" }).then((r) => r.json()),
        fetch("/api/account/orders", { cache: "no-store" }).then((r) => r.json()),
        fetch("/api/account/coupon", { cache: "no-store" }).then((r) => r.json()).catch(() => ({})),
      ]);
      setAddresses(addrRes.addresses ?? []);
      setOrders(ordRes.orders ?? []);
      setCoupon(cpnRes.coupon ?? null);
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const saveAddress = async () => {
    if (!form.fullName.trim() || !form.phone.trim() || !form.city.trim() || !form.address.trim()) return;
    setSaving(true);
    await fetch("/api/addresses", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(form),
    });
    setSaving(false);
    setShowForm(false);
    setForm({ label: "المنزل", fullName: customer.name ?? "", phone: customer.phone ?? "", city: "", address: "", isDefault: false });
    await load();
  };

  const removeAddress = async (id: string) => {
    await fetch(`/api/addresses?id=${encodeURIComponent(id)}`, { method: "DELETE" });
    await load();
  };

  const inputCls =
    "h-11 w-full rounded-lg border border-mist bg-white px-4 text-sm text-ink outline-none transition-colors placeholder:text-steel focus:border-accent";

  return (
    <div className="shell min-h-[60vh] py-10 sm:py-14">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="eyebrow">ACCOUNT</p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight">حسابي</h1>
          <p className="mt-2 text-sm text-steel">
            {customer.name || "عميل QAVEN"}
            {customer.email && (
              <>
                {" · "}
                <span dir="ltr">{customer.email}</span>
              </>
            )}
            {customer.phone && (
              <>
                {" · "}
                <span dir="ltr">+968 {customer.phone}</span>
              </>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {isAdmin && (
            <a
              href="/dashboard"
            className="inline-flex h-10 items-center gap-2 rounded-lg bg-ink px-4 text-sm font-medium text-white transition-colors hover:bg-accent"
          >
            <LayoutDashboard size={15} strokeWidth={1.75} />
            لوحة التحكم
          </a>
          )}
          <button
            type="button"
            onClick={() => signOut()}
            className="inline-flex h-10 items-center gap-2 rounded-lg border border-mist bg-white px-4 text-sm text-graphite transition-colors hover:border-ink hover:text-ink"
          >
            <LogOut size={15} strokeWidth={1.75} />
            تسجيل الخروج
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="mt-8 flex gap-1.5 border-b border-mist">
        {(
          [
            { id: "orders", label: "طلباتي", icon: Package },
            { id: "addresses", label: "العناوين", icon: MapPin },
          ] as const
        ).map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`-mb-px inline-flex items-center gap-1.5 border-b-2 px-4 py-3 text-sm transition-colors ${
              tab === t.id ? "border-ink font-medium text-ink" : "border-transparent text-steel hover:text-ink"
            }`}
          >
            <t.icon size={15} strokeWidth={1.75} />
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="spin-ring text-steel" size={24} />
        </div>
      ) : tab === "orders" && coupon ? (
        <div className="mt-6 max-w-2xl">
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-dashed border-silver bg-paper p-4">
            <div>
              <p className="text-sm font-semibold text-ink">كوبونك — خصم 2.000 ر.ع</p>
              <p className="mt-0.5 text-xs text-steel">
                {coupon.used_at
                  ? `استُخدم في طلبك — شكراً لك`
                  : "على أي منتج من 12.000 ر.ع أو أكثر · مرة واحدة"}
                {coupon.expires_at && !coupon.used_at &&
                  ` · حتى ${new Date(coupon.expires_at).toLocaleDateString("ar-OM")}`}
              </p>
            </div>
            <span
              dir="ltr"
              className={`select-all rounded-lg border px-4 py-2 text-sm font-bold tracking-[0.15em] ${
                coupon.used_at ? "border-mist bg-cloud text-steel line-through" : "border-ink bg-white text-ink"
              }`}
            >
              {coupon.code}
            </span>
          </div>
        </div>
      ) : tab === "addresses" ? (
        /* ——— العناوين ——— */
        <div className="mt-8 max-w-2xl">
          {addresses.length > 0 && (
            <div className="grid gap-3 sm:grid-cols-2">
              {addresses.map((a) => (
                <div key={a.id} className="rounded-xl border border-mist bg-white p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-ink">
                      {a.label}
                      {a.is_default && (
                        <span className="ms-2 rounded bg-paper px-1.5 py-0.5 text-[10px] font-normal text-steel ring-1 ring-mist">
                          الافتراضي
                        </span>
                      )}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeAddress(a.id)}
                      aria-label="حذف العنوان"
                      className="rounded-md p-1.5 text-steel transition-colors hover:bg-cloud hover:text-ink"
                    >
                      <Trash2 size={14} strokeWidth={1.75} />
                    </button>
                  </div>
                  <p className="mt-2 text-[13px] leading-6 text-graphite">
                    {a.full_name} · <span dir="ltr">{a.phone}</span>
                    <br />
                    {a.city} — {a.address}
                  </p>
                </div>
              ))}
            </div>
          )}

          {showForm ? (
            <div className="mt-4 rounded-2xl border border-mist bg-white p-6">
              <h2 className="text-sm font-semibold text-ink">عنوان جديد</h2>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className="mb-1.5 block text-xs font-medium text-graphite">اسم العنوان</span>
                  <input className={inputCls} value={form.label} onChange={(e) => setForm((f) => ({ ...f, label: e.target.value }))} placeholder="المنزل، العمل…" />
                </label>
                <label className="block">
                  <span className="mb-1.5 block text-xs font-medium text-graphite">الاسم الكامل</span>
                  <input className={inputCls} value={form.fullName} onChange={(e) => setForm((f) => ({ ...f, fullName: e.target.value }))} />
                </label>
                <label className="block">
                  <span className="mb-1.5 block text-xs font-medium text-graphite">رقم الهاتف</span>
                  <input className={inputCls} value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} dir="ltr" inputMode="numeric" placeholder="9XXXXXXX" />
                </label>
                <label className="block">
                  <span className="mb-1.5 block text-xs font-medium text-graphite">الولاية / المدينة</span>
                  <input className={inputCls} value={form.city} onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))} placeholder="مسقط، السيب…" />
                </label>
                <label className="block sm:col-span-2">
                  <span className="mb-1.5 block text-xs font-medium text-graphite">العنوان التفصيلي</span>
                  <input className={inputCls} value={form.address} onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))} placeholder="الحي، الشارع، رقم المنزل" />
                </label>
              </div>
              <label className="mt-4 flex items-center gap-2.5 text-sm text-graphite">
                <input type="checkbox" checked={form.isDefault} onChange={(e) => setForm((f) => ({ ...f, isDefault: e.target.checked }))} className="h-4 w-4 accent-[#2e6ba8]" />
                تعيين كعنوان افتراضي
              </label>
              <div className="mt-5 flex gap-3">
                <button
                  type="button"
                  onClick={saveAddress}
                  disabled={saving}
                  className="h-11 rounded-lg bg-ink px-6 text-sm font-medium text-white transition-colors hover:bg-accent disabled:opacity-50"
                >
                  {saving ? "جارٍ الحفظ…" : "حفظ العنوان"}
                </button>
                <button type="button" onClick={() => setShowForm(false)} className="h-11 rounded-lg border border-mist px-6 text-sm text-graphite transition-colors hover:border-steel hover:text-ink">
                  إلغاء
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setShowForm(true)}
              className="mt-4 flex min-h-16 w-full flex-col items-start justify-center gap-1 rounded-xl border border-dashed border-silver p-4 text-sm text-graphite transition-colors hover:border-accent hover:text-accent"
            >
              <Plus size={16} strokeWidth={1.75} />
              إضافة عنوان جديد
            </button>
          )}
        </div>
      ) : (
        /* ——— الطلبات ——— */
        <div className="mt-8 max-w-2xl space-y-4">
          {orders.length === 0 ? (
            <div className="rounded-xl border border-mist bg-paper p-10 text-center">
              <p className="text-sm text-graphite">لا توجد طلبات بعد.</p>
              <Link href="/shop" className="mt-4 inline-flex h-11 items-center rounded-lg bg-ink px-6 text-sm font-medium text-white transition-colors hover:bg-accent">
                ابدأ التسوق
              </Link>
            </div>
          ) : (
            orders.map((o) => (
              <div key={o.id} className="rounded-xl border border-mist bg-white p-5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span dir="ltr" className="text-sm font-semibold text-ink">
                    {o.id}
                  </span>
                  <span
                    className={`rounded-full px-2.5 py-1 text-[11px] font-medium ${
                      o.status === "delivered"
                        ? "bg-emerald-50 text-emerald-700"
                        : o.status === "cancelled"
                          ? "bg-mist text-steel"
                          : "bg-paper text-graphite ring-1 ring-mist"
                    }`}
                  >
                    {STATUS_LABEL[o.status] ?? o.status}
                  </span>
                </div>
                <p className="mt-2 text-xs text-steel">
                  {new Date(o.placed_at).toLocaleDateString("ar-OM", { year: "numeric", month: "long", day: "numeric" })} ·{" "}
                  {o.delivery_method === "fast" ? "توصيل سريع" : "توصيل عادي مجاني"} ·{" "}
                  {o.payment_method === "cod" ? "دفع عند الاستلام" : "تحويل بنكي"}
                </p>
                {o.items && (
                  <ul className="mt-3 space-y-1 text-[13px] text-graphite">
                    {o.items.map((it, i) => (
                      <li key={i}>
                        {it.name} × {it.qty}
                      </li>
                    ))}
                  </ul>
                )}
                <div className="mt-3 flex justify-between border-t border-mist pt-3 text-sm">
                  <span className="text-steel">{o.delivery_method === "fast" ? "+ 2.500 ر.ع توصيل سريع" : "توصيل مجاني"}</span>
                  <span className="font-semibold text-ink">{formatPrice(o.total)}</span>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
