import crypto from "node:crypto";
import { memoryDb } from "@/lib/store/memory";
import type { WebhookEvent } from "@/lib/types/domain";
import { ensureStore } from "@/features/salla/service";

function hashPayload(payload: string) {
  return crypto.createHash("sha256").update(payload).digest("hex");
}

export function verifyWebhookSignature(payload: string, signature: string | null) {
  const secret = process.env.SALLA_WEBHOOK_SECRET;
  if (!secret) return true;
  if (!signature) return false;

  const digestHex = crypto.createHmac("sha256", secret).update(payload).digest("hex");
  const digestBase64 = crypto.createHmac("sha256", secret).update(payload).digest("base64");

  return signature === digestHex || signature === digestBase64;
}

export function processWebhook(params: {
  rawBody: string;
  eventType: string;
  eventId: string;
  storeId: string;
}) {
  if (memoryDb.processedWebhookIds.has(params.eventId)) {
    const duplicate: WebhookEvent = {
      eventId: params.eventId,
      eventType: params.eventType,
      storeId: params.storeId,
      timestamp: new Date().toISOString(),
      payloadHash: hashPayload(params.rawBody),
      status: "duplicate"
    };

    memoryDb.webhooks.set(params.eventId, duplicate);
    return duplicate;
  }

  ensureStore(params.storeId);

  const event: WebhookEvent = {
    eventId: params.eventId,
    eventType: params.eventType,
    storeId: params.storeId,
    timestamp: new Date().toISOString(),
    payloadHash: hashPayload(params.rawBody),
    status: "accepted"
  };

  memoryDb.processedWebhookIds.add(params.eventId);
  memoryDb.webhooks.set(params.eventId, event);
  return event;
}
