import type { ConnectorId } from "@/lib/types/domain";

export const DEFAULT_CONNECTOR_EXTERNAL_IDS: Record<ConnectorId, string> = {
  salla: "demo-salla-store",
  klaviyo: "demo-klaviyo-account"
};

export type ConnectorContextInput = {
  connector?: ConnectorId;
  storeId?: string;
  accountId?: string;
};

export type ResolvedConnectorContext = {
  connector: ConnectorId;
  externalId: string;
  storeId: string;
  accountId?: string;
};

export function resolveConnectorContext(input: ConnectorContextInput): ResolvedConnectorContext {
  const connector = input.connector ?? "salla";

  if (connector === "klaviyo") {
    const externalId =
      input.accountId ?? input.storeId ?? DEFAULT_CONNECTOR_EXTERNAL_IDS.klaviyo;
    return {
      connector,
      externalId,
      storeId: externalId,
      accountId: externalId
    };
  }

  const externalId = input.storeId ?? DEFAULT_CONNECTOR_EXTERNAL_IDS.salla;
  return {
    connector,
    externalId,
    storeId: externalId
  };
}
