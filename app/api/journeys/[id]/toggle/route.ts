import { NextResponse } from "next/server";
import { toggleJourney } from "@/features/journeys/service";
import { resolveConnectorContext } from "@/lib/connectors/context";
import { toggleJourneySchema } from "@/lib/schemas/api";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();
  const parsed = toggleJourneySchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const context = resolveConnectorContext(parsed.data);
  const updated = toggleJourney({
    connector: context.connector,
    storeId: context.externalId,
    journeyId: id,
    enabled: parsed.data.enabled
  });

  if (!updated) {
    return NextResponse.json({ error: "Journey not found" }, { status: 404 });
  }

  return NextResponse.json({ journey: updated });
}
