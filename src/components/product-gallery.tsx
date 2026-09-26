"use client";

import { useCallback, useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Maximize2, X } from "lucide-react";
import { SafeImg } from "@/components/ui";

/* ============================================================
 * ProductGallery — معرض صور المنتج في صفحة المتجر
 * • الصورة الرئيسية كبيرة + مصغرات أسفلها (شريط أفقي على الجوال)
 * • الضغط على مصغرة يبدّل الرئيسية + أسهم Previous/Next + لوحة مفاتيح
 * • تكبير بحجم أكبر (Lightbox) مع دعم لوحة المفاتيح والخلفية المظلمة
 * • صورة واحدة → لا مصغرات ولا أسهم (عرض طبيعي)
 * ============================================================ */

export function ProductGallery({ images, alt }: { images: string[]; alt: string }) {
  const [active, setActive] = useState(0);
  const [zoom, setZoom] = useState(false);
  const count = images.length;
  const multiple = count > 1;

  const go = useCallback(
    (dir: -1 | 1) => setActive((a) => (a + dir + count) % count),
    [count]
  );

  const openZoom = useCallback(() => setZoom(true), []);

  /* لوحة المفاتيح: أسهم للتنقل + Escape للإغلاق */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (zoom) {
        if (e.key === "Escape") setZoom(false);
        if (e.key === "ArrowLeft") go(1); /* RTL: اليسار = التالي */
        if (e.key === "ArrowRight") go(-1);
      } else if (multiple && e.target === document.body) {
        if (e.key === "ArrowLeft") go(1);
        if (e.key === "ArrowRight") go(-1);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [zoom, multiple, go]);

  if (count === 0) return null;
  const current = images[Math.min(active, count - 1)];

  return (
    <div>
      {/* الصورة الرئيسية */}
      <div className="relative overflow-hidden rounded-2xl bg-cloud">
        <div className="aspect-square w-full">
          <SafeImg
            key={current}
            src={current}
            alt={alt}
            className="page-enter h-full w-full object-cover"
            eager
          />
        </div>

        {/* زر التكبير */}
        <button
          type="button"
          onClick={openZoom}
          aria-label="تكبير الصورة"
          className="absolute end-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-ink shadow-sm transition-colors hover:bg-white"
        >
          <Maximize2 size={15} strokeWidth={1.75} />
        </button>

        {/* أسهم التنقل — تظهر مع أكثر من صورة فقط */}
        {multiple && (
          <>
            <button
              type="button"
              onClick={() => go(-1)}
              aria-label="الصورة السابقة"
              className="absolute start-2 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-ink shadow-sm transition-colors hover:bg-white"
            >
              <ChevronRight size={18} strokeWidth={1.75} />
            </button>
            <button
              type="button"
              onClick={() => go(1)}
              aria-label="الصورة التالية"
              className="absolute end-2 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-ink shadow-sm transition-colors hover:bg-white"
            >
              <ChevronLeft size={18} strokeWidth={1.75} />
            </button>
          </>
        )}
      </div>

      {/* المصغرات */}
      {multiple && (
        <div className="mt-3 flex gap-2.5 overflow-x-auto pb-1">
          {images.map((src, i) => (
            <button
              key={src}
              type="button"
              onClick={() => setActive(i)}
              aria-label={`عرض الصورة ${i + 1} من ${count}`}
              aria-current={i === active}
              className={`h-16 w-16 shrink-0 overflow-hidden rounded-lg border-2 transition-colors sm:h-18 sm:w-18 ${
                i === active ? "border-ink" : "border-transparent opacity-70 hover:opacity-100"
              }`}
            >
              <SafeImg src={src} alt="" className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      )}

      {/* Lightbox — عرض بحجم أكبر */}
      {zoom && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="عرض الصورة بحجم أكبر"
          className="fixed inset-0 z-[100] flex items-center justify-center bg-ink/90 p-4"
          onClick={() => setZoom(false)}
        >
          <button
            type="button"
            aria-label="إغلاق"
            className="absolute end-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
            onClick={() => setZoom(false)}
          >
            <X size={20} strokeWidth={1.75} />
          </button>

          <div className="max-h-full max-w-3xl" onClick={(e) => e.stopPropagation()}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={current}
              alt={alt}
              className="max-h-[80vh] w-full rounded-xl object-contain page-enter"
            />
            {multiple && (
              <div className="mt-4 flex items-center justify-center gap-3">
                <button
                  type="button"
                  aria-label="السابقة"
                  onClick={() => go(-1)}
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
                >
                  <ChevronRight size={18} strokeWidth={1.75} />
                </button>
                <span className="text-xs text-white/80" dir="ltr">
                  {active + 1} / {count}
                </span>
                <button
                  type="button"
                  aria-label="التالية"
                  onClick={() => go(1)}
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
                >
                  <ChevronLeft size={18} strokeWidth={1.75} />
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
