"use client";

import { useLocale } from "@/components/locale-provider";

export default function PricingPage() {
  const { locale } = useLocale();
  const isAr = locale === "ar";

  const plans = [
    {
      name: isAr ? "Starter" : "Starter",
      price: isAr ? "349 ريال/شهر" : "$99/mo",
      features: isAr
        ? ["تفعيل قناة واحدة", "رحلات أساسية", "تقارير أسبوعية"]
        : ["Single channel", "baseline journeys", "weekly reports"]
    },
    {
      name: isAr ? "Growth" : "Growth",
      price: isAr ? "899 ريال/شهر" : "$299/mo",
      features: isAr
        ? ["SMS + WhatsApp + Email", "استوديو الذكاء", "تحليلات متقدمة"]
        : ["SMS + WhatsApp + Email", "AI studio", "advanced analytics"]
    },
    {
      name: isAr ? "Scale" : "Scale",
      price: isAr ? "مخصص" : "Custom",
      features: isAr
        ? ["حدود أعلى", "دعم فني مخصص", "قواعد امتثال متقدمة"]
        : ["Higher limits", "dedicated support", "advanced compliance controls"]
    }
  ];

  return (
    <>
      <section className="hero">
        <h1>{isAr ? "الأسعار" : "Pricing"}</h1>
        <p>
          {isAr
            ? "نموذج اشتراك + استخدام حتى تربط التكلفة مباشرة بنتيجة الإيراد."
            : "Tiered subscription + usage to align cost with measurable revenue output."}
        </p>
      </section>

      <section className="sectionCard">
        <h2>{isAr ? "الباقات" : "Plans"}</h2>
        <div className="cardsGrid">
          {plans.map((plan) => (
            <article key={plan.name} className="card">
              <h3>{plan.name}</h3>
              <p className="badgeSuccess">{plan.price}</p>
              <ul>
                {plan.features.map((feature) => (
                  <li key={feature}>{feature}</li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </section>
    </>
  );
}
