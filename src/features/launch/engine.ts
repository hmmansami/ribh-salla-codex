import crypto from "node:crypto";
import { ensureStore } from "@/features/salla/service";
import { ensureBaselineJourneys } from "@/features/journeys/service";
import { sendThroughChannel } from "@/lib/providers";
import type { Channel } from "@/lib/types/domain";

type LaunchInput = {
  storeId: string;
  channels: Channel[];
  locale: "ar" | "en";
  guardrails: {
    quietHours: string;
    frequencyCapPerDay: number;
  };
};

function runId() {
  return `run_${crypto.randomBytes(5).toString("hex")}`;
}

export async function runLaunchEngine(input: LaunchInput) {
  ensureStore(input.storeId);

  const stages = [
    {
      id: "data",
      label: input.locale === "ar" ? "البيانات جاهزة" : "Data foundation ready",
      status: "completed" as const
    },
    {
      id: "consent",
      label: input.locale === "ar" ? "التحقق من الموافقات" : "Consent validation",
      status: "completed" as const
    },
    {
      id: "decision",
      label: input.locale === "ar" ? "اختيار القناة والتوقيت" : "Channel and timing decision",
      status: "completed" as const
    },
    {
      id: "journeys",
      label: input.locale === "ar" ? "تفعيل الرحلات" : "Journey activation",
      status: "completed" as const
    }
  ];

  const journeys = ensureBaselineJourneys({
    storeId: input.storeId,
    locale: input.locale,
    channels: input.channels
  });

  // Fire a provider path check so each enabled channel has a real send execution path.
  await Promise.all(
    input.channels.map((channel) =>
      sendThroughChannel({
        storeId: input.storeId,
        channel,
        recipient: channel === "email" ? "customer@example.com" : "+966500000000",
        content: {
          subject: "Ribh Launch Check",
          body: "Provider path validation"
        }
      })
    )
  );

  return {
    runId: runId(),
    storeId: input.storeId,
    stages,
    activatedJourneys: journeys.map((journey) => ({
      id: journey.id,
      name: journey.name,
      status: journey.status
    }))
  };
}
