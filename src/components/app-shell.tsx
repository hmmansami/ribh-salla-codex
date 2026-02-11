"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { LanguageToggle } from "@/components/language-toggle";
import { useLocale } from "@/components/locale-provider";

export function AppShell({ children }: { children: ReactNode }) {
  const { locale, dict } = useLocale();

  const nav = [
    { href: "/app/launch", label: dict.nav.launch },
    { href: "/app/journeys", label: dict.nav.journeys },
    { href: "/app/ai-studio", label: dict.nav.aiStudio },
    { href: "/app/analytics", label: dict.nav.analytics },
    { href: "/app/compliance", label: dict.nav.compliance }
  ];

  return (
    <div className="page">
      <header className="siteHeader appHeader">
        <div className="container headerInner">
          <Link href="/" className="brand">
            {dict.appName}
          </Link>
          <nav className="navLinks">
            {nav.map((item) => (
              <Link key={item.href} href={item.href}>
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="headerActions">
            <LanguageToggle />
            <span className="pillTag">{locale === "ar" ? "وضع سلة" : "Salla Mode"}</span>
          </div>
        </div>
      </header>
      <main className="container content">{children}</main>
    </div>
  );
}
