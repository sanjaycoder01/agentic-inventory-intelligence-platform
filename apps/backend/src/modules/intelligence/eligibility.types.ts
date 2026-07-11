import type { ProductSignals as AggregatedSignals } from "./signal-aggregator.types.js";

export type { AggregatedSignals };

export type EligibilityReason =
  | "INVENTORY_NOT_LOW"
  | "NO_WAREHOUSE_STOCK"
  | "SCORE_BELOW_THRESHOLD"
  | "LOW_DEMAND"
  | "LOW_CONVERSION"
  | "LOW_RATING";

export interface EligibilityChecks {
  inventoryLow: boolean;
  warehouseHasStock: boolean;
  /** PRD hard gate: overall replenishment score >= threshold */
  scoreAboveThreshold: boolean;
  demandHealthy: boolean;
  conversionHealthy: boolean;
  ratingHealthy: boolean;
}

export interface EligibilityResult {
  /** True only when score clears the hard gate and stock/warehouse allow reorder */
  eligible: boolean;
  reasons: EligibilityReason[];
  checks: EligibilityChecks;
  replenishmentScore: number;
}
