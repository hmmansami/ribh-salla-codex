import { NextResponse } from "next/server";
import { getJourneys, ensureBaselineJourneys } from "@/features/journeys/service";
import { resolveConnectorContext } from "@/lib/connectors/context";
import { connectorQuerySchema } from "@/lib/schemas/api";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const parsed = connectorQuerySchema.safeParse({
    connector: url.searchParams.get("connector") ?? undefined,
    storeId: url.searchParams.get("storeId") ?? undefined,
    accountId: url.searchParams.get("accountId") ?? undefined
  });

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const context = resolveConnectorContext(parsed.data);
  const existing = getJourneys(context.externalId, context.connector);
  const journeys =
    existing.length > 0
      ? existing
      : ensureBaselineJourneys({
          storeId: context.externalId,
          locale: "ar",
          channels: ["email", "sms", "whatsapp"],
          connector: context.connector
        });

  return NextResponse.json({
    connector: context.connector,
    storeId: context.externalId,
    accountId: context.accountId,
    journeys
  });
}
