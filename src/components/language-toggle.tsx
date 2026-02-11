"use client";

import { useLocale } from "@/components/locale-provider";

export function LanguageToggle() {
  const { locale, setLocale, dict } = useLocale();

  return (
    <div className="langToggle" aria-label={dict.common.language}>
      <button
        type="button"
        className={locale === "ar" ? "active" : ""}
        onClick={() => setLocale("ar")}
      >
        {dict.common.arabic}
      </button>
      <button
        type="button"
        className={locale === "en" ? "active" : ""}
        onClick={() => setLocale("en")}
      >
        {dict.common.english}
      </button>
    </div>
  );
}
