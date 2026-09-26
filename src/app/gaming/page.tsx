import Link from "next/link";
import { ArrowLeft, Trophy, Users, Target } from "lucide-react";
import {
  gamingSubs,
  gamingProducts,
  featuredGear,
  gamingNewArrivals,
  topPicks,
  setupBundles,
  categoryHref,
} from "@/lib/products";
import { ProductCard } from "@/components/product-card";
import { SectionHeader } from "@/components/section-header";
import { SetupBundle } from "@/components/setup-bundle";
import { SafeImg } from "@/components/ui";
import { Reveal } from "@/components/motion";

export const metadata = { title: "QAVEN Gaming" };

const HERO =
  "https://images.unsplash.com/photo-1592840496694-26d035b52b48?auto=format&fit=crop&w=1600&q=80";

export default function GamingPage() {
  return (
    <>
      <GamingHero />
      <GamingCategories />
      <FeaturedGear />
      <Esports />
      <GamingNew />
      <TopPicks />
      <BuildSetup />
    </>
  );
}

/* ——— Hero ——— */
function GamingHero() {
  return (
    <section className="relative overflow-hidden bg-night text-white">
      <div className="absolute inset-0">
        <SafeImg src={HERO} alt="" className="h-full w-full object-cover opacity-25" />
        <div className="absolute inset-0 bg-gradient-to-l from-night via-night/80 to-night/55" />
      </div>

      <div className="shell relative py-16 sm:py-20 lg:py-24">
        <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-cyan">
          QAVEN GAMING
        </p>
        <h1 className="mt-4 max-w-xl text-4xl font-semibold leading-[1.15] tracking-tight sm:text-5xl">
          Level up your setup.
        </h1>
        <p className="mt-5 max-w-lg text-sm leading-8 text-silver sm:text-[15px]">
          معدات مختارة بعناية للاعبين الجادين — سماعات، أذرع تحكم، لوحات ميكانيكية
          وفأرات احترافية. أصلية بضمان الوكيل، وتوصيل داخل عُمان.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href={categoryHref("gaming")}
            className="inline-flex h-12 items-center gap-2 rounded-lg bg-white px-7 text-sm font-medium text-ink transition-all duration-200 hover:bg-cyan hover:text-white active:scale-[0.98]"
          >
            تسوق كل المعدات
            <ArrowLeft size={17} strokeWidth={1.75} />
          </Link>
          <a
            href="#setup"
            className="inline-flex h-12 items-center rounded-lg border border-white/20 px-7 text-sm font-medium text-white transition-colors hover:border-cyan hover:text-cyan"
          >
            Build your setup
          </a>
        </div>
      </div>
    </section>
  );
}

/* ——— Subcategories ——— */
function GamingCategories() {
  return (
    <section className="border-b border-white/5 bg-ink text-white">
      <div className="shell py-14 sm:py-16">
        <Reveal>
          <SectionHeader eyebrow="CATEGORIES" title="Gaming Categories" dark />
        </Reveal>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {gamingSubs.map((s, i) => (
            <Reveal key={s.slug} delay={i * 50}>
              <Link
                href={categoryHref("gaming") + `&sub=${s.slug}`}
                className="group block scroll-mt-36 overflow-hidden rounded-xl border border-white/10 bg-white/[0.03] transition-colors hover:border-cyan/60"
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

/* ——— Featured gear ——— */
function FeaturedGear() {
  return (
    <section className="bg-ink text-white">
      <div className="shell py-14 sm:py-16">
        <Reveal>
          <SectionHeader
            eyebrow="FEATURED GEAR"
            title="معدات مميزة"
            link={{ href: categoryHref("gaming"), label: "عرض الكل" }}
            dark
          />
        </Reveal>
        <div className="grid grid-cols-2 gap-x-4 gap-y-10 sm:gap-x-6 lg:grid-cols-4">
          {featuredGear.slice(0, 4).map((p, i) => (
            <Reveal key={p.id} delay={(i % 4) * 60}>
              <ProductCard product={p} dark priority={i === 0} />
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ——— Esports band ——— */
function Esports() {
  const points = [
    { icon: Trophy, title: "QAVEN Tournaments", text: "بطولات دورية داخل عُمان بجوائز معدات." },
    { icon: Users, title: "Sponsored Teams", text: "دعم الفرق واللاعبين المحليين." },
    { icon: Target, title: "Pro Approved", text: "المعدات نفسها التي نوصي بها للاعبين." },
  ];

  return (
    <section className="border-y border-white/5 bg-night text-white">
      <div className="shell py-14 sm:py-16">
        <Reveal>
          <div>
            <p className="eyebrow text-cyan">QAVEN ESPORTS</p>
            <h2 className="mt-3 text-2xl font-semibold tracking-tight sm:text-3xl">
              نبني مشهد الألعاب في عُمان
            </h2>
          </div>
        </Reveal>
        <div className="mt-9 grid gap-4 sm:grid-cols-3">
          {points.map((pt, i) => (
            <Reveal key={pt.title} delay={i * 60}>
              <div className="h-full rounded-xl border border-white/10 bg-white/[0.03] p-5 transition-colors hover:border-cyan/50">
                <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-ink text-cyan">
                  <pt.icon size={20} strokeWidth={1.6} />
                </span>
                <h3 className="mt-4 text-sm font-semibold">{pt.title}</h3>
                <p className="mt-1.5 text-[13px] leading-6 text-silver">{pt.text}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ——— New arrivals ——— */
function GamingNew() {
  return (
    <section className="bg-ink text-white">
      <div className="shell py-14 sm:py-16">
        <Reveal>
          <SectionHeader eyebrow="NEW ARRIVALS" title="وصل حديثاً" dark />
        </Reveal>
        <div className="grid grid-cols-2 gap-x-4 gap-y-10 sm:gap-x-6 lg:grid-cols-4">
          {(gamingNewArrivals.length > 0 ? gamingNewArrivals : gamingProducts.filter((p) => p.badge))
            .slice(0, 4)
            .map((p, i) => (
              <Reveal key={p.id} delay={(i % 4) * 60}>
                <ProductCard product={p} dark />
              </Reveal>
            ))}
        </div>
      </div>
    </section>
  );
}

/* ——— Top picks ——— */
function TopPicks() {
  return (
    <section className="border-t border-white/5 bg-ink text-white">
      <div className="shell py-14 sm:py-16">
        <Reveal>
          <SectionHeader eyebrow="TOP PICKS" title="اختيارات الفريق" dark />
        </Reveal>
        <div className="grid grid-cols-2 gap-x-4 gap-y-10 sm:gap-x-6 lg:grid-cols-4">
          {topPicks.map((p, i) => (
            <Reveal key={p.id} delay={(i % 4) * 60}>
              <div className="relative">
                <span
                  className="pointer-events-none absolute -top-4 end-3 z-10 text-5xl font-bold text-white/[0.07]"
                  aria-hidden
                >
                  {i + 1}
                </span>
                <ProductCard product={p} dark />
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ——— Build your setup ——— */
function BuildSetup() {
  return (
    <section id="setup" className="scroll-mt-24 border-t border-white/5 bg-night text-white">
      <div className="shell py-14 sm:py-16">
        <Reveal>
          <SectionHeader
            eyebrow="BUILD YOUR SETUP"
            title="ابنِ إعدادك كاملاً"
            dark
          />
        </Reveal>
        <div className="grid gap-5 lg:grid-cols-3">
          {setupBundles.map((b, i) => (
            <Reveal key={b.id} delay={i * 70}>
              <SetupBundle id={b.id} name={b.name} items={b.items} />
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
