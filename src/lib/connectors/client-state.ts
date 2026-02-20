import type { ConnectorId } from "@/lib/types/domain";
import {
  DEFAULT_CONNECTOR_EXTERNAL_IDS,
  resolveConnectorContext
} from "@/lib/connectors/context";

export const CONNECTOR_STORAGE_KEYS = {
  connector: "ribh_connector",
  externalId: "ribh_external_id",
  demoMode: "ribh_demo_mode",
  legacyStoreId: "ribh_store_id"
} as const;

export type StoredConnectorState = {
  connector: ConnectorId;
  externalId: string;
  demoMode: boolean;
};

function parseBoolean(value: string | null) {
  return value === "1" || value === "true";
}

export function readStoredConnectorState(): StoredConnectorState {
  if (typeof window === "undefined") {
    return {
      connector: "salla",
      externalId: DEFAULT_CONNECTOR_EXTERNAL_IDS.salla,
      demoMode: false
    };
  }

  const rawConnector = window.localStorage.getItem(
    CONNECTOR_STORAGE_KEYS.connector
  ) as ConnectorId | null;
  const legacyStoreId = window.localStorage.getItem(
    CONNECTOR_STORAGE_KEYS.legacyStoreId
  );
  const externalId = window.localStorage.getItem(
    CONNECTOR_STORAGE_KEYS.externalId
  );
  const resolved = resolveConnectorContext({
    connector: rawConnector ?? undefined,
    storeId: externalId ?? legacyStoreId ?? undefined
  });

  return {
    connector: resolved.connector,
    externalId: resolved.externalId,
    demoMode: parseBoolean(
      window.localStorage.getItem(CONNECTOR_STORAGE_KEYS.demoMode)
    )
  };
}

export function writeStoredConnectorState(state: StoredConnectorState) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(CONNECTOR_STORAGE_KEYS.connector, state.connector);
  window.localStorage.setItem(CONNECTOR_STORAGE_KEYS.externalId, state.externalId);
  window.localStorage.setItem(
    CONNECTOR_STORAGE_KEYS.demoMode,
    state.demoMode ? "true" : "false"
  );

  // Backward-compatible key used by existing pages and APIs.
  window.localStorage.setItem(CONNECTOR_STORAGE_KEYS.legacyStoreId, state.externalId);
}
