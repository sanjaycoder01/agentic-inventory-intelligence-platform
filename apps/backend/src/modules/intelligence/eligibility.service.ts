import {
  INTELLIGENCE_ELIGIBILITY_THRESHOLDS,
  REPLENISHMENT_SCORE_THRESHOLD,
} from "./intelligence.constants.js";
import {
  calculateReplenishmentScore,
  passesReplenishmentScoreGate,
} from "./scoring.js";
import type {
  AggregatedSignals,
  EligibilityReason,
  EligibilityResult,
} from "./eligibility.types.js";

export class EligibilityService {
  evaluate(signals: AggregatedSignals): EligibilityResult {
    const replenishmentScore =
      signals.replenishmentScore ??
      calculateReplenishmentScore(
        signals.demandScore,
        signals.ratingScore,
        signals.conversionScore,
      );

    const checks = {
      inventoryLow:
        signals.availableQuantity <=
        INTELLIGENCE_ELIGIBILITY_THRESHOLDS.MAX_AVAILABLE_STOCK,
      warehouseHasStock:
        signals.warehouseStock >=
        INTELLIGENCE_ELIGIBILITY_THRESHOLDS.MIN_WAREHOUSE_STOCK,
      scoreAboveThreshold: passesReplenishmentScoreGate(
        replenishmentScore,
        REPLENISHMENT_SCORE_THRESHOLD,
      ),
      demandHealthy:
        signals.demandScore >=
        INTELLIGENCE_ELIGIBILITY_THRESHOLDS.MIN_DEMAND_SCORE,
      conversionHealthy:
        signals.conversionScore >=
        INTELLIGENCE_ELIGIBILITY_THRESHOLDS.MIN_CONVERSION_SCORE,
      ratingHealthy:
        signals.ratingScore >=
        INTELLIGENCE_ELIGIBILITY_THRESHOLDS.MIN_RATING_SCORE,
    };

    // PRD hard gate: overall score + stock need + warehouse availability
    const eligible =
      checks.scoreAboveThreshold &&
      checks.inventoryLow &&
      checks.warehouseHasStock;

    const reasons: EligibilityReason[] = [];

    if (!checks.scoreAboveThreshold) {
      reasons.push("SCORE_BELOW_THRESHOLD");
    }
    if (!checks.inventoryLow) {
      reasons.push("INVENTORY_NOT_LOW");
    }
    if (!checks.warehouseHasStock) {
      reasons.push("NO_WAREHOUSE_STOCK");
    }

    // Sub-score weaknesses for explainability when not a reorder candidate
    if (!eligible) {
      if (!checks.demandHealthy) {
        reasons.push("LOW_DEMAND");
      }
      if (!checks.conversionHealthy) {
        reasons.push("LOW_CONVERSION");
      }
      if (!checks.ratingHealthy) {
        reasons.push("LOW_RATING");
      }
    }

    return {
      eligible,
      reasons,
      checks,
      replenishmentScore,
    };
  }
}

export const eligibilityService = new EligibilityService();
