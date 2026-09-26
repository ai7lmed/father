"use client";

import Link from "next/link";
import { Truck, X } from "lucide-react";
import { useCart } from "@/lib/cart";
import {
  categoryName,
  formatPrice,
  getProduct,
  bestSellers,
} from "@/lib/products";
import { SafeImg } from "@/components/ui";
import { ProductCard } from "@/components/product-card";
import { SectionHeader } from "@/components/section-header";
import { Reveal } from "@/components/motion";

const FREE_SHIPPING_AT = 25;
export default function CartPage() {
  const { items, ready, setQty, remove } = useCart();

  if (!ready) {
    return <div className="min-h-[60vh]" />;
  }

  const rows = items
    .map((i) => ({ item: i, product: getProduct(i.id) }))
    .filter(
      (r): r is { item: (typeof items)[number]; product: NonNullable<typeof r.product> } =>
        Boolean(r.product)
    );

  const subtotal = rows.reduce((s, r) => s + r.product.price * r.item.qty, 0);
  const total = subtotal;
  const savings = rows.reduce(
    (s, r) =>
      s +
      (r.product.oldPrice
        ? (r.product.oldPrice - r.product.price) * r.item.qty
        : 0),
    0
  );
  const toFree = Math.max(0, FREE_SHIPPING_AT - subtotal);
  const qualified = subtotal >= FREE_SHIPPING_AT;

  return (
    <>
      <div className="shell py-10 sm:py-14">
        <p className="eyebrow">CART</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
          سلة التسوق
        </h1>

        {rows.length === 0 ? (
          <div className="py-20 text-center">
            <p className="eyebrow">EMPTY</p>
            <h2 className="mt-4 text-xl font-semibold text-ink">سلتك فارغة</h2>
            <p className="mt-2 text-sm text-steel">
              تصفح المتجر واختر ما يناسب إعدادك.
            </p>
            <Link
              href="/shop"
              className="mt-8 inline-flex h-12 items-center rounded-lg bg-ink px-7 text-sm font-medium text-white transition-all duration-200 hover:bg-accent active:scale-[0.98]"
            >
              ابدأ التسوق
            </Link>
          </div>
        ) : (
          <div className="mt-8 grid gap-10 lg:grid-cols-[1fr_360px] lg:gap-14">
            {/* Lines */}
            <div>
              {/* Free delivery note — عادي مجاني دائماً، سريع 2.500 فقط */}
              <div className="mb-6 flex items-center gap-2.5 rounded-xl border border-mist bg-paper p-4 text-[13px] text-graphite">
                <Truck size={16} strokeWidth={1.6} className="shrink-0 text-accent" />
                <span>
                  {qualified ? (
                    <span className="font-medium text-emerald-600">
                      طلبك مؤهل للتوصيل المجاني
                    </span>
                  ) : (
                    <>
                      التوصيل العادي <span className="font-medium text-ink">مجاني</span> —
                      السريع فقط <span dir="ltr" className="font-medium text-ink">2.500 ر.ع</span>
                    </>
                  )}
                </span>
              </div>

              <div className="divide-y divide-mist border-y border-mist">
                {rows.map(({ item, product: p }) => (
                  <div key={p.id} className="flex gap-4 py-5 sm:gap-5">
                    <Link
                      href={`/product/${p.id}`}
                      className="h-22 w-22 shrink-0 overflow-hidden rounded-xl bg-cloud sm:h-24 sm:w-24"
                    >
                      <SafeImg
                        src={p.img}
                        alt={p.name}
                        className="h-full w-full object-cover"
                      />
                    </Link>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-[11px] font-medium tracking-[0.12em] text-steel">
                            {p.brand} · {categoryName(p.category)}
                          </p>
                          <Link
                            href={`/product/${p.id}`}
                            className="mt-1 block text-sm font-medium leading-6 text-ink transition-colors hover:text-accent"
                          >
                            {p.name}
                          </Link>
                        </div>
                        <button
                          type="button"
                          onClick={() => remove(p.id)}
                          aria-label={`حذف ${p.name}`}
                          className="shrink-0 rounded-md p-1.5 text-steel transition-colors hover:bg-cloud hover:text-ink"
                        >
                          <X size={15} strokeWidth={1.75} />
                        </button>
                      </div>

                      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                        <div className="flex h-9 items-center rounded-lg border border-mist bg-white">
                          <button
                            type="button"
                            aria-label="إنقاص الكمية"
                            onClick={() => setQty(p.id, item.qty - 1)}
                            className="flex h-full w-9 items-center justify-center text-graphite transition-colors hover:text-ink active:scale-90"
                          >
                            −
                          </button>
                          <span className="w-8 text-center text-sm font-semibold">
                            {item.qty}
                          </span>
                          <button
                            type="button"
                            aria-label="زيادة الكمية"
                            onClick={() => setQty(p.id, item.qty + 1)}
                            className="flex h-full w-9 items-center justify-center text-graphite transition-colors hover:text-ink active:scale-90"
                          >
                            +
                          </button>
                        </div>

                        <div className="text-end">
                          <div className="text-[15px] font-semibold text-ink">
                            {formatPrice(p.price * item.qty)}
                          </div>
                          {p.oldPrice && (
                            <div className="text-xs text-steel line-through">
                              {formatPrice(p.oldPrice * item.qty)}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <Link
                href="/shop"
                className="mt-5 inline-flex text-sm text-accent underline-offset-4 hover:underline"
              >
                ← متابعة التسوق
              </Link>
            </div>

            {/* Summary */}
            <aside className="h-fit rounded-2xl border border-mist bg-white p-6 shadow-sm lg:sticky lg:top-32">
              <h2 className="text-sm font-semibold text-ink">ملخص الطلب</h2>

              <dl className="mt-5 space-y-3 text-sm">
                <div className="flex justify-between">
                  <dt className="text-steel">المجموع الفرعي</dt>
                  <dd className="font-medium text-ink">{formatPrice(subtotal)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-steel">التوصيل (عادي)</dt>
                  <dd className="font-medium text-emerald-600">مجاني</dd>
                </div>
                {savings > 0 && (
                  <div className="flex justify-between">
                    <dt className="text-steel">وفّرت</dt>
                    <dd className="font-medium text-accent">−{formatPrice(savings)}</dd>
                  </div>
                )}
                <div className="border-t border-mist pt-3">
                  <div className="flex justify-between">
                    <dt className="font-medium text-ink">الإجمالي</dt>
                    <dd className="text-lg font-semibold text-ink">
                      {formatPrice(total)}
                    </dd>
                  </div>
                  <p className="mt-1 text-[11px] text-steel">الأسعار تشمل الضريبة</p>
                </div>
              </dl>

              <Link
                href="/checkout"
                className="mt-6 flex h-12 w-full items-center justify-center rounded-lg bg-ink text-sm font-medium text-white transition-all duration-200 hover:bg-accent active:scale-[0.98]"
              >
                إتمام الشراء
              </Link>
              <p className="mt-3 text-center text-[11px] text-steel">
                التوصيل العادي مجاني · السريع 2.500 ر.ع · دفع عند الاستلام أو تحويل بنكي
              </p>
            </aside>
          </div>
        )}
      </div>

      {/* Suggestions when empty */}
      {ready && rows.length === 0 && (
        <section className="border-t border-mist bg-paper">
          <div className="shell py-14">
            <SectionHeader eyebrow="POPULAR" title="الأكثر رواجاً" />
            <div className="grid grid-cols-2 gap-x-4 gap-y-10 sm:gap-x-6 lg:grid-cols-4">
              {bestSellers.slice(0, 4).map((p, i) => (
                <Reveal key={p.id} delay={(i % 4) * 60}>
                  <ProductCard product={p} />
                </Reveal>
              ))}
            </div>
          </div>
        </section>
      )}
    </>
  );
}
