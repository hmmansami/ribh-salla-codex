import crypto from "node:crypto";
import { getInstallContext, upsertAccount } from "@/features/klaviyo/service";
import type { ConnectorAuthContext, KlaviyoTokenSet } from "@/lib/types/domain";

function digest(input: string) {
  return crypto.createHash("sha256").update(input).digest("hex");
}

function demoTokenSet(code: string): KlaviyoTokenSet {
  const accessDigest = digest(`klaviyo:${code}:api`);
  const privateDigest = digest(`klaviyo:${code}:private`);

  return {
    apiKey: `demo_pk_${accessDigest.slice(0, 24)}`,
    privateKey: `demo_sk_${privateDigest.slice(0, 24)}`,
    expiresAt: "2099-01-01T00:00:00.000Z",
    scope: "profiles:read profiles:write campaigns:read events:read"
  };
}

function isDemoTokenSet(tokens: KlaviyoTokenSet) {
  return tokens.apiKey.startsWith("demo_pk_");
}

function isLiveOAuthConfigured() {
  return Boolean(
    process.env.KLAVIYO_TOKEN_URL &&
      process.env.KLAVIYO_CLIENT_ID &&
      process.env.KLAVIYO_CLIENT_SECRET &&
      process.env.KLAVIYO_REDIRECT_URI
  );
}

export function buildInstallUrl(params: { accountId: string; state: string }) {
  const base = process.env.KLAVIYO_AUTH_BASE_URL ?? "https://www.klaviyo.com/oauth/authorize";
  const clientId = process.env.KLAVIYO_CLIENT_ID ?? "missing-client-id";
  const redirectUri = process.env.KLAVIYO_REDIRECT_URI ?? "http://localhost:3000/api/klaviyo/oauth/callback";

  const url = new URL(base);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("client_id", clientId);
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("scope", "profiles:read profiles:write campaigns:read events:read");
  url.searchParams.set("state", params.state);
  url.searchParams.set("account_id", params.accountId);

  return url.toString();
}

export async function exchangeCodeForToken(code: string): Promise<KlaviyoTokenSet> {
  if (isLiveOAuthConfigured()) {
    const body = new URLSearchParams({
      grant_type: "authorization_code",
      code,
      client_id: process.env.KLAVIYO_CLIENT_ID!,
      client_secret: process.env.KLAVIYO_CLIENT_SECRET!,
      redirect_uri: process.env.KLAVIYO_REDIRECT_URI!
    });

    try {
      const response = await fetch(process.env.KLAVIYO_TOKEN_URL!, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded"
        },
        body
      });

      if (response.ok) {
        const json = await response.json();
        return {
          apiKey: json.access_token ?? json.api_key ?? demoTokenSet(code).apiKey,
          privateKey: json.refresh_token ?? json.private_key,
          expiresAt:
            typeof json.expires_in === "number"
              ? new Date(Date.now() + json.expires_in * 1000).toISOString()
              : undefined,
          scope: json.scope
        };
      }
    } catch {
      return demoTokenSet(code);
    }
  }

  return demoTokenSet(code);
}

export async function completeOAuth(params: {
  code: string;
  accountId: string;
  locale?: "ar" | "en";
}) {
  const tokens = await exchangeCodeForToken(params.code);
  const account = upsertAccount({
    accountId: params.accountId,
    installStatus: "installed",
    locale: params.locale ?? "ar",
    currency: "SAR",
    tokens
  });

  const authContext: ConnectorAuthContext = {
    connector: "klaviyo",
    externalId: account.id,
    authenticatedAt: new Date().toISOString(),
    demoMode: !isLiveOAuthConfigured() || isDemoTokenSet(tokens)
  };

  const installContext = getInstallContext(account.id);

  return {
    account,
    tokens,
    authContext,
    installContext
  };
}
