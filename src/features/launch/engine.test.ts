import { beforeEach, describe, expect, it, vi } from "vitest";
import { runLaunchEngine } from "@/features/launch/engine";
import { memoryDb } from "@/lib/store/memory";
import * as providers from "@/lib/providers";

function resetMemoryDb() {
  memoryDb.stores.clear();
  memoryDb.klaviyoAccounts.clear();
  memoryDb.journeys.clear();
  memoryDb.consent.clear();
  memoryDb.webhooks.clear();
  memoryDb.processedWebhookIds.clear();
}

describe("launch engine connector context", () => {
  beforeEach(() => {
    resetMemoryDb();
    vi.restoreAllMocks();

    vi.spyOn(providers, "sendThroughChannel").mockImplementation(async (input) => ({
      provider: `${input.channel}-simulated`,
      channel: input.channel,
      status: "simulated",
      messageId: `${input.channel}-msg-1`
    }));
  });

  it("keeps Salla-first launch behavior when connector is omitted", async () => {
    const result = await runLaunchEngine({
      storeId: "salla-1",
      channels: ["email", "sms"],
      locale: "ar",
      guardrails: {
        quietHours: "23:00-08:00",
        frequencyCapPerDay: 2
      }
    });

    expect(result.storeId).toBe("salla-1");
    expect(result.execution.connector).toBe("salla");
    expect(result.execution.externalId).toBe("salla-1");
    expect(result.execution.demoMode).toBe(false);
    expect(result.activatedJourneys).toHaveLength(4);
    expect(memoryDb.stores.get("salla-1")?.store.id).toBe("salla-1");
    expect(providers.sendThroughChannel).toHaveBeenCalledTimes(2);
  });

  it("keeps Salla behavior unchanged when connector is explicitly set to salla", async () => {
    const result = await runLaunchEngine({
      connector: "salla",
      storeId: "salla-explicit-1",
      channels: ["whatsapp"],
      locale: "en",
      guardrails: {
        quietHours: "23:00-08:00",
        frequencyCapPerDay: 2
      }
    });

    expect(result.storeId).toBe("salla-explicit-1");
    expect(result.execution.connector).toBe("salla");
    expect(result.execution.externalId).toBe("salla-explicit-1");
    expect(result.execution.demoMode).toBe(false);
    expect(memoryDb.stores.get("salla-explicit-1")?.store.id).toBe("salla-explicit-1");
    expect(memoryDb.klaviyoAccounts.size).toBe(0);

    const mockedCalls = vi.mocked(providers.sendThroughChannel).mock.calls;
    expect(mockedCalls).toHaveLength(1);
    expect(mockedCalls[0][0].storeId).toBe("salla-explicit-1");
  });

  it("runs launch with Klaviyo connector context using accountId as execution scope", async () => {
    const result = await runLaunchEngine({
      connector: "klaviyo",
      accountId: "acc-1",
      channels: ["email", "sms", "whatsapp"],
      locale: "en",
      guardrails: {
        quietHours: "23:00-08:00",
        frequencyCapPerDay: 2
      }
    });

    expect(result.storeId).toBe("acc-1");
    expect(result.execution.connector).toBe("klaviyo");
    expect(result.execution.externalId).toBe("acc-1");
    expect(result.execution.demoMode).toBe(true);
    expect(result.activatedJourneys).toHaveLength(4);
    expect(memoryDb.klaviyoAccounts.get("acc-1")?.account.id).toBe("acc-1");
    expect(memoryDb.stores.get("acc-1")).toBeUndefined();

    const mockedCalls = vi.mocked(providers.sendThroughChannel).mock.calls;
    expect(mockedCalls).toHaveLength(3);
    expect(mockedCalls.every(([input]) => input.storeId === "acc-1")).toBe(true);
  });

  it("uses accountId as the canonical Klaviyo identifier when both accountId and storeId are provided", async () => {
    const result = await runLaunchEngine({
      connector: "klaviyo",
      accountId: "acc-canonical-1",
      storeId: "legacy-store-id",
      channels: ["email", "sms"],
      locale: "en",
      guardrails: {
        quietHours: "23:00-08:00",
        frequencyCapPerDay: 2
      }
    });

    expect(result.storeId).toBe("acc-canonical-1");
    expect(result.execution.connector).toBe("klaviyo");
    expect(result.execution.externalId).toBe("acc-canonical-1");

    expect(memoryDb.klaviyoAccounts.get("acc-canonical-1")?.account.id).toBe("acc-canonical-1");
    expect(memoryDb.journeys.get("acc-canonical-1")?.length).toBe(4);
    expect(memoryDb.journeys.get("legacy-store-id")).toBeUndefined();

    const mockedCalls = vi.mocked(providers.sendThroughChannel).mock.calls;
    expect(mockedCalls).toHaveLength(2);
    expect(mockedCalls.every(([input]) => input.storeId === "acc-canonical-1")).toBe(true);
  });
});
