"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Check,
  Truck,
  Zap,
  Banknote,
  Building2,
  Upload,
  UserRound,
  LogIn,
} from "lucide-react";
import { useCart } from "@/lib/cart";
import { useAuth } from "@/lib/auth";
import {
  formatPrice,
  getProduct,
  settings,
  FAST_DELIVERY_FEE,
  type Product,
} from "@/lib/products";
import { SafeImg } from "@/components/ui";

/* طريقة التوصيل/الدفع تُدار من الإعدادات (→ DB لاحقًا) */
type DeliveryCode = "standard" | "fast";
type PaymentCode = "cod" | "bank_transfer";

type Form = {
  fullName: string;
  phone: string;
  city: string;
  address: string;
  notes: string;
};

const OMANI_CITIES = [
  "مسقط", "السيب", "مطرح", "بوشر", "قريات", "ال عامراط", "عمان (ولاية)",
  "صحار", "العوابي", "البريمي", "شناص", "نزوى", "إبراء", "بدية", "المضيبي",
  "صور", "جعلان بني بو علي", "Sur", "بهلاء", "أدم", "حيماء", "الدقم",
  "صلالة", "ثمريت", "طاقة", "مرباط", "خصب", "دبا", "مدحاء", "البكاء",
];

export default function CheckoutPage() {
  const { items, ready: cartReady, clear } = useCart();
  const { customer } = useAuth();
  const router = useRouter();

  const [form, setForm] = useState<Form>({
    fullName: "",
    phone: "",
    city: "",
    address: "",
    notes: "",
  });
  const [prefilled, setPrefilled] = useState(false);
  const [savedAddresses, setSavedAddresses] = useState<
    { id: string; label: string; full_name: string; phone: string; city: string; address: string; notes: string | null }[]
  >([]);
  const [activeAddressId, setActiveAddressId] = useState<string | null>(null);
  const [orderError, setOrderError] = useState<string | null>(null);
  const [delivery, setDelivery] = useState<DeliveryCode>("standard");
  const [payment, setPayment] = useState<PaymentCode>("cod");
  const [receipt, setReceipt] = useState<string | null>(null);
  const [placing, setPlacing] = useState(false);
  const [couponInput, setCouponInput] = useState("");
  const [couponState, setCouponState] = useState<"idle" | "checking" | "ok" | "error">("idle");
  const [couponMsg, setCouponMsg] = useState<string | null>(null);
  const [couponDiscount, setCouponDiscount] = useState(0);

  const rows = useMemo(
    () =>
      items
        .map((i) => ({ item: i, product: getProduct(i.id) }))
        .filter((r): r is { item: (typeof items)[number]; product: Product } =>
          Boolean(r.product)
        ),
    [items]
  );

  const subtotal = rows.reduce((s, r) => s + r.product.price * r.item.qty, 0);

  /* القاعدة: التوصيل العادي مجاني لجميع الطلبات.
     التوصيل السريع فقط برسوم 2.500 ر.ع.
     الطلبات ≥ 25 ر.ع مؤهلة للتوصيل المجاني (العادي مجاني أصلاً). */
  const deliveryFee = delivery === "fast" ? FAST_DELIVERY_FEE : 0;
  const total = subtotal + deliveryFee;
  const freeShipping = subtotal >= 25;

  /* سلة فارغة → عودة للسلة (مع حماية من التسابق أثناء التأكيد) */
  useEffect(() => {
    if (cartReady && rows.length === 0 && !placing) router.replace("/cart");
  }, [cartReady, rows.length, placing, router]);

  /* تعبئة تلقائية من حساب العميل وعناوينه المحفوظة (قاعدة البيانات) */
  useEffect(() => {
    if (!customer || prefilled) return;
    setPrefilled(true);
    (async () => {
      try {
        const res = await fetch("/api/checkout-data", { cache: "no-store" });
        const json = (await res.json()) as {
          customer: { name?: string | null; phone?: string | null } | null;
          addresses: { id: string; label: string; full_name: string; phone: string; city: string; address: string; notes: string | null; is_default: boolean }[];
        };
        if (json.addresses?.length) {
          setSavedAddresses(json.addresses);
          const def = json.addresses[0];
          setActiveAddressId(def.id);
          setForm((f) => ({
            ...f,
            fullName: def.full_name || f.fullName,
            phone: def.phone || f.phone,
            city: def.city || f.city,
            address: def.address || f.address,
            notes: def.notes || f.notes,
          }));
        } else if (json.customer) {
          setForm((f) => ({
            ...f,
            fullName: f.fullName || json.customer?.name || "",
            phone: f.phone || (json.customer?.phone ? json.customer.phone.replace(/^968/, "") : ""),
          }));
        }
      } catch {
        /* فشل التعبئة لا يعطل الشراء */
      }
    })();
  }, [customer, prefilled]);

  /* اختيار عنوان محفوظ */
  const useSavedAddress = (id: string) => {
    const a = savedAddresses.find((x) => x.id === id);
    if (!a) return;
    setActiveAddressId(id);
    setForm((f) => ({
      ...f,
      fullName: a.full_name,
      phone: a.phone,
      city: a.city,
      address: a.address,
      notes: a.notes || "",
    }));
  };

  const formValid =
    form.fullName.trim().length >= 2 &&
    /^9\d{7}$/.test(form.phone.replace(/\D/g, "").replace(/^(?:968|00968)/, "")) &&
    form.city.trim() !== "" &&
    form.address.trim().length >= 5;

  const COUPON_MSG: Record<string, string> = {
    coupon_not_found: "الكوبون غير موجود أو ليس لك.",
    coupon_already_used: "هذا الكوبون مستُخدم من قبل — مرة واحدة فقط.",
    coupon_expired: "انتهت صلاحية الكوبون.",
    coupon_min_product: "الكوبون ينطبق على المنتجات من 12.000 ر.ع أو أكثر.",
    coupon_invalid: "الكوبون غير صالح.",
  };

  const checkCoupon = async () => {
    const code = couponInput.trim().toUpperCase();
    if (!code || couponState === "checking") return;
    setCouponState("checking");
    setCouponMsg(null);
    try {
      const res = await fetch("/api/coupons/validate", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ code, items: rows.map(({ item, product }) => ({ productId: item.id, price: product.price, qty: item.qty })) }),
      });
      const json = (await res.json()) as { ok: boolean; error?: string; discount?: number };
      if (json.ok && json.discount) {
        setCouponState("ok");
        setCouponDiscount(json.discount);
        setCouponMsg(`تم تطبيق الكوبون — خصم ${formatPrice(json.discount)}`);
      } else {
        setCouponState("error");
        setCouponDiscount(0);
        setCouponMsg(COUPON_MSG[json.error ?? ""] ?? "الكوبون غير صالح.");
      }
    } catch {
      setCouponState("error");
      setCouponMsg("تعذّر التحقق — أعد المحاولة.");
    }
  };

  const canPlace = formValid && (payment !== "bank_transfer" || Boolean(receipt)) && !placing;

  const placeOrder = async () => {
    if (!canPlace || rows.length === 0) return;
    setPlacing(true);
    setOrderError(null);
    try {
      /* الطلب يُنشأ على الخادم — التسعير من قاعدة البيانات، لا من المتصفح */
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          items: rows.map((r) => ({ productId: r.product.id, qty: r.item.qty })),
          deliveryMethod: delivery,
          paymentMethod: payment,
          address: {
            fullName: form.fullName.trim(),
            phone: form.phone.replace(/\D/g, ""),
            city: form.city.trim(),
            address: form.address.trim(),
            notes: form.notes.trim() || undefined,
          },
          receipt: receipt ? { dataUrl: receipt } : null,
          couponCode: couponState === "ok" ? couponInput.trim().toUpperCase() : null,
        }),
      });

      const json = (await res.json()) as {
        ok: boolean;
        error?: string;
        order?: { id: string; total: number };
        coupon?: { applied: boolean; error?: string | null; issued?: string | null };
        notifications?: { email: boolean; whatsapp: boolean };
      };

      if (!json.ok || !json.order) {
        setPlacing(false);
        const M: Record<string, string> = {
          empty_cart: "سلتك فارغة.",
          invalid_address: "تحقق من بيانات التوصيل — الاسم ورقم عُماني صحيح والعنوان.",
          product_not_found: "أحد المنتجات لم يعد متوفراً — حدّث السلة.",
          db_unavailable: "قاعدة البيانات غير متصلة بعد — أعد المحاولة قريباً.",
          order_failed: "تعذّر إنشاء الطلب — أعد المحاولة.",
        };
        setOrderError(M[json.error ?? ""] ?? "حدث خطأ — أعد المحاولة.");
        return;
      }

      /* مرآة للعرض الفوري في صفحة النجاح (المصدر الرسمي في DB) */
      try {
        window.sessionStorage.setItem(
          "qaven-order",
          JSON.stringify({
            id: json.order.id,
            total: json.order.total,
            coupon: json.coupon?.issued ?? undefined,
            notifications: json.notifications ?? undefined,
          })
        );
      } catch { /* ignore */ }

      clear();
      /* لا نُعيد placing إلى false عند النجاح — حرس السلة الفارغة يرى placing=true حتى يكتمل التنقل */
      router.push("/order-success");
    } catch {
      setPlacing(false);
      setOrderError("تعذّر الاتصال بالخادم — تحقق من اتصالك وأعد المحاولة.");
    }
  };

  if (!cartReady) return <div className="min-h-[60vh]" />;

  return (
    <div className="shell py-10 sm:py-14">
      <p className="eyebrow">CHECKOUT</p>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
        إتمام الشراء
      </h1>
      <p className="mt-2 text-sm text-steel">
        ثلاث خطوات سريعة — بدون حساب مطلوب.
      </p>

      <div className="mt-8 grid gap-10 lg:grid-cols-[1fr_360px] lg:gap-14">
        <div className="space-y-8">
          {/* ——— 1. بيانات التوصيل ——— */}
          <section>
            <StepTitle n={1} title="بيانات التوصيل" hint="سنتصل بك قبل التوصيل" />
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <label className="block">
                <FieldLabel>الاسم الكامل</FieldLabel>
                <input
                  className={inputCls}
                  value={form.fullName}
                  onChange={(e) => setForm((f) => ({ ...f, fullName: e.target.value }))}
                  placeholder="محمد العامري"
                  autoComplete="name"
                />
              </label>
              <label className="block">
                <FieldLabel>رقم الهاتف</FieldLabel>
                <input
                  className={inputCls}
                  value={form.phone}
                  onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                  placeholder="9XXXXXXX"
                  dir="ltr"
                  inputMode="numeric"
                  autoComplete="tel"
                />
              </label>
              <label className="block">
                <FieldLabel>الولاية / المدينة</FieldLabel>
                <input
                  className={inputCls}
                  value={form.city}
                  onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
                  placeholder="مسقط، السيب…"
                  list="omani-cities"
                  autoComplete="address-level2"
                />
                <datalist id="omani-cities">
                  {OMANI_CITIES.map((c) => (
                    <option key={c} value={c} />
                  ))}
                </datalist>
              </label>
              <label className="block">
                <FieldLabel>العنوان التفصيلي</FieldLabel>
                <input
                  className={inputCls}
                  value={form.address}
                  onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
                  placeholder="الحي، الشارع، رقم المنزل"
                  autoComplete="street-address"
                />
              </label>
              <label className="block sm:col-span-2">
                <FieldLabel>ملاحظات للمندوب (اختياري)</FieldLabel>
                <input
                  className={inputCls}
                  value={form.notes}
                  onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                  placeholder="أي تفاصيل تساعد في الوصول…"
                />
              </label>
            </div>
            {!formValid && hasAnyInput(form) && (
              <p className="mt-3 text-xs text-accent-deep">
                أكمل الاسم، رقم عُماني صحيح (9XXXXXXX)، الولاية، والعنوان التفصيلي.
              </p>
            )}

            {/* العناوين المحفوظة — من قاعدة البيانات */}
            {savedAddresses.length > 0 && (
              <div className="mt-4">
                <p className="text-xs font-medium text-graphite">عناوينك المحفوظة</p>
                <div className="mt-2 grid gap-2 sm:grid-cols-2">
                  {savedAddresses.map((a) => (
                    <button
                      key={a.id}
                      type="button"
                      onClick={() => useSavedAddress(a.id)}
                      className={`rounded-xl border p-3 text-start transition-all duration-200 ${
                        activeAddressId === a.id
                          ? "border-accent bg-white ring-1 ring-accent"
                          : "border-mist bg-white hover:border-steel"
                      }`}
                    >
                      <span className="text-[13px] font-semibold text-ink">{a.label}</span>
                      <span className="mt-0.5 block text-xs text-steel">
                        {a.city} — {a.address}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <p className="mt-4 flex items-center gap-2 rounded-xl border border-mist bg-paper p-3.5 text-[13px] text-graphite">
              <LogIn size={15} strokeWidth={1.6} className="shrink-0 text-accent" />
              {customer ? (
                <span>
                  مسجّل الدخول — بياناتك معبّأة تلقائياً من حسابك ✓
                </span>
              ) : (
                <span>
                  لديك حساب؟{" "}
                  <Link href="/login?next=/checkout" className="font-medium text-accent hover:underline">
                    سجّل دخولك
                  </Link>{" "}
                  — تُعبّأ بياناتك تلقائياً
                </span>
              )}
            </p>
          </section>

          {/* ——— 2. التوصيل ——— */}
          <section>
            <StepTitle n={2} title="طريقة التوصيل" hint="العادي مجاني · السريع 2.500 ر.ع" />
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {settings.deliveryMethods
                .filter((d) => d.active)
                .map((d) => (
                  <OptionCard
                    key={d.code}
                    active={delivery === d.code}
                    onSelect={() => setDelivery(d.code as DeliveryCode)}
                    icon={d.code === "fast" ? <Zap size={18} strokeWidth={1.6} /> : <Truck size={18} strokeWidth={1.6} />}
                    title={d.label}
                    text={d.desc}
                    price={d.fee === 0 ? "مجاني" : formatPrice(d.fee)}
                    badge={
                      d.code === "standard"
                        ? freeShipping
                          ? "مؤهل للتوصيل المجاني"
                          : "مجاني لجميع الطلبات"
                        : undefined
                    }
                  />
                ))}
            </div>
            <p className="mt-3 text-xs text-steel">
              التوصيل العادي مجاني لجميع الطلبات — رسوم 2.500 ر.ع للتوصيل السريع فقط.
            </p>
          </section>

          {/* ——— 3. الدفع ——— */}
          <section>
            <StepTitle n={3} title="طريقة الدفع" />
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {settings.paymentMethods
                .filter((m) => m.active)
                .map((m) => (
                  <OptionCard
                    key={m.code}
                    active={payment === m.code}
                    onSelect={() => setPayment(m.code as PaymentCode)}
                    icon={m.code === "cod" ? <Banknote size={18} strokeWidth={1.6} /> : <Building2 size={18} strokeWidth={1.6} />}
                    title={m.label}
                    text={m.desc}
                    price=""
                  />
                ))}
            </div>

            {payment === "bank_transfer" && (
              <div className="mt-4 space-y-4 rounded-xl border border-mist bg-paper p-5">
                <div>
                  <h3 className="flex items-center gap-2 text-sm font-semibold text-ink">
                    <Building2 size={16} strokeWidth={1.6} className="text-accent" />
                    بيانات التحويل البنكي
                  </h3>
                  <dl className="mt-3 space-y-1.5 text-sm">
                    <Row k="البنك" v={settings.bankAccount.bankName} />
                    <Row k="اسم الحساب" v={settings.bankAccount.accountName} />
                    <Row k="رقم الحساب" v={settings.bankAccount.accountNumber} mono />
                    <Row k="IBAN" v={settings.bankAccount.iban} mono />
                  </dl>
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-ink">إيصال التحويل</h3>
                  <p className="mt-1 text-xs text-steel">
                    صورة PNG أو JPG — تُرفق بطلبك ليتم تأكيده أسرع.
                  </p>
                  {receipt ? (
                    <div className="mt-3 flex items-center gap-4">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={receipt}
                        alt="إيصال التحويل"
                        className="h-20 w-20 rounded-lg border border-mist object-cover"
                      />
                      <div className="text-sm">
                        <p className="flex items-center gap-1.5 font-medium text-emerald-600">
                          <Check size={15} strokeWidth={2} /> تم إرفاق الإيصال
                        </p>
                        <button
                          type="button"
                          onClick={() => setReceipt(null)}
                          className="mt-1 text-xs text-steel underline-offset-4 hover:text-ink hover:underline"
                        >
                          إزالة واختيار صورة أخرى
                        </button>
                      </div>
                    </div>
                  ) : (
                    <label className="mt-3 flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-silver bg-white py-6 text-sm text-graphite transition-colors hover:border-accent hover:text-accent">
                      <Upload size={17} strokeWidth={1.6} />
                      ارفع صورة الإيصال
                      <input
                        type="file"
                        accept="image/png,image/jpeg"
                        className="hidden"
                        onChange={(e) => {
                          const f = e.target.files?.[0];
                          if (!f) return;
                          const reader = new FileReader();
                          reader.onload = () => setReceipt(String(reader.result));
                          reader.readAsDataURL(f);
                        }}
                      />
                    </label>
                  )}
                </div>
              </div>
            )}

            {payment === "cod" && (
              <p className="mt-3 text-xs text-steel">
                جهّز المبلغ عند الاستلام — يدفعه المندوب نقداً عند تسليم الطلب.
              </p>
            )}
          </section>
        </div>

        {/* ——— الملخص ——— */}
        <aside className="h-fit rounded-2xl border border-mist bg-white p-6 shadow-sm lg:sticky lg:top-32">
          <h2 className="text-sm font-semibold text-ink">طلبك ({rows.length})</h2>

          <ul className="mt-4 space-y-3">
            {rows.map(({ item, product: p }) => (
              <li key={p.id} className="flex items-center gap-3">
                <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-cloud">
                  <SafeImg src={p.img} alt={p.name} className="h-full w-full object-cover" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] text-ink">{p.name}</p>
                  <p className="text-xs text-steel">× {item.qty}</p>
                </div>
                <span className="text-[13px] font-medium text-ink">
                  {formatPrice(p.price * item.qty)}
                </span>
              </li>
            ))}
          </ul>

          <dl className="mt-5 space-y-2.5 border-t border-mist pt-4 text-sm">
            <div className="flex justify-between">
              <dt className="text-steel">المجموع الفرعي</dt>
              <dd className="font-medium text-ink">{formatPrice(subtotal)}</dd>
            </div>
            {couponDiscount > 0 && (
              <div className="flex justify-between text-emerald-600">
                <dt>خصم الكوبون</dt>
                <dd className="font-medium">- {formatPrice(couponDiscount)}</dd>
              </div>
            )}
            <div className="flex justify-between">
              <dt className="text-steel">
                التوصيل ({delivery === "fast" ? "سريع" : "عادي"})
              </dt>
              <dd className={`font-medium ${deliveryFee === 0 ? "text-emerald-600" : "text-ink"}`}>
                {deliveryFee === 0 ? "مجاني" : formatPrice(deliveryFee)}
              </dd>
            </div>
            <div className="flex justify-between border-t border-mist pt-3">
              <dt className="font-medium text-ink">الإجمالي</dt>
              <dd className="text-lg font-semibold text-ink">{formatPrice(Math.max(0, subtotal - couponDiscount) + deliveryFee)}</dd>
            </div>
          </dl>

          {/* ——— كوبون الخصم ——— */}
          {customer && (
            <div className="mt-4 border-t border-mist pt-4">
              <div className="flex gap-2">
                <input
                  value={couponInput}
                  onChange={(e) => { setCouponInput(e.target.value); setCouponState("idle"); setCouponMsg(null); }}
                  placeholder="كود الخصم"
                  dir="ltr"
                  className="h-10 flex-1 rounded-lg border border-mist bg-white px-3 text-sm uppercase tracking-wide text-ink outline-none placeholder:text-steel placeholder:normal-case placeholder:tracking-normal focus:border-accent"
                />
                <button
                  type="button"
                  onClick={checkCoupon}
                  disabled={!couponInput.trim() || couponState === "checking"}
                  className="h-10 rounded-lg border border-ink/15 bg-white px-4 text-sm font-medium text-ink transition-colors hover:border-ink disabled:opacity-50"
                >
                  {couponState === "checking" ? "…" : "تطبيق"}
                </button>
              </div>
              {couponMsg && (
                <p className={`mt-2 text-xs ${couponState === "ok" ? "text-emerald-600" : "text-red-600"}`}>{couponMsg}</p>
              )}
            </div>
          )}

          {payment === "bank_transfer" && !receipt && (
            <p className="mt-4 rounded-lg bg-paper px-3 py-2 text-xs text-graphite ring-1 ring-mist">
              ارفع إيصال التحويل لتتمكن من تأكيد الطلب.
            </p>
          )}

          {orderError && (
            <p className="mt-4 rounded-lg bg-red-50 p-3 text-[13px] text-red-700 ring-1 ring-red-100">
              {orderError}
            </p>
          )}

          <button
            type="button"
            onClick={placeOrder}
            disabled={!canPlace}
            className="mt-5 flex h-12 w-full items-center justify-center rounded-lg bg-ink text-sm font-medium text-white transition-all duration-200 hover:bg-accent active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {placing ? "جارٍ تأكيد الطلب…" : "تأكيد الطلب"}
          </button>
          <Link
            href="/cart"
            className="mt-3 block text-center text-xs text-steel transition-colors hover:text-ink"
          >
            العودة إلى السلة
          </Link>
        </aside>
      </div>
    </div>
  );
}

/* ——— Pieces ——— */

function hasAnyInput(f: Form): boolean {
  return Boolean(f.fullName || f.phone || f.city || f.address);
}

const inputCls =
  "h-12 w-full rounded-lg border border-mist bg-white px-4 text-sm text-ink outline-none transition-colors placeholder:text-steel focus:border-accent";

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <span className="mb-1.5 block text-xs font-medium text-graphite">{children}</span>;
}

function StepTitle({ n, title, hint }: { n: number; title: string; hint?: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-ink text-xs font-semibold text-white">
        {n}
      </span>
      <h2 className="text-base font-semibold text-ink">{title}</h2>
      {hint && <span className="text-xs text-steel">{hint}</span>}
    </div>
  );
}

function OptionCard({
  active,
  onSelect,
  icon,
  title,
  text,
  price,
  badge,
}: {
  active: boolean;
  onSelect: () => void;
  icon: React.ReactNode;
  title: string;
  text: string;
  price: string;
  badge?: string;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`rounded-xl border p-4 text-start transition-all duration-200 active:scale-[0.99] ${
        active ? "border-accent bg-white ring-1 ring-accent" : "border-mist bg-white hover:border-steel"
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="flex items-center gap-2 text-sm font-semibold text-ink">
          <span className={active ? "text-accent" : "text-steel"}>{icon}</span>
          {title}
        </span>
        <span
          className={`flex h-4 w-4 items-center justify-center rounded-full border ${
            active ? "border-accent" : "border-silver"
          }`}
        >
          {active && <span className="h-2 w-2 rounded-full bg-accent" />}
        </span>
      </div>
      <p className="mt-1.5 text-xs text-steel">{text}</p>
      <div className="mt-2 flex items-center justify-between">
        {price && <span className="text-xs font-medium text-graphite">{price}</span>}
        {badge && (
          <span className="rounded bg-emerald-50 px-1.5 py-0.5 text-[10px] font-medium text-emerald-700">
            {badge}
          </span>
        )}
      </div>
    </button>
  );
}

function Row({ k, v, mono = false }: { k: string; v: string; mono?: boolean }) {
  return (
    <div className="flex justify-between gap-6">
      <dt className="text-steel">{k}</dt>
      <dd dir={mono ? "ltr" : undefined} className="font-medium text-ink">
        {v}
      </dd>
    </div>
  );
}

// Keep UserRound referenced for the (future) saved-customer summary
void UserRound;
