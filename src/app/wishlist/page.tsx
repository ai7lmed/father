"use client";

import Link from "next/link";
import { useWishlist } from "@/lib/wishlist";
import { getProduct } from "@/lib/products";
import { ProductCard } from "@/components/product-card";
import { Reveal } from "@/components/motion";

export default function WishlistPage() {
  const { ids, ready } = useWishlist();

  if (!ready) return <div className="min-h-[60vh]" />;

  const items = ids
    .map((id) => getProduct(id))
    .filter((p): p is NonNullable<typeof p> => Boolean(p));

  return (
    <div className="shell min-h-[60vh] py-10 sm:py-14">
      <p className="eyebrow">WISHLIST</p>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
        المفضلة
      </h1>
      <p className="mt-3 text-sm text-steel">
        {items.length > 0
          ? `${items.length} منتجاً محفوظاً — محفوظة على هذا الجهاز.`
          : "احفظ ما يعجبك للرجوع إليه لاحقاً."}
      </p>

      {items.length === 0 ? (
        <div className="py-20 text-center">
          <p className="eyebrow">EMPTY</p>
          <h2 className="mt-4 text-xl font-semibold text-ink">
            لا توجد منتجات في المفضلة
          </h2>
          <p className="mt-2 text-sm text-steel">
            اضغط أيقونة القلب على أي منتج لإضافته هنا.
          </p>
          <Link
            href="/shop"
            className="mt-8 inline-flex h-12 items-center rounded-lg bg-ink px-7 text-sm font-medium text-white transition-all duration-200 hover:bg-accent active:scale-[0.98]"
          >
            تصفح المنتجات
          </Link>
        </div>
      ) : (
        <div className="mt-10 grid grid-cols-2 gap-x-4 gap-y-10 sm:gap-x-6 lg:grid-cols-4">
          {items.map((p, i) => (
            <Reveal key={p.id} delay={(i % 4) * 60}>
              <ProductCard product={p} />
            </Reveal>
          ))}
        </div>
      )}
    </div>
  );
}
