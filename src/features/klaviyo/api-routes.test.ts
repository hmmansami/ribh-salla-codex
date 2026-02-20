import { beforeEach, describe, expect, it, vi } from "vitest";
import { GET as installRouteGET } from "../../../app/api/klaviyo/install/route";
import { GET as callbackRouteGET } from "../../../app/api/klaviyo/oauth/callback/route";
import { GET as sallaInstallRouteGET } from "../../../app/api/salla/install/route";
import { GET as sallaCallbackRouteGET } from "../../../app/api/salla/oauth/callback/route";
import { getAccount, getInstallContext } from "@/features/klaviyo/service";
import { getStore } from "@/features/salla/service";
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

describe("klaviyo api routes", () => {
  beforeEach(() => {
    resetMemoryDb();
    clearKlaviyoEnv();
    vi.restoreAllMocks();
  });

  it("creates install URL and pending account from /api/klaviyo/install", async () => {
    const response = await installRouteGET(new Request("http://localhost:3000/api/klaviyo/install?accountId=acc-1"));
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.accountId).toBe("acc-1");
    expect(payload.redirectUrl).toContain("account_id=acc-1");

    const stored = getAccount("acc-1");
    expect(stored?.account.installStatus).toBe("pending");
  });

  it("returns 400 with zod-style error contract for invalid install query", async () => {
    const response = await installRouteGET(new Request("http://localhost:3000/api/klaviyo/install?accountId=a"));
    const payload = await response.json();

    expect(response.status).toBe(400);
    expect(payload.error.fieldErrors.accountId?.length).toBeGreaterThan(0);
  });

  it("redirects callback error state to launch error", async () => {
    const response = await callbackRouteGET(
      new Request("http://localhost:3000/api/klaviyo/oauth/callback?error=access_denied&accountId=acc-2")
    );

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe("http://localhost:3000/app/launch?oauth=error&reason=access_denied");
  });

  it("stores installed account and redirects success in demo mode when credentials are unavailable", async () => {
    const response = await callbackRouteGET(
      new Request("http://localhost:3000/api/klaviyo/oauth/callback?code=demo-code&accountId=acc-3")
    );

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toContain("oauth=success");
    expect(response.headers.get("location")).toContain("accountId=acc-3");
    expect(response.headers.get("location")).toContain("connector=klaviyo");
    expect(response.headers.get("location")).toContain("mode=demo");

    const stored = getAccount("acc-3");
    expect(stored?.account.installStatus).toBe("installed");
    expect(stored?.tokens?.apiKey.startsWith("demo_pk_")).toBe(true);

    const installContext = getInstallContext("acc-3");
    expect(installContext.connector).toBe("klaviyo");
    expect(installContext.externalId).toBe("acc-3");
    expect(installContext.installStatus).toBe("installed");
    expect(installContext.demoMode).toBe(true);
  });

  it("returns 400 for invalid callback query when code and error are both provided", async () => {
    const response = await callbackRouteGET(
      new Request("http://localhost:3000/api/klaviyo/oauth/callback?code=demo-code&error=denied&accountId=acc-4")
    );
    const payload = await response.json();

    expect(response.status).toBe(400);
    expect(payload.error.fieldErrors.error?.length).toBeGreaterThan(0);
  });

  it("returns 400 for callback query when code is provided without an account identifier", async () => {
    const response = await callbackRouteGET(new Request("http://localhost:3000/api/klaviyo/oauth/callback?code=demo-code"));
    const payload = await response.json();

    expect(response.status).toBe(400);
    expect(payload.error.fieldErrors.accountId?.length).toBeGreaterThan(0);
  });

  it("returns 400 for invalid callback query when no code or error is provided", async () => {
    const response = await callbackRouteGET(new Request("http://localhost:3000/api/klaviyo/oauth/callback?accountId=acc-5"));
    const payload = await response.json();

    expect(response.status).toBe(400);
    expect(payload.error.fieldErrors.code?.length).toBeGreaterThan(0);
  });

  it("keeps Salla install route behavior unchanged", async () => {
    const response = await sallaInstallRouteGET(new Request("http://localhost:3000/api/salla/install?storeId=salla-1"));
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.storeId).toBe("salla-1");
    expect(payload.redirectUrl).toContain("store_id=salla-1");

    const stored = getStore("salla-1");
    expect(stored?.store.installStatus).toBe("pending");
  });

  it("keeps Salla callback missing-code behavior unchanged", async () => {
    const response = await sallaCallbackRouteGET(new Request("http://localhost:3000/api/salla/oauth/callback?storeId=salla-2"));

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe("http://localhost:3000/app/launch?oauth=missing_code");
  });
});
