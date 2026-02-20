import type { BenchmarkScenario, ConnectorId } from "@/lib/types/domain";

type Core3ConnectorFixture = {
  timeToFirstCampaignMinutes: number;
  predictedRecoveryRate: number;
  predictedRevenuePerContact: number;
};

export type Core3Fixture = {
  scenario: BenchmarkScenario;
  baseline: {
    recoveryRate: number;
    revenuePerContact: number;
  };
  connectors: Record<ConnectorId, Core3ConnectorFixture>;
};

export const core3Fixture: Core3Fixture = {
  scenario: "core3",
  baseline: {
    recoveryRate: 0.16,
    revenuePerContact: 38
  },
  connectors: {
    salla: {
      timeToFirstCampaignMinutes: 14,
      predictedRecoveryRate: 0.168,
      predictedRevenuePerContact: 41
    },
    klaviyo: {
      timeToFirstCampaignMinutes: 12,
      predictedRecoveryRate: 0.163,
      predictedRevenuePerContact: 39
    }
  }
};
