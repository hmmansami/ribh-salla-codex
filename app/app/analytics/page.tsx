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

import { PageWrapper, HeroSection } from "@/components/page-wrapper";

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
    return (
      <PageWrapper className="flex min-h-[50vh] items-center justify-center">
        <p className="text-slate-400 animate-pulse">{isAr ? "جاري تحميل التحليلات..." : "Loading analytics..."}</p>
      </PageWrapper>
    );
  }

  if (!data) {
    return (
      <PageWrapper className="flex min-h-[50vh] items-center justify-center">
        <p className="text-red-400 font-medium bg-red-500/10 px-6 py-4 rounded-xl border border-red-500/20">
          {isAr ? "لا توجد بيانات" : "No analytics data"}
        </p>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper className="space-y-8">
      <HeroSection
        label={isAr ? "التحليلات" : "Analytics"}
        title={isAr ? "قياس الإيراد الأكيد" : "Measure True Revenue"}
        description={isAr
          ? "قياس الإيراد المنسوب والإيراد التزايدي معا لبناء قرارات أدق."
          : "Measure attributed and incremental revenue together for higher-confidence decisions."}
      />

      <section data-animate className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="glass-card p-6 border-cyan-500/20 bg-gradient-to-br from-slate-900/80 to-slate-900/40">
          <p className="text-sm font-medium text-slate-400 mb-1">{isAr ? "إيراد منسوب" : "Attributed Revenue"}</p>
          <p className="text-3xl font-bold text-white tracking-tight">{data.attributedRevenue.toLocaleString()} <span className="text-xl text-slate-500 font-normal">SAR</span></p>
        </div>
        <div className="glass-card p-6 border-emerald-500/20 bg-gradient-to-br from-slate-900/80 to-slate-900/40">
          <p className="text-sm font-medium text-slate-400 mb-1">{isAr ? "إيراد تزايدي" : "Incremental Revenue"}</p>
          <p className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400 tracking-tight">{data.incrementalRevenue.toLocaleString()} <span className="text-xl text-slate-500 font-normal">SAR</span></p>
        </div>
        <div className="glass-card p-6">
          <p className="text-sm font-medium text-slate-400 mb-1">{isAr ? "الرفع" : "Uplift"}</p>
          <p className="text-3xl font-bold text-white tracking-tight">+{data.upliftPercent.toFixed(1)}%</p>
        </div>
        <div className="glass-card p-6">
          <p className="text-sm font-medium text-slate-400 mb-1">{isAr ? "النطاق" : "Scope"}</p>
          <p className="text-3xl font-bold text-white tracking-tight">{isAr ? "سلة أولا" : "Salla-first"}</p>
        </div>
      </section>

      <div className="grid gap-8 lg:grid-cols-2">
        <section data-animate className="glass-card p-6">
          <h2 className="text-lg font-semibold text-white mb-6 tracking-tight">
            {isAr ? "الإيراد حسب القناة" : "Revenue by Channel"}
          </h2>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.channelRevenue} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis
                  dataKey="channel"
                  stroke="rgba(255,255,255,0.4)"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  stroke="rgba(255,255,255,0.4)"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) => `${value / 1000}k`}
                />
                <Tooltip
                  cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: 'rgba(6,182,212,0.2)', borderRadius: '8px', color: '#fff' }}
                  itemStyle={{ color: '#22d3ee' }}
                />
                <Bar
                  dataKey="revenue"
                  fill="#0ea5e9"
                  radius={[4, 4, 0, 0]}
                  label={{ position: 'top', fill: 'rgba(255,255,255,0.7)', fontSize: 10, formatter: (val: number) => `${val / 1000}k` }}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section data-animate className="glass-card p-6">
          <h2 className="text-lg font-semibold text-white mb-6 tracking-tight">
            {isAr ? "الاحتفاظ بالمجموعات" : "Cohort Retention"}
          </h2>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.cohortRetention} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis
                  dataKey="week"
                  stroke="rgba(255,255,255,0.4)"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  stroke="rgba(255,255,255,0.4)"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: 'rgba(16,185,129,0.2)', borderRadius: '8px', color: '#fff' }}
                  itemStyle={{ color: '#34d399' }}
                />
                <Line
                  type="monotone"
                  dataKey="retained"
                  stroke="#10b981"
                  strokeWidth={3}
                  dot={{ r: 4, fill: '#10b981', strokeWidth: 0 }}
                  activeDot={{ r: 6, fill: '#fff', stroke: '#10b981', strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </section>
      </div>
    </PageWrapper>
  );
}
