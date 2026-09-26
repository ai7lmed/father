import Link from "next/link";
import {
  categories,
  categoryName,
  discountPercent,
  gamingSubs,
  products,
  type CategorySlug,
} from "@/lib/products";
import { ProductCard } from "@/components/product-card";
import { Reveal } from "@/components/motion";
import { SlidersHorizontal, X } from "lucide-react";

export const metadata = { title: "المتجر" };

type Search = {
  cat?: string;
  sub?: string; // تصنيف فرعي (مثل gaming-mice)
  sort?: string;
  q?: string;
  brand?: string; // comma separated
  price?: string; // e.g. "0-50"
  rating?: string; // "4.5"
  stock?: string; // "1"
};

const sorts = [
  { value: "featured", label: "المميزة" },
  { value: "newest", label: "الأحدث" },
  { value: "price-asc", label: "السعر: من الأقل" },
  { value: "price-desc", label: "السعر: من الأعلى" },
  { value: "best-selling", label: "الأكثر مبيعاً" },
  { value: "rating", label: "الأعلى تقييماً" },
];

const priceRanges = [
  { value: "0-25", label: "أقل من 25 ر.ع" },
  { value: "25-75", label: "25 – 75 ر.ع" },
  { value: "75-150", label: "75 – 150 ر.ع" },
  { value: "150-9999", label: "أكثر من 150 ر.ع" },
];

const brandNames = [...new Set(products.map((p) => p.brand))].sort();

function parseBrand(raw?: string): string[] {
  return raw ? raw.split(",").filter(Boolean) : [];
}

function applyFilters(sp: Search) {
  let list = [...products];
  const q = sp.q?.trim() ?? "";
  const brands = parseBrand(sp.brand);

  if (sp.cat && sp.cat !== "all") {
    // الفلتر شجري: تصنيف أب يشمل كل تصنيفاته الفرعية (مطابق لشجرة DB)
    const children = gamingSubs.filter((s) => s.parent === sp.cat).map((s) => s.slug);
    const allow = new Set([sp.cat, ...children]);
    list = list.filter((p) => allow.has(p.category));
  }
  if (sp.sub) list = list.filter((p) => p.subcategory === sp.sub);
  if (q) {
    const needle = q.toLowerCase();
    list = list.filter(
      (p) =>
        p.name.toLowerCase().includes(needle) ||
        p.brand.toLowerCase().includes(needle) ||
        categoryName(p.category).includes(q) ||
        p.tags.some((t) => t.toLowerCase().includes(needle))
    );
  }
  if (brands.length) list = list.filter((p) => brands.includes(p.brand));

  if (sp.price) {
    const [min, max] = sp.price.split("-").map(Number);
    list = list.filter((p) => p.price >= min && p.price <= max);
  }
  if (sp.rating) {
    const min = Number(sp.rating);
    list = list.filter((p) => p.rating >= min);
  }
  if (sp.stock === "1") list = list.filter((p) => p.stock > 0);

  switch (sp.sort) {
    case "price-asc":
      list.sort((a, b) => a.price - b.price);
      break;
    case "price-desc":
      list.sort((a, b) => b.price - a.price);
      break;
    case "newest":
      list.sort((a, b) => Number(Boolean(b.isNew)) - Number(Boolean(a.isNew)));
      break;
    case "best-selling":
      list.sort((a, b) => b.sold - a.sold);
      break;
    case "rating":
      list.sort((a, b) => b.rating - a.rating);
      break;
    default:
      list.sort((a, b) => Number(Boolean(b.isFeatured)) - Number(Boolean(a.isFeatured)));
  }

  return list;
}

function buildHref(current: Search, patch: Partial<Search>): string {
  const merged = { ...current, ...patch };
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(merged)) {
    if (v) params.set(k, String(v));
  }
  const qs = params.toString();
  return qs ? `/shop?${qs}` : "/shop";
}

/* ——— Filter panel (shared between sidebar and mobile drawer) ——— */

function FilterPanel({ sp }: { sp: Search }) {
  const brands = parseBrand(sp.brand);
  const activeCat = sp.cat ?? "all";

  return (
    <div className="space-y-7">
      {/* Categories */}
      <div>
        <h3 className="text-xs font-semibold uppercase tracking-[0.18em] text-steel">
          التصنيف
        </h3>
        <div className="mt-3 space-y-1">
          <FilterLink href={buildHref(sp, { cat: undefined, sub: undefined })} active={activeCat === "all"}>
            الكل
          </FilterLink>
          {categories.map((c) => (
            <FilterLink
              key={c.slug}
              href={buildHref(sp, { cat: c.slug, sub: undefined })}
              active={activeCat === c.slug && !sp.sub}
            >
              {c.nameAr}
            </FilterLink>
          ))}
        </div>

        {/* Subcategories — تظهر عند اختيار تصنيف له فرعيّات */}
        {activeCat === "gaming" && (
          <div className="mt-4 border-t border-mist pt-4">
            <h4 className="text-[11px] font-semibold uppercase tracking-[0.18em] text-steel">
              فرعيّات Gaming
            </h4>
            <div className="mt-2.5 space-y-1">
              {gamingSubs.map((s) => (
                <FilterLink
                  key={s.slug}
                  href={buildHref(sp, { cat: "gaming", sub: s.slug })}
                  active={sp.sub === s.slug}
                >
                  {s.nameAr || s.name}
                </FilterLink>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Price */}
      <div>
        <h3 className="text-xs font-semibold uppercase tracking-[0.18em] text-steel">
          السعر
        </h3>
        <div className="mt-3 space-y-1">
          <FilterLink href={buildHref(sp, { price: undefined })} active={!sp.price}>
            كل الأسعار
          </FilterLink>
          {priceRanges.map((r) => (
            <FilterLink
              key={r.value}
              href={buildHref(sp, { price: r.value })}
              active={sp.price === r.value}
            >
              {r.label}
            </FilterLink>
          ))}
        </div>
      </div>

      {/* Rating */}
      <div>
        <h3 className="text-xs font-semibold uppercase tracking-[0.18em] text-steel">
          التقييم
        </h3>
        <div className="mt-3 space-y-1">
          <FilterLink href={buildHref(sp, { rating: undefined })} active={!sp.rating}>
            كل التقييمات
          </FilterLink>
          {["4.5", "4", "3.5"].map((r) => (
            <FilterLink
              key={r}
              href={buildHref(sp, { rating: r })}
              active={sp.rating === r}
            >
              {r}★ وأعلى
            </FilterLink>
          ))}
        </div>
      </div>

      {/* Availability */}
      <div>
        <h3 className="text-xs font-semibold uppercase tracking-[0.18em] text-steel">
          التوفر
        </h3>
        <div className="mt-3 space-y-1">
          <FilterLink href={buildHref(sp, { stock: undefined })} active={sp.stock !== "1"}>
            كل المنتجات
          </FilterLink>
          <FilterLink href={buildHref(sp, { stock: "1" })} active={sp.stock === "1"}>
            المتوفر فقط
          </FilterLink>
        </div>
      </div>

      {/* Brands */}
      <div>
        <h3 className="text-xs font-semibold uppercase tracking-[0.18em] text-steel">
          العلامة التجارية
        </h3>
        <div className="mt-3 space-y-2">
          {brandNames.map((b) => {
            const active = brands.includes(b);
            const next = active ? brands.filter((x) => x !== b) : [...brands, b];
            return (
              <Link
                key={b}
                href={buildHref(sp, { brand: next.join(",") || undefined })}
                className="flex items-center gap-2.5 text-sm text-graphite transition-colors hover:text-ink"
              >
                <span
                  className={`flex h-4.5 w-4.5 items-center justify-center rounded border transition-colors ${
                    active ? "border-accent bg-accent text-white" : "border-silver bg-white"
                  }`}
                >
                  {active && (
                    <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
                      <path d="M2 6.5 4.8 9 10 3.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </span>
                {b}
              </Link>
            );
          })}
        </div>
      </div>

      {/* Clear */}
      <Link
        href="/shop"
        className="inline-flex text-xs text-accent underline-offset-4 hover:underline"
      >
        مسح كل الفلاتر
      </Link>
    </div>
  );
}

function FilterLink({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={`block text-sm transition-colors ${
        active ? "font-medium text-accent" : "text-graphite hover:text-ink"
      }`}
    >
      {children}
    </Link>
  );
}

/* ——— Page ——— */

async function ShopContent({ searchParams }: { searchParams: Search }) {
  const list = applyFilters(searchParams);
  const activeCat = searchParams.cat ?? "all";
  const activeSub = searchParams.sub;
  const sort = searchParams.sort ?? "featured";
  const brands = parseBrand(searchParams.brand);
  const filtersActive =
    Boolean(searchParams.brand || searchParams.price || searchParams.rating || searchParams.stock || searchParams.sub) ||
    activeCat !== "all";

  return (
    <>
      {/* Header */}
      <section className="border-b border-mist bg-paper">
        <div className="shell py-10 sm:py-14">
          <p className="eyebrow">SHOP</p>
          <h1 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">
            {activeCat === "all"
              ? "كل المنتجات"
              : activeSub
                ? gamingSubs.find((s) => s.slug === activeSub)?.name ?? categoryName(activeCat as CategorySlug)
                : categoryName(activeCat as CategorySlug)}
          </h1>
          <p className="mt-3 text-sm text-steel">
            {list.length} منتجاً — أسعار بالريال العُماني شاملة الضريبة.
          </p>
        </div>
      </section>

      {/* Toolbar */}
      <div className="sticky top-[100px] z-30 border-b border-mist bg-paper2/95 backdrop-blur">
        <div className="shell flex h-14 items-center justify-between gap-3">
          {/* Mobile filter trigger */}
          <details className="relative lg:hidden">
            <summary className="flex h-9 cursor-pointer list-none items-center gap-2 rounded-lg border border-mist bg-white px-4 text-sm text-ink [&::-webkit-details-marker]:hidden">
              <SlidersHorizontal size={15} strokeWidth={1.75} />
              الفلاتر
              {filtersActive && <span className="h-1.5 w-1.5 rounded-full bg-accent" />}
            </summary>
            <div className="absolute start-0 end-0 top-11 max-h-[70vh] overflow-y-auto rounded-xl border border-mist bg-white p-5 shadow-xl">
              <div className="mb-4 flex items-center justify-between">
                <span className="text-sm font-semibold">الفلاتر</span>
                <X size={16} className="text-steel" />
              </div>
              <FilterPanel sp={searchParams} />
            </div>
          </details>

          <p className="hidden text-xs text-steel lg:block">
            {list.length} منتجاً {filtersActive && "· فلاتر مفعّلة"}
          </p>

          {/* Sort chips */}
          <div className="no-scrollbar flex items-center gap-1.5 overflow-x-auto">
            {sorts.map((s) => (
              <Link
                key={s.value}
                href={buildHref(searchParams, { sort: s.value })}
                className={`inline-flex h-9 shrink-0 items-center whitespace-nowrap rounded-lg border px-3.5 text-xs transition-all duration-200 ${
                  sort === s.value
                    ? "border-ink bg-ink text-white"
                    : "border-mist bg-white text-graphite hover:border-steel hover:text-ink"
                }`}
              >
                {s.label}
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Body */}
      <section className="shell py-10">
        <div className="grid gap-10 lg:grid-cols-[220px_1fr] lg:gap-12">
          {/* Sidebar */}
          <aside className="hidden lg:block">
            <div className="sticky top-[172px]">
              <FilterPanel sp={searchParams} />
            </div>
          </aside>

          {/* Grid */}
          <div>
            {list.length === 0 ? (
              <div className="py-24 text-center">
                <p className="eyebrow">EMPTY</p>
                <h2 className="mt-4 text-xl font-semibold text-ink">
                  لا توجد منتجات مطابقة
                </h2>
                <p className="mt-2 text-sm text-steel">
                  جرّب تعديل الفلاتر أو مسحها بالكامل.
                </p>
                <Link
                  href="/shop"
                  className="mt-6 inline-flex h-11 items-center rounded-lg bg-ink px-6 text-sm font-medium text-white transition-colors hover:bg-accent"
                >
                  مسح الفلاتر
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-x-4 gap-y-10 sm:gap-x-6 lg:grid-cols-3">
                {list.map((p, i) => (
                  <Reveal key={p.id} delay={(i % 3) * 60}>
                    <ProductCard product={p} />
                  </Reveal>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>
    </>
  );
}

export default async function ShopPage({
  searchParams,
}: {
  searchParams: Promise<Search>;
}) {
  const params = await searchParams;
  return <ShopContent searchParams={params} />;
}
