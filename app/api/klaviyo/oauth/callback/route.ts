import { NextResponse } from "next/server";
import { completeOAuth } from "@/features/klaviyo/oauth";
import { klaviyoOAuthCallbackQuerySchema } from "@/lib/schemas/api";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const parsed = klaviyoOAuthCallbackQuerySchema.safeParse({
    code: url.searchParams.get("code") ?? undefined,
    error: url.searchParams.get("error") ?? undefined,
    account_id: url.searchParams.get("account_id") ?? undefined,
    account: url.searchParams.get("account") ?? undefined,
    accountId: url.searchParams.get("accountId") ?? undefined
  });

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { code, error, account_id, account, accountId } = parsed.data;
  const resolvedAccountId = account_id ?? account ?? accountId;

  if (error) {
    const redirect = new URL(`/app/launch?oauth=error&reason=${encodeURIComponent(error)}`, url.origin);
    return NextResponse.redirect(redirect);
  }

  if (!code || !resolvedAccountId) {
    return NextResponse.json(
      { error: { formErrors: ["Invalid OAuth callback state."], fieldErrors: {} } },
      { status: 400 }
    );
  }

  const { authContext } = await completeOAuth({
    code,
    accountId: resolvedAccountId,
    locale: "ar"
  });

  const mode = authContext.demoMode ? "demo" : "live";
  const redirect = new URL(
    `/app/launch?oauth=success&accountId=${encodeURIComponent(resolvedAccountId)}&connector=klaviyo&mode=${mode}`,
    url.origin
  );
  return NextResponse.redirect(redirect);
}
