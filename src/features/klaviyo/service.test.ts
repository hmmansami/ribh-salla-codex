import { beforeEach, describe, expect, it } from "vitest";
import {
  ensureAccount,
  getAccount,
  getBillingStatus,
  getInstallContext,
  getSyncContext,
  updateSyncCheckpoint,
  upsertAccount
} from "@/features/klaviyo/service";
import { upsertStore } from "@/features/salla/service";
import { memoryDb } from "@/lib/store/memory";

function resetMemoryDb() {
  memoryDb.stores.clear();
  memoryDb.klaviyoAccounts.clear();
  memoryDb.journeys.clear();
  memoryDb.consent.clear();
  memoryDb.webhooks.clear();
  memoryDb.processedWebhookIds.clear();
}

describe("klaviyo service", () => {
  beforeEach(() => {
    resetMemoryDb();
  });

  it("upserts and loads Klaviyo account records", () => {
    const account = upsertAccount({
      accountId: "acc-1",
      accountName: "Klaviyo One",
      locale: "en",
      currency: "USD",
      installStatus: "installed",
      tokens: {
        apiKey: "pk_test_1",
        privateKey: "sk_test_1",
        scope: "profiles:read"
      }
    });

    expect(account.id).toBe("acc-1");
    expect(account.accountName).toBe("Klaviyo One");

    const loaded = getAccount("acc-1");
    expect(loaded?.account.id).toBe("acc-1");
    expect(loaded?.tokens?.apiKey).toBe("pk_test_1");
  });

  it("ensures account and updates sync checkpoint", () => {
    const ensured = ensureAccount("acc-2");
    expect(ensured.account.installStatus).toBe("installed");

    updateSyncCheckpoint("acc-2", "checkpoint-1");
    const loaded = getAccount("acc-2");
    expect(loaded?.lastSyncCheckpoint).toBe("checkpoint-1");
  });

  it("returns connector-specific install context in demo mode when tokens are missing", () => {
    upsertAccount({
      accountId: "acc-3",
      installStatus: "pending"
    });

    const context = getInstallContext("acc-3");
    expect(context.connector).toBe("klaviyo");
    expect(context.externalId).toBe("acc-3");
    expect(context.demoMode).toBe(true);
  });

  it("returns sync context in demo mode without credentials and non-demo with api key", () => {
    upsertAccount({
      accountId: "acc-4",
      installStatus: "installed"
    });

    const demoContext = getSyncContext("acc-4");
    expect(demoContext.connector).toBe("klaviyo");
    expect(demoContext.externalId).toBe("acc-4");
    expect(demoContext.demoMode).toBe(true);

    upsertAccount({
      accountId: "acc-4",
      tokens: {
        apiKey: "pk_live_1",
        scope: "profiles:read"
      }
    });

    const authenticatedContext = getSyncContext("acc-4");
    expect(authenticatedContext.connector).toBe("klaviyo");
    expect(authenticatedContext.externalId).toBe("acc-4");
    expect(authenticatedContext.demoMode).toBe(false);
  });

  it("keeps Salla records isolated when ids overlap", () => {
    upsertStore({
      storeId: "shared-id",
      installStatus: "installed"
    });

    upsertAccount({
      accountId: "shared-id",
      accountName: "Shared Klaviyo",
      installStatus: "installed"
    });

    const sallaRecord = memoryDb.stores.get("shared-id");
    const klaviyoRecord = memoryDb.klaviyoAccounts.get("shared-id");

    expect(sallaRecord?.store.id).toBe("shared-id");
    expect(sallaRecord?.store.domain).toBe("shared-id.salla.sa");
    expect(klaviyoRecord?.account.id).toBe("shared-id");
    expect(klaviyoRecord?.account.accountName).toBe("Shared Klaviyo");
    expect(getBillingStatus("shared-id").plan).toBe("starter");
  });
});