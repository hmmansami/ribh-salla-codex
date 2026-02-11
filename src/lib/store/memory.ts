import type {
  BillingStatus,
  ConsentRecord,
  Journey,
  SallaStore,
  SallaTokenSet,
  WebhookEvent
} from "@/lib/types/domain";

type StoreRecord = {
  store: SallaStore;
  tokens?: SallaTokenSet;
  billing: BillingStatus;
  lastSyncCheckpoint?: string;
};

type MemoryDB = {
  stores: Map<string, StoreRecord>;
  journeys: Map<string, Journey[]>;
  consent: Map<string, ConsentRecord[]>;
  webhooks: Map<string, WebhookEvent>;
  processedWebhookIds: Set<string>;
};

declare global {
  // eslint-disable-next-line no-var
  var __RIBH_MEMORY_DB__: MemoryDB | undefined;
}

function createMemoryDb(): MemoryDB {
  return {
    stores: new Map(),
    journeys: new Map(),
    consent: new Map(),
    webhooks: new Map(),
    processedWebhookIds: new Set()
  };
}

export const memoryDb = global.__RIBH_MEMORY_DB__ ?? createMemoryDb();

if (!global.__RIBH_MEMORY_DB__) {
  global.__RIBH_MEMORY_DB__ = memoryDb;
}
