import { NextResponse } from "next/server";
import { complianceSchema } from "@/lib/schemas/api";
import { validateCompliance } from "@/features/compliance/validator";

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = complianceSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const result = validateCompliance(parsed.data);
  return NextResponse.json(result);
}
