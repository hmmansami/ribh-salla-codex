"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { LanguageToggle } from "@/components/language-toggle";
import { useLocale } from "@/components/locale-provider";

import {
  Rocket,
  Map as MapIcon,
  Sparkles,
  BarChart3,
  ShieldCheck,
  Users,
  Send,
  LayoutTemplate
} from "lucide-react";

export function AppShell({ children }: { children: ReactNode }) {
  const { locale, dict } = useLocale();
  const isAr = locale === "ar";

  const nav = [
    { href: "/app/launch", label: isAr ? "التهيئة" : "Launch", icon: Rocket },
    { href: "/app/audiences", label: isAr ? "الجمهور" : "Audiences", icon: Users },
    { href: "/app/campaigns", label: isAr ? "الحملات" : "Campaigns", icon: Send },
    { href: "/app/journeys", label: isAr ? "الرحلات" : "Journeys", icon: MapIcon },
    { href: "/app/forms", label: isAr ? "النماذج" : "Forms", icon: LayoutTemplate },
    { href: "/app/analytics", label: isAr ? "التحليلات" : "Analytics", icon: BarChart3 },
  ];

  return (
    <div className="flex min-h-screen flex-col selection:bg-cyan-500/30">
      <header className="sticky top-0 z-50 w-full border-b border-white/5 bg-slate-950/60 backdrop-blur-xl">
        <div className="container mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center gap-2 transition-opacity hover:opacity-80">
              <span className="text-xl font-bold tracking-tighter text-white">
                Ribh
              </span>
            </Link>
            <nav className="hidden md:flex md:items-center md:gap-6">
              {nav.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="flex items-center gap-2 text-sm font-medium text-slate-400 transition-colors hover:text-cyan-400"
                  >
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </div>
          <div className="flex items-center gap-4">
            <LanguageToggle />
            <div className="hidden sm:flex items-center gap-2 rounded-full border border-cyan-500/20 bg-cyan-500/10 px-3 py-1 text-xs font-medium text-cyan-400">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-cyan-400 opacity-75"></span>
                <span className="relative inline-flex h-2 w-2 rounded-full bg-cyan-500"></span>
              </span>
              {isAr ? "وضع سلة" : "Salla Mode"}
            </div>
          </div>
        </div>
      </header>
      <main className="flex-1 pb-24">
        {children}
      </main>
    </div>
  );
}
