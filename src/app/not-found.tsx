import Link from "next/link";

export default function NotFound() {
  return (
    <section className="shell flex min-h-[50vh] flex-col items-center justify-center py-24 text-center">
      <p className="eyebrow">404</p>
      <h1 className="mt-4 text-3xl font-semibold tracking-tight text-ink">
        الصفحة غير موجودة
      </h1>
      <p className="mt-3 max-w-sm text-sm leading-7 text-steel">
        الرابط الذي تبحث عنه غير متاح — جرّب العودة للرئيسية أو تصفح المتجر.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link
          href="/"
          className="inline-flex h-11 items-center rounded-lg bg-ink px-6 text-sm font-medium text-white transition-colors hover:bg-accent"
        >
          العودة إلى الرئيسية
        </Link>
        <Link
          href="/shop"
          className="inline-flex h-11 items-center rounded-lg border border-mist bg-white px-6 text-sm font-medium text-ink transition-colors hover:border-ink"
        >
          تصفح المتجر
        </Link>
      </div>
    </section>
  );
}
