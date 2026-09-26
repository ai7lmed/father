"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Heart, Minus, Plus, ChevronLeft, ShieldCheck, Truck, RotateCcw } from "lucide-react";
import { useCart } from "@/lib/cart";
import { useWishlist } from "@/lib/wishlist";
import {
  categoryName,
  discountPercent,
  formatPrice,
  soldLabel,
  relatedProducts,
  type Product,
} from "@/lib/products";
import { Stars, SafeImg, StockPill, Accordion } from "@/components/ui";
import { ProductCard } from "@/components/product-card";
import { SectionHeader } from "@/components/section-header";
import { Reveal } from "@/components/motion";

export function ProductDetail({ product }: { product: Product }) {
  const { add } = useCart();
  const { has, toggle } = useWishlist();
  const router = useRouter();
  const [qty, setQty] = useState(1);
  const [activeImg, setActiveImg] = useState(0);
  const [pop, setPop] = useState(false);
  const off = discountPercent(product);
  const related = relatedProducts(product);
  const gallery = [product.img, ...(product.gallery ?? [])];
  const wished = has(product.id);

  const buyNow = () => {
    add(product.id, qty);
    router.push("/checkout");
  };

  return (
    <>
      {/* Breadcrumbs */}
      <div className="border-b border-mist bg-paper">
        <nav className="shell flex items-center gap-1.5 py-3 text-xs text-steel">
          <Link href="/" className="transition-colors hover:text-ink">الرئيسية</Link>
          <ChevronLeft size={13} strokeWidth={1.5} />
          <Link href={categoryHrefSafe(product.category)} className="transition-colors hover:text-ink">
            {categoryName(product.category)}
          </Link>
          <ChevronLeft size={13} strokeWidth={1.5} />
          <span className="truncate text-graphite">{product.name}</span>
        </nav>
      </div>

      <div className="shell py-8 sm:py-12">
        <div className="grid gap-10 lg:grid-cols-2 lg:gap-14">
          {/* Gallery */}
          <div>
            <div className="relative overflow-hidden rounded-2xl bg-cloud">
              <div className="aspect-square w-full">
                <SafeImg
                  key={activeImg}
                  src={gallery[activeImg]}
                  alt={product.name}
                  className="page-enter h-full w-full object-cover"
                  eager
                />
              </div>
              {off > 0 && (
                <span className="absolute start-4 top-4 rounded-md bg-accent px-2.5 py-1 text-xs font-semibold text-white">
                  خصم {off}%
                </span>
              )}
            </div>

            {gallery.length > 1 && (
              <div className="mt-3 flex gap-2.5">
                {gallery.map((src, i) => (
                  <button
                    key={src}
                    type="button"
                    onClick={() => setActiveImg(i)}
                    aria-label={`صورة ${i + 1}`}
                    className={`h-18 w-18 overflow-hidden rounded-lg border-2 transition-colors ${
                      i === activeImg ? "border-ink" : "border-transparent opacity-70 hover:opacity-100"
                    }`}
                  >
                    <SafeImg src={src} alt="" className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Info */}
          <div>
            <div className="flex items-center gap-3">
              <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-accent">
                {product.brand}
              </span>
              <StockPill stock={product.stock} />
            </div>

            <h1 className="mt-3 text-2xl font-semibold leading-9 tracking-tight text-ink sm:text-[28px]">
              {product.name}
            </h1>

            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2">
              <span className="flex items-center gap-1.5">
                <Stars value={product.rating} size={14} />
                <span className="text-sm font-medium text-ink">{product.rating}</span>
              </span>
              <button type="button" className="text-xs text-steel underline-offset-4 hover:underline">
                {product.reviews} مراجعة
              </button>
              <span className="text-xs text-steel">{soldLabel(product.sold)}</span>
            </div>

            <div className="mt-5 flex items-baseline gap-3 border-t border-mist pt-5">
              <span className="text-3xl font-semibold tracking-tight text-ink">
                {formatPrice(product.price)}
              </span>
              {product.oldPrice && (
                <>
                  <span className="text-base text-steel line-through">
                    {formatPrice(product.oldPrice)}
                  </span>
                  <span className="rounded-md bg-accent px-2 py-0.5 text-[11px] font-semibold text-white">
                    وفّر {formatPrice(product.oldPrice - product.price)}
                  </span>
                </>
              )}
            </div>

            <p className="mt-5 text-[15px] leading-8 text-graphite">{product.desc}</p>

            {/* Qty + actions */}
            <div className="mt-7 flex flex-wrap items-center gap-3">
              <div className="flex h-12 items-center rounded-lg border border-mist bg-white">
                <button
                  type="button"
                  aria-label="إنقاص الكمية"
                  onClick={() => setQty((q) => Math.max(1, q - 1))}
                  className="flex h-full w-11 items-center justify-center text-graphite transition-colors hover:text-ink active:scale-90"
                >
                  <Minus size={15} strokeWidth={1.75} />
                </button>
                <span className="w-10 text-center text-sm font-semibold">{qty}</span>
                <button
                  type="button"
                  aria-label="زيادة الكمية"
                  onClick={() => setQty((q) => Math.min(product.stock || 99, q + 1))}
                  className="flex h-full w-11 items-center justify-center text-graphite transition-colors hover:text-ink active:scale-90"
                >
                  <Plus size={15} strokeWidth={1.75} />
                </button>
              </div>

              <button
                type="button"
                disabled={product.stock === 0}
                onClick={() => {
                  add(product.id, qty);
                  setPop(true);
                  setTimeout(() => setPop(false), 450);
                }}
                className={`h-12 min-w-40 flex-1 rounded-lg bg-ink text-sm font-medium text-white transition-all duration-200 hover:bg-accent active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 sm:flex-none ${
                  pop ? "badge-pop" : ""
                }`}
              >
                أضف إلى السلة
              </button>

              <button
                type="button"
                disabled={product.stock === 0}
                onClick={buyNow}
                className="h-12 min-w-40 flex-1 rounded-lg border border-ink bg-white text-sm font-medium text-ink transition-all duration-200 hover:border-accent hover:text-accent active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 sm:flex-none"
              >
                اشترِ الآن
              </button>

              <button
                type="button"
                aria-label={wished ? "إزالة من المفضلة" : "أضف إلى المفضلة"}
                onClick={() => toggle(product.id)}
                className={`flex h-12 w-12 items-center justify-center rounded-lg border transition-colors ${
                  wished
                    ? "border-accent bg-accent text-white"
                    : "border-mist bg-white text-graphite hover:border-ink hover:text-ink"
                }`}
              >
                <Heart size={18} strokeWidth={1.75} className={wished ? "fill-current" : ""} />
              </button>
            </div>

            {/* Trust row */}
            <div className="mt-7 grid grid-cols-3 gap-2 rounded-xl border border-mist bg-paper p-4 text-[11px] leading-5 text-graphite">
              <span className="flex items-center gap-2">
                <Truck size={15} strokeWidth={1.6} className="shrink-0 text-accent" />
توصيل مجاني 3-5 أيام
              </span>
              <span className="flex items-center gap-2">
                <ShieldCheck size={15} strokeWidth={1.6} className="shrink-0 text-accent" />
                ضمان الوكيل
              </span>
              <span className="flex items-center gap-2">
                <RotateCcw size={15} strokeWidth={1.6} className="shrink-0 text-accent" />
                إرجاع خلال 7 أيام
              </span>
            </div>

            {/* Accordions */}
            <div className="mt-8 border-t border-mist">
              <Accordion title="المواصفات" open>
                <dl className="divide-y divide-mist">
                  {product.specs.map(([k, v]) => (
                    <div key={k} className="flex items-center justify-between gap-6 py-2.5">
                      <dt className="text-steel">{k}</dt>
                      <dd className="text-end font-medium text-ink">{v}</dd>
                    </div>
                  ))}
                </dl>
              </Accordion>
              <Accordion title="الوصف">
                <p>{product.desc}</p>
              </Accordion>
              <Accordion title="الشحن والإرجاع">
                <p>
                  التوصيل العادي مجاني لجميع الطلبات داخل سلطنة عُمان (3-5 أيام عمل).
                  التوصيل السريع خلال 24-48 ساعة برسوم 2.500 ر.ع فقط. إمكانية الإرجاع
                  خلال 7 أيام بحالته الأصلية — راسلنا من صفحة التواصل لترتيب الاستلام.
                </p>
              </Accordion>
            </div>
          </div>
        </div>
      </div>

      {/* Related */}
      <section className="border-t border-mist bg-paper">
        <div className="shell py-14">
          <Reveal>
            <SectionHeader eyebrow="RELATED" title="قد يعجبك أيضاً" />
          </Reveal>
          <div className="grid grid-cols-2 gap-x-4 gap-y-10 sm:gap-x-6 lg:grid-cols-4">
            {related.map((p, i) => (
              <Reveal key={p.id} delay={(i % 4) * 60}>
                <ProductCard product={p} />
              </Reveal>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}

function categoryHrefSafe(slug: string): string {
  return `/shop?cat=${slug}`;
}
