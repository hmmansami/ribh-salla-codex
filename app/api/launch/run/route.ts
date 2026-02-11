import { NextResponse } from "next/server";
import { launchRunSchema } from "@/lib/schemas/api";
import { runLaunchEngine } from "@/features/launch/engine";

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = launchRunSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const result = await runLaunchEngine(parsed.data);
  return NextResponse.json(result);
}
