"use client";

import { useEffect, useState } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  BarChart,
  Bar
} from "recharts";
import { readStoredConnectorState } from "@/lib/connectors/client-state";
import type { BenchmarkKpiName, ConnectorId } from "@/lib/types/domain";
import { useLocale } from "@/components/locale-provider";

type AnalyticsResponse = {
  connector?: ConnectorId;
  storeId?: string;
  accountId?: string;
  attributedRevenue: number;
  incrementalRevenue: number;
  upliftPercent: number;
  channelRevenue: { channel: string; revenue: number }[];
  cohortRetention: { week: string; retained: number }[];
};

type BenchmarkKpi = {
  name: BenchmarkKpiName;
  value: number;
  baseline: number;
  pass: boolean;
};

type BenchmarkResponse = {
  connector: ConnectorId;
  scenario: "core3";
  kpis: BenchmarkKpi[];
  overallPass: boolean;
  evaluatedAt: string;
};

function kpiLabel(name: BenchmarkKpiName, isAr: boolean) {
  if (name === "flow_enablement_rate") {
    return isAr ? "معدل تفعيل الرحلات الأساسية" : "Core flow enablement rate";
  }
  if (name === "time_to_first_campaign_minutes") {
    return isAr ? "الوقت لأول حملة (دقيقة)" : "Time to first campaign (minutes)";
  }
  if (name === "predicted_recovery_rate") {
    return isAr ? "معدل الاسترجاع المتوقع" : "Predicted recovery rate";
  }
  return isAr ? "الإيراد المتوقع لكل عميل" : "Predicted revenue per contact";
}

function formatKpiValue(name: BenchmarkKpiName, value: number) {
  if (name === "time_to_first_campaign_minutes") {
    return `${value.toFixed(0)} min`;
  }

  if (name === "predicted_revenue_per_contact") {
    return `${value.toFixed(2)} SAR`;
  }

  return `${(value * 100).toFixed(1)}%`;
}

function formatBaseline(name: BenchmarkKpiName, baseline: number) {
  if (name === "time_to_first_campaign_minutes") {
    return `<= ${baseline.toFixed(0)} min`;
  }

  if (name === "predicted_revenue_per_contact") {
    return `>= ${baseline.toFixed(2)} SAR`;
  }

  return `>= ${(baseline * 100).toFixed(1)}%`;
}

export default function AnalyticsPage() {
  const { locale, dict } = useLocale();
  const isAr = locale === "ar";
  const [connector, setConnector] = useState<ConnectorId>("salla");
  const [externalId, setExternalId] = useState("demo-salla-store");
  const [demoMode, setDemoMode] = useState(false);
  const [contextLoaded, setContextLoaded] = useState(false);

  const [data, setData] = useState<AnalyticsResponse | null>(null);
  const [benchmark, setBenchmark] = useState<BenchmarkResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const stored = readStoredConnectorState();
    setConnector(stored.connector);
    setExternalId(stored.externalId);
    setDemoMode(stored.demoMode);
    setContextLoaded(true);
  }, []);

  useEffect(() => {
    if (!contextLoaded) {
      return;
    }

    const query =
      connector === "klaviyo"
        ? `connector=klaviyo&accountId=${encodeURIComponent(externalId)}`
        : `connector=salla&storeId=${encodeURIComponent(externalId)}`;

    setLoading(true);
    setError(null);

    Promise.all([
      fetch(`/api/analytics/overview?${query}`).then(async (res) => {
        const json = await res.json();
        if (!res.ok) {
          throw new Error(json.error || "Failed to load analytics");
        }
        return json as AnalyticsResponse;
      }),
      fetch(`/api/analytics/benchmark?${query}&scenario=core3`).then(async (res) => {
        const json = await res.json();
        if (!res.ok) {
          throw new Error(json.error || "Failed to load benchmark");
        }
        return json as BenchmarkResponse;
      })
    ])
      .then(([overview, benchmarkResult]) => {
        setData(overview);
        setBenchmark(benchmarkResult);
      })
      .catch((requestError: unknown) => {
        setError(requestError instanceof Error ? requestError.message : "Unknown error");
      })
      .finally(() => setLoading(false));
  }, [contextLoaded, connector, externalId]);

  const connectorLabel = connector === "klaviyo" ? dict.common.klaviyo : dict.common.salla;

  if (loading) {
    return <p>{isAr ? "جاري تحميل التحليلات..." : "Loading analytics..."}</p>;
  }

  if (error) {
    return <p className="badgeWarn">{error}</p>;
  }

  if (!data) {
    return <p className="badgeWarn">{isAr ? "لا توجد بيانات" : "No analytics data"}</p>;
  }

  return (
    <>
      <section className="hero">
        <h1>{isAr ? "التحليلات" : "Analytics"}</h1>
        <p>
          {isAr
            ? "قياس الإيراد المنسوب والتزايدي مع بوابة مقارنة معيارية لرحلات Core 3."
            : "Track attributed and incremental revenue with a deterministic Core 3 benchmark gate."}
        </p>
        <div className="row" style={{ marginTop: 10 }}>
          <span className="pillTag">{`${dict.common.connector}: ${connectorLabel}`}</span>
          <span className="pillTag">{`${connector === "klaviyo" ? dict.common.accountId : dict.common.storeId}: ${externalId}`}</span>
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
        <h2>{isAr ? "المؤشرات الرئيسية" : "Key Metrics"}</h2>
        <div className="kpiGrid">
          <article className="kpi">
            <span>{isAr ? "إيراد منسوب" : "Attributed Revenue"}</span>
            <strong>{data.attributedRevenue.toLocaleString()} SAR</strong>
          </article>
          <article className="kpi">
            <span>{isAr ? "إيراد تزايدي" : "Incremental Revenue"}</span>
            <strong>{data.incrementalRevenue.toLocaleString()} SAR</strong>
          </article>
          <article className="kpi">
            <span>{isAr ? "الرفع" : "Uplift"}</span>
            <strong>{data.upliftPercent.toFixed(1)}%</strong>
          </article>
          <article className="kpi">
            <span>{isAr ? "نطاق التنفيذ" : "Execution Scope"}</span>
            <strong>{connectorLabel}</strong>
          </article>
        </div>
      </section>

      {benchmark && (
        <section className="sectionCard">
          <h2>{isAr ? "بوابة المقارنة المعيارية (Core 3)" : "Core 3 Benchmark Gate"}</h2>
          <p>
            {isAr ? "النتيجة الإجمالية" : "Overall verdict"}: {" "}
            <strong className={benchmark.overallPass ? "badgeSuccess" : "badgeWarn"}>
              {benchmark.overallPass ? dict.common.pass : dict.common.fail}
            </strong>
          </p>
          <p>
            {isAr ? "وقت التقييم" : "Evaluated at"}: {benchmark.evaluatedAt}
          </p>
          <div className="cardsGrid two">
            {benchmark.kpis.map((kpi) => (
              <article className="card" key={kpi.name}>
                <h3>{kpiLabel(kpi.name, isAr)}</h3>
                <p>
                  {isAr ? "القيمة" : "Value"}: <strong>{formatKpiValue(kpi.name, kpi.value)}</strong>
                </p>
                <p>
                  {isAr ? "الحد الأدنى" : "Baseline"}: <strong>{formatBaseline(kpi.name, kpi.baseline)}</strong>
                </p>
                <p className={kpi.pass ? "badgeSuccess" : "badgeWarn"}>
                  {kpi.pass ? dict.common.pass : dict.common.fail}
                </p>
              </article>
            ))}
          </div>
        </section>
      )}

      <section className="sectionCard">
        <h2>{isAr ? "الإيراد حسب القناة" : "Revenue by Channel"}</h2>
        <div className="chartWrap">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data.channelRevenue}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="channel" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="revenue" fill="#0f766e" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className="sectionCard">
        <h2>{isAr ? "الاحتفاظ بالمجموعات" : "Cohort Retention"}</h2>
        <div className="chartWrap">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data.cohortRetention}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="week" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="retained" stroke="#166534" strokeWidth={3} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </section>
    </>
  );
}
