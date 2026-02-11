import { describe, expect, it } from "vitest";
import { generateMessageVariants } from "@/features/ai/generator";

describe("generateMessageVariants", () => {
  it("returns 3 ranked variants", () => {
    const variants = generateMessageVariants({
      locale: "en",
      campaignType: "abandon_cart",
      audienceId: "high_intent",
      channel: "whatsapp",
      tone: "confident",
      productRefs: ["sku-1", "sku-2"]
    });

    expect(variants).toHaveLength(3);
    expect(variants[0].score).toBeGreaterThan(variants[2].score);
  });

  it("creates arabic copy when locale is ar", () => {
    const variants = generateMessageVariants({
      locale: "ar",
      campaignType: "welcome",
      audienceId: "new_customers",
      channel: "email",
      tone: "friendly",
      productRefs: ["sku-9"]
    });

    expect(variants[0].subjectOrHook).toContain("عرض");
  });
});
