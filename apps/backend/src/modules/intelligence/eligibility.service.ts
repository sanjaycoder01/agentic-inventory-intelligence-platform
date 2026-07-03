import { INTELLIGENCE_ELIGIBILITY_THRESHOLDS } from "./intelligence.constants.js";
import type {
  AggregatedSignals,
  EligibilityReason,
  EligibilityResult,
} from "./eligibility.types.js";

export class EligibilityService {
  evaluate(signals: AggregatedSignals): EligibilityResult {
    const checks = {
      inventoryLow:
        signals.availableQuantity <=
        INTELLIGENCE_ELIGIBILITY_THRESHOLDS.MAX_AVAILABLE_STOCK,
      warehouseHasStock:
        signals.warehouseStock >=
        INTELLIGENCE_ELIGIBILITY_THRESHOLDS.MIN_WAREHOUSE_STOCK,
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

    const reasons: EligibilityReason[] = [];

    if (!checks.inventoryLow) {
      reasons.push("INVENTORY_NOT_LOW");
    }

    if (!checks.warehouseHasStock) {
      reasons.push("NO_WAREHOUSE_STOCK");
    }

    if (!checks.demandHealthy) {
      reasons.push("LOW_DEMAND");
    }

    if (!checks.conversionHealthy) {
      reasons.push("LOW_CONVERSION");
    }

    if (!checks.ratingHealthy) {
      reasons.push("LOW_RATING");
    }

    return {
      eligible: reasons.length === 0,
      reasons,
      checks,
    };
  }
}

export const eligibilityService = new EligibilityService();
