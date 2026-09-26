"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Search as SearchIcon } from "lucide-react";
import { categoryName, products } from "@/lib/products";
import { ProductCard } from "@/components/product-card";
import { Reveal } from "@/components/motion";

const POPULAR = ["Galaxy", "iPhone", "سماعة", "Logitech", "شاحن", "ساعة"];

/* كلمات مفتاحية عربية للتصنيفات — تُستبدل بعمود keywords من قاعدة البيانات لاحقاً */
const CATEGORY_KEYWORDS: Record<string, string> = {
  phones: "هاتف هواتف جوال جهاز",
  wearables: "ساعة ساعات smartwatch",
  audio: "سماعة سماعات مكبرات صوت earbuds headphones",
  gaming: "يد تحكم غيمباد控制 controller gaming",
  accessories: "ملحقات شاحن شاحنات كيبل حماية",
  charging: "شاحن باور بانك بطارية",
  "smart-home": "منزل ذكي إنترنت اشياء",
  "solar-cameras": "كاميرا شمسية مراقبة أمن",
  "car-gps": "gps ملاحة سيارة تتبع",
};

/* تطبيع عربي: همزات/تاء مربوطة/ألف مقصورة + إزالة تشكيل */
function normalizeAr(s: string): string {
  return s
    .toLowerCase()
    .replace(/[\u064B-\u0652]/g, "")
    .replace(/[أإآ]/g, "ا")
    .replace(/ة/g, "ه")
    .replace(/ى/g, "ي")
    .replace(/ـ/g, "");
}

/* جذر بسيط: قطع لواحق الجمع/التأنيث الشائعة */
function stem(s: string): string {
  return normalizeAr(s.trim()).replace(/(ات|ون|ين|ة|ه)$/, "");
}

function searchProducts(query: string) {
  const q = query.trim();
  if (!q) return [];
  const qStem = stem(q);
  if (!qStem) return [];

  return products.filter((p) => {
    const cat = p.category;
    const blob = normalizeAr(
      [
        p.name,
        p.brand,
        p.desc,
        categoryName(cat),
        CATEGORY_KEYWORDS[cat] ?? "",
      ].join(" ")
    );
    /* مطابقة بادئة الكلمات — "سماع" تجد "سماعات"، "sams" تجد "Samsung" */
    return blob.split(/[\s،,.\-—/()]+/).some((w) => w.startsWith(qStem));
  });
}

function SearchInner() {
  /* القراءة الأولى من ?q= في الـ URL — الروابط المشتركة تعمل */
  const params = useSearchParams();
  const [q, setQ] = useState(params.get("q") ?? "");

  /* البحث الذكي: اسم + علامة + وصف + تصنيف + كلمات مفتاحية، بتطبيع عربي */
  const results = useMemo(() => searchProducts(q), [q]);

  /* كتابة في الحقل تُحدّث الـ URL (قابل للمشاركة/العودة) */
  useEffect(() => {
    const t = q.trim()
      ? history.replaceState(null, "", `/search?q=${encodeURIComponent(q.trim())}`)
      : history.replaceState(null, "", "/search");
    return t;
  }, [q]);

  return (
    <div className="shell min-h-[70vh] py-10 sm:py-14">
      <p className="eyebrow">SEARCH</p>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
        البحث
      </h1>

      <div className="relative mt-7 max-w-xl">
        <SearchIcon
          size={18}
          strokeWidth={1.75}
          className="absolute start-4 top-1/2 -translate-y-1/2 text-steel"
        />
        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="ابحث عن منتج أو علامة تجارية…"
          autoFocus
          className="h-13 w-full rounded-xl border border-mist bg-white py-3.5 ps-11 pe-4 text-[15px] text-ink outline-none transition-colors placeholder:text-steel focus:border-accent"
        />
      </div>

      {q.trim() ? (
        results.length > 0 ? (
          <>
            <p className="mt-9 text-sm text-steel">
              {results.length} نتيجة لـ &quot;{q.trim()}&quot;
            </p>
            <div className="mt-5 grid grid-cols-2 gap-x-4 gap-y-10 sm:gap-x-6 lg:grid-cols-4">
              {results.map((p, i) => (
                <Reveal key={p.id} delay={(i % 4) * 60}>
                  <ProductCard product={p} />
                </Reveal>
              ))}
            </div>
          </>
        ) : (
          <div className="py-20 text-center">
            <p className="eyebrow">NO RESULTS</p>
            <h2 className="mt-4 text-xl font-semibold text-ink">
              لا توجد نتائج لـ &quot;{q.trim()}&quot;
            </h2>
            <p className="mt-2 text-sm text-steel">
              جرّب اسم علامة مثل &quot;Samsung&quot; أو كلمة أعم مثل &quot;سماعة&quot;.
            </p>
          </div>
        )
      ) : (
        <div className="mt-12">
          <p className="text-sm font-medium text-ink">بحث شائع</p>
          <div className="mt-4 flex flex-wrap gap-2">
            {POPULAR.map((term) => (
              <button
                key={term}
                type="button"
                onClick={() => setQ(term)}
                className="inline-flex h-9 items-center rounded-lg border border-mist bg-white px-4 text-sm text-graphite transition-all duration-200 hover:border-accent hover:text-accent active:scale-[0.97]"
              >
                {term}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="min-h-[60vh]" />}>
      <SearchInner />
    </Suspense>
  );
}
