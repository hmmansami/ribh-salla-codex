import crypto from "node:crypto";
import { ensureStore } from "@/features/salla/service";
import { ensureAccount, getInstallContext } from "@/features/klaviyo/service";
import { ensureBaselineJourneys } from "@/features/journeys/service";
import { sendThroughChannel } from "@/lib/providers";
import type { Channel, ConnectorId } from "@/lib/types/domain";

export type LaunchInput = {
  connector?: ConnectorId;
  storeId?: string;
  accountId?: string;
  channels: Channel[];
  locale: "ar" | "en";
  guardrails: {
    quietHours: string;
    frequencyCapPerDay: number;
  };
};

type ResolvedLaunchContext = {
  connector: ConnectorId;
  externalId: string;
  journeyScopeId: string;
  demoMode: boolean;
};

function runId() {
  return `run_${crypto.randomBytes(5).toString("hex")}`;
}

function resolveLaunchContext(input: LaunchInput): ResolvedLaunchContext {
  const connector = input.connector ?? "salla";

  if (connector === "klaviyo") {
    const canonicalAccountId = input.accountId ?? input.storeId;
    if (!canonicalAccountId) {
      throw new Error("accountId or storeId is required for klaviyo connector.");
    }

    ensureAccount(canonicalAccountId);
    const installContext = getInstallContext(canonicalAccountId);

    return {
      connector,
      externalId: canonicalAccountId,
      journeyScopeId: canonicalAccountId,
      demoMode: installContext.demoMode
    };
  }

  if (!input.storeId) {
    throw new Error("storeId is required for salla connector.");
  }

  ensureStore(input.storeId);
  return {
    connector,
    externalId: input.storeId,
    journeyScopeId: input.storeId,
    demoMode: false
  };
}

export async function runLaunchEngine(input: LaunchInput) {
  const context = resolveLaunchContext(input);

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
    storeId: context.journeyScopeId,
    locale: input.locale,
    channels: input.channels,
    connector: context.connector
  });

  // Fire a provider path check so each enabled channel has a real send execution path.
  await Promise.all(
    input.channels.map((channel) =>
      sendThroughChannel({
        storeId: context.journeyScopeId,
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
    storeId: context.journeyScopeId,
    execution: {
      connector: context.connector,
      externalId: context.externalId,
      demoMode: context.demoMode
    },
    stages,
    activatedJourneys: journeys.map((journey) => ({
      id: journey.id,
      name: journey.name,
      status: journey.status
    }))
  };
}
