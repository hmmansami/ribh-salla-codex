import { NextResponse } from "next/server";
import { completeOAuth } from "@/features/salla/oauth";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const error = url.searchParams.get("error");
  const storeId =
    url.searchParams.get("store_id") ??
    url.searchParams.get("store") ??
    url.searchParams.get("storeId") ??
    "demo-salla-store";

  if (error) {
    const redirect = new URL(`/app/launch?oauth=error&reason=${encodeURIComponent(error)}`, url.origin);
    return NextResponse.redirect(redirect);
  }

  if (!code) {
    const redirect = new URL(`/app/launch?oauth=missing_code`, url.origin);
    return NextResponse.redirect(redirect);
  }

  await completeOAuth({
    code,
    storeId,
    locale: "ar"
  });

  const redirect = new URL(`/app/launch?oauth=success&storeId=${encodeURIComponent(storeId)}`, url.origin);
  return NextResponse.redirect(redirect);
}
