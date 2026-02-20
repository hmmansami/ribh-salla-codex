"use client";

import { PageWrapper, HeroSection } from "@/components/page-wrapper";
import { useLocale } from "@/components/locale-provider";
import { Users, Filter, Plus, ArrowRight } from "lucide-react";

export default function AudiencesPage() {
    const { locale } = useLocale();
    const isAr = locale === "ar";

    const segments = [
        { name: isAr ? "عملاء VIP" : "VIP Customers", size: 12503, growth: "+12%", type: isAr ? "نشط" : "Dynamic" },
        { name: isAr ? "معرضون للتسرب" : "Churn Risk", size: 4200, growth: "-3%", type: isAr ? "نشط" : "Dynamic" },
        { name: isAr ? "مشترون جدد" : "New Buyers", size: 8430, growth: "+21%", type: isAr ? "نشط" : "Dynamic" },
        { name: isAr ? "تخفيضات الصيف" : "Summer Sale Opt-ins", size: 45000, growth: "0%", type: isAr ? "ثابت" : "Static" },
    ];

    return (
        <PageWrapper className="space-y-8">
            <HeroSection
                label={isAr ? "الجمهور والشرائح" : "Audiences & Segments"}
                title={isAr ? "اعرف عملاءك. استهدف بدقة." : "Know your buyers. Target with precision."}
                description={isAr
                    ? "البيانات المباشرة من سلة تتيح لك بناء شرائح متقدمة (VIP، المتسربون، والمزيد) لزيادة المبيعات."
                    : "Live Salla data enables you to build advanced segments (VIP, Churn Risk, etc.) to drive revenue."}
            />

            <section data-animate className="glass-card p-6">
                <div className="mb-6 flex items-center justify-between">
                    <h2 className="text-xl font-semibold tracking-tight text-white flex items-center gap-2">
                        <Users className="h-5 w-5 text-cyan-400" />
                        {isAr ? "شرائح العملاء" : "Customer Segments"}
                    </h2>
                    <button className="flex items-center gap-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 px-4 py-2 text-sm font-semibold text-slate-950 transition-colors">
                        <Plus className="h-4 w-4" />
                        {isAr ? "شريحة جديدة" : "New Segment"}
                    </button>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                    {segments.map((segment, i) => (
                        <article key={i} className="group relative overflow-hidden rounded-xl border border-white/5 bg-slate-900/50 p-6 transition-colors hover:border-cyan-500/30 hover:bg-slate-900/80 cursor-pointer">
                            <div className="flex items-start justify-between">
                                <div>
                                    <h3 className="text-lg font-medium text-white group-hover:text-cyan-400 transition-colors">
                                        {segment.name}
                                    </h3>
                                    <div className="mt-2 text-sm text-slate-400 flex items-center gap-2">
                                        <span className="px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-xs">
                                            {segment.type}
                                        </span>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="text-2xl font-bold tracking-tight text-white">
                                        {segment.size.toLocaleString()}
                                    </div>
                                    <div className={`text-sm font-medium mt-1 ${segment.growth.startsWith('+') ? 'text-emerald-400' : segment.growth === '0%' ? 'text-slate-400' : 'text-red-400'}`}>
                                        {segment.growth}
                                    </div>
                                </div>
                            </div>
                            <div className="mt-6 flex items-center text-sm font-medium text-cyan-400 opacity-0 transform translate-x-[-10px] group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300">
                                {isAr ? "عرض التفاصيل" : "View Details"} <ArrowRight className="ml-1 h-4 w-4" />
                            </div>
                        </article>
                    ))}
                </div>
            </section>
        </PageWrapper>
    );
}
