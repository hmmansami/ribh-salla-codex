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
    <>
      <section className="hero">
        <h1>{isAr ? "الرحلات" : "Journeys"}</h1>
        <p>
          {isAr
            ? "تحكم في كل رحلة: تشغيل/إيقاف، قنوات التنفيذ، وقياس التحويل والإيراد."
            : "Control every lifecycle journey: on/off state, channels, conversion, and revenue impact."}
        </p>
      </section>

      <section className="sectionCard">
        <h2>{isAr ? "قائمة الرحلات" : "Journey List"}</h2>
        {loading && <p>{isAr ? "جاري التحميل..." : "Loading..."}</p>}
        {error && <p className="badgeWarn">{error}</p>}
        {!loading && !error && (
          <div className="cardsGrid two">
            {journeys.map((journey) => (
              <article key={journey.id} className="card">
                <h3>{journey.name}</h3>
                <p>
                  {isAr ? "المحفز" : "Trigger"}: {journey.trigger}
                </p>
                <p>
                  {isAr ? "القنوات" : "Channels"}: {journey.channels.join(", ")}
                </p>
                <p>
                  {isAr ? "التحويل" : "Conversion"}: {(journey.conversionRate * 100).toFixed(1)}%
                </p>
                <p>
                  {isAr ? "الأثر الإيرادي" : "Revenue Impact"}: {journey.revenueImpact.toLocaleString()} SAR
                </p>
                <button
                  className={journey.status === "active" ? "secondary" : ""}
                  onClick={() => toggleJourney(journey.id, journey.status !== "active")}
                >
                  {journey.status === "active" ? (isAr ? "إيقاف" : "Pause") : isAr ? "تشغيل" : "Activate"}
                </button>
              </article>
            ))}
          </div>
        )}
      </section>
    </>
  );
}
