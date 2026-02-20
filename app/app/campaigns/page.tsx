"use client";

import { PageWrapper, HeroSection } from "@/components/page-wrapper";
import { useLocale } from "@/components/locale-provider";
import { Send, Mail, MessageCircle, MoreHorizontal } from "lucide-react";

export default function CampaignsPage() {
    const { locale } = useLocale();
    const isAr = locale === "ar";

    const campaigns = [
        { name: isAr ? "عروض العودة للمدارس" : "Back to School Promo", date: "Sep 1, 2025", status: "Sent", type: "Email", sent: 12400, opened: 5600, clicked: 800 },
        { name: isAr ? "إطلاق المنتج الجديد" : "New Collection Launch", date: "Aug 15, 2025", status: "Draft", type: "WhatsApp", sent: 0, opened: 0, clicked: 0 },
        { name: isAr ? "تذكير بالسلة المتروكة" : "Flash Sale Announce", date: "Jul 20, 2025", status: "Sent", type: "SMS", sent: 45000, opened: 42000, clicked: 5100 },
    ];

    return (
        <PageWrapper className="space-y-8">
            <HeroSection
                label={isAr ? "الحملات الإعلانية" : "Campaigns / Broadcasts"}
                title={isAr ? "أرسل في الوقت المناسب" : "Send at the perfect moment"}
                description={isAr
                    ? "حلقات تواصل مستمرة مع عملائك عبر الإيميل، الواتساب، والرسائل النصية."
                    : "Reach your audience with personalized one-off broadcasts across Email, WhatsApp, and SMS."}
            />

            <section data-animate className="glass-card p-6">
                <div className="mb-6 flex items-center justify-between">
                    <h2 className="text-xl font-semibold tracking-tight text-white flex items-center gap-2">
                        <Send className="h-5 w-5 text-cyan-400" />
                        {isAr ? "إدارة الحملات" : "Manage Campaigns"}
                    </h2>
                    <button className="flex items-center gap-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 px-4 py-2 text-sm font-semibold text-slate-950 transition-colors">
                        {isAr ? "إنشاء حملة" : "Create Campaign"}
                    </button>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-slate-400">
                        <thead className="bg-white/5 text-xs uppercase text-slate-300">
                            <tr>
                                <th scope="col" className="px-6 py-3 rounded-l-lg">{isAr ? "اسم الحملة" : "Campaign Name"}</th>
                                <th scope="col" className="px-6 py-3">{isAr ? "الحالة" : "Status"}</th>
                                <th scope="col" className="px-6 py-3">{isAr ? "النوع" : "Channel"}</th>
                                <th scope="col" className="px-6 py-3">{isAr ? "المرسل" : "Sent"}</th>
                                <th scope="col" className="px-6 py-3">{isAr ? "المفتوح" : "Opened"}</th>
                                <th scope="col" className="px-6 py-3 rounded-r-lg"></th>
                            </tr>
                        </thead>
                        <tbody>
                            {campaigns.map((camp, i) => (
                                <tr key={i} className="border-b border-white/5 hover:bg-slate-900/50 transition-colors">
                                    <td className="px-6 py-4 font-medium text-white">{camp.name} <div className="text-xs text-slate-500 mt-1">{camp.date}</div></td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${camp.status === 'Sent' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                                : 'bg-slate-500/10 text-slate-400 border-slate-500/20'
                                            }`}>
                                            {camp.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 flex items-center gap-2 mt-2">
                                        {camp.type === 'Email' && <Mail className="h-4 w-4 text-slate-400" />}
                                        {camp.type === 'WhatsApp' && <MessageCircle className="h-4 w-4 text-emerald-400" />}
                                        {camp.type === 'SMS' && <MessageCircle className="h-4 w-4 text-cyan-400" />}
                                        {camp.type}
                                    </td>
                                    <td className="px-6 py-4">{camp.sent.toLocaleString()}</td>
                                    <td className="px-6 py-4">{camp.opened.toLocaleString()}</td>
                                    <td className="px-6 py-4 text-right">
                                        <button className="text-slate-400 hover:text-white transition-colors">
                                            <MoreHorizontal className="h-5 w-5" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </section>
        </PageWrapper>
    );
}
