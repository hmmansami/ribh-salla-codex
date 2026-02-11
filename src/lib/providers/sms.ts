import type { ProviderAdapter } from "@/lib/providers/types";

function randomId(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}

export const smsAdapter: ProviderAdapter = {
  channel: "sms",
  providerName: "default-sms-adapter",
  async send(input) {
    const endpoint = process.env.SMS_PROVIDER_URL;
    const key = process.env.SMS_PROVIDER_KEY;

    if (endpoint && key) {
      try {
        const res = await fetch(endpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${key}`
          },
          body: JSON.stringify(input)
        });

        if (!res.ok) {
          return {
            provider: "sms-live",
            channel: "sms",
            status: "failed",
            messageId: randomId("sms-failed"),
            detail: `Provider error: ${res.status}`
          };
        }

        return {
          provider: "sms-live",
          channel: "sms",
          status: "queued",
          messageId: randomId("sms-live")
        };
      } catch (error) {
        return {
          provider: "sms-live",
          channel: "sms",
          status: "failed",
          messageId: randomId("sms-exception"),
          detail: error instanceof Error ? error.message : "Unknown provider exception"
        };
      }
    }

    return {
      provider: "sms-simulated",
      channel: "sms",
      status: "simulated",
      messageId: randomId("sms-sim")
    };
  }
};
