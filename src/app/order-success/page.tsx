"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Check, Truck, Zap, Banknote, Building2 } from "lucide-react";
import { formatPrice, getProduct, settings } from "@/lib/products";
import type { OrderRow } from "@/lib/db/schema";
import { SafeImg } from "@/components/ui";

export default function OrderSuccessPage() {
  const router = useRouter();
  const [order, setOrder] = useState<OrderRow | null>(null);
  const [checked, setChecked] = useState(false);
  const [issuedCoupon, setIssuedCoupon] = useState<string | null>(null);
  const [notify, setNotify] = useState<{ email: boolean; whatsapp: boolean } | null>(null);
  const [invoiceUrl, setInvoiceUrl] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      /* المصدر الرسمي: قاعدة البيانات عبر /api/orders?id=… (لصاحب الطلب فقط)
         المرآة في sessionStorage تُظهر id والإجمالي فوراً حتى للضيوف */
      try {
        const raw = window.sessionStorage.getItem("qaven-order");
        if (raw) {
          const mirror = JSON.parse(raw) as { id: string; total: number; coupon?: string; notifications?: { email: boolean; whatsapp: boolean }; invoiceUrl?: string };
          if (mirror.coupon) setIssuedCoupon(mirror.coupon);
          if (mirror.notifications) setNotify(mirror.notifications);
          if (mirror.invoiceUrl) setInvoiceUrl(mirror.invoiceUrl);
          /* الفاتورة: للضيف برابط موقّع، ولصاحب الحساب عبر الجلسة مباشرة */
          try {
            const inv = await fetch(`/api/invoice/${encodeURIComponent(mirror.id)}`, { cache: "no-store" });
            if (inv.ok) setInvoiceUrl(`/api/invoice/${encodeURIComponent(mirror.id)}`);
          } catch { /* الضيف بدون توقيع — الرابط الموقّع يأتي من الإشعارات */ }
          const res = await fetch(`/api/orders?id=${encodeURIComponent(mirror.id)}`, {
            cache: "no-store",
          });
          if (res.ok) {
            const json = (await res.json()) as {
              ok: boolean;
              order?: {
                id: string;
                status: string;
                total: number;
                subtotal: number;
                delivery_method: "standard" | "fast";
                delivery_fee: number;
                payment_method: "cod" | "bank_transfer";
                receipt_attached: boolean;
                ship_city: string;
                ship_address: string;
                placed_at: string;
                items: { product_id: string; name: string; qty: number; unit_price: number }[];
              };
            };
            if (json.ok && json.order && alive) {
              const o = json.order;
              setOrder({
                id: o.id,
                status: o.status as OrderRow["status"],
                customerId: undefined,
                items: (o.items ?? []).map((it) => ({
                  productId: it.product_id,
                  name: it.name,
                  qty: it.qty,
                  unitPrice: it.unit_price,
                })),
                subtotal: o.subtotal ?? o.items?.reduce((s, it) => s + it.unit_price * it.qty, 0) ?? o.total,
                deliveryMethod: o.delivery_method,
                deliveryFee: o.delivery_fee,
                total: o.total,
                paymentMethod: o.payment_method,
                receiptAttached: o.receipt_attached,
                address: {
                  fullName: "",
                  phone: "",
                  city: o.ship_city,
                  address: o.ship_address,
                },
                placedAt: o.placed_at,
              });
              if (alive) return setChecked(true);
            }
          }
          /* لا DB (ضيف أو DB غير متصل): عرض مرآة مختصرة */
          if (alive) setOrder({ id: mirror.id, total: mirror.total } as unknown as OrderRow);
        }
      } catch {
        /* ignore */
      }
      if (alive) setChecked(true);
    })();
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    if (checked && !order) {
      const t = setTimeout(() => router.replace("/"), 1500);
      return () => clearTimeout(t);
    }
  }, [checked, order, router]);

  if (!checked) return <div className="min-h-[60vh]" />;

  if (!order) {
    return (
      <div className="shell flex min-h-[60vh] items-center justify-center py-24">
        <p className="text-sm text-steel">جارٍ العودة إلى الرئيسية…</p>
      </div>
    );
  }

  const eta =
    order.deliveryMethod === "fast"
      ? settings.deliveryMethods.find((d) => d.code === "fast")?.eta ?? "24 – 48 ساعة"
      : settings.deliveryMethods.find((d) => d.code === "standard")?.eta ?? "3 – 5 أيام عمل";

  return (
    <div className="shell py-14 sm:py-20">
      <div className="mx-auto max-w-lg text-center">
        <span className="badge-pop mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-ink text-white">
          <Check size={26} strokeWidth={2} />
        </span>
        <p className="eyebrow mt-6">ORDER CONFIRMED</p>
        <h1 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">
          تم استلام طلبك
        </h1>
        <p className="mt-4 text-sm leading-7 text-graphite">
          طلبك رقم{" "}
          <span dir="ltr" className="font-medium text-ink">
            {order.id}
          </span>{" "}
          {order.paymentMethod === "bank_transfer"
            ? "بانتظار تأكيد التحويل — سنراجع الإيصال ونؤكد طلبك قريباً."
            : "قيد التجهيز، وسنتواصل معك لتأكيد التوصيل."}
        </p>

        {/* تأكيد الإشعارات المُرسلة */}
        {notify?.email && (
          <p className="mt-3 text-xs text-steel">
            أرسلنا تأكيد الطلب والفاتورة إلى بريدك الإلكتروني ✓
            {notify.whatsapp && " — وعبر واتساب ✓"}
          </p>
        )}

        {/* كوبون الشكر — مرة واحدة لكل عميل */}
        {issuedCoupon && (
          <div className="stagger-in mx-auto mt-5 max-w-sm rounded-xl border border-dashed border-silver bg-paper p-4">
            <p className="text-xs font-medium text-ink">هديتك لطلبك القادم</p>
            <p className="mt-1 text-xs leading-6 text-steel">
              خصم 2.000 ر.ع على أي منتج من 12.000 ر.ع أو أكثر — مرة واحدة
            </p>
            <p dir="ltr" className="mt-2 select-all rounded-lg border border-mist bg-white py-2 text-center text-sm font-bold tracking-[0.2em] text-ink">
              {issuedCoupon}
            </p>
          </div>
        )}

        {/* ملخص الدفع/التوصيل */}
        <div className="mt-8 space-y-3 text-start">
          <div className="flex items-center gap-3 rounded-xl border border-mist bg-white p-4">
            {order.deliveryMethod === "fast" ? (
              <Zap size={18} strokeWidth={1.6} className="shrink-0 text-accent" />
            ) : (
              <Truck size={18} strokeWidth={1.6} className="shrink-0 text-accent" />
            )}
            <div className="flex-1 text-sm">
              <p className="font-medium text-ink">
                {order.deliveryMethod === "fast" ? "توصيل سريع" : "توصيل عادي"} — {eta}
              </p>
              <p className="mt-0.5 text-xs text-steel">
                {order.address.city} — {order.address.address}
              </p>
            </div>
            <span className="text-sm font-medium text-ink">
              {order.deliveryFee === 0 ? "مجاني" : formatPrice(order.deliveryFee)}
            </span>
          </div>

          <div className="flex items-center gap-3 rounded-xl border border-mist bg-white p-4">
            {order.paymentMethod === "cod" ? (
              <Banknote size={18} strokeWidth={1.6} className="shrink-0 text-accent" />
            ) : (
              <Building2 size={18} strokeWidth={1.6} className="shrink-0 text-accent" />
            )}
            <div className="flex-1 text-sm">
              {order.paymentMethod === "cod" ? (
                <>
                  <p className="font-medium text-ink">الدفع عند الاستلام</p>
                  <p className="mt-0.5 text-xs text-steel">
                    جهّز {formatPrice(order.total)} نقداً عند وصول المندوب.
                  </p>
                </>
              ) : (
                <>
                  <p className="font-medium text-ink">تحويل بنكي</p>
                  <p className="mt-0.5 text-xs text-steel">
                    {order.receiptAttached
                      ? "تم إرفاق إيصال التحويل — قيد المراجعة ✓"
                      : "لم يتم إرفاق إيصال — سنطلب منك إرساله."}
                  </p>
                </>
              )}
            </div>
          </div>

          {/* بيانات الحساب البنكي للمراجعة */}
          {order.paymentMethod === "bank_transfer" && (
            <div className="rounded-xl border border-mist bg-paper p-4">
              <h3 className="text-xs font-semibold text-ink">بيانات الحساب البنكي</h3>
              <dl className="mt-2 space-y-1 text-xs text-graphite">
                <div className="flex justify-between gap-4">
                  <dt className="text-steel">البنك</dt>
                  <dd className="font-medium text-ink">{settings.bankAccount.bankName}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-steel">اسم الحساب</dt>
                  <dd className="font-medium text-ink">{settings.bankAccount.accountName}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-steel">رقم الحساب</dt>
                  <dd dir="ltr" className="font-medium text-ink">{settings.bankAccount.accountNumber}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-steel">IBAN</dt>
                  <dd dir="ltr" className="font-medium text-ink">{settings.bankAccount.iban}</dd>
                </div>
              </dl>
            </div>
          )}

          <div className="rounded-xl border border-mist bg-white p-4">
            <ul className="space-y-3">
              {order.items.map((it) => {
                const p = getProduct(it.productId);
                return (
                  <li key={it.productId} className="flex items-center gap-3 text-sm">
                    {p && (
                      <div className="h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-cloud">
                        <SafeImg src={p.img} alt={it.name} className="h-full w-full object-cover" />
                      </div>
                    )}
                    <span className="flex-1 text-graphite">
                      {it.name} × {it.qty}
                    </span>
                    <span className="font-medium text-ink">
                      {formatPrice(it.unitPrice * it.qty)}
                    </span>
                  </li>
                );
              })}
            </ul>
            <div className="mt-4 flex justify-between border-t border-mist pt-4">
              <span className="text-sm font-medium text-ink">الإجمالي</span>
              <span className="text-base font-semibold text-ink">
                {formatPrice(order.total)}
              </span>
            </div>
          </div>
        </div>

        {invoiceUrl && (
          <div className="mt-6">
            <a
              href={invoiceUrl}
              target="_blank"
              rel="noopener"
              className="inline-flex h-12 items-center gap-2 rounded-lg border border-ink/15 bg-white px-7 text-sm font-medium text-ink transition-all duration-200 hover:border-ink active:scale-[0.98]"
            >
              🧾 عرض الفاتورة
            </a>
            <p className="mt-2 text-[11px] text-steel">
              فاتورة رسمية قابلة للطباعة أو الحفظ PDF — وتصلك أيضاً عبر البريد وواتساب
            </p>
          </div>
        )}

        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link
            href="/shop"
            className="inline-flex h-12 items-center rounded-lg bg-ink px-7 text-sm font-medium text-white transition-all duration-200 hover:bg-accent active:scale-[0.98]"
          >
            متابعة التسوق
          </Link>
          <Link
            href="/"
            className="inline-flex h-12 items-center rounded-lg border border-ink/15 bg-white px-7 text-sm font-medium text-ink transition-all duration-200 hover:border-ink active:scale-[0.98]"
          >
            العودة للرئيسية
          </Link>
        </div>
      </div>
    </div>
  );
}
