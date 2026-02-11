import type { ProviderAdapter } from "@/lib/providers/types";

function randomId(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}

export const whatsappAdapter: ProviderAdapter = {
  channel: "whatsapp",
  providerName: "default-whatsapp-adapter",
  async send(input) {
    const endpoint = process.env.WHATSAPP_PROVIDER_URL;
    const key = process.env.WHATSAPP_PROVIDER_KEY;

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
            provider: "whatsapp-live",
            channel: "whatsapp",
            status: "failed",
            messageId: randomId("wa-failed"),
            detail: `Provider error: ${res.status}`
          };
        }

        return {
          provider: "whatsapp-live",
          channel: "whatsapp",
          status: "queued",
          messageId: randomId("wa-live")
        };
      } catch (error) {
        return {
          provider: "whatsapp-live",
          channel: "whatsapp",
          status: "failed",
          messageId: randomId("wa-exception"),
          detail: error instanceof Error ? error.message : "Unknown provider exception"
        };
      }
    }

    return {
      provider: "whatsapp-simulated",
      channel: "whatsapp",
      status: "simulated",
      messageId: randomId("wa-sim")
    };
  }
};
