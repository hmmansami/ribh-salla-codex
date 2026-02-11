"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { LanguageToggle } from "@/components/language-toggle";
import { useLocale } from "@/components/locale-provider";

export function MarketingShell({ children }: { children: ReactNode }) {
  const { locale, dict } = useLocale();

  const nav = [
    { href: "/", label: dict.nav.home },
    { href: "/product", label: dict.nav.product },
    { href: "/solutions", label: dict.nav.solutions },
    { href: "/pricing", label: dict.nav.pricing },
    { href: "/about", label: dict.nav.about }
  ];

  return (
    <div className="page">
      <header className="siteHeader">
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
            <Link href="/app/launch" className="primaryBtn">
              {dict.nav.start}
            </Link>
          </div>
        </div>
      </header>
      <main className="container content">{children}</main>
      <footer className="siteFooter">
        <div className="container footerInner">
          <p>
            {locale === "ar"
              ? "ربح: منصة تسويق مؤتمتة ومخصصة للمتاجر العربية"
              : "Ribh: automated and personalized growth platform for commerce"}
          </p>
        </div>
      </footer>
    </div>
  );
}
