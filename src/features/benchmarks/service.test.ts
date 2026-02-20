import { beforeEach, describe, expect, it } from "vitest";
import { evaluateBenchmark } from "@/features/benchmarks/service";
import {
  ensureBaselineJourneys,
  toggleJourney
} from "@/features/journeys/service";
import { memoryDb } from "@/lib/store/memory";

function resetMemoryDb() {
  memoryDb.stores.clear();
  memoryDb.klaviyoAccounts.clear();
  memoryDb.journeys.clear();
  memoryDb.consent.clear();
  memoryDb.webhooks.clear();
  memoryDb.processedWebhookIds.clear();
}

describe("core3 benchmark evaluator", () => {
  beforeEach(() => {
    resetMemoryDb();
  });

  it("passes when all Core 3 journeys are active for Klaviyo connector", () => {
    ensureBaselineJourneys({
      connector: "klaviyo",
      storeId: "acc-benchmark-pass",
      locale: "en",
      channels: ["email", "sms", "whatsapp"]
    });

    const result = evaluateBenchmark({
      connector: "klaviyo",
      externalId: "acc-benchmark-pass",
      scenario: "core3"
    });

    expect(result.connector).toBe("klaviyo");
    expect(result.scenario).toBe("core3");
    expect(result.kpis).toHaveLength(4);
    expect(result.overallPass).toBe(true);
    expect(
      result.kpis.find((kpi) => kpi.name === "flow_enablement_rate")?.value
    ).toBe(1);
  });

  it("fails benchmark when a required Core 3 journey is paused", () => {
    ensureBaselineJourneys({
      connector: "klaviyo",
      storeId: "acc-benchmark-fail",
      locale: "en",
      channels: ["email", "sms", "whatsapp"]
    });

    toggleJourney({
      connector: "klaviyo",
      storeId: "acc-benchmark-fail",
      journeyId: "abandon_cart",
      enabled: false
    });

    const result = evaluateBenchmark({
      connector: "klaviyo",
      externalId: "acc-benchmark-fail"
    });

    const flowEnablement = result.kpis.find(
      (kpi) => kpi.name === "flow_enablement_rate"
    );

    expect(result.overallPass).toBe(false);
    expect(flowEnablement?.pass).toBe(false);
    expect(flowEnablement?.value).toBeCloseTo(2 / 3, 4);
  });

  it("keeps Salla path deterministic and passing by default", () => {
    const result = evaluateBenchmark({
      connector: "salla",
      externalId: "salla-benchmark-pass"
    });

    expect(result.connector).toBe("salla");
    expect(result.kpis.every((kpi) => kpi.pass)).toBe(true);
    expect(result.overallPass).toBe(true);
  });
});
