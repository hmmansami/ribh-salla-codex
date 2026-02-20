import { beforeEach, describe, expect, it, vi } from "vitest";
import { getAccount, upsertAccount } from "@/features/klaviyo/service";
import { runKlaviyoSync } from "@/features/klaviyo/sync";
import { memoryDb } from "@/lib/store/memory";

function resetMemoryDb() {
  memoryDb.stores.clear();
  memoryDb.klaviyoAccounts.clear();
  memoryDb.journeys.clear();
  memoryDb.consent.clear();
  memoryDb.webhooks.clear();
  memoryDb.processedWebhookIds.clear();
}

describe("klaviyo sync", () => {
  beforeEach(() => {
    resetMemoryDb();
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
    delete process.env.KLAVIYO_API_BASE_URL;
  });

  it("returns demo-mode counts and checkpoint when credentials are unavailable", async () => {
    upsertAccount({
      accountId: "acc-demo",
      installStatus: "installed"
    });

    const result = await runKlaviyoSync({
      accountId: "acc-demo",
      entities: ["customers", "orders", "products"]
    });

    expect(result.connector).toBe("klaviyo");
    expect(result.accountId).toBe("acc-demo");
    expect(result.summary).toEqual({
      customers: 860,
      orders: 215,
      products: 640
    });
    expect(result.context.connector).toBe("klaviyo");
    expect(result.context.externalId).toBe("acc-demo");
    expect(result.context.demoMode).toBe(true);
    expect(result.context.checkpoint).toBe(result.checkpoint);

    const stored = getAccount("acc-demo");
    expect(stored?.lastSyncCheckpoint).toBe(result.checkpoint);
  });

  it("uses live API counts when configured and falls back when shape is unknown", async () => {
    vi.stubEnv("KLAVIYO_API_BASE_URL", "https://api.klaviyo.test");

    upsertAccount({
      accountId: "acc-live",
      installStatus: "installed",
      tokens: {
        apiKey: "pk_live_123",
        scope: "profiles:read"
      }
    });

    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: [{ id: "1" }, { id: "2" }] })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ pagination: { total: 77 } })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ status: "ok" })
      });

    vi.stubGlobal("fetch", fetchMock);

    const result = await runKlaviyoSync({
      accountId: "acc-live",
      entities: ["customers", "orders", "products"]
    });

    expect(result.summary).toEqual({
      customers: 2,
      orders: 77,
      products: 640
    });
    expect(result.context.demoMode).toBe(false);
    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(fetchMock.mock.calls[0][0]).toBe("https://api.klaviyo.test/customers");
  });
});
