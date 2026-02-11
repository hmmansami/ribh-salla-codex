import { describe, expect, it } from "vitest";
import { validateCompliance } from "@/features/compliance/validator";

describe("validateCompliance", () => {
  it("blocks marketing sends without opt-in", () => {
    const result = validateCompliance({
      channel: "sms",
      region: "SA",
      messageType: "marketing",
      consentState: "opted_out",
      sendWindow: "11:00"
    });

    expect(result.allowed).toBe(false);
    expect(result.violations.length).toBeGreaterThan(0);
  });

  it("allows transactional send without marketing consent", () => {
    const result = validateCompliance({
      channel: "email",
      region: "SA",
      messageType: "transactional",
      consentState: "unknown",
      sendWindow: "11:00"
    });

    expect(result.allowed).toBe(true);
    expect(result.requiredFixes.length).toBeGreaterThan(0);
  });

  it("blocks quiet-hour SMS", () => {
    const result = validateCompliance({
      channel: "sms",
      region: "SA",
      messageType: "marketing",
      consentState: "opted_in",
      sendWindow: "00:30"
    });

    expect(result.allowed).toBe(false);
    expect(result.violations.join(" ")).toContain("quiet hours");
  });
});
