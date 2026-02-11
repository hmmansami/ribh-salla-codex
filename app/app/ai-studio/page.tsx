"use client";

import { useState } from "react";
import { useLocale } from "@/components/locale-provider";

type Variant = {
  id: string;
  channel: "email" | "sms" | "whatsapp";
  subjectOrHook: string;
  body: string;
  tone: string;
  score: number;
};

export default function AIStudioPage() {
  const { locale } = useLocale();
  const isAr = locale === "ar";

  const [campaignType, setCampaignType] = useState("abandon_cart");
  const [audienceId, setAudienceId] = useState("high_intent");
  const [channel, setChannel] = useState<"email" | "sms" | "whatsapp">("whatsapp");
  const [tone, setTone] = useState("confident");
  const [productRefs, setProductRefs] = useState("sku-101,sku-202");
  const [variants, setVariants] = useState<Variant[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function generate() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/ai/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          locale,
          campaignType,
          audienceId,
          channel,
          tone,
          productRefs: productRefs
            .split(",")
            .map((item) => item.trim())
            .filter(Boolean)
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Generation failed");
      setVariants(data.variants);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <section className="hero">
        <h1>{isAr ? "استوديو الذكاء" : "AI Studio"}</h1>
        <p>
          {isAr
            ? "توليد رسائل مخصصة بالعربية والإنجليزية مع الحفاظ على كل قدرات القوالب اليدوية."
            : "Generate localized personalized messages while keeping full manual template capability."}
        </p>
      </section>

      <section className="sectionCard">
        <h2>{isAr ? "توليد المحتوى" : "Generate Content"}</h2>
        <div className="formGrid">
          <label>
            {isAr ? "نوع الحملة" : "Campaign Type"}
            <select value={campaignType} onChange={(e) => setCampaignType(e.target.value)}>
              <option value="welcome">welcome</option>
              <option value="abandon_cart">abandon_cart</option>
              <option value="post_purchase">post_purchase</option>
              <option value="winback">winback</option>
            </select>
          </label>
          <label>
            {isAr ? "الجمهور" : "Audience"}
            <input className="input" value={audienceId} onChange={(e) => setAudienceId(e.target.value)} />
          </label>
          <label>
            {isAr ? "القناة" : "Channel"}
            <select value={channel} onChange={(e) => setChannel(e.target.value as "email" | "sms" | "whatsapp")}> 
              <option value="email">email</option>
              <option value="sms">sms</option>
              <option value="whatsapp">whatsapp</option>
            </select>
          </label>
          <label>
            {isAr ? "نغمة الرسالة" : "Tone"}
            <input className="input" value={tone} onChange={(e) => setTone(e.target.value)} />
          </label>
          <label style={{ gridColumn: "1 / -1" }}>
            {isAr ? "مراجع المنتجات" : "Product refs"}
            <input className="input" value={productRefs} onChange={(e) => setProductRefs(e.target.value)} />
          </label>
        </div>

        <div className="row" style={{ marginTop: 12 }}>
          <button onClick={generate} disabled={loading}>
            {loading ? (isAr ? "جاري التوليد..." : "Generating...") : isAr ? "توليد" : "Generate"}
          </button>
        </div>

        {error && <p className="badgeWarn">{error}</p>}
      </section>

      {variants.length > 0 && (
        <section className="sectionCard">
          <h2>{isAr ? "النسخ المقترحة" : "Generated Variants"}</h2>
          <div className="cardsGrid two">
            {variants.map((variant) => (
              <article key={variant.id} className="card">
                <h3>
                  {variant.channel.toUpperCase()} - {variant.subjectOrHook}
                </h3>
                <p>{variant.body}</p>
                <p>
                  {isAr ? "النغمة" : "Tone"}: {variant.tone}
                </p>
                <p className="badgeSuccess">
                  {isAr ? "الجودة" : "Score"}: {Math.round(variant.score * 100)}%
                </p>
              </article>
            ))}
          </div>
        </section>
      )}
    </>
  );
}
