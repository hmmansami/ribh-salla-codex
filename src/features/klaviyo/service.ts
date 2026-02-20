import { memoryDb } from "@/lib/store/memory";
import type {
  BillingStatus,
  ConnectorInstallContext,
  ConnectorSyncContext,
  KlaviyoAccount,
  KlaviyoTokenSet
} from "@/lib/types/domain";

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

function isDemoTokenSet(tokens?: KlaviyoTokenSet) {
  if (!tokens?.apiKey) return true;
  return tokens.apiKey.startsWith("demo_pk_");
}

export function upsertAccount(params: {
  accountId: string;
  accountName?: string;
  locale?: "ar" | "en";
  currency?: "SAR" | "USD";
  timezone?: string;
  installStatus?: KlaviyoAccount["installStatus"];
  tokens?: KlaviyoTokenSet;
}) {
  const existing = memoryDb.klaviyoAccounts.get(params.accountId);

  const account: KlaviyoAccount = {
    id: params.accountId,
    accountName: params.accountName ?? existing?.account.accountName ?? `Klaviyo ${params.accountId}`,
    locale: params.locale ?? existing?.account.locale ?? "ar",
    currency: params.currency ?? existing?.account.currency ?? "SAR",
    installStatus: params.installStatus ?? existing?.account.installStatus ?? "pending",
    timezone: params.timezone ?? existing?.account.timezone ?? "Asia/Riyadh"
  };

  memoryDb.klaviyoAccounts.set(params.accountId, {
    account,
    tokens: params.tokens ?? existing?.tokens,
    billing: existing?.billing ?? defaultBilling(),
    lastSyncCheckpoint: existing?.lastSyncCheckpoint
  });

  return account;
}

export function getAccount(accountId: string) {
  return memoryDb.klaviyoAccounts.get(accountId);
}

export function ensureAccount(accountId: string) {
  const current = getAccount(accountId);
  if (current) return current;

  const account = upsertAccount({
    accountId,
    installStatus: "installed",
    locale: "ar",
    currency: "SAR"
  });

  return memoryDb.klaviyoAccounts.get(account.id)!;
}

export function updateSyncCheckpoint(accountId: string, checkpoint: string) {
  const record = ensureAccount(accountId);
  memoryDb.klaviyoAccounts.set(accountId, {
    ...record,
    lastSyncCheckpoint: checkpoint
  });
}

export function getBillingStatus(accountId: string) {
  return ensureAccount(accountId).billing;
}

export function getInstallContext(accountId: string): ConnectorInstallContext {
  const record = ensureAccount(accountId);
  return {
    connector: "klaviyo",
    externalId: record.account.id,
    locale: record.account.locale,
    timezone: record.account.timezone,
    installStatus: record.account.installStatus,
    demoMode: isDemoTokenSet(record.tokens)
  };
}

export function getSyncContext(accountId: string): ConnectorSyncContext {
  const record = ensureAccount(accountId);
  return {
    connector: "klaviyo",
    externalId: record.account.id,
    checkpoint: record.lastSyncCheckpoint,
    syncedAt: new Date().toISOString(),
    demoMode: isDemoTokenSet(record.tokens)
  };
}
