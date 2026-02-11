export type Channel = "email" | "sms" | "whatsapp";
export type JourneyStatus = "active" | "paused";

export type SallaStore = {
  id: string;
  domain: string;
  locale: "ar" | "en";
  currency: "SAR" | "USD";
  installStatus: "pending" | "installed" | "disconnected";
  timezone: string;
};

export type SallaTokenSet = {
  accessToken: string;
  refreshToken?: string;
  expiresAt: string;
  tokenType: string;
  scope: string;
};

export type WebhookEvent = {
  eventId: string;
  eventType: string;
  storeId: string;
  timestamp: string;
  payloadHash: string;
  status: "accepted" | "duplicate" | "failed";
};

export type ConsentRecord = {
  profileId: string;
  channel: Channel;
  marketingOptIn: boolean;
  transactionalOptIn: boolean;
  source: string;
  timestamp: string;
  region: string;
};

export type Journey = {
  id: string;
  name: string;
  trigger: string;
  channels: Channel[];
  fallbackPath: Channel[];
  frequencyCapPerDay: number;
  status: JourneyStatus;
  conversionRate: number;
  revenueImpact: number;
};

export type MessageVariant = {
  id: string;
  locale: "ar" | "en";
  channel: Channel;
  subjectOrHook: string;
  body: string;
  tone: string;
  personalizationFields: string[];
  score: number;
};

export type AttributionSnapshot = {
  model: "last_touch" | "linear";
  windowDays: number;
  channelBreakdown: { channel: Channel; revenue: number }[];
  totalAttributed: number;
};

export type IncrementalitySnapshot = {
  holdoutGroupSize: number;
  upliftPercent: number;
  confidence: number;
  estimatedIncrementalRevenue: number;
};

export type BillingStatus = {
  plan: "starter" | "growth" | "scale";
  trialEndsAt: string;
  status: "trial" | "active" | "past_due" | "cancelled";
  limits: {
    monthlyMessages: number;
    monthlyContacts: number;
  };
};
