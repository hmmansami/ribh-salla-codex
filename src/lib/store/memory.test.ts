import { beforeEach, describe, expect, it } from "vitest";
import { ensureStore, getStore, upsertStore, updateSyncCheckpoint } from "@/features/salla/service";
import { memoryDb } from "@/lib/store/memory";
import type { BillingStatus, KlaviyoAccount } from "@/lib/types/domain";

function resetMemoryDb() {
  memoryDb.stores.clear();
  memoryDb.klaviyoAccounts.clear();
  memoryDb.journeys.clear();
  memoryDb.consent.clear();
  memoryDb.webhooks.clear();
  memoryDb.processedWebhookIds.clear();
}

function billingFixture(): BillingStatus {
  return {
    plan: "starter",
    trialEndsAt: new Date("2026-01-01T00:00:00.000Z").toISOString(),
    status: "trial",
    limits: {
      monthlyContacts: 1000,
      monthlyMessages: 5000
    }
  };
}

describe("memoryDb connector boundaries", () => {
  beforeEach(() => {
    resetMemoryDb();
  });

  it("keeps Salla upsert/get behavior unchanged", () => {
    const store = upsertStore({
      storeId: "store-1",
      installStatus: "installed",
      locale: "en",
      currency: "USD"
    });

    expect(store.id).toBe("store-1");
    expect(store.domain).toBe("store-1.salla.sa");

    const loaded = getStore("store-1");
    expect(loaded?.store.id).toBe("store-1");
    expect(loaded?.store.installStatus).toBe("installed");
  });

  it("updates sync checkpoint for Salla without changing API", () => {
    ensureStore("store-2");
    updateSyncCheckpoint("store-2", "checkpoint-1");

    const loaded = getStore("store-2");
    expect(loaded?.lastSyncCheckpoint).toBe("checkpoint-1");
  });

  it("stores Klaviyo records separately from Salla records", () => {
    const account: KlaviyoAccount = {
      id: "shared-id",
      accountName: "Demo Account",
      locale: "en",
      currency: "USD",
      installStatus: "installed",
      timezone: "America/New_York"
    };

    memoryDb.klaviyoAccounts.set("shared-id", {
      account,
      tokens: {
        apiKey: "demo-key",
        scope: "profiles:read"
      },
      billing: billingFixture(),
      lastSyncCheckpoint: "klaviyo-checkpoint-1"
    });

    upsertStore({
      storeId: "shared-id",
      installStatus: "installed"
    });

    const sallaRecord = memoryDb.stores.get("shared-id");
    const klaviyoRecord = memoryDb.klaviyoAccounts.get("shared-id");

    expect(sallaRecord?.store.id).toBe("shared-id");
    expect(klaviyoRecord?.account.id).toBe("shared-id");
    expect(klaviyoRecord?.lastSyncCheckpoint).toBe("klaviyo-checkpoint-1");
    expect(sallaRecord?.store.domain).toBe("shared-id.salla.sa");
    expect(klaviyoRecord?.account.accountName).toBe("Demo Account");
  });
});
