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
import { useLocale } from "@/components/locale-provider";

type AnalyticsResponse = {
  attributedRevenue: number;
  incrementalRevenue: number;
  upliftPercent: number;
  channelRevenue: { channel: string; revenue: number }[];
  cohortRetention: { week: string; retained: number }[];
};

const FALLBACK_STORE = "demo-salla-store";

export default function AnalyticsPage() {
  const { locale } = useLocale();
  const isAr = locale === "ar";
  const [data, setData] = useState<AnalyticsResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storeId = window.localStorage.getItem("ribh_store_id") || FALLBACK_STORE;

    fetch(`/api/analytics/overview?storeId=${encodeURIComponent(storeId)}`)
      .then(async (res) => {
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || "Failed to load analytics");
        return json as AnalyticsResponse;
      })
      .then((result) => setData(result))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <p>{isAr ? "جاري تحميل التحليلات..." : "Loading analytics..."}</p>;
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
            ? "قياس الإيراد المنسوب والإيراد التزايدي معا لبناء قرارات أدق."
            : "Measure attributed and incremental revenue together for higher-confidence decisions."}
        </p>
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
            <span>{isAr ? "النطاق" : "Scope"}</span>
            <strong>{isAr ? "سلة أولا" : "Salla-first"}</strong>
          </article>
        </div>
      </section>

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
