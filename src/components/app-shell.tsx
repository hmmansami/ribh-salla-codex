"use client";

import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";
import { readStoredConnectorState } from "@/lib/connectors/client-state";
import type { ConnectorId } from "@/lib/types/domain";
import { LanguageToggle } from "@/components/language-toggle";
import { useLocale } from "@/components/locale-provider";

export function AppShell({ children }: { children: ReactNode }) {
  const { dict } = useLocale();
  const [connector, setConnector] = useState<ConnectorId>("salla");
  const [demoMode, setDemoMode] = useState(false);

  const nav = [
    { href: "/app/launch", label: dict.nav.launch },
    { href: "/app/journeys", label: dict.nav.journeys },
    { href: "/app/ai-studio", label: dict.nav.aiStudio },
    { href: "/app/analytics", label: dict.nav.analytics },
    { href: "/app/compliance", label: dict.nav.compliance }
  ];

  useEffect(() => {
    const syncFromStorage = () => {
      const stored = readStoredConnectorState();
      setConnector(stored.connector);
      setDemoMode(stored.demoMode);
    };

    syncFromStorage();
    window.addEventListener("storage", syncFromStorage);
    return () => window.removeEventListener("storage", syncFromStorage);
  }, []);

  const connectorLabel = connector === "klaviyo" ? dict.common.klaviyo : dict.common.salla;
  const modeLabel = demoMode ? dict.common.demoMode : dict.common.liveMode;

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
            <span className="pillTag">{`${connectorLabel} ${modeLabel}`}</span>
          </div>
        </div>
      </header>
      <main className="container content">{children}</main>
    </div>
  );
}
