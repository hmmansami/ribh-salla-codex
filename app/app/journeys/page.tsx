"use client";

import { useCallback, useEffect, useState } from "react";
import {
  readStoredConnectorState,
  writeStoredConnectorState
} from "@/lib/connectors/client-state";
import type { ConnectorId } from "@/lib/types/domain";
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

function connectorIdentity(connector: ConnectorId, externalId: string) {
  if (connector === "klaviyo") {
    return {
      accountId: externalId,
      connector
    };
  }

  return {
    storeId: externalId,
    connector
  };
}

export default function JourneysPage() {
  const { locale, dict } = useLocale();
  const isAr = locale === "ar";
  const [connector, setConnector] = useState<ConnectorId>("salla");
  const [externalId, setExternalId] = useState("demo-salla-store");
  const [journeys, setJourneys] = useState<Journey[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const stored = readStoredConnectorState();
    setConnector(stored.connector);
    setExternalId(stored.externalId);
  }, []);

  const loadJourneys = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const query =
        connector === "klaviyo"
          ? `connector=klaviyo&accountId=${encodeURIComponent(externalId)}`
          : `connector=salla&storeId=${encodeURIComponent(externalId)}`;

      const res = await fetch(`/api/journeys?${query}`);
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to load journeys");
      }

      const resolvedConnector = (data.connector ?? connector) as ConnectorId;
      const resolvedExternalId = data.accountId ?? data.storeId ?? externalId;

      setConnector(resolvedConnector);
      setExternalId(resolvedExternalId);
      setJourneys(data.journeys);
      writeStoredConnectorState({
        connector: resolvedConnector,
        externalId: resolvedExternalId,
        demoMode: readStoredConnectorState().demoMode
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, [connector, externalId]);

  useEffect(() => {
    void loadJourneys();
  }, [loadJourneys]);

  async function toggleJourney(id: string, enabled: boolean) {
    const res = await fetch(`/api/journeys/${id}/toggle`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...connectorIdentity(connector, externalId),
        enabled
      })
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
            ? "تحكم في كل رحلة: تشغيل/إيقاف، القنوات، وأثر التحويل والإيراد عبر سلة أو كلافيو."
            : "Control every lifecycle journey: on/off state, channels, conversion, and revenue impact for Salla or Klaviyo."}
        </p>
        <div className="row" style={{ marginTop: 10 }}>
          <span className="pillTag">{`${dict.common.connector}: ${connector === "klaviyo" ? dict.common.klaviyo : dict.common.salla}`}</span>
          <span className="pillTag">{`${connector === "klaviyo" ? dict.common.accountId : dict.common.storeId}: ${externalId}`}</span>
        </div>
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
