import {
  ensureBaselineJourneys,
  getJourneys
} from "@/features/journeys/service";
import { core3Fixture } from "@/features/benchmarks/core3-fixtures";
import type {
  BenchmarkEvaluation,
  BenchmarkKpi,
  BenchmarkScenario,
  ConnectorId
} from "@/lib/types/domain";

const CORE3_IDS = new Set(["welcome", "abandon_cart", "post_purchase"]);

function round(value: number, digits: number) {
  return Number(value.toFixed(digits));
}

function ensureJourneyState(externalId: string, connector: ConnectorId) {
  const existing = getJourneys(externalId, connector);
  if (existing.length > 0) {
    return existing;
  }

  return ensureBaselineJourneys({
    storeId: externalId,
    connector,
    locale: "en",
    channels: ["email", "sms", "whatsapp"]
  });
}

export function evaluateBenchmark(params: {
  connector: ConnectorId;
  externalId: string;
  scenario?: BenchmarkScenario;
}): BenchmarkEvaluation {
  const scenario = params.scenario ?? "core3";
  const fixture = core3Fixture;
  const connectorFixture = fixture.connectors[params.connector];
  const journeys = ensureJourneyState(params.externalId, params.connector);

  const coreJourneys = journeys.filter((journey) => CORE3_IDS.has(journey.id));
  const activeCoreJourneys = coreJourneys.filter(
    (journey) => journey.status === "active"
  );
  const flowEnablementRate =
    coreJourneys.length === 0 ? 0 : activeCoreJourneys.length / coreJourneys.length;

  const predictedRecoveryRate = round(
    connectorFixture.predictedRecoveryRate * flowEnablementRate,
    4
  );
  const predictedRevenuePerContact = round(
    connectorFixture.predictedRevenuePerContact * flowEnablementRate,
    2
  );

  const kpis: BenchmarkKpi[] = [
    {
      name: "flow_enablement_rate",
      value: round(flowEnablementRate, 4),
      baseline: 1,
      pass: flowEnablementRate === 1
    },
    {
      name: "time_to_first_campaign_minutes",
      value: connectorFixture.timeToFirstCampaignMinutes,
      baseline: 15,
      pass: connectorFixture.timeToFirstCampaignMinutes <= 15
    },
    {
      name: "predicted_recovery_rate",
      value: predictedRecoveryRate,
      baseline: fixture.baseline.recoveryRate,
      pass: predictedRecoveryRate >= fixture.baseline.recoveryRate
    },
    {
      name: "predicted_revenue_per_contact",
      value: predictedRevenuePerContact,
      baseline: fixture.baseline.revenuePerContact,
      pass:
        predictedRevenuePerContact >= fixture.baseline.revenuePerContact
    }
  ];

  return {
    connector: params.connector,
    scenario,
    kpis,
    overallPass: kpis.every((kpi) => kpi.pass),
    evaluatedAt: new Date().toISOString()
  };
}
