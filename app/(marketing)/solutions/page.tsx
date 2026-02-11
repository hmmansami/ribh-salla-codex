"use client";

import { useLocale } from "@/components/locale-provider";

export default function SolutionsPage() {
  const { locale } = useLocale();
  const isAr = locale === "ar";

  const cases = [
    {
      title: isAr ? "متاجر DTC سريعة النمو" : "Fast-growing DTC stores",
      points: isAr
        ? ["تشغيل سريع", "رحلات جاهزة", "تقارير إيراد يومية"]
        : ["Fast launch", "ready journeys", "daily revenue intelligence"]
    },
    {
      title: isAr ? "فرق تسويق صغيرة" : "Lean marketing teams",
      points: isAr
        ? ["تقليل التشغيل اليدوي", "توليد محتوى تلقائي", "تحكم مركزي"]
        : ["Lower manual ops", "AI content generation", "centralized control"]
    },
    {
      title: isAr ? "علامات تحتاج امتثال قوي" : "Compliance-sensitive brands",
      points: isAr
        ? ["سجل موافقات", "حواجز إرسال", "تحقق قبل التنفيذ"]
        : ["Consent ledger", "send guardrails", "pre-send validation"]
    }
  ];

  return (
    <>
      <section className="hero">
        <h1>{isAr ? "الحلول" : "Solutions"}</h1>
        <p>
          {isAr
            ? "حلول مصممة لمتاجر سلة أولا، مع جاهزية للتوسع إلى Shopify لاحقا."
            : "Solutions designed Salla-first with a clear path to Shopify expansion."}
        </p>
      </section>

      <section className="sectionCard">
        <h2>{isAr ? "سيناريوهات النجاح" : "Success scenarios"}</h2>
        <div className="cardsGrid">
          {cases.map((solution) => (
            <article key={solution.title} className="card">
              <h3>{solution.title}</h3>
              <ul>
                {solution.points.map((point) => (
                  <li key={point}>{point}</li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </section>
    </>
  );
}
