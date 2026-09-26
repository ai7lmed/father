"use client";

import { useState } from "react";
import Image from "next/image";
import { Star, ChevronDown, ImageOff } from "lucide-react";
import { inStockLabel } from "@/lib/products";

/* ——— Star rating ——— */
export function Stars({
  value,
  size = 13,
  className = "",
}: {
  value: number;
  size?: number;
  className?: string;
}) {
  return (
    <span className={`inline-flex items-center gap-0.5 ${className}`} aria-label={`تقييم ${value} من 5`}>
      {[0, 1, 2, 3, 4].map((i) => {
        const fill = value - i;
        return (
          <span key={i} className="relative inline-block" style={{ width: size, height: size }}>
            <Star size={size} strokeWidth={1.5} className="absolute inset-0 text-silver" />
            {fill > 0 && (
              <span
                className="absolute inset-0 overflow-hidden"
                style={{ width: `${Math.min(1, fill) * 100}%` }}
              >
                <Star size={size} strokeWidth={1.5} className="text-amber-500 fill-amber-400" />
              </span>
            )}
          </span>
        );
      })}
    </span>
  );
}

/* ——— Product image with graceful fallback ———
 * تستخدم next/image: تقليل تلقائي + WebP/AVIF + lazy + منع CLS.
 * تُحدَّد أبعاداً تقريبية عند غياب layout حجمي لتفادي وثب CLS. */
export function SafeImg({
  src,
  alt,
  className = "",
  sizes = "(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw",
  eager = false,
  priority,
  fillClass,
}: {
  src: string;
  alt: string;
  className?: string;
  sizes?: string;
  eager?: boolean;
  priority?: boolean;
  /** للصور الغيْر المعبأة بأبعاد CSS: مطلوب container نسبي */
  fillClass?: string;
}) {
  const [failed, setFailed] = useState(false);
  if (failed) {
    return (
      <div
        className={`flex items-center justify-center bg-cloud ${className}`}
        aria-label={alt}
      >
        <ImageOff size={22} strokeWidth={1.5} className="text-steel" />
      </div>
    );
  }

  if (fillClass) {
    return (
      <span className={`relative block ${fillClass}`}>
        <Image
          src={src}
          alt={alt}
          fill
          sizes={sizes}
          priority={priority ?? eager}
          loading={priority || eager ? undefined : "lazy"}
          onError={() => setFailed(true)}
          className={className}
          draggable={false}
        />
      </span>
    );
  }

  return (
    <Image
      src={src}
      alt={alt}
      width={800}
      height={600}
      sizes={sizes}
      priority={priority ?? eager}
      loading={priority || eager ? undefined : "lazy"}
      onError={() => setFailed(true)}
      className={className}
      draggable={false}
    />);
}

/* ——— Accordion section (details/summary based) ——— */
export function Accordion({
  title,
  children,
  open = false,
}: {
  title: string;
  children: React.ReactNode;
  open?: boolean;
}) {
  return (
    <details className="acc group border-b border-mist" open={open}>
      <summary className="flex cursor-pointer list-none items-center justify-between py-4 text-sm font-medium text-ink [&::-webkit-details-marker]:hidden">
        {title}
        <ChevronDown size={16} strokeWidth={1.75} className="acc-icon text-steel" />
      </summary>
      <div className="acc-body pb-5 text-sm leading-7 text-graphite">{children}</div>
    </details>
  );
}

/* ——— Availability pill ——— */
export function StockPill({ stock }: { stock: number }) {
  const label = inStockLabel(stock);
  const out = stock === 0;
  const low = stock > 0 && stock <= 5;
  return (
    <span
      className={`inline-flex w-fit items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium ${
        out
          ? "bg-mist text-steel"
          : low
            ? "bg-paper text-graphite ring-1 ring-silver"
            : "bg-paper text-graphite ring-1 ring-mist"
      }`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${
          out ? "bg-steel" : low ? "bg-amber-500" : "bg-emerald-500"
        }`}
      />
      {label}
    </span>
  );
}
