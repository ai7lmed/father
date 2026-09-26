"use client";

import { useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { Heart, Eye } from "lucide-react";
import { useCart } from "@/lib/cart";
import { useWishlist } from "@/lib/wishlist";
import {
  categoryName,
  discountPercent,
  formatPrice,
  soldLabel,
  type Product,
} from "@/lib/products";
import { Stars, SafeImg, StockPill } from "@/components/ui";

/* Code-splitting: QuickView يُحمَّل فقط عند أول استخدام (أوف النافذة الأساسية) */
const QuickView = dynamic(
  () => import("@/components/quick-view").then((m) => ({ default: m.QuickView })),
  { ssr: false }
);

const BADGE_STYLE: Record<string, string> = {
  "Best Seller": "bg-ink text-white",
  New: "bg-accent text-white",
  Sale: "bg-accent text-white",
  Limited: "bg-night text-silver",
};

export function ProductCard({
  product,
  dark = false,
  priority = false,
}: {
  product: Product;
  dark?: boolean;
  /** صحيح فقط لأول بطاقة في أعلى الشاشة (LCP) */
  priority?: boolean;
}) {
  const { add } = useCart();
  const { has, toggle } = useWishlist();
  const [pop, setPop] = useState(false);
  const [quick, setQuick] = useState(false);
  const off = discountPercent(product);
  const wished = has(product.id);
  const out = product.stock === 0;

  const onAdd = () => {
    add(product.id);
    setPop(true);
    setTimeout(() => setPop(false), 450);
  };

  return (
    <div className="group flex flex-col">
      <div className={`relative overflow-hidden rounded-xl ${dark ? "bg-carbon" : "bg-cloud"}`}>
        <Link href={`/product/${product.id}`} aria-label={product.name}>
          <div className="aspect-[4/3] w-full overflow-hidden">
            <SafeImg
              src={product.img}
              alt={product.name}
              priority={priority}
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 45vw, 300px"
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
            />
          </div>
        </Link>

        {/* Badges — top */}
        <div className="absolute start-3 top-3 flex flex-col gap-1.5">
          {off > 0 && (
            <span className="rounded-md bg-accent px-2 py-0.5 text-[11px] font-semibold text-white">
              -{off}%
            </span>
          )}
          {product.badge && (
            <span
              className={`rounded-md px-2 py-0.5 text-[11px] font-semibold ${
                dark ? "bg-white text-ink" : BADGE_STYLE[product.badge]
              }`}
            >
              {product.badge}
            </span>
          )}
        </div>

        {/* Hover actions — end side */}
        <div className="absolute end-3 top-3 flex flex-col gap-2 opacity-100 transition-all duration-200 sm:translate-x-1 sm:opacity-0 sm:group-hover:translate-x-0 sm:group-hover:opacity-100">
          <button
            type="button"
            aria-label={wished ? "إزالة من المفضلة" : "أضف إلى المفضلة"}
            onClick={() => toggle(product.id)}
            className={`flex h-9 w-9 items-center justify-center rounded-full shadow-sm transition-colors ${
              wished
                ? "bg-accent text-white"
                : "bg-white text-graphite hover:bg-ink hover:text-white"
            }`}
          >
            <Heart size={15} strokeWidth={1.75} className={wished ? "fill-current" : ""} />
          </button>
          <button
            type="button"
            aria-label="عرض سريع"
            onClick={() => setQuick(true)}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-graphite shadow-sm transition-colors hover:bg-ink hover:text-white"
          >
            <Eye size={15} strokeWidth={1.75} />
          </button>
        </div>

        {/* Out of stock veil */}
        {out && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/60 backdrop-blur-[1px]">
            <span className="rounded-lg bg-ink px-3 py-1.5 text-xs font-medium text-white">
              نفد من المخزون
              </span>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex flex-1 flex-col pt-3.5">
        <p className="text-[11px] font-medium tracking-[0.12em] text-steel">
          {product.brand} · {categoryName(product.category)}
        </p>
        <h3 className={`mt-1 text-sm font-medium leading-6 ${dark ? "text-white" : "text-ink"}`}>
          <Link href={`/product/${product.id}`} className="transition-colors hover:text-accent">
            {product.name}
          </Link>
        </h3>

        <div className="mt-1.5 flex items-center gap-1.5">
          <Stars value={product.rating} size={12} />
          <span className="text-[11px] text-steel">
            {product.rating} ({product.reviews})
          </span>
        </div>

        <div className="mt-1 text-[11px] text-steel">{soldLabel(product.sold)}</div>

        <div className="mt-auto pt-2.5">
          <div className="flex items-baseline gap-2">
            <span className={`text-[15px] font-semibold ${dark ? "text-white" : "text-ink"}`}>
              {formatPrice(product.price)}
            </span>
            {product.oldPrice && (
              <span className="text-xs text-steel line-through">
                {formatPrice(product.oldPrice)}
              </span>
            )}
          </div>

          <div className="mt-1.5">
            <StockPill stock={product.stock} />
          </div>

          <button
            type="button"
            onClick={onAdd}
            disabled={out}
            className={`mt-3 w-full rounded-lg py-2.5 text-sm font-medium transition-all duration-200 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 ${
              dark
                ? "border border-graphite bg-transparent text-white hover:border-cyan hover:bg-white hover:text-ink"
                : "border border-mist bg-white text-ink hover:border-ink hover:bg-ink hover:text-white"
            } ${pop ? "badge-pop" : ""}`}
          >
            {out ? "غير متوفر" : "أضف إلى السلة"}
          </button>
        </div>
      </div>

      {quick && <QuickView product={product} onClose={() => setQuick(false)} />}
    </div>
  );
}
