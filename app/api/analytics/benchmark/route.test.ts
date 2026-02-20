import { beforeEach, describe, expect, it } from "vitest";
import { GET as benchmarkRouteGET } from "./route";
import { memoryDb } from "@/lib/store/memory";
import { ensureBaselineJourneys, toggleJourney } from "@/features/journeys/service";

function resetMemoryDb() {
  memoryDb.stores.clear();
  memoryDb.klaviyoAccounts.clear();
  memoryDb.journeys.clear();
  memoryDb.consent.clear();
  memoryDb.webhooks.clear();
  memoryDb.processedWebhookIds.clear();
}

describe("GET /api/analytics/benchmark", () => {
  beforeEach(() => {
    resetMemoryDb();
  });

  it("returns a passing Core 3 benchmark for seeded Klaviyo demo context", async () => {
    ensureBaselineJourneys({
      connector: "klaviyo",
      storeId: "acc-bench-route",
      locale: "en",
      channels: ["email", "sms", "whatsapp"]
    });

    const response = await benchmarkRouteGET(
      new Request(
        "http://localhost:3000/api/analytics/benchmark?connector=klaviyo&accountId=acc-bench-route&scenario=core3"
      )
    );
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.connector).toBe("klaviyo");
    expect(payload.scenario).toBe("core3");
    expect(payload.kpis).toHaveLength(4);
    expect(payload.overallPass).toBe(true);
  });

  it("returns failing verdict when Core 3 lifecycle is not fully enabled", async () => {
    ensureBaselineJourneys({
      connector: "salla",
      storeId: "salla-bench-route-fail",
      locale: "en",
      channels: ["email", "sms", "whatsapp"]
    });
    toggleJourney({
      connector: "salla",
      storeId: "salla-bench-route-fail",
      journeyId: "post_purchase",
      enabled: false
    });

    const response = await benchmarkRouteGET(
      new Request(
        "http://localhost:3000/api/analytics/benchmark?connector=salla&storeId=salla-bench-route-fail&scenario=core3"
      )
    );
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.overallPass).toBe(false);
    expect(
      payload.kpis.find((kpi: { name: string }) => kpi.name === "flow_enablement_rate")
        ?.pass
    ).toBe(false);
  });

  it("returns 400 for invalid scenario", async () => {
    const response = await benchmarkRouteGET(
      new Request(
        "http://localhost:3000/api/analytics/benchmark?connector=salla&storeId=salla-bench-route&scenario=invalid"
      )
    );
    const payload = await response.json();

    expect(response.status).toBe(400);
    expect(payload.error.fieldErrors.scenario?.length).toBeGreaterThan(0);
  });
});
