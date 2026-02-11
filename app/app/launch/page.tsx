"use client";

import { useState } from "react";
import { useLocale } from "@/components/locale-provider";

type SyncResponse = {
  storeId: string;
  summary: Record<string, number>;
  checkpoint: string;
};

type LaunchResponse = {
  runId: string;
  storeId: string;
  stages: { id: string; label: string; status: "completed" | "running" | "failed" }[];
  activatedJourneys: { id: string; name: string; status: string }[];
};

const DEFAULT_STORE_ID = "demo-salla-store";

export default function LaunchPage() {
  const { locale } = useLocale();
  const isAr = locale === "ar";

  const [storeId, setStoreId] = useState(DEFAULT_STORE_ID);
  const [installLog, setInstallLog] = useState<string>(isAr ? "لم يبدأ الربط بعد." : "Install not started.");
  const [syncData, setSyncData] = useState<SyncResponse | null>(null);
  const [launchData, setLaunchData] = useState<LaunchResponse | null>(null);
  const [loading, setLoading] = useState<"idle" | "install" | "sync" | "launch">("idle");

  async function startInstall() {
    setLoading("install");
    try {
      const res = await fetch(`/api/salla/install?storeId=${encodeURIComponent(storeId)}`);
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Install failed");
      }
      setInstallLog(data.message || (isAr ? "تم توليد رابط الربط." : "Install URL generated."));
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
        body: JSON.stringify({ storeId, entities: ["customers", "orders", "products"] })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Sync failed");
      }
      setSyncData(data);
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
          storeId,
          channels: ["email", "sms", "whatsapp"],
          locale,
          guardrails: {
            quietHours: "23:00-08:00",
            frequencyCapPerDay: 2
          }
        })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Launch failed");
      }
      setLaunchData(data);
      window.localStorage.setItem("ribh_store_id", data.storeId);
    } catch (error) {
      setInstallLog(error instanceof Error ? error.message : "Launch error");
    } finally {
      setLoading("idle");
    }
  }

  return (
    <>
      <section className="hero">
        <h1>{isAr ? "مركز الإطلاق بضغطة واحدة" : "One-Click Launch Center"}</h1>
        <p>
          {isAr
            ? "هذا المسار يشغل الربط مع سلة، يزامن البيانات، ثم يفعّل الرحلات الأساسية فورا."
            : "This flow handles Salla install, data sync, and instant lifecycle journey activation."}
        </p>
      </section>

      <section className="sectionCard">
        <h2>{isAr ? "التهيئة" : "Setup"}</h2>
        <div className="formGrid">
          <label>
            {isAr ? "معرف المتجر" : "Store ID"}
            <input className="input" value={storeId} onChange={(e) => setStoreId(e.target.value)} />
          </label>
        </div>
        <div className="row" style={{ marginTop: 12 }}>
          <button onClick={startInstall} disabled={loading !== "idle"}>
            {loading === "install" ? (isAr ? "جاري الربط..." : "Connecting...") : isAr ? "بدء ربط سلة" : "Start Salla Install"}
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
