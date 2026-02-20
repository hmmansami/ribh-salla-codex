"use client";

import { useEffect, useState } from "react";
import { useLocale } from "@/components/locale-provider";

type Journey = {
  id: string;
  name: string;
  trigger: string;
  status: "active" | "paused";
  channels: ("email" | "sms" | "whatsapp")[];
  conversionRate: number;
  revenueImpact: number;
};

const FALLBACK_STORE = "demo-salla-store";

import { PageWrapper, HeroSection } from "@/components/page-wrapper";
import { Play, Pause } from "lucide-react";

export default function JourneysPage() {
  const { locale } = useLocale();
  const isAr = locale === "ar";
  const [journeys, setJourneys] = useState<Journey[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const storeId = typeof window !== "undefined" ? window.localStorage.getItem("ribh_store_id") || FALLBACK_STORE : FALLBACK_STORE;

  async function loadJourneys() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/journeys?storeId=${encodeURIComponent(storeId)}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load journeys");
      setJourneys(data.journeys);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadJourneys();
  }, []);

  async function toggleJourney(id: string, enabled: boolean) {
    const res = await fetch(`/api/journeys/${id}/toggle`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ storeId, enabled })
    });

    if (res.ok) {
      await loadJourneys();
    }
  }

  return (
    <PageWrapper className="space-y-8">
      <HeroSection
        label={isAr ? "الرحلات الآلية" : "Automated Journeys"}
        title={isAr ? "تحكم في كل رحلة" : "Control every lifecycle journey"}
        description={isAr
          ? "تشغيل/إيقاف، قنوات التنفيذ، وقياس التحويل والإيراد."
          : "On/off state, channels, conversion, and revenue impact in one view."}
      />

      <section data-animate className="glass-card p-6">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-xl font-semibold tracking-tight text-white">
            {isAr ? "قائمة الرحلات" : "Journey List"}
          </h2>
        </div>

        {loading && <p className="text-slate-400">{isAr ? "جاري التحميل..." : "Loading..."}</p>}
        {error && <p className="text-red-400">{error}</p>}

        {!loading && !error && (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-2">
            {journeys.map((journey) => (
              <article key={journey.id} className="group relative overflow-hidden rounded-xl border border-white/5 bg-slate-900/50 p-6 transition-colors hover:border-cyan-500/30 hover:bg-slate-900/80">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-lg font-medium text-white group-hover:text-cyan-400 transition-colors">
                      {journey.name}
                    </h3>
                    <div className="mt-4 space-y-2 text-sm text-slate-400">
                      <p className="flex justify-between">
                        <span>{isAr ? "المحفز" : "Trigger"}</span>
                        <span className="text-slate-300">{journey.trigger}</span>
                      </p>
                      <p className="flex justify-between">
                        <span>{isAr ? "القنوات" : "Channels"}</span>
                        <span className="text-slate-300">{journey.channels.join(", ")}</span>
                      </p>
                      <p className="flex justify-between">
                        <span>{isAr ? "التحويل" : "Conversion"}</span>
                        <span className="text-cyan-400">{(journey.conversionRate * 100).toFixed(1)}%</span>
                      </p>
                      <p className="flex justify-between border-t border-white/5 pt-2 mt-2">
                        <span>{isAr ? "الأثر الإيرادي" : "Revenue Impact"}</span>
                        <span className="text-emerald-400 font-medium">
                          {journey.revenueImpact.toLocaleString()} SAR
                        </span>
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-6 flex justify-end">
                  <button
                    onClick={() => toggleJourney(journey.id, journey.status !== "active")}
                    className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all ${journey.status === "active"
                        ? "bg-slate-800 text-slate-300 hover:bg-slate-700"
                        : "bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500/20"
                      }`}
                  >
                    {journey.status === "active" ? (
                      <>
                        <Pause className="h-4 w-4" />
                        {isAr ? "إيقاف" : "Pause"}
                      </>
                    ) : (
                      <>
                        <Play className="h-4 w-4" />
                        {isAr ? "تشغيل" : "Activate"}
                      </>
                    )}
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </PageWrapper>
  );
}
