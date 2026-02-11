import { memoryDb } from "@/lib/store/memory";
import type { BillingStatus, SallaStore, SallaTokenSet } from "@/lib/types/domain";

function defaultBilling(): BillingStatus {
  return {
    plan: "starter",
    trialEndsAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 14).toISOString(),
    status: "trial",
    limits: {
      monthlyContacts: 10_000,
      monthlyMessages: 50_000
    }
  };
}

export function upsertStore(params: {
  storeId: string;
  domain?: string;
  locale?: "ar" | "en";
  currency?: "SAR" | "USD";
  installStatus?: SallaStore["installStatus"];
  tokens?: SallaTokenSet;
}) {
  const existing = memoryDb.stores.get(params.storeId);

  const store: SallaStore = {
    id: params.storeId,
    domain: params.domain ?? existing?.store.domain ?? `${params.storeId}.salla.sa`,
    locale: params.locale ?? existing?.store.locale ?? "ar",
    currency: params.currency ?? existing?.store.currency ?? "SAR",
    installStatus: params.installStatus ?? existing?.store.installStatus ?? "pending",
    timezone: "Asia/Riyadh"
  };

  memoryDb.stores.set(params.storeId, {
    store,
    tokens: params.tokens ?? existing?.tokens,
    billing: existing?.billing ?? defaultBilling(),
    lastSyncCheckpoint: existing?.lastSyncCheckpoint
  });

  return store;
}

export function getStore(storeId: string) {
  return memoryDb.stores.get(storeId);
}

export function ensureStore(storeId: string) {
  const current = getStore(storeId);
  if (current) return current;

  const store = upsertStore({
    storeId,
    installStatus: "installed",
    locale: "ar",
    currency: "SAR"
  });

  return memoryDb.stores.get(store.id)!;
}

export function updateSyncCheckpoint(storeId: string, checkpoint: string) {
  const record = ensureStore(storeId);
  memoryDb.stores.set(storeId, {
    ...record,
    lastSyncCheckpoint: checkpoint
  });
}

export function getBillingStatus(storeId: string) {
  return ensureStore(storeId).billing;
}
