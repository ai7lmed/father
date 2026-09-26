import Link from "next/link";
import { SafeImg } from "@/components/ui";
import { Reveal } from "@/components/motion";

export const metadata = { title: "من نحن" };

const stats = [
  { value: "+4,000", label: "طلب تم توصيله" },
  { value: "مجاني", label: "توصيل عادي لكل المحافظات" },
  { value: "%100", label: "منتجات أصلية بضمان" },
  { value: "4.9", label: "تقييم العملاء" },
];

const values = [
  {
    title: "اختيار بلا ضجيج",
    text: "لا نعرض كل شيء — نختار الأجهزة التي تستحق مكانها في إعدادك، ونشرح سبب اختيارها.",
  },
  {
    title: "أسعار واضحة",
    text: "السعر الذي تراه هو السعر الذي تدفعه — والتوصيل العادي مجاني لكل الطلبات.",
  },
  {
    title: "دعم يفهم التقنية",
    text: "فريقنا يستخدم نفس الأجهزة التي يبيعها — إجابات عملية، لا نصوص تسويقية.",
  },
];

export default function AboutPage() {
  return (
    <>
      <section className="border-b border-mist">
        <div className="shell grid items-center gap-12 py-16 sm:py-20 lg:grid-cols-2 lg:gap-16">
          <div>
            <p className="eyebrow">ABOUT QAVEN</p>
            <h1 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">
              التقنية، ببساطة أفضل.
            </h1>
            <p className="mt-5 max-w-md text-sm leading-7 text-steel">
              بدأ QAVEN من سؤال بسيط: لماذا يكون شراء جهاز جديد عملية مزعجة؟
              بنينا متجراً هادئاً يعرض ما يُختار بعناية، بأسعار واضحة، وتوصيل داخل
              سلطنة عُمان — بلا ضوضاء تسويقية.
            </p>
          </div>
          <div className="overflow-hidden rounded-2xl bg-cloud">
            <SafeImg
              src="https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&w=1200&q=80"
              alt="أجهزة QAVEN"
              className="aspect-[4/3.2] w-full object-cover"
            />
          </div>
        </div>
      </section>

      <section className="border-b border-mist bg-paper">
        <div className="shell grid grid-cols-2 gap-8 py-12 sm:grid-cols-4">
          {stats.map((s, i) => (
            <Reveal key={s.label} delay={i * 60}>
              <div>
                <p dir="ltr" className="text-2xl font-semibold tracking-tight text-ink text-start">
                  {s.value}
                </p>
                <p className="mt-1 text-sm text-steel">{s.label}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="shell py-16 sm:py-20">
        <Reveal>
          <p className="eyebrow">PRINCIPLES</p>
          <h2 className="mt-3 text-2xl font-semibold tracking-tight sm:text-3xl">
            كيف نعمل
          </h2>
        </Reveal>
        <div className="mt-10 grid gap-x-8 gap-y-10 sm:grid-cols-3">
          {values.map((v, i) => (
            <Reveal key={v.title} delay={i * 70}>
              <div>
                <span className="text-xs font-semibold tracking-[0.2em] text-steel">
                  0{i + 1}
                </span>
                <h3 className="mt-3 text-[15px] font-medium text-ink">{v.title}</h3>
                <p className="mt-2 text-sm leading-6 text-steel">{v.text}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="border-t border-mist bg-paper">
        <div className="shell flex flex-col items-center py-16 text-center sm:py-20">
          <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            جاهز لتحديث إعدادك؟
          </h2>
          <p className="mt-3 max-w-sm text-sm leading-7 text-steel">
            تصفح المتجر واختر ما يناسبك — والتوصيل علينا أن نرتبه.
          </p>
          <Link
            href="/shop"
            className="mt-8 inline-flex h-12 items-center rounded-lg bg-ink px-7 text-sm font-medium text-white transition-all duration-200 hover:bg-carbon active:scale-[0.98]"
          >
            تسوق الآن
          </Link>
        </div>
      </section>
    </>
  );
}
