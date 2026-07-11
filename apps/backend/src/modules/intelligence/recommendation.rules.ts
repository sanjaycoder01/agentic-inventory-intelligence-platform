import type {
  AggregatedSignals,
  EligibilityResult,
  RecommendationReason,
  RecommendationRule,
} from "./recommendation.types.js";
import { RecommendationType } from "./recommendation.types.js";

function clampScore(score: number): number {
  return Math.max(0, Math.min(score, 1));
}

function roundConfidence(confidence: number): number {
  return Math.round(clampScore(confidence) * 100) / 100;
}

function signalConfidence(signals: AggregatedSignals): number {
  return roundConfidence(
    (signals.demandScore + signals.conversionScore + signals.ratingScore) / 3,
  );
}

function inventoryConfidence(
  signals: AggregatedSignals,
  eligibility: EligibilityResult,
): number {
  const inventoryPressure = eligibility.checks.inventoryLow ? 1 : 0;
  const warehouseReadiness = eligibility.checks.warehouseHasStock ? 1 : 0;
  const scoreGate = eligibility.checks.scoreAboveThreshold ? 1 : 0;
  const replenishmentScore =
    eligibility.replenishmentScore ??
    signals.replenishmentScore ??
    (signals.demandScore + signals.conversionScore + signals.ratingScore) / 3;

  return roundConfidence(
    (replenishmentScore + inventoryPressure + warehouseReadiness + scoreGate) / 4,
  );
}

function noActionReasons(eligibility: EligibilityResult): RecommendationReason[] {
  const reasons: RecommendationReason[] = [];

  if (!eligibility.eligible) {
    reasons.push("NOT_ELIGIBLE");
  }

  if (!eligibility.checks.scoreAboveThreshold) {
    reasons.push("SCORE_BELOW_THRESHOLD");
  }

  if (!eligibility.checks.warehouseHasStock) {
    reasons.push("NO_WAREHOUSE_STOCK");
  }

  if (!eligibility.checks.demandHealthy) {
    reasons.push("LOW_DEMAND");
  }

  if (!eligibility.checks.conversionHealthy) {
    reasons.push("LOW_CONVERSION");
  }

  if (!eligibility.checks.ratingHealthy) {
    reasons.push("LOW_RATING");
  }

  return reasons.length > 0 ? reasons : ["NO_RULE_MATCHED"];
}

export const recommendationRules: RecommendationRule[] = [
  {
    id: "RULE_REORDER",
    // PRD hard gate: overall score clears threshold + low stock + warehouse can fulfill
    matches: (_signals, eligibility) => eligibility.eligible,
    buildResult: (signals, eligibility) => ({
      recommendation: RecommendationType.REORDER,
      confidence: inventoryConfidence(signals, eligibility),
      matchedRule: "RULE_REORDER",
      reasons: [
        "SCORE_ABOVE_THRESHOLD",
        "LOW_INVENTORY",
        "WAREHOUSE_STOCK_AVAILABLE",
        "HIGH_DEMAND",
        "GOOD_CONVERSION",
        "GOOD_RATING",
      ],
    }),
  },
  {
    id: "RULE_DO_NOT_REORDER_LOW_CONVERSION",
    matches: (_signals, eligibility) =>
      eligibility.checks.demandHealthy && !eligibility.checks.conversionHealthy,
    buildResult: (signals) => ({
      recommendation: RecommendationType.DO_NOT_REORDER,
      confidence: roundConfidence(
        (signals.demandScore + (1 - signals.conversionScore)) / 2,
      ),
      matchedRule: "RULE_DO_NOT_REORDER_LOW_CONVERSION",
      reasons: ["HIGH_DEMAND", "LOW_CONVERSION"],
    }),
  },
  {
    id: "RULE_RETURN_TO_WAREHOUSE",
    matches: (_signals, eligibility) =>
      !eligibility.checks.demandHealthy && !eligibility.checks.inventoryLow,
    buildResult: (signals) => ({
      recommendation: RecommendationType.RETURN_TO_WAREHOUSE,
      confidence: roundConfidence(
        ((1 - signals.demandScore) + signals.availableQuantity / 100) / 2,
      ),
      matchedRule: "RULE_RETURN_TO_WAREHOUSE",
      reasons: ["LOW_DEMAND", "HIGH_INVENTORY"],
    }),
  },
  {
    id: "RULE_NO_ACTION",
    matches: () => true,
    buildResult: (signals, eligibility) => ({
      recommendation: RecommendationType.NO_ACTION,
      confidence: signalConfidence(signals),
      matchedRule: "RULE_NO_ACTION",
      reasons: noActionReasons(eligibility),
    }),
  },
];
