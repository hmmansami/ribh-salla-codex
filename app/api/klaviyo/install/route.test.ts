import { beforeEach, describe, expect, it, vi } from "vitest";
import { GET as installRouteGET } from "./route";
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

describe("GET /api/klaviyo/install", () => {
  beforeEach(() => {
    resetMemoryDb();
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
    delete process.env.KLAVIYO_AUTH_BASE_URL;
    delete process.env.KLAVIYO_CLIENT_ID;
    delete process.env.KLAVIYO_CLIENT_SECRET;
    delete process.env.KLAVIYO_REDIRECT_URI;
  });

  it("creates install URL and pending account in fallback mode", async () => {
    const response = await installRouteGET(new Request("http://localhost:3000/api/klaviyo/install?accountId=acc-install-1"));
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.accountId).toBe("acc-install-1");
    expect(payload.redirectUrl).toContain("account_id=acc-install-1");
    expect(payload.redirectUrl).toContain("client_id=missing-client-id");
    expect(payload.message).toContain("fallback mode");
    expect(payload.demoMode).toBe(true);

    const stored = getAccount("acc-install-1");
    expect(stored?.account.installStatus).toBe("pending");
  });

  it("returns live-mode message when OAuth credentials are configured", async () => {
    vi.stubEnv("KLAVIYO_CLIENT_ID", "live-client-id");
    vi.stubEnv("KLAVIYO_CLIENT_SECRET", "live-client-secret");

    const response = await installRouteGET(new Request("http://localhost:3000/api/klaviyo/install?accountId=acc-install-2"));
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.message).toContain("live OAuth");
    expect(payload.redirectUrl).toContain("client_id=live-client-id");
    expect(payload.demoMode).toBe(false);
  });

  it("returns 400 with zod field errors for invalid accountId", async () => {
    const response = await installRouteGET(new Request("http://localhost:3000/api/klaviyo/install?accountId=a"));
    const payload = await response.json();

    expect(response.status).toBe(400);
    expect(payload.error.fieldErrors.accountId?.length).toBeGreaterThan(0);
  });
});
