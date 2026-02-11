import { NextResponse } from "next/server";
import { getStoreBillingStatus } from "@/features/billing/service";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const storeId = url.searchParams.get("storeId") ?? "demo-salla-store";
  const billing = getStoreBillingStatus(storeId);

  return NextResponse.json(billing);
}
