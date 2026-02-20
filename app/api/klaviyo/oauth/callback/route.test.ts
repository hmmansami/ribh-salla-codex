import { beforeEach, describe, expect, it, vi } from "vitest";
import { GET as callbackRouteGET } from "./route";
import { getAccount, getInstallContext } from "@/features/klaviyo/service";
import { memoryDb } from "@/lib/store/memory";

function resetMemoryDb() {
  memoryDb.stores.clear();
  memoryDb.klaviyoAccounts.clear();
  memoryDb.journeys.clear();
  memoryDb.consent.clear();
  memoryDb.webhooks.clear();
  memoryDb.processedWebhookIds.clear();
}

describe("GET /api/klaviyo/oauth/callback", () => {
  beforeEach(() => {
    resetMemoryDb();
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
    delete process.env.KLAVIYO_TOKEN_URL;
    delete process.env.KLAVIYO_CLIENT_ID;
    delete process.env.KLAVIYO_CLIENT_SECRET;
    delete process.env.KLAVIYO_REDIRECT_URI;
  });

  it("redirects oauth errors to launch with reason", async () => {
    const response = await callbackRouteGET(
      new Request("http://localhost:3000/api/klaviyo/oauth/callback?error=access_denied&accountId=acc-oauth-1")
    );

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe("http://localhost:3000/app/launch?oauth=error&reason=access_denied");
  });

  it("completes OAuth in demo mode when live env is missing", async () => {
    const response = await callbackRouteGET(
      new Request("http://localhost:3000/api/klaviyo/oauth/callback?code=demo-code&accountId=acc-oauth-2")
    );

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toContain("oauth=success");
    expect(response.headers.get("location")).toContain("accountId=acc-oauth-2");
    expect(response.headers.get("location")).toContain("connector=klaviyo");
    expect(response.headers.get("location")).toContain("mode=demo");

    const stored = getAccount("acc-oauth-2");
    expect(stored?.account.installStatus).toBe("installed");
    expect(stored?.tokens?.apiKey.startsWith("demo_pk_")).toBe(true);

    const installContext = getInstallContext("acc-oauth-2");
    expect(installContext.demoMode).toBe(true);
  });

  it("completes OAuth in live mode when env and token exchange are configured", async () => {
    vi.stubEnv("KLAVIYO_TOKEN_URL", "https://example.com/oauth/token");
    vi.stubEnv("KLAVIYO_CLIENT_ID", "live-client-id");
    vi.stubEnv("KLAVIYO_CLIENT_SECRET", "live-client-secret");
    vi.stubEnv("KLAVIYO_REDIRECT_URI", "http://localhost:3000/api/klaviyo/oauth/callback");

    vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({
        access_token: "live_pk_123",
        refresh_token: "live_sk_456",
        expires_in: 3600,
        scope: "profiles:read"
      })
    } as Response);

    const response = await callbackRouteGET(
      new Request("http://localhost:3000/api/klaviyo/oauth/callback?code=live-code&accountId=acc-oauth-3")
    );

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toContain("mode=live");

    const stored = getAccount("acc-oauth-3");
    expect(stored?.tokens?.apiKey).toBe("live_pk_123");

    const installContext = getInstallContext("acc-oauth-3");
    expect(installContext.demoMode).toBe(false);
  });

  it("returns 400 for invalid callback query", async () => {
    const response = await callbackRouteGET(new Request("http://localhost:3000/api/klaviyo/oauth/callback?code=demo-code"));
    const payload = await response.json();

    expect(response.status).toBe(400);
    expect(payload.error.fieldErrors.accountId?.length).toBeGreaterThan(0);
  });
});
