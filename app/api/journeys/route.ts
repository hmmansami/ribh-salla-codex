import { NextResponse } from "next/server";
import { getJourneys, ensureBaselineJourneys } from "@/features/journeys/service";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const storeId = url.searchParams.get("storeId") ?? "demo-salla-store";

  const existing = getJourneys(storeId);
  const journeys =
    existing.length > 0
      ? existing
      : ensureBaselineJourneys({
          storeId,
          locale: "ar",
          channels: ["email", "sms", "whatsapp"]
        });

  return NextResponse.json({ storeId, journeys });
}
