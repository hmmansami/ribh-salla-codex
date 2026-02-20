import { beforeEach, describe, expect, it, vi } from "vitest";
import { buildInstallUrl, completeOAuth, exchangeCodeForToken } from "@/features/klaviyo/oauth";
import { getAccount } from "@/features/klaviyo/service";
import { memoryDb } from "@/lib/store/memory";

function resetMemoryDb() {
  memoryDb.stores.clear();
  memoryDb.klaviyoAccounts.clear();
  memoryDb.journeys.clear();
  memoryDb.consent.clear();
  memoryDb.webhooks.clear();
  memoryDb.processedWebhookIds.clear();
}

function clearKlaviyoEnv() {
  vi.unstubAllEnvs();
  delete process.env.KLAVIYO_AUTH_BASE_URL;
  delete process.env.KLAVIYO_CLIENT_ID;
  delete process.env.KLAVIYO_CLIENT_SECRET;
  delete process.env.KLAVIYO_REDIRECT_URI;
  delete process.env.KLAVIYO_TOKEN_URL;
}

describe("klaviyo oauth", () => {
  beforeEach(() => {
    resetMemoryDb();
    clearKlaviyoEnv();
    vi.restoreAllMocks();
  });

  it("builds install URL with defaults", () => {
    const url = new URL(buildInstallUrl({ accountId: "acc-1", state: "state-123" }));

    expect(url.origin).toBe("https://www.klaviyo.com");
    expect(url.pathname).toBe("/oauth/authorize");
    expect(url.searchParams.get("client_id")).toBe("missing-client-id");
    expect(url.searchParams.get("account_id")).toBe("acc-1");
    expect(url.searchParams.get("state")).toBe("state-123");
  });

  it("returns deterministic demo tokens when env vars are missing", async () => {
    const first = await exchangeCodeForToken("demo-code");
    const second = await exchangeCodeForToken("demo-code");
    const third = await exchangeCodeForToken("other-code");

    expect(first.apiKey).toBe(second.apiKey);
    expect(first.privateKey).toBe(second.privateKey);
    expect(first.apiKey).not.toBe(third.apiKey);
    expect(first.scope).toContain("profiles:read");
  });

  it("completes OAuth in demo mode and persists Klaviyo account", async () => {
    const result = await completeOAuth({
      code: "demo-code",
      accountId: "acc-2",
      locale: "en"
    });

    expect(result.account.id).toBe("acc-2");
    expect(result.account.installStatus).toBe("installed");
    expect(result.authContext.connector).toBe("klaviyo");
    expect(result.authContext.demoMode).toBe(true);

    const stored = getAccount("acc-2");
    expect(stored?.tokens?.apiKey).toBe(result.tokens.apiKey);
  });

  it("uses live token endpoint when configured", async () => {
    vi.stubEnv("KLAVIYO_TOKEN_URL", "https://example.com/oauth/token");
    vi.stubEnv("KLAVIYO_CLIENT_ID", "client-id");
    vi.stubEnv("KLAVIYO_CLIENT_SECRET", "client-secret");
    vi.stubEnv("KLAVIYO_REDIRECT_URI", "http://localhost:3000/api/klaviyo/oauth/callback");

    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({
        access_token: "live-pk",
        refresh_token: "live-sk",
        expires_in: 3600,
        scope: "profiles:read"
      })
    } as Response);

    const tokens = await exchangeCodeForToken("live-code");

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(tokens.apiKey).toBe("live-pk");
    expect(tokens.privateKey).toBe("live-sk");
    expect(tokens.scope).toBe("profiles:read");
  });
});
