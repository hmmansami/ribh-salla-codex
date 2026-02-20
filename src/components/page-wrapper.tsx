"use client";

import { useEffect, useRef, type ReactNode } from "react";

/**
 * Wraps page sections with staggered fade-in-up animations.
 * Uses IntersectionObserver for scroll-triggered reveals (Apple pattern).
 * Respects prefers-reduced-motion (Apple accessibility pattern).
 */
export function PageWrapper({ children, className = "" }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion) {
      el.querySelectorAll<HTMLElement>("[data-animate]").forEach((child) => {
        child.style.opacity = "1";
        child.style.transform = "none";
      });
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            (entry.target as HTMLElement).classList.add("animate-fade-in-up");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1, rootMargin: "0px 0px -40px 0px" }
    );

    el.querySelectorAll("[data-animate]").forEach((child, i) => {
      (child as HTMLElement).style.opacity = "0";
      (child as HTMLElement).classList.add(`delay-${Math.min(i, 7)}`);
      observer.observe(child);
    });

    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}

/**
 * Hero section with Stripe-style ambient gradient glow
 */
export function HeroSection({
  label,
  title,
  description,
}: {
  label: string;
  title: string;
  description: string;
}) {
  return (
    <section data-animate className="gradient-hero relative overflow-hidden rounded-2xl p-8 md:p-12">
      {/* Subtle top border glow (Stripe accent line) */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-400/40 to-transparent" />
      <div className="relative space-y-4">
        <p className="text-sm font-semibold uppercase tracking-[0.25em] text-cyan-400">{label}</p>
        <h1 className="text-3xl font-bold leading-[1.1] tracking-tight md:text-5xl lg:text-6xl">{title}</h1>
        <p className="max-w-3xl text-base leading-relaxed text-slate-400 md:text-lg">{description}</p>
      </div>
    </section>
  );
}
