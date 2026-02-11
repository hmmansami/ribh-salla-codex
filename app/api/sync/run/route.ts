import { NextResponse } from "next/server";
import { syncRunSchema } from "@/lib/schemas/api";
import { runSync } from "@/features/salla/sync";

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = syncRunSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const result = await runSync(parsed.data);
  return NextResponse.json(result);
}
