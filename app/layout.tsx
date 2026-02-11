import type { Metadata } from "next";
import type { ReactNode } from "react";
import { LocaleProvider } from "@/components/locale-provider";
import "./globals.css";

export const metadata: Metadata = {
  title: "Ribh - Salla-first Growth OS",
  description: "One-click growth platform for Salla stores with AI marketing automation"
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ar" dir="rtl">
      <body>
        <LocaleProvider>{children}</LocaleProvider>
      </body>
    </html>
  );
}
