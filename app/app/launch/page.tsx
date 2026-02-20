"use client";

import { useEffect, useState } from "react";
import {
  DEFAULT_CONNECTOR_EXTERNAL_IDS,
  resolveConnectorContext
} from "@/lib/connectors/context";
import {
  readStoredConnectorState,
  writeStoredConnectorState
} from "@/lib/connectors/client-state";
import type { ConnectorId } from "@/lib/types/domain";
import { useLocale } from "@/components/locale-provider";

type SyncResponse = {
  connector?: ConnectorId;
  storeId?: string;
  accountId?: string;
  summary: Record<string, number>;
  checkpoint: string;
  context?: {
    connector: ConnectorId;
    externalId: string;
    demoMode: boolean;
  };
};

type LaunchResponse = {
  runId: string;
  storeId: string;
  execution: {
    connector: ConnectorId;
    externalId: string;
    demoMode: boolean;
  };
  stages: {
    id: string;
    label: string;
    status: "completed" | "running" | "failed";
  }[];
  activatedJourneys: { id: string; name: string; status: string }[];
};

function connectorPayload(connector: ConnectorId, externalId: string) {
  if (connector === "klaviyo") {
    return {
      connector,
      accountId: externalId
    };
  }

  return {
    connector,
    storeId: externalId
  };
}

export default function LaunchPage() {
  const { locale, dict } = useLocale();
  const isAr = locale === "ar";

  const [connector, setConnector] = useState<ConnectorId>("salla");
  const [externalId, setExternalId] = useState(DEFAULT_CONNECTOR_EXTERNAL_IDS.salla);
  const [demoMode, setDemoMode] = useState(false);
  const [installLog, setInstallLog] = useState<string>(
    isAr ? "لم يبدأ الربط بعد." : "Install not started."
  );
  const [syncData, setSyncData] = useState<SyncResponse | null>(null);
  const [launchData, setLaunchData] = useState<LaunchResponse | null>(null);
  const [loading, setLoading] = useState<"idle" | "install" | "sync" | "launch">("idle");

  useEffect(() => {
    const stored = readStoredConnectorState();

    const params = new URLSearchParams(window.location.search);
    const queryConnector = params.get("connector") as ConnectorId | null;
    const queryStoreId = params.get("storeId");
    const queryAccountId = params.get("accountId");
    const mode = params.get("mode");
    const inferredQueryConnector =
      queryConnector ??
      (queryAccountId ? "klaviyo" : queryStoreId ? "salla" : stored.connector);

    const resolved = resolveConnectorContext({
      connector: inferredQueryConnector,
      storeId: queryStoreId ?? undefined,
      accountId: queryAccountId ?? undefined
    });

    const hasQueryIdentity = Boolean(queryStoreId || queryAccountId || queryConnector);

    const nextConnector = hasQueryIdentity ? resolved.connector : stored.connector;
    const nextExternalId = hasQueryIdentity ? resolved.externalId : stored.externalId;
    const nextDemoMode =
      mode === "demo" ? true : mode === "live" ? false : stored.demoMode;

    setConnector(nextConnector);
    setExternalId(nextExternalId);
    setDemoMode(nextDemoMode);

    writeStoredConnectorState({
      connector: nextConnector,
      externalId: nextExternalId,
      demoMode: nextDemoMode
    });
  }, []);

  useEffect(() => {
    setInstallLog(isAr ? "لم يبدأ الربط بعد." : "Install not started.");
  }, [isAr]);

  const connectorLabel = connector === "klaviyo" ? dict.common.klaviyo : dict.common.salla;

  const scopeLabel = connector === "klaviyo" ? dict.common.accountId : dict.common.storeId;

  async function startInstall() {
    setLoading("install");
    try {
      const endpoint =
        connector === "klaviyo"
          ? `/api/klaviyo/install?accountId=${encodeURIComponent(externalId)}`
          : `/api/salla/install?storeId=${encodeURIComponent(externalId)}`;

      const res = await fetch(endpoint);
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Install failed");
      }

      const resolvedExternalId = data.accountId ?? data.storeId ?? externalId;
      const nextDemoMode =
        connector === "klaviyo" ? Boolean(data.demoMode ?? data.message?.includes("fallback")) : false;

      setExternalId(resolvedExternalId);
      setDemoMode(nextDemoMode);
      setInstallLog(data.message || (isAr ? "تم توليد رابط الربط." : "Install URL generated."));

      writeStoredConnectorState({
        connector,
        externalId: resolvedExternalId,
        demoMode: nextDemoMode
      });

      if (data.redirectUrl) {
        window.open(data.redirectUrl, "_blank", "noopener,noreferrer");
      }
    } catch (error) {
      setInstallLog(error instanceof Error ? error.message : "Install error");
    } finally {
      setLoading("idle");
    }
  }

  async function runSync() {
    setLoading("sync");
    try {
      const res = await fetch("/api/sync/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...connectorPayload(connector, externalId),
          entities: ["customers", "orders", "products"]
        })
      });
      const data = (await res.json()) as SyncResponse;
      if (!res.ok) {
        throw new Error((data as { error?: string }).error || "Sync failed");
      }

      const resolvedConnector = data.context?.connector ?? data.connector ?? connector;
      const resolvedExternalId =
        data.context?.externalId ?? data.accountId ?? data.storeId ?? externalId;
      const nextDemoMode = data.context?.demoMode ?? demoMode;

      setSyncData(data);
      setConnector(resolvedConnector);
      setExternalId(resolvedExternalId);
      setDemoMode(nextDemoMode);

      writeStoredConnectorState({
        connector: resolvedConnector,
        externalId: resolvedExternalId,
        demoMode: nextDemoMode
      });
    } catch (error) {
      setInstallLog(error instanceof Error ? error.message : "Sync error");
    } finally {
      setLoading("idle");
    }
  }

  async function runLaunch() {
    setLoading("launch");
    try {
      const res = await fetch("/api/launch/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...connectorPayload(connector, externalId),
          channels: ["email", "sms", "whatsapp"],
          locale,
          guardrails: {
            quietHours: "23:00-08:00",
            frequencyCapPerDay: 2
          }
        })
      });
      const data = (await res.json()) as LaunchResponse;
      if (!res.ok) {
        throw new Error((data as { error?: string }).error || "Launch failed");
      }

      const resolvedConnector = data.execution.connector ?? connector;
      const resolvedExternalId = data.execution.externalId ?? data.storeId ?? externalId;
      const nextDemoMode = data.execution.demoMode;

      setLaunchData(data);
      setConnector(resolvedConnector);
      setExternalId(resolvedExternalId);
      setDemoMode(nextDemoMode);

      writeStoredConnectorState({
        connector: resolvedConnector,
        externalId: resolvedExternalId,
        demoMode: nextDemoMode
      });
    } catch (error) {
      setInstallLog(error instanceof Error ? error.message : "Launch error");
    } finally {
      setLoading("idle");
    }
  }

  function handleConnectorChange(nextConnector: ConnectorId) {
    const currentStored = readStoredConnectorState();
    const nextExternalId =
      nextConnector === currentStored.connector
        ? currentStored.externalId
        : DEFAULT_CONNECTOR_EXTERNAL_IDS[nextConnector];
    const nextDemoMode = nextConnector === "klaviyo";

    setConnector(nextConnector);
    setExternalId(nextExternalId);
    setDemoMode(nextDemoMode);
    setSyncData(null);
    setLaunchData(null);

    writeStoredConnectorState({
      connector: nextConnector,
      externalId: nextExternalId,
      demoMode: nextDemoMode
    });
  }

  return (
    <>
      <section className="hero">
        <h1>{isAr ? "مركز الإطلاق بضغطة واحدة" : "One-Click Launch Center"}</h1>
        <p>
          {isAr
            ? "اختر الموصل، نفّذ الربط، مزامنة البيانات، ثم فعّل رحلات Core 3 في نفس المسار."
            : "Pick a connector, run install, sync data, and activate Core 3 lifecycle journeys in one flow."}
        </p>
        <div className="row" style={{ marginTop: 10 }}>
          <span className="pillTag">{`${dict.common.connector}: ${connectorLabel}`}</span>
          {connector === "klaviyo" && (
            <span className="pillTag">
              {demoMode
                ? `${dict.common.klaviyo} ${dict.common.demoMode}`
                : `${dict.common.klaviyo} ${dict.common.liveMode}`}
            </span>
          )}
        </div>
      </section>

      <section className="sectionCard">
        <h2>{isAr ? "التهيئة" : "Setup"}</h2>
        <div className="formGrid">
          <label>
            {dict.common.connector}
            <select
              className="input"
              value={connector}
              onChange={(e) => handleConnectorChange(e.target.value as ConnectorId)}
            >
              <option value="salla">{dict.common.salla}</option>
              <option value="klaviyo">{dict.common.klaviyo}</option>
            </select>
          </label>
          <label>
            {scopeLabel}
            <input
              className="input"
              value={externalId}
              onChange={(e) => setExternalId(e.target.value)}
            />
          </label>
        </div>
        <div className="row" style={{ marginTop: 12 }}>
          <button onClick={startInstall} disabled={loading !== "idle"}>
            {loading === "install"
              ? isAr
                ? "جاري الربط..."
                : "Connecting..."
              : connector === "klaviyo"
                ? isAr
                  ? "بدء ربط كلافيو"
                  : "Start Klaviyo Install"
                : isAr
                  ? "بدء ربط سلة"
                  : "Start Salla Install"}
          </button>
          <button className="secondary" onClick={runSync} disabled={loading !== "idle"}>
            {loading === "sync" ? (isAr ? "جاري المزامنة..." : "Syncing...") : isAr ? "مزامنة البيانات" : "Sync Core Data"}
          </button>
          <button onClick={runLaunch} disabled={loading !== "idle"}>
            {loading === "launch" ? (isAr ? "جاري التشغيل..." : "Launching...") : isAr ? "تشغيل المحرك" : "Run One-Click Engine"}
          </button>
        </div>
        <div className="logBlock" style={{ marginTop: 12 }}>{installLog}</div>
      </section>

      {syncData && (
        <section className="sectionCard">
          <h2>{isAr ? "نتيجة المزامنة" : "Sync Result"}</h2>
          <p>
            {dict.common.connector}: <strong>{connector === "klaviyo" ? dict.common.klaviyo : dict.common.salla}</strong>
          </p>
          <p>
            {scopeLabel}: <strong>{syncData.context?.externalId ?? syncData.accountId ?? syncData.storeId ?? externalId}</strong>
          </p>
          <p>
            {isAr ? "نقطة التحقق" : "Checkpoint"}: <strong>{syncData.checkpoint}</strong>
          </p>
          <div className="cardsGrid two">
            {Object.entries(syncData.summary).map(([entity, count]) => (
              <article key={entity} className="card">
                <h3>{entity}</h3>
                <p className="badgeSuccess">{count}</p>
              </article>
            ))}
          </div>
        </section>
      )}

      {launchData && (
        <section className="sectionCard">
          <h2>{isAr ? "نتيجة التشغيل" : "Launch Result"}</h2>
          <p>
            {isAr ? "معرف التشغيل" : "Run ID"}: <strong>{launchData.runId}</strong>
          </p>
          <p>
            {dict.common.connector}: <strong>{launchData.execution.connector === "klaviyo" ? dict.common.klaviyo : dict.common.salla}</strong>
          </p>
          <p>
            {launchData.execution.connector === "klaviyo" ? dict.common.accountId : dict.common.storeId}: <strong>{launchData.execution.externalId}</strong>
          </p>
          {launchData.execution.connector === "klaviyo" && (
            <p>
              {isAr ? "وضع الربط" : "Install Mode"}: {launchData.execution.demoMode ? dict.common.demoMode : dict.common.liveMode}
            </p>
          )}
          <h3>{isAr ? "المراحل" : "Stages"}</h3>
          <ol className="steps">
            {launchData.stages.map((stage) => (
              <li key={stage.id}>
                <strong>{stage.label}</strong> - {stage.status}
              </li>
            ))}
          </ol>
          <h3 style={{ marginTop: 14 }}>{isAr ? "الرحلات المفعلة" : "Activated Journeys"}</h3>
          <div className="cardsGrid two">
            {launchData.activatedJourneys.map((journey) => (
              <article key={journey.id} className="card">
                <h3>{journey.name}</h3>
                <p>{journey.status}</p>
              </article>
            ))}
          </div>
        </section>
      )}
    </>
  );
}
