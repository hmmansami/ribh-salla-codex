import { NextResponse } from "next/server";
import { evaluateBenchmark } from "@/features/benchmarks/service";
import { resolveConnectorContext } from "@/lib/connectors/context";
import { benchmarkQuerySchema } from "@/lib/schemas/api";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const parsed = benchmarkQuerySchema.safeParse({
    connector: url.searchParams.get("connector") ?? undefined,
    storeId: url.searchParams.get("storeId") ?? undefined,
    accountId: url.searchParams.get("accountId") ?? undefined,
    scenario: url.searchParams.get("scenario") ?? undefined
  });

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const context = resolveConnectorContext(parsed.data);
  const result = evaluateBenchmark({
    connector: context.connector,
    externalId: context.externalId,
    scenario: parsed.data.scenario
  });

  return NextResponse.json(result);
}
