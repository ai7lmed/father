"use client";

import { useState } from "react";
import { useCart } from "@/lib/cart";
import { formatPrice, getProduct } from "@/lib/products";
import { SafeImg } from "@/components/ui";

const BUNDLE_TOTALS: Record<string, number> = {
  starter: 135.5,
  competitive: 257.5,
  studio: 287.9,
};

export function SetupBundle({
  id,
  name,
  items,
}: {
  id: string;
  name: string;
  items: string[];
}) {
  const { add } = useCart();
  const [pop, setPop] = useState(false);

  const products = items
    .map((pid) => getProduct(pid))
    .filter((p): p is NonNullable<typeof p> => Boolean(p));

  const total = BUNDLE_TOTALS[id] ?? products.reduce((s, p) => s + p.price, 0);

  const onAddAll = () => {
    for (const p of products) add(p.id);
    setPop(true);
    setTimeout(() => setPop(false), 450);
  };

  return (
    <div className="flex h-full flex-col rounded-2xl border border-white/10 bg-white/[0.03] p-6 transition-colors hover:border-cyan/40">
      <div className="flex items-baseline justify-between gap-4">
        <h3 className="text-sm font-semibold tracking-[0.12em] text-white">{name}</h3>
        <p className="text-sm text-cyan">{formatPrice(total)}</p>
      </div>

      <div className="mt-6 flex-1 space-y-4">
        {products.map((p) => (
          <div key={p.id} className="flex items-center gap-3.5">
            <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-ink">
              <SafeImg src={p.img} alt={p.name} className="h-full w-full object-cover" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[13px] text-white">{p.name}</p>
              <p className="mt-0.5 text-xs text-steel">{formatPrice(p.price)}</p>
            </div>
            <button
              type="button"
              onClick={() => add(p.id)}
              aria-label={`إضافة ${p.name}`}
              className="shrink-0 rounded-md border border-white/15 px-2.5 py-1.5 text-xs text-silver transition-colors hover:border-cyan hover:text-cyan active:scale-95"
            >
              إضافة
            </button>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={onAddAll}
        className={`mt-7 w-full rounded-lg bg-white py-3 text-sm font-medium text-ink transition-all duration-200 hover:bg-cyan hover:text-white active:scale-[0.98] ${
          pop ? "badge-pop" : ""
        }`}
      >
        أضف الإعداد كاملاً
      </button>
    </div>
  );
}
