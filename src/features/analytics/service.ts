import { getJourneys } from "@/features/journeys/service";
import type { ConnectorId } from "@/lib/types/domain";

function baseNumberFromStoreId(storeId: string) {
  return storeId.split("").reduce((sum, char) => sum + char.charCodeAt(0), 0);
}

export function getAnalyticsOverview(storeId: string, connector: ConnectorId = "salla") {
  const journeys = getJourneys(storeId, connector);
  const base = baseNumberFromStoreId(storeId);
  const activeMultiplier = Math.max(1, journeys.filter((j) => j.status === "active").length);

  const attributedRevenue = 40_000 + (base % 5000) + activeMultiplier * 3200;
  const incrementalRevenue = Math.round(attributedRevenue * 0.27);
  const upliftPercent = Number(((incrementalRevenue / attributedRevenue) * 100).toFixed(2));

  const channelRevenue = [
    { channel: "email", revenue: Math.round(attributedRevenue * 0.32) },
    { channel: "sms", revenue: Math.round(attributedRevenue * 0.38) },
    { channel: "whatsapp", revenue: Math.round(attributedRevenue * 0.3) }
  ];

  const cohortRetention = [
    { week: "W1", retained: 100 },
    { week: "W2", retained: 73 },
    { week: "W3", retained: 62 },
    { week: "W4", retained: 55 },
    { week: "W5", retained: 49 },
    { week: "W6", retained: 45 }
  ];

  return {
    attributedRevenue,
    incrementalRevenue,
    upliftPercent,
    channelRevenue,
    cohortRetention
  };
}
