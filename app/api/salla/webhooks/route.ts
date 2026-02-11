import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { processWebhook, verifyWebhookSignature } from "@/features/salla/webhooks";

export async function POST(request: Request) {
  const rawBody = await request.text();
  const eventType = request.headers.get("x-salla-event") ?? "unknown.event";
  const eventId = request.headers.get("x-salla-event-id") ?? crypto.createHash("sha1").update(rawBody).digest("hex");
  const storeId = request.headers.get("x-salla-store-id") ?? "demo-salla-store";
  const signature = request.headers.get("x-salla-signature") ?? request.headers.get("x-signature");

  const verified = verifyWebhookSignature(rawBody, signature);
  if (!verified) {
    return NextResponse.json({ error: "Invalid webhook signature" }, { status: 401 });
  }

  const result = processWebhook({
    rawBody,
    eventId,
    eventType,
    storeId
  });

  return NextResponse.json({
    acknowledged: true,
    event: result
  });
}
