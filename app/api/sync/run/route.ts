import { NextResponse } from "next/server";
import { runKlaviyoSync } from "@/features/klaviyo/sync";
import { runSync } from "@/features/salla/sync";
import { syncRunSchema } from "@/lib/schemas/api";

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = syncRunSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  if (parsed.data.connector === "klaviyo") {
    const accountId = parsed.data.accountId ?? parsed.data.storeId!;
    const result = await runKlaviyoSync({
      accountId,
      entities: parsed.data.entities
    });
    return NextResponse.json(result);
  }

  const result = await runSync({
    storeId: parsed.data.storeId!,
    entities: parsed.data.entities
  });
  return NextResponse.json(result);
}
