import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { buildInstallUrl } from "@/features/salla/oauth";
import { upsertStore } from "@/features/salla/service";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const storeId = url.searchParams.get("storeId") ?? "demo-salla-store";
  const state = crypto.randomBytes(8).toString("hex");

  upsertStore({ storeId, installStatus: "pending", locale: "ar", currency: "SAR" });

  const redirectUrl = buildInstallUrl({ storeId, state });

  return NextResponse.json({
    storeId,
    state,
    redirectUrl,
    message:
      process.env.SALLA_CLIENT_ID && process.env.SALLA_CLIENT_SECRET
        ? "Salla install URL generated for live OAuth."
        : "Salla install URL generated in fallback mode. Add env credentials for live OAuth exchange."
  });
}
