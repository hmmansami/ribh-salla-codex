import crypto from "node:crypto";
import type { Channel, MessageVariant } from "@/lib/types/domain";

function shortId() {
  return crypto.randomBytes(4).toString("hex");
}

function buildCopy(locale: "ar" | "en", channel: Channel, campaignType: string, tone: string, productRefs: string[]) {
  const products = productRefs.length > 0 ? productRefs.join("، ") : locale === "ar" ? "منتجاتك المفضلة" : "your favorite products";

  if (locale === "ar") {
    return {
      subjectOrHook: `عرض ${campaignType} بنبرة ${tone}`,
      body:
        channel === "email"
          ? `مرحباً، جهزنا لك رسالة ${campaignType} مخصصة بناءً على سلوكك. اكتشف الآن: ${products}`
          : `عرض مخصص لك الآن (${campaignType}) - ${products}. اضغط لإكمال الطلب.`
    };
  }

  return {
    subjectOrHook: `${campaignType} offer in ${tone} tone`,
    body:
      channel === "email"
        ? `Hi, we generated a ${campaignType} message based on your behavior. Discover: ${products}`
        : `Personalized ${campaignType} offer now - ${products}. Tap to complete checkout.`
  };
}

export function generateMessageVariants(params: {
  locale: "ar" | "en";
  campaignType: string;
  audienceId: string;
  channel: Channel;
  tone: string;
  productRefs: string[];
}): MessageVariant[] {
  const tones = [params.tone, "confident", "friendly"];

  return tones.slice(0, 3).map((tone, index) => {
    const copy = buildCopy(params.locale, params.channel, params.campaignType, tone, params.productRefs);
    return {
      id: `variant_${shortId()}_${index}`,
      locale: params.locale,
      channel: params.channel,
      subjectOrHook: copy.subjectOrHook,
      body: copy.body,
      tone,
      personalizationFields: ["first_name", "last_order_value", "recommended_products"],
      score: Math.max(0.65, 0.9 - index * 0.08)
    };
  });
}
