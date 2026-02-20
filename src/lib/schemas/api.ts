import { z } from "zod";

const syncEntitySchema = z.enum(["customers", "orders", "products"]);
const connectorSchema = z.enum(["salla", "klaviyo"]);
const benchmarkScenarioSchema = z.enum(["core3"]);

export const syncRunSchema = z
  .object({
    connector: connectorSchema.default("salla"),
    storeId: z.string().min(2).optional(),
    accountId: z.string().min(2).optional(),
    entities: z.array(syncEntitySchema).min(1)
  })
  .superRefine((value, ctx) => {
    if (value.connector === "salla" && !value.storeId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "storeId is required for salla connector.",
        path: ["storeId"]
      });
    }

    if (value.connector === "klaviyo" && !value.accountId && !value.storeId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "accountId is required for klaviyo connector.",
        path: ["accountId"]
      });
    }
  });

export const launchRunSchema = z
  .object({
    connector: connectorSchema.default("salla"),
    storeId: z.string().min(2).optional(),
    accountId: z.string().min(2).optional(),
    channels: z.array(z.enum(["email", "sms", "whatsapp"])).min(1),
    locale: z.enum(["ar", "en"]).default("ar"),
    guardrails: z
      .object({
        quietHours: z.string().default("23:00-08:00"),
        frequencyCapPerDay: z.number().int().min(1).max(20).default(2)
      })
      .default({ quietHours: "23:00-08:00", frequencyCapPerDay: 2 })
  })
  .superRefine((value, ctx) => {
    if (value.connector === "salla" && !value.storeId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "storeId is required for salla connector.",
        path: ["storeId"]
      });
    }

    if (value.connector === "klaviyo" && !value.accountId && !value.storeId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "accountId is required for klaviyo connector.",
        path: ["accountId"]
      });
    }
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
  connector: connectorSchema.default("salla"),
  storeId: z.string().min(2).optional(),
  accountId: z.string().min(2).optional(),
  enabled: z.boolean()
}).superRefine((value, ctx) => {
  if (value.connector === "salla" && !value.storeId) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "storeId is required for salla connector.",
      path: ["storeId"]
    });
  }

  if (value.connector === "klaviyo" && !value.accountId && !value.storeId) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "accountId is required for klaviyo connector.",
      path: ["accountId"]
    });
  }
});

export const connectorQuerySchema = z.object({
  connector: connectorSchema.default("salla"),
  storeId: z.string().min(2).optional(),
  accountId: z.string().min(2).optional()
});

export const benchmarkQuerySchema = connectorQuerySchema.extend({
  scenario: benchmarkScenarioSchema.default("core3")
});

export const klaviyoInstallQuerySchema = z.object({
  accountId: z.string().min(2).optional()
});

export const klaviyoOAuthCallbackQuerySchema = z
  .object({
    code: z.string().min(1).optional(),
    error: z.string().min(1).optional(),
    account_id: z.string().min(2).optional(),
    account: z.string().min(2).optional(),
    accountId: z.string().min(2).optional()
  })
  .superRefine((value, ctx) => {
    const hasCode = Boolean(value.code);
    const hasError = Boolean(value.error);
    const hasAccountIdentifier = Boolean(value.account_id ?? value.account ?? value.accountId);

    if (!hasCode && !hasError) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Either code or error must be provided.",
        path: ["code"]
      });
      return;
    }

    if (hasCode && hasError) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "code and error cannot both be provided.",
        path: ["error"]
      });
    }

    if (hasCode && !hasAccountIdentifier) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "account identifier is required when code is provided.",
        path: ["accountId"]
      });
    }
  });
