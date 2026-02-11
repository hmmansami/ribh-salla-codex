import type { ProviderAdapter } from "@/lib/providers/types";

function randomId(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}

export const emailAdapter: ProviderAdapter = {
  channel: "email",
  providerName: "default-email-adapter",
  async send(input) {
    const endpoint = process.env.EMAIL_PROVIDER_URL;
    const key = process.env.EMAIL_PROVIDER_KEY;

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
            provider: "email-live",
            channel: "email",
            status: "failed",
            messageId: randomId("email-failed"),
            detail: `Provider error: ${res.status}`
          };
        }

        return {
          provider: "email-live",
          channel: "email",
          status: "queued",
          messageId: randomId("email-live")
        };
      } catch (error) {
        return {
          provider: "email-live",
          channel: "email",
          status: "failed",
          messageId: randomId("email-exception"),
          detail: error instanceof Error ? error.message : "Unknown provider exception"
        };
      }
    }

    return {
      provider: "email-simulated",
      channel: "email",
      status: "simulated",
      messageId: randomId("email-sim")
    };
  }
};
