import type { ProductSignals as AggregatedSignals } from "./signal-aggregator.types.js";

export type { AggregatedSignals };

export type EligibilityReason =
  | "INVENTORY_NOT_LOW"
  | "NO_WAREHOUSE_STOCK"
  | "LOW_DEMAND"
  | "LOW_CONVERSION"
  | "LOW_RATING";

export interface EligibilityChecks {
  inventoryLow: boolean;
  warehouseHasStock: boolean;
  demandHealthy: boolean;
  conversionHealthy: boolean;
  ratingHealthy: boolean;
}

export interface EligibilityResult {
  eligible: boolean;
  reasons: EligibilityReason[];
  checks: EligibilityChecks;
}
