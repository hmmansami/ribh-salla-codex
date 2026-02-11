import { memoryDb } from "@/lib/store/memory";
import type { Channel, Journey } from "@/lib/types/domain";
import { ensureStore } from "@/features/salla/service";

function baselineJourneys(locale: "ar" | "en", channels: Channel[]): Journey[] {
  const names = locale === "ar"
    ? {
        welcome: "رحلة الترحيب",
        abandon: "رحلة السلة المتروكة",
        postPurchase: "رحلة ما بعد الشراء",
        winback: "رحلة الاسترجاع"
      }
    : {
        welcome: "Welcome Journey",
        abandon: "Abandon Cart Journey",
        postPurchase: "Post-purchase Journey",
        winback: "Winback Journey"
      };

  return [
    {
      id: "welcome",
      name: names.welcome,
      trigger: "customer_created",
      channels,
      fallbackPath: ["email", "sms"],
      frequencyCapPerDay: 2,
      status: "active",
      conversionRate: 0.12,
      revenueImpact: 5400
    },
    {
      id: "abandon_cart",
      name: names.abandon,
      trigger: "cart_abandoned",
      channels,
      fallbackPath: ["whatsapp", "sms", "email"],
      frequencyCapPerDay: 2,
      status: "active",
      conversionRate: 0.19,
      revenueImpact: 13200
    },
    {
      id: "post_purchase",
      name: names.postPurchase,
      trigger: "order_completed",
      channels,
      fallbackPath: ["email", "whatsapp"],
      frequencyCapPerDay: 1,
      status: "active",
      conversionRate: 0.09,
      revenueImpact: 6100
    },
    {
      id: "winback",
      name: names.winback,
      trigger: "churn_risk_detected",
      channels,
      fallbackPath: ["sms", "email"],
      frequencyCapPerDay: 1,
      status: "paused",
      conversionRate: 0.06,
      revenueImpact: 2700
    }
  ];
}

export function ensureBaselineJourneys(params: {
  storeId: string;
  locale: "ar" | "en";
  channels: Channel[];
}) {
  ensureStore(params.storeId);
  const existing = memoryDb.journeys.get(params.storeId);
  if (existing && existing.length > 0) {
    return existing;
  }

  const seeded = baselineJourneys(params.locale, params.channels);
  memoryDb.journeys.set(params.storeId, seeded);
  return seeded;
}

export function getJourneys(storeId: string) {
  ensureStore(storeId);
  return memoryDb.journeys.get(storeId) ?? [];
}

export function toggleJourney(params: { storeId: string; journeyId: string; enabled: boolean }) {
  const journeys = getJourneys(params.storeId);
  const updated: Journey[] = journeys.map((journey): Journey => {
    if (journey.id !== params.journeyId) {
      return journey;
    }

    const nextStatus: Journey["status"] = params.enabled ? "active" : "paused";
    return {
      ...journey,
      status: nextStatus
    };
  });

  memoryDb.journeys.set(params.storeId, updated);
  return updated.find((journey) => journey.id === params.journeyId) ?? null;
}
