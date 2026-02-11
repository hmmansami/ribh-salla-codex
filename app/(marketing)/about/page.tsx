"use client";

import { useLocale } from "@/components/locale-provider";

export default function AboutPage() {
  const { locale } = useLocale();
  const isAr = locale === "ar";

  return (
    <>
      <section className="hero">
        <h1>{isAr ? "من نحن" : "About"}</h1>
        <p>
          {isAr
            ? "نساعد متاجر سلة على التحول من حملات متفرقة إلى نظام نمو مؤتمت يعمل بشكل يومي."
            : "We help Salla stores move from fragmented campaigns to an always-on automated growth system."}
        </p>
      </section>

      <section className="sectionCard">
        <h2>{isAr ? "تواصل" : "Contact"}</h2>
        <p>{isAr ? "البريد: team@ribh.ai" : "Email: team@ribh.ai"}</p>
        <p>{isAr ? "واتساب أعمال: +966000000000" : "WhatsApp Business: +966000000000"}</p>
      </section>
    </>
  );
}
