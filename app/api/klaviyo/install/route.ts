import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { buildInstallUrl } from "@/features/klaviyo/oauth";
import { upsertAccount } from "@/features/klaviyo/service";
import { klaviyoInstallQuerySchema } from "@/lib/schemas/api";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const parsed = klaviyoInstallQuerySchema.safeParse({
    accountId: url.searchParams.get("accountId") ?? undefined
  });

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const accountId = parsed.data.accountId ?? "demo-klaviyo-account";
  const state = crypto.randomBytes(8).toString("hex");
  const liveOAuthConfigured = Boolean(
    process.env.KLAVIYO_CLIENT_ID && process.env.KLAVIYO_CLIENT_SECRET
  );

  upsertAccount({
    accountId,
    installStatus: "pending",
    locale: "ar",
    currency: "SAR"
  });

  const redirectUrl = buildInstallUrl({ accountId, state });

  return NextResponse.json({
    accountId,
    state,
    redirectUrl,
    demoMode: !liveOAuthConfigured,
    message:
      liveOAuthConfigured
        ? "Klaviyo install URL generated for live OAuth."
        : "Klaviyo install URL generated in fallback mode. Add env credentials for live OAuth exchange."
  });
}
