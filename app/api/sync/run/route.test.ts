import { beforeEach, describe, expect, it, vi } from "vitest";
import { POST as syncRunRoutePOST } from "./route";
import { memoryDb } from "@/lib/store/memory";

function resetMemoryDb() {
  memoryDb.stores.clear();
  memoryDb.klaviyoAccounts.clear();
  memoryDb.journeys.clear();
  memoryDb.consent.clear();
  memoryDb.webhooks.clear();
  memoryDb.processedWebhookIds.clear();
}

describe("POST /api/sync/run", () => {
  beforeEach(() => {
    resetMemoryDb();
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
    delete process.env.SALLA_API_BASE_URL;
    delete process.env.KLAVIYO_API_BASE_URL;
  });

  it("keeps default Salla sync behavior when connector is omitted", async () => {
    const response = await syncRunRoutePOST(
      new Request("http://localhost:3000/api/sync/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          storeId: "salla-sync-1",
          entities: ["customers", "orders", "products"]
        })
      })
    );

    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.storeId).toBe("salla-sync-1");
    expect(payload.summary).toEqual({
      customers: 1280,
      orders: 402,
      products: 920
    });
    expect("connector" in payload).toBe(false);
  });

  it("routes through Klaviyo sync and returns connector-specific normalized shape", async () => {
    const response = await syncRunRoutePOST(
      new Request("http://localhost:3000/api/sync/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          connector: "klaviyo",
          accountId: "acc-sync-1",
          entities: ["customers", "products"]
        })
      })
    );

    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.connector).toBe("klaviyo");
    expect(payload.accountId).toBe("acc-sync-1");
    expect(payload.summary).toEqual({
      customers: 860,
      products: 640
    });
    expect(payload.context.connector).toBe("klaviyo");
    expect(payload.context.externalId).toBe("acc-sync-1");
    expect(payload.context.demoMode).toBe(true);
  });

  it("accepts storeId as Klaviyo fallback identifier when accountId is omitted", async () => {
    const response = await syncRunRoutePOST(
      new Request("http://localhost:3000/api/sync/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          connector: "klaviyo",
          storeId: "legacy-klaviyo-id",
          entities: ["orders"]
        })
      })
    );

    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.connector).toBe("klaviyo");
    expect(payload.accountId).toBe("legacy-klaviyo-id");
    expect(payload.summary.orders).toBe(215);
  });

  it("returns 400 when connector-specific identifiers are missing", async () => {
    const response = await syncRunRoutePOST(
      new Request("http://localhost:3000/api/sync/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          connector: "klaviyo",
          entities: ["customers"]
        })
      })
    );

    const payload = await response.json();

    expect(response.status).toBe(400);
    expect(payload.error.fieldErrors.accountId?.length).toBeGreaterThan(0);
  });
});
