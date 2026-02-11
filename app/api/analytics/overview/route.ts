import { NextResponse } from "next/server";
import { getAnalyticsOverview } from "@/features/analytics/service";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const storeId = url.searchParams.get("storeId") ?? "demo-salla-store";
  const result = getAnalyticsOverview(storeId);

  return NextResponse.json(result);
}
