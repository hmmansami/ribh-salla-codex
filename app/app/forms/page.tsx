"use client";

import { PageWrapper, HeroSection } from "@/components/page-wrapper";
import { useLocale } from "@/components/locale-provider";
import { LayoutTemplate, Plus, View, PenTool, Power } from "lucide-react";

export default function FormsPage() {
    const { locale } = useLocale();
    const isAr = locale === "ar";

    const forms = [
        { name: isAr ? "خصم الترحيب (10%)" : "Welcome Discount (10%)", type: "Popup", views: 24500, submits: 3200, rate: "13.06%", status: "Active" },
        { name: isAr ? "نموذج الخروج من الموقع" : "Exit Intent Offer", type: "Flyout", views: 12000, submits: 850, rate: "7.08%", status: "Active" },
        { name: isAr ? "تجميع أرقام الواتساب" : "WhatsApp Opt-in", type: "Embed", views: 5000, submits: 1200, rate: "24.0%", status: "Draft" },
    ];

    return (
        <PageWrapper className="space-y-8">
            <HeroSection
                label={isAr ? "النماذج والنوافذ المنبثقة" : "Forms & Popups"}
                title={isAr ? "حوّل الزوار إلى عملاء" : "Turn Visitors into Subscribers"}
                description={isAr
                    ? "اجمع بيانات عملائك (صفرية الطرف) لبناء جمهورك عبر قنوات متعددة دون الاعتماد على الإعلانات."
                    : "Capture zero-party data and build your audience across multiple channels without relying on ads."}
            />

            <section data-animate className="glass-card p-6">
                <div className="mb-6 flex items-center justify-between">
                    <h2 className="text-xl font-semibold tracking-tight text-white flex items-center gap-2">
                        <LayoutTemplate className="h-5 w-5 text-cyan-400" />
                        {isAr ? "إدارة النماذج" : "Manage Forms"}
                    </h2>
                    <button className="flex items-center gap-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 px-4 py-2 text-sm font-semibold text-slate-950 transition-colors">
                        <Plus className="h-4 w-4" />
                        {isAr ? "إنشاء نموذج جديد" : "Create Form"}
                    </button>
                </div>

                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {forms.map((form, i) => (
                        <article key={i} className="group flex flex-col justify-between overflow-hidden rounded-xl border border-white/5 bg-slate-900/50 p-6 transition-colors hover:border-cyan-500/30 hover:bg-slate-900/80">
                            <div>
                                <div className="flex items-start justify-between mb-4">
                                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${form.status === 'Active' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                            : 'bg-slate-500/10 text-slate-400 border-slate-500/20'
                                        }`}>
                                        {form.status}
                                    </span>
                                    <span className="text-xs font-medium text-slate-400 bg-white/5 px-2 py-1 rounded-md border border-white/10">
                                        {form.type}
                                    </span>
                                </div>

                                <h3 className="text-lg font-medium text-white group-hover:text-cyan-400 transition-colors">
                                    {form.name}
                                </h3>

                                <div className="mt-6 grid grid-cols-3 gap-2 border-t border-white/5 pt-4 text-center">
                                    <div>
                                        <div className="text-slate-400 text-xs mb-1">{isAr ? "المشاهدات" : "Views"}</div>
                                        <div className="text-white font-medium">{form.views.toLocaleString()}</div>
                                    </div>
                                    <div className="border-l border-r border-white/5">
                                        <div className="text-slate-400 text-xs mb-1">{isAr ? "التسجيلات" : "Submits"}</div>
                                        <div className="text-white font-medium">{form.submits.toLocaleString()}</div>
                                    </div>
                                    <div>
                                        <div className="text-slate-400 text-xs mb-1">{isAr ? "النسبة" : "Rate"}</div>
                                        <div className="text-cyan-400 font-medium">{form.rate}</div>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-6 flex justify-between gap-2 border-t border-white/5 pt-4">
                                <button className="flex w-full items-center justify-center gap-2 rounded-lg bg-white/5 px-3 py-2 text-sm font-medium text-slate-300 transition-colors hover:bg-white/10 hover:text-white">
                                    <PenTool className="h-4 w-4" />
                                    {isAr ? "تعديل" : "Edit"}
                                </button>
                                <button className="flex items-center justify-center rounded-lg bg-white/5 px-3 py-2 text-slate-400 transition-colors hover:bg-white/10 hover:text-white">
                                    <View className="h-4 w-4" />
                                </button>
                                <button className={`flex items-center justify-center rounded-lg px-3 py-2 transition-colors ${form.status === 'Active' ? 'bg-red-500/10 text-red-400 hover:bg-red-500/20' : 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20'}`}>
                                    <Power className="h-4 w-4" />
                                </button>
                            </div>
                        </article>
                    ))}
                </div>
            </section>
        </PageWrapper>
    );
}
