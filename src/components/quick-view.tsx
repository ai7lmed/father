"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { X, Heart, Eye } from "lucide-react";
import {
  categoryName,
  discountPercent,
  formatPrice,
  soldLabel,
  type Product,
} from "@/lib/products";
import { useCart } from "@/lib/cart";
import { useWishlist } from "@/lib/wishlist";
import { Stars, SafeImg, StockPill } from "@/components/ui";

export function QuickView({
  product,
  onClose,
}: {
  product: Product;
  onClose: () => void;
}) {
  const { add } = useCart();
  const { has, toggle } = useWishlist();
  const [added, setAdded] = useState(false);
  const off = discountPercent(product);
  const wished = has(product.id);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-[80] flex items-end justify-center bg-ink/50 p-0 backdrop-blur-[2px] sm:items-center sm:p-6"
      onClick={onClose}
    >
      <div
        className="page-enter w-full max-w-3xl overflow-hidden rounded-t-2xl bg-white shadow-2xl sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={product.name}
      >
        <div className="grid sm:grid-cols-2">
          <div className="relative bg-cloud">
            <div className="aspect-square w-full">
              <SafeImg
                src={product.img}
                alt={product.name}
                className="h-full w-full object-cover"
                eager
              />
            </div>
            {off > 0 && (
              <span className="absolute start-4 top-4 rounded-md bg-accent px-2 py-1 text-[11px] font-semibold text-white">
                خصم {off}%
              </span>
            )}
          </div>

          <div className="relative flex flex-col p-6 sm:p-7">
            <button
              type="button"
              onClick={onClose}
              aria-label="إغلاق"
              className="absolute end-4 top-4 flex h-8 w-8 items-center justify-center rounded-lg text-steel transition-colors hover:bg-cloud hover:text-ink"
            >
              <X size={18} />
            </button>

            <p className="text-[11px] font-medium tracking-[0.14em] text-steel">
              {product.brand} · {categoryName(product.category)}
            </p>
            <h3 className="mt-2 pe-8 text-lg font-semibold leading-8 text-ink">
              {product.name}
            </h3>

            <div className="mt-2 flex items-center gap-2">
              <Stars value={product.rating} />
              <span className="text-xs text-steel">({product.reviews} مراجعة)</span>
            </div>

            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-xl font-semibold text-ink">
                {formatPrice(product.price)}
              </span>
              {product.oldPrice && (
                <span className="text-sm text-steel line-through">
                  {formatPrice(product.oldPrice)}
                </span>
              )}
            </div>

            <div className="mt-3">
              <StockPill stock={product.stock} />
            </div>

            <p className="mt-4 line-clamp-3 text-sm leading-7 text-graphite">
              {product.desc}
            </p>
            <p className="mt-2 text-xs text-steel">{soldLabel(product.sold)}</p>

            <div className="mt-auto space-y-2.5 pt-6">
              <button
                type="button"
                disabled={product.stock === 0}
                onClick={() => {
                  add(product.id);
                  setAdded(true);
                  setTimeout(() => setAdded(false), 1200);
                }}
                className="h-11 w-full rounded-lg bg-ink text-sm font-medium text-white transition-all duration-200 hover:bg-accent active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {added ? "تمت الإضافة ✓" : "أضف إلى السلة"}
              </button>
              <div className="flex gap-2.5">
                <Link
                  href={`/product/${product.id}`}
                  className="flex h-11 flex-1 items-center justify-center rounded-lg border border-mist text-sm font-medium text-ink transition-colors hover:border-ink"
                >
                  التفاصيل الكاملة
                </Link>
                <button
                  type="button"
                  aria-label="أضف إلى المفضلة"
                  onClick={() => toggle(product.id)}
                  className={`flex h-11 w-11 items-center justify-center rounded-lg border transition-colors ${
                    wished
                      ? "border-accent bg-accent text-white"
                      : "border-mist text-steel hover:border-ink hover:text-ink"
                  }`}
                >
                  <Heart size={16} strokeWidth={1.75} className={wished ? "fill-current" : ""} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
