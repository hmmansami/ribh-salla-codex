import { getBillingStatus, ensureStore } from "@/features/salla/service";

export function getStoreBillingStatus(storeId: string) {
  ensureStore(storeId);
  return getBillingStatus(storeId);
}
