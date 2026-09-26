import Link from "next/link";
import { Instagram, MessageCircle, Mail, MapPin, Phone } from "lucide-react";
import { categories, categoryHref } from "@/lib/products";

const storeLinks = [
  { href: "/shop", label: "كل المنتجات" },
  { href: "/gaming", label: "ALDIRXON Gaming" },
  { href: "/shop?cat=solar-cameras", label: "كاميرات شمسية" },
  { href: "/shop?cat=car-gps", label: "GPS السيارات" },
  { href: "/wishlist", label: "المفضلة" },
  { href: "/account", label: "حسابي" },
  { href: "/about", label: "من نحن" },
  { href: "/contact", label: "تواصل معنا" },
];

const supportLinks = [
  { href: "/policies/shipping", label: "الشحن والتوصيل" },
  { href: "/policies/returns", label: "الإرجاع والاستبدال" },
  { href: "/policies/privacy", label: "سياسة الخصوصية" },
  { href: "/policies/terms", label: "الشروط والأحكام" },
  { href: "/search", label: "بحث" },
];

const payments = ["Visa", "Mastercard", "Apple Pay", "الدفع عند الاستلام"];

export function SiteFooter() {
  return (
    <footer className="bg-night text-white">
      {/* Newsletter strip */}
      <div className="border-b border-white/10">
        <div className="shell flex flex-col items-center justify-between gap-4 py-8 sm:flex-row">
          <div>
            <p className="text-sm font-semibold">اشترك ليصلك الجديد والعروض</p>
            <p className="mt-1 text-xs text-silver">رسالة واحدة شهرياً — بدون إزعاج.</p>
          </div>
          <form
            action="/contact"
            className="flex w-full max-w-md gap-2"
          >
            <input
              type="email"
              name="email"
              required
              placeholder="بريدك الإلكتروني"
              className="h-11 flex-1 rounded-lg border border-white/15 bg-white/5 px-4 text-sm text-white outline-none transition-colors placeholder:text-steel focus:border-silver"
            />
            <button
              type="submit"
              className="h-11 rounded-lg bg-white px-5 text-sm font-medium text-ink transition-colors hover:bg-mist"
            >
              اشترك
            </button>
          </form>
        </div>
      </div>

      {/* Columns */}
      <div className="shell grid gap-10 py-12 sm:grid-cols-2 lg:grid-cols-[1.6fr_1fr_1fr_1fr]">
        <div>
          <Link href="/" className="text-lg font-bold tracking-[0.24em]">
            ALDIRXON
          </Link>
          <p className="mt-4 max-w-xs text-sm leading-7 text-silver">
            متجر الإلكترونيات والأجهزة الذكية في سلطنة عُمان — منتجات أصلية بضمان
            الوكيل، أسعار واضحة، وتوصيل لكل المحافظات.
          </p>
          <div className="mt-5 space-y-2 text-sm text-silver">
            <p className="flex items-center gap-2">
              <MapPin size={15} strokeWidth={1.6} /> مسقط، سلطنة عُمان
            </p>
            <p className="flex items-center gap-2">
              <Mail size={15} strokeWidth={1.6} />
              <a href="mailto:support@aldirxon.om" dir="ltr" className="transition-colors hover:text-white">
                support@aldirxon.om
              </a>
            </p>
            <p className="flex items-center gap-2">
              <Phone size={15} strokeWidth={1.6} />
              <a href="tel:+96895535100" dir="ltr" className="transition-colors hover:text-white">
                +968 9553 5100
              </a>
            </p>
          </div>
          <div className="mt-5 flex items-center gap-2">
            <a
              href="https://instagram.com"
              target="_blank"
              rel="noreferrer"
              aria-label="Instagram"
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/15 text-silver transition-colors hover:border-white hover:text-white"
            >
              <Instagram size={16} strokeWidth={1.6} />
            </a>
            <a
              href="https://wa.me/96895535100"
              target="_blank"
              rel="noreferrer"
              aria-label="WhatsApp"
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/15 text-silver transition-colors hover:border-white hover:text-white"
            >
              <MessageCircle size={16} strokeWidth={1.6} />
            </a>
          </div>
        </div>

        <FooterColumn title="المتجر" links={storeLinks} />
        <FooterColumn
          title="التصنيفات"
          links={categories.map((c) => ({ href: categoryHref(c.slug), label: c.nameAr }))}
        />
        <FooterColumn title="خدمة العملاء" links={supportLinks} />
      </div>

      {/* Payments + bottom */}
      <div className="border-t border-white/10">
        <div className="shell flex flex-col items-center justify-between gap-4 py-6 sm:flex-row">
          <p className="text-xs text-steel">
            © 2026 ALDIRXON. جميع الحقوق محفوظة — سلطنة عُمان
          </p>
          <div className="flex flex-wrap items-center justify-center gap-1.5">
            {payments.map((p) => (
              <span
                key={p}
                className="rounded-md border border-white/10 px-2.5 py-1 text-[11px] text-silver"
              >
                {p}
              </span>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}

function FooterColumn({
  title,
  links,
}: {
  title: string;
  links: { href: string; label: string }[];
}) {
  return (
    <div>
      <h3 className="text-sm font-semibold">{title}</h3>
      <ul className="mt-4 space-y-2.5">
        {links.map((l) => (
          <li key={l.label}>
            <Link href={l.href} className="text-sm text-silver transition-colors hover:text-white">
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
