import { beforeEach, describe, expect, it, vi } from "vitest";
import { POST as launchRunRoutePOST } from "../../../app/api/launch/run/route";
import { memoryDb } from "@/lib/store/memory";

function resetMemoryDb() {
  memoryDb.stores.clear();
  memoryDb.klaviyoAccounts.clear();
  memoryDb.journeys.clear();
  memoryDb.consent.clear();
  memoryDb.webhooks.clear();
  memoryDb.processedWebhookIds.clear();
}

describe("launch run route", () => {
  beforeEach(() => {
    resetMemoryDb();
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
    delete process.env.EMAIL_PROVIDER_URL;
    delete process.env.EMAIL_PROVIDER_KEY;
    delete process.env.SMS_PROVIDER_URL;
    delete process.env.SMS_PROVIDER_KEY;
    delete process.env.WHATSAPP_PROVIDER_URL;
    delete process.env.WHATSAPP_PROVIDER_KEY;
  });

  it("keeps backward-compatible Salla launch request behavior", async () => {
    const response = await launchRunRoutePOST(
      new Request("http://localhost:3000/api/launch/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          storeId: "demo-salla-store",
          channels: ["email", "sms"],
          locale: "ar",
          guardrails: {
            quietHours: "23:00-08:00",
            frequencyCapPerDay: 2
          }
        })
      })
    );

    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.storeId).toBe("demo-salla-store");
    expect(payload.execution.connector).toBe("salla");
    expect(payload.execution.externalId).toBe("demo-salla-store");
    expect(payload.activatedJourneys).toHaveLength(4);
  });

  it("supports Klaviyo launch requests with connector context", async () => {
    const response = await launchRunRoutePOST(
      new Request("http://localhost:3000/api/launch/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          connector: "klaviyo",
          accountId: "acc-route-1",
          channels: ["email", "whatsapp"],
          locale: "en",
          guardrails: {
            quietHours: "23:00-08:00",
            frequencyCapPerDay: 2
          }
        })
      })
    );

    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.storeId).toBe("acc-route-1");
    expect(payload.execution.connector).toBe("klaviyo");
    expect(payload.execution.externalId).toBe("acc-route-1");
    expect(payload.execution.demoMode).toBe(true);
    expect(payload.activatedJourneys).toHaveLength(4);
  });

  it("prefers accountId as canonical Klaviyo id when both accountId and storeId are provided", async () => {
    const response = await launchRunRoutePOST(
      new Request("http://localhost:3000/api/launch/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          connector: "klaviyo",
          accountId: "acc-route-canonical",
          storeId: "legacy-route-store",
          channels: ["email"],
          locale: "en",
          guardrails: {
            quietHours: "23:00-08:00",
            frequencyCapPerDay: 2
          }
        })
      })
    );

    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.storeId).toBe("acc-route-canonical");
    expect(payload.execution.connector).toBe("klaviyo");
    expect(payload.execution.externalId).toBe("acc-route-canonical");
    expect(memoryDb.journeys.get("acc-route-canonical")?.length).toBe(4);
    expect(memoryDb.journeys.get("legacy-route-store")).toBeUndefined();
  });

  it("returns 400 when Klaviyo launch request omits both accountId and storeId", async () => {
    const response = await launchRunRoutePOST(
      new Request("http://localhost:3000/api/launch/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          connector: "klaviyo",
          channels: ["email"],
          locale: "ar",
          guardrails: {
            quietHours: "23:00-08:00",
            frequencyCapPerDay: 2
          }
        })
      })
    );

    const payload = await response.json();

    expect(response.status).toBe(400);
    expect(payload.error.fieldErrors.accountId?.length).toBeGreaterThan(0);
  });
});
