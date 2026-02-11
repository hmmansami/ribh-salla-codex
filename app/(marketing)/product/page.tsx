"use client";

import Link from "next/link";
import { useLocale } from "@/components/locale-provider";

export default function ProductPage() {
  const { locale } = useLocale();
  const isAr = locale === "ar";

  const modules = [
    {
      name: isAr ? "مركز الإطلاق" : "Launch Center",
      desc: isAr
        ? "ضغطة واحدة لتشغيل الربط، المزامنة، التحقق، وتفعيل الرحلات."
        : "One-click activation for connectors, sync, validation, and journey deployment."
    },
    {
      name: isAr ? "الرحلات" : "Journeys",
      desc: isAr
        ? "رحلات دورة حياة العميل مع تحكم يدوي كامل ووصفات جاهزة."
        : "Lifecycle journeys with full manual control and ready-made recipes."
    },
    {
      name: isAr ? "استوديو الذكاء" : "AI Studio",
      desc: isAr
        ? "توليد رسائل وقوالب مخصصة بالعربية والإنجليزية حسب القناة."
        : "Generate localized channel-specific messages and templates."
    },
    {
      name: isAr ? "التحليلات" : "Analytics",
      desc: isAr
        ? "عرض الإيراد المنسوب والإيراد التزايدي في نفس اللوحة."
        : "Attributed and incremental revenue side-by-side in one dashboard."
    },
    {
      name: isAr ? "الامتثال" : "Compliance",
      desc: isAr
        ? "قواعد الموافقة والهدوء الزمني وسياسات الإرسال حسب المنطقة."
        : "Consent, quiet-hours, and policy guardrails by region and channel."
    }
  ];

  return (
    <>
      <section className="hero">
        <h1>{isAr ? "المنتج" : "Product"}</h1>
        <p>
          {isAr
            ? "ربح يبني فوق سلة مباشرة ويجمع الأتمتة والتخصيص في نظام تشغيلي واحد."
            : "Ribh is built Salla-first, merging automation and AI personalization in one operating system."}
        </p>
        <Link href="/app/launch" className="primaryBtn">
          {isAr ? "ابدأ التشغيل الآن" : "Start Setup Now"}
        </Link>
      </section>

      <section className="sectionCard">
        <h2>{isAr ? "الوحدات الأساسية" : "Core modules"}</h2>
        <div className="cardsGrid two">
          {modules.map((module) => (
            <article key={module.name} className="card">
              <h3>{module.name}</h3>
              <p>{module.desc}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="sectionCard">
        <h2>{isAr ? "دمج الميزات بدون حذف" : "Feature merge without deletion"}</h2>
        <ul>
          <li>
            {isAr
              ? "القوالب الكثيرة محفوظة، لكن المدخل الأساسي هو مولد ذكاء اصطناعي بدلا من البحث اليدوي الطويل."
              : "Full template depth is preserved, but AI generation becomes the default entry point."}
          </li>
          <li>
            {isAr
              ? "الاستهداف المتقدم محفوظ، مع طبقة توصية ذكية موحدة فوقه."
              : "Advanced segmentation remains, with a unified recommendation layer on top."}
          </li>
          <li>
            {isAr
              ? "كل القنوات متاحة، مع محرك اختيار القناة الأفضل تلقائيا."
              : "All channels are available, with automated best-channel routing."}
          </li>
        </ul>
      </section>
    </>
  );
}
