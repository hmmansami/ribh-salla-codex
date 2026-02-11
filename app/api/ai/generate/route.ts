import { NextResponse } from "next/server";
import { aiGenerateSchema } from "@/lib/schemas/api";
import { generateMessageVariants } from "@/features/ai/generator";

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = aiGenerateSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const variants = generateMessageVariants(parsed.data);

  return NextResponse.json({
    variants,
    reasoning:
      parsed.data.locale === "ar"
        ? "تم التوليد بناء على نوع الحملة والقناة والنغمة وسياق المنتجات."
        : "Generated from campaign type, channel, tone, and product context."
  });
}
