import type { Channel } from "@/lib/types/domain";

export type SendInput = {
  storeId: string;
  channel: Channel;
  recipient: string;
  content: {
    subject?: string;
    body: string;
  };
};

export type SendResult = {
  provider: string;
  channel: Channel;
  status: "queued" | "simulated" | "failed";
  messageId: string;
  detail?: string;
};

export type ProviderAdapter = {
  channel: Channel;
  providerName: string;
  send: (input: SendInput) => Promise<SendResult>;
};
