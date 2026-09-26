import { notFound } from "next/navigation";
import Link from "next/link";

type Section = { h: string; p: string[] };

const policies: Record<string, { title: string; intro: string; sections: Section[] }> = {
  shipping: {
    title: "الشحن والتوصيل",
    intro: "نوصل إلى جميع محافظات سلطنة عُمان.",
    sections: [
      {
        h: "مدة التوصيل",
        p: [
          "توصيل عادي: 3 – 5 أيام عمل.",
          "توصيل سريع: خلال 24 – 48 ساعة داخل مسقط، و2 – 3 أيام لبقية المحافظات.",
        ],
      },
      {
        h: "التكلفة",
        p: [
          "التوصيل العادي مجاني لجميع الطلبات داخل سلطنة عُمان.",
          "التوصيل السريع (24 – 48 ساعة) برسوم ثابتة 2.500 ر.ع تظهر عند اختياره في إتمام الطلب.",
        ],
      },
      {
        h: "تتبع الطلب",
        p: [
          "عند شحن طلبك سنرسل لك رسالة نصية برقم الطلب لتتبعه.",
        ],
      },
    ],
  },
  returns: {
    title: "الإرجاع والاستبدال",
    intro: "إذا لم يكن المنتج كما توقعت، نرجّع لك قيمته.",
    sections: [
      {
        h: "المدة",
        p: ["لديك 7 أيام من تاريخ الاستلام لطلب الإرجاع أو الاستبدال."],
      },
      {
        h: "الشروط",
        p: [
          "يجب أن يكون المنتج بحالته الأصلية مع كامل الملحقات والتغليف.",
          "المنتجات المفتوحة من فئة السماعات داخل الأذن لا تُرجع لأسباب صحية.",
        ],
      },
      {
        h: "كيف تُرجع منتجاً",
        p: [
          "راسلنا من صفحة التواصل مع رقم طلبك وسنرتب استلام المنتج من عنوانك.",
        ],
      },
    ],
  },
  privacy: {
    title: "سياسة الخصوصية",
    intro: "نجمع أقل قدر ممكن من البيانات، ولا نشاركه مع أحد.",
    sections: [
      {
        h: "البيانات التي نجمعها",
        p: [
          "الاسم ورقم الهاتف والعنوان — فقط لإتمام التوصيل.",
          "البريد الإلكتروني اختياري، ويُستخدم لإشعارات الطلب فقط.",
        ],
      },
      {
        h: "ما لا نفعله",
        p: [
          "لا نبيع بياناتك ولا نشاركها مع أطراف خارجية لأغراض تسويقية.",
        ],
      },
    ],
  },
  terms: {
    title: "الشروط والأحكام",
    intro: "الأساس الذي يعمل به المتجر.",
    sections: [
      {
        h: "الأسعار",
        p: [
          "جميع الأسعار بالريال العُماني وتشمل الضرائب المطبقة.",
          "قد تتغير الأسعار، لكن طلبك المؤكد يبقى بسعره عند الشراء.",
        ],
      },
      {
        h: "الضمان",
        p: [
          "جميع المنتجات أصلية وتشمل ضمان الوكيل أو ضمان المتجر لمدة سنة.",
        ],
      },
      {
        h: "استخدام الموقع",
        p: [
          "يُمنع استخدام الموقع لأي غرض غير قانوني أو لمحاولة التلاعب بالطلبات.",
        ],
      },
    ],
  },
};

export function generateStaticParams() {
  return Object.keys(policies).map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return { title: policies[slug]?.title ?? "السياسات" };
}

export default async function PolicyPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const policy = policies[slug];
  if (!policy) notFound();

  return (
    <div className="shell max-w-3xl py-12 sm:py-16">
      <p className="eyebrow">POLICY</p>
      <h1 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">
        {policy.title}
      </h1>
      <p className="mt-3 text-sm leading-7 text-steel">{policy.intro}</p>

      <div className="mt-10 space-y-9">
        {policy.sections.map((s) => (
          <section key={s.h}>
            <h2 className="text-base font-semibold text-ink">{s.h}</h2>
            <div className="mt-2.5 space-y-2">
              {s.p.map((para, i) => (
                <p key={i} className="text-sm leading-7 text-steel">
                  {para}
                </p>
              ))}
            </div>
          </section>
        ))}
      </div>

      <div className="mt-12 border-t border-mist pt-6 text-sm text-steel">
        لديك سؤال عن هذه السياسة؟{" "}
        <Link href="/contact" className="text-ink underline-offset-4 hover:underline">
          تواصل معنا
        </Link>
      </div>
    </div>
  );
}
