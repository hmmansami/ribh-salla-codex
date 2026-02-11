import { z } from "zod";

export const syncRunSchema = z.object({
  storeId: z.string().min(2),
  entities: z.array(z.enum(["customers", "orders", "products"])).min(1)
});

export const launchRunSchema = z.object({
  storeId: z.string().min(2),
  channels: z.array(z.enum(["email", "sms", "whatsapp"])).min(1),
  locale: z.enum(["ar", "en"]).default("ar"),
  guardrails: z
    .object({
      quietHours: z.string().default("23:00-08:00"),
      frequencyCapPerDay: z.number().int().min(1).max(20).default(2)
    })
    .default({ quietHours: "23:00-08:00", frequencyCapPerDay: 2 })
});

export const aiGenerateSchema = z.object({
  locale: z.enum(["ar", "en"]).default("ar"),
  campaignType: z.string().min(3),
  audienceId: z.string().min(2),
  channel: z.enum(["email", "sms", "whatsapp"]),
  tone: z.string().min(2),
  productRefs: z.array(z.string()).default([])
});

export const complianceSchema = z.object({
  channel: z.enum(["email", "sms", "whatsapp"]),
  region: z.string().default("SA"),
  messageType: z.enum(["marketing", "transactional"]),
  consentState: z.enum(["opted_in", "opted_out", "unknown"]),
  sendWindow: z.string().default("10:00")
});

export const toggleJourneySchema = z.object({
  storeId: z.string().min(2),
  enabled: z.boolean()
});
