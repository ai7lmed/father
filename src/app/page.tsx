import Link from "next/link";
import {
  ArrowLeft,
  Truck,
  ShieldCheck,
  BadgeCheck,
  Headset,
  Gamepad2,
  Instagram,
} from "lucide-react";
import {
  categories,
  categoryHref,
  featuredProducts,
  bestSellers,
  newArrivals,
  gamingSubs,
} from "@/lib/products";
import { ProductCard } from "@/components/product-card";
import { SectionHeader } from "@/components/section-header";
import { SafeImg } from "@/components/ui";
import { Reveal } from "@/components/motion";

export default function HomePage() {
  return (
    <>
      <Hero />
      <Categories />
      <Featured />
      <BestSellers />
      <GamingHub />
      <WhyQaven />
      <Latest />
      <Social />
    </>
  );
}

/* ————————————————— Hero ————————————————— */

const HERO_IMG =
  "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&w=1400&q=80";
const HERO_IMG_2 =
  "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=900&q=80";
const HERO_IMG_3 =
  "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=900&q=80";

function Hero() {
  return (
    <section className="border-b border-mist bg-paper">
      <div className="shell grid items-center gap-10 py-10 sm:py-14 lg:grid-cols-2 lg:gap-14 lg:py-20">
        {/* Copy */}
        <div className="max-w-xl">
          <p className="eyebrow">Electronics &amp; Smart Devices — Oman</p>
          <h1 className="mt-4 text-4xl font-semibold leading-[1.15] tracking-tight text-ink sm:text-5xl">
            Technology. <span className="text-accent">Simplified.</span>
          </h1>
          <p className="mt-5 text-[15px] leading-8 text-graphite">
            QAVEN متجر الإلكترونيات والأجهزة الذكية في سلطنة عُمان — هواتف، سماعات،
            أجهزة Gaming ومنتجات المنزل الذكي، مختارة من علامات موثوقة وبضمان الوكيل.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/shop"
              className="inline-flex h-12 items-center gap-2 rounded-lg bg-ink px-7 text-sm font-medium text-white transition-all duration-200 hover:bg-accent active:scale-[0.98]"
            >
              تسوق الآن
              <ArrowLeft size={17} strokeWidth={1.75} />
            </Link>
            <Link
              href="/gaming"
              className="inline-flex h-12 items-center gap-2 rounded-lg border border-ink/15 bg-white px-7 text-sm font-medium text-ink transition-all duration-200 hover:border-ink active:scale-[0.98]"
            >
              <Gamepad2 size={17} strokeWidth={1.75} />
              Explore Gaming
            </Link>
          </div>

          {/* Trust strip */}
          <div className="mt-9 flex flex-wrap gap-x-6 gap-y-2 text-xs text-steel">
            <span className="flex items-center gap-1.5">
              <Truck size={14} strokeWidth={1.6} /> توصيل لكل محافظات عُمان
            </span>
            <span className="flex items-center gap-1.5">
              <ShieldCheck size={14} strokeWidth={1.6} /> منتجات أصلية 100%
            </span>
            <span className="flex items-center gap-1.5">
              <BadgeCheck size={14} strokeWidth={1.6} /> ضمان الوكيل المعتمد
            </span>
          </div>
        </div>

        {/* Photo composition */}
        <Reveal className="relative">
          <div className="grid grid-cols-[1.7fr_1fr] gap-3">
            <div className="relative overflow-hidden rounded-2xl bg-cloud">
              <SafeImg
                src={HERO_IMG}
                alt="لابتوبات وأجهزة QAVEN"
                eager
                className="aspect-[4/3.4] h-full w-full object-cover"
              />
            </div>
            <div className="grid grid-rows-2 gap-3">
              <div className="overflow-hidden rounded-2xl bg-cloud">
                <SafeImg
                  src={HERO_IMG_2}
                  alt="سماعات"
                  eager
                  className="h-full w-full object-cover"
                />
              </div>
              <div className="overflow-hidden rounded-2xl bg-cloud">
                <SafeImg
                  src={HERO_IMG_3}
                  alt="ساعات ذكية"
                  eager
                  className="h-full w-full object-cover"
                />
              </div>
            </div>
          </div>

          {/* Floating price chip — small commercial detail */}
          <div className="absolute bottom-4 start-4 rounded-xl border border-mist bg-white/95 px-3.5 py-2.5 shadow-lg shadow-ink/5 backdrop-blur">
            <p className="text-[10px] text-steel">عروض هذا الأسبوع</p>
            <p className="text-sm font-semibold text-ink">
              خصومات حتى <span className="text-accent">25%</span>
            </p>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* ————————————————— Categories ————————————————— */

function Categories() {
  return (
    <section id="categories" className="scroll-mt-24">
      <div className="shell py-14 sm:py-18 lg:py-20">
        <Reveal>
          <SectionHeader
            eyebrow="CATEGORIES"
            title="تصفح حسب التصنيف"
            link={{ href: "/shop", label: "كل المنتجات" }}
          />
        </Reveal>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
          {categories.map((c, i) => (
            <Reveal key={c.slug} delay={i * 50}>
              <Link
                href={categoryHref(c.slug)}
                className="group block overflow-hidden rounded-xl border border-mist bg-white transition-all duration-200 hover:border-steel hover:shadow-md hover:shadow-ink/5"
              >
                <div className="aspect-[4/3] overflow-hidden bg-cloud">
                  <SafeImg
                    src={c.img}
                    alt={c.nameAr}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.05]"
                  />
                </div>
                <div className="p-3">
                  <p className="text-[13px] font-semibold text-ink">{c.name}</p>
                  <p className="mt-0.5 text-[11px] text-steel">{c.nameAr}</p>
                </div>
              </Link>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ————————————————— Featured ————————————————— */

function Featured() {
  return (
    <section className="border-y border-mist bg-paper">
      <div className="shell py-14 sm:py-18 lg:py-20">
        <Reveal>
          <SectionHeader
            eyebrow="FEATURED"
            title="منتجات مميزة"
            link={{ href: "/shop", label: "عرض الكل" }}
          />
        </Reveal>
        <div className="grid grid-cols-2 gap-x-4 gap-y-10 sm:gap-x-6 lg:grid-cols-4">
          {featuredProducts.slice(0, 8).map((p, i) => (
            <Reveal key={p.id} delay={(i % 4) * 60}>
              <ProductCard product={p} />
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ————————————————— Best sellers ————————————————— */

function BestSellers() {
  return (
    <section>
      <div className="shell py-14 sm:py-18 lg:py-20">
        <Reveal>
          <SectionHeader
            eyebrow="BEST SELLERS"
            title="الأكثر طلباً"
            link={{ href: "/shop?sort=best-selling", label: "عرض الكل" }}
          />
        </Reveal>
        <div className="grid grid-cols-2 gap-x-4 gap-y-10 sm:gap-x-6 lg:grid-cols-4">
          {bestSellers.slice(0, 4).map((p, i) => (
            <Reveal key={p.id} delay={(i % 4) * 60}>
              <ProductCard product={p} />
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ————————————————— Gaming hub ————————————————— */

const GAMING_BANNER =
  "https://images.unsplash.com/photo-1592840496694-26d035b52b48?auto=format&fit=crop&w=1400&q=80";

function GamingHub() {
  return (
    <section className="relative overflow-hidden bg-night text-white">
      {/* Banner background */}
      <div className="absolute inset-0">
        <SafeImg
          src={GAMING_BANNER}
          alt=""
          className="h-full w-full object-cover opacity-[0.14]"
        />
        <div className="absolute inset-0 bg-gradient-to-l from-night via-night/85 to-night/40" />
      </div>

      <div className="shell relative py-14 sm:py-18 lg:py-20">
        <Reveal>
          <div className="flex flex-wrap items-end justify-between gap-6">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-cyan">
                QAVEN GAMING
              </p>
              <h2 className="mt-3 text-2xl font-semibold tracking-tight sm:text-3xl">
                مركز الألعاب — Level up your setup
              </h2>
              <p className="mt-3 max-w-lg text-sm leading-7 text-silver">
                سماعات، أذرع تحكم، لوحات مفاتيح ميكانيكية وفأرات احترافية — معدات
                مختارة بعناية للاعبين الجادين في عُمان.
              </p>
            </div>
            <Link
              href="/gaming"
              className="inline-flex h-12 items-center gap-2 rounded-lg bg-white px-7 text-sm font-medium text-ink transition-all duration-200 hover:bg-cyan hover:text-white active:scale-[0.98]"
            >
              Explore Gaming
              <ArrowLeft size={17} strokeWidth={1.75} />
            </Link>
          </div>
        </Reveal>

        {/* Subcategory tiles */}
        <div className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {gamingSubs.map((s, i) => (
            <Reveal key={s.slug} delay={i * 50}>
              <Link
                href={`/shop?cat=gaming&sub=${s.slug}`}
                className="group block overflow-hidden rounded-xl border border-white/10 bg-white/[0.04] transition-colors hover:border-cyan/60"
              >
                <div className="aspect-[4/3] overflow-hidden">
                  <SafeImg
                    src={s.img!}
                    alt={s.name}
                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 200px"
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.05]"
                  />
                </div>
                <p className="px-3 py-3 text-[12px] font-medium text-silver transition-colors group-hover:text-white">
                  {s.name}
                </p>
              </Link>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ————————————————— Why QAVEN ————————————————— */

const whyPoints = [
  {
    icon: Truck,
    title: "Fast Delivery in Oman",
    text: "توصيل مجاني لجميع المحافظات — والتوصيل السريع 24-48 ساعة عند الحاجة.",
  },
  {
    icon: ShieldCheck,
    title: "Secure Shopping",
    text: "دفع آمن عند الاستلام أو إلكترونياً، مع حماية كاملة لبياناتك.",
  },
  {
    icon: BadgeCheck,
    title: "Quality Products",
    text: "منتجات أصلية 100% بضمان الوكيل المعتمد في السلطنة.",
  },
  {
    icon: Headset,
    title: "Customer Support",
    text: "فريق حقيقي يجيب عبر واتساب والهاتف طوال أيام الأسبوع.",
  },
];

function WhyQaven() {
  return (
    <section className="border-y border-mist bg-paper">
      <div className="shell py-14 sm:py-18 lg:py-20">
        <Reveal>
          <SectionHeader eyebrow="WHY QAVEN" title="لماذا يتسوق العملاء من QAVEN؟" />
        </Reveal>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {whyPoints.map((point, i) => (
            <Reveal key={point.title} delay={i * 60}>
              <div className="h-full rounded-xl border border-mist bg-white p-5 transition-colors hover:border-steel">
                <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-paper text-accent ring-1 ring-mist">
                  <point.icon size={20} strokeWidth={1.6} />
                </span>
                <h3 className="mt-4 text-sm font-semibold text-ink">{point.title}</h3>
                <p className="mt-1.5 text-[13px] leading-6 text-steel">{point.text}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ————————————————— Latest arrivals ————————————————— */

function Latest() {
  return (
    <section>
      <div className="shell py-14 sm:py-18 lg:py-20">
        <Reveal>
          <SectionHeader
            eyebrow="LATEST ARRIVALS"
            title="وصل حديثاً"
            link={{ href: "/shop?sort=newest", label: "عرض الكل" }}
          />
        </Reveal>
        <div className="grid grid-cols-2 gap-x-4 gap-y-10 sm:gap-x-6 lg:grid-cols-4">
          {newArrivals.slice(0, 4).map((p, i) => (
            <Reveal key={p.id} delay={(i % 4) * 60}>
              <ProductCard product={p} />
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ————————————————— Social / Instagram ————————————————— */

const socialImgs = [
  "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=700&q=70",
  "https://images.unsplash.com/photo-1595225476474-87563907a212?auto=format&fit=crop&w=700&q=70",
  "https://images.unsplash.com/photo-1606144042614-b2417e99c4e3?auto=format&fit=crop&w=700&q=70",
  "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?auto=format&fit=crop&w=700&q=70",
  "https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?auto=format&fit=crop&w=700&q=70",
  "https://images.unsplash.com/photo-1599669454699-248893623440?auto=format&fit=crop&w=700&q=70",
];

function Social() {
  return (
    <section className="border-t border-mist bg-paper">
      <div className="shell py-14 sm:py-18">
        <Reveal>
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="eyebrow">@QAVEN.OM</p>
              <h2 className="mt-3 text-2xl font-semibold tracking-tight sm:text-3xl">
                تابعنا على إنستغرام
              </h2>
            </div>
            <a
              href="https://instagram.com"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 text-sm text-graphite transition-colors hover:text-ink"
            >
              <Instagram size={17} strokeWidth={1.6} />
              qaven.om
            </a>
          </div>
        </Reveal>

        <div className="mt-8 grid grid-cols-3 gap-2 sm:grid-cols-6">
          {socialImgs.map((src, i) => (
            <Reveal key={src} delay={i * 40}>
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noreferrer"
                className="group relative block overflow-hidden rounded-lg bg-cloud"
                aria-label="منشور إنستغرام"
              >
                <SafeImg
                  src={src}
                  alt="QAVEN على إنستغرام"
                  className="aspect-square w-full object-cover transition-transform duration-500 group-hover:scale-[1.06]"
                />
                <span className="absolute inset-0 flex items-center justify-center bg-ink/0 opacity-0 transition-all duration-200 group-hover:bg-ink/30 group-hover:opacity-100">
                  <Instagram size={20} className="text-white" />
                </span>
              </a>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
