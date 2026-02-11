"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode
} from "react";
import { getDictionary, normalizeLocale, type Locale } from "@/lib/i18n";

const LOCALE_STORAGE_KEY = "ribh_locale";

type LocaleContextValue = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  dir: "rtl" | "ltr";
  dict: ReturnType<typeof getDictionary>;
};

const LocaleContext = createContext<LocaleContextValue | null>(null);

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("ar");

  useEffect(() => {
    const stored = typeof window !== "undefined" ? window.localStorage.getItem(LOCALE_STORAGE_KEY) : null;
    const normalized = normalizeLocale(stored);
    setLocaleState(normalized);
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(LOCALE_STORAGE_KEY, locale);
    }
    document.documentElement.lang = locale;
    document.documentElement.dir = locale === "ar" ? "rtl" : "ltr";
  }, [locale]);

  const value = useMemo<LocaleContextValue>(
    () => ({
      locale,
      setLocale: setLocaleState,
      dir: locale === "ar" ? "rtl" : "ltr",
      dict: getDictionary(locale)
    }),
    [locale]
  );

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useLocale() {
  const value = useContext(LocaleContext);
  if (!value) {
    throw new Error("useLocale must be used inside LocaleProvider");
  }
  return value;
}
