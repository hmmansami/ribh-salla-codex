import { beforeEach, describe, expect, it, vi } from "vitest";
import { POST as syncRunRoutePOST } from "../../../app/api/sync/run/route";
import { memoryDb } from "@/lib/store/memory";

function resetMemoryDb() {
  memoryDb.stores.clear();
  memoryDb.klaviyoAccounts.clear();
  memoryDb.journeys.clear();
  memoryDb.consent.clear();
  memoryDb.webhooks.clear();
  memoryDb.processedWebhookIds.clear();
}

describe("sync run route", () => {
  beforeEach(() => {
    resetMemoryDb();
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
    delete process.env.SALLA_API_BASE_URL;
    delete process.env.KLAVIYO_API_BASE_URL;
  });

  it("keeps Salla-default sync request behavior unchanged", async () => {
    const response = await syncRunRoutePOST(
      new Request("http://localhost:3000/api/sync/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          storeId: "salla-1",
          entities: ["customers", "orders"]
        })
      })
    );

    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.storeId).toBe("salla-1");
    expect(payload.summary.customers).toBe(1280);
    expect(payload.summary.orders).toBe(402);
    expect(typeof payload.checkpoint).toBe("string");
    expect("connector" in payload).toBe(false);
  });

  it("routes sync through Klaviyo connector and returns connector context", async () => {
    const response = await syncRunRoutePOST(
      new Request("http://localhost:3000/api/sync/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          connector: "klaviyo",
          accountId: "acc-1",
          entities: ["customers", "products"]
        })
      })
    );

    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.connector).toBe("klaviyo");
    expect(payload.accountId).toBe("acc-1");
    expect(payload.summary.customers).toBe(860);
    expect(payload.summary.products).toBe(640);
    expect(payload.context.connector).toBe("klaviyo");
    expect(payload.context.demoMode).toBe(true);
    expect(payload.context.checkpoint).toBe(payload.checkpoint);
  });

  it("returns 400 when Salla-default request omits storeId", async () => {
    const response = await syncRunRoutePOST(
      new Request("http://localhost:3000/api/sync/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          entities: ["customers"]
        })
      })
    );

    const payload = await response.json();

    expect(response.status).toBe(400);
    expect(payload.error.fieldErrors.storeId?.length).toBeGreaterThan(0);
  });
});
