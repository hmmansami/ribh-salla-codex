import type { Channel } from "@/lib/types/domain";

type ValidateInput = {
  channel: Channel;
  region: string;
  messageType: "marketing" | "transactional";
  consentState: "opted_in" | "opted_out" | "unknown";
  sendWindow: string;
};

function isInQuietHours(sendWindow: string) {
  const [hourString] = sendWindow.split(":");
  const hour = Number(hourString);
  if (Number.isNaN(hour)) return false;

  return hour >= 23 || hour < 8;
}

export function validateCompliance(input: ValidateInput) {
  const violations: string[] = [];
  const requiredFixes: string[] = [];

  if (input.messageType === "marketing" && input.consentState !== "opted_in") {
    violations.push("Marketing send attempted without explicit opt-in consent.");
    requiredFixes.push("Collect and store explicit marketing consent before sending.");
  }

  if (input.messageType === "transactional" && input.consentState === "unknown") {
    requiredFixes.push("Mark transactional basis/source for audit traceability.");
  }

  if ((input.channel === "sms" || input.channel === "whatsapp") && isInQuietHours(input.sendWindow)) {
    violations.push("SMS/WhatsApp send is inside quiet hours (23:00-08:00).");
    requiredFixes.push("Schedule message outside quiet hours or switch to email fallback.");
  }

  if (input.region.toUpperCase() === "SA" && input.channel !== "email" && input.messageType === "marketing") {
    requiredFixes.push("Keep localized disclosure text and sender identity in campaign template.");
  }

  return {
    allowed: violations.length === 0,
    violations,
    requiredFixes
  };
}
