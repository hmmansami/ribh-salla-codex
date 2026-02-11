import crypto from "node:crypto";
import { upsertStore } from "@/features/salla/service";
import type { SallaTokenSet } from "@/lib/types/domain";

function randomToken(prefix: string) {
  return `${prefix}_${crypto.randomBytes(12).toString("hex")}`;
}

export function buildInstallUrl(params: { storeId: string; state: string }) {
  const base = process.env.SALLA_AUTH_BASE_URL ?? "https://accounts.salla.sa/oauth2/auth";
  const clientId = process.env.SALLA_CLIENT_ID ?? "missing-client-id";
  const redirectUri = process.env.SALLA_REDIRECT_URI ?? "http://localhost:3000/api/salla/oauth/callback";

  const url = new URL(base);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("client_id", clientId);
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("scope", "offline_access customers.read orders.read products.read");
  url.searchParams.set("state", params.state);
  url.searchParams.set("store_id", params.storeId);

  return url.toString();
}

export async function exchangeCodeForToken(code: string): Promise<SallaTokenSet> {
  const tokenUrl = process.env.SALLA_TOKEN_URL;
  const clientId = process.env.SALLA_CLIENT_ID;
  const clientSecret = process.env.SALLA_CLIENT_SECRET;
  const redirectUri = process.env.SALLA_REDIRECT_URI;

  if (tokenUrl && clientId && clientSecret && redirectUri) {
    const body = new URLSearchParams({
      grant_type: "authorization_code",
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri
    });

    const response = await fetch(tokenUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body
    });

    if (response.ok) {
      const json = await response.json();
      return {
        accessToken: json.access_token,
        refreshToken: json.refresh_token,
        expiresAt: new Date(Date.now() + (json.expires_in ?? 3600) * 1000).toISOString(),
        tokenType: json.token_type ?? "Bearer",
        scope: json.scope ?? ""
      };
    }
  }

  return {
    accessToken: randomToken("mock_access"),
    refreshToken: randomToken("mock_refresh"),
    expiresAt: new Date(Date.now() + 1000 * 60 * 60).toISOString(),
    tokenType: "Bearer",
    scope: "customers.read orders.read products.read"
  };
}

export async function completeOAuth(params: {
  code: string;
  storeId: string;
  locale?: "ar" | "en";
}) {
  const tokens = await exchangeCodeForToken(params.code);
  const store = upsertStore({
    storeId: params.storeId,
    installStatus: "installed",
    locale: params.locale ?? "ar",
    currency: "SAR",
    tokens
  });

  return {
    store,
    tokens
  };
}
