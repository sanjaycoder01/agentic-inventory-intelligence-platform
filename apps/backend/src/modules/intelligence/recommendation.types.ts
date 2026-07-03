import type { EligibilityResult } from "./eligibility.types.js";
import type { ProductSignals as AggregatedSignals } from "./signal-aggregator.types.js";

export type { AggregatedSignals, EligibilityResult };

export enum RecommendationType {
  REORDER = "REORDER",
  DO_NOT_REORDER = "DO_NOT_REORDER",
  RETURN_TO_WAREHOUSE = "RETURN_TO_WAREHOUSE",
  NO_ACTION = "NO_ACTION",
}

export type RecommendationReason =
  | "LOW_INVENTORY"
  | "HIGH_INVENTORY"
  | "WAREHOUSE_STOCK_AVAILABLE"
  | "NO_WAREHOUSE_STOCK"
  | "HIGH_DEMAND"
  | "LOW_DEMAND"
  | "GOOD_CONVERSION"
  | "LOW_CONVERSION"
  | "GOOD_RATING"
  | "LOW_RATING"
  | "NOT_ELIGIBLE"
  | "NO_RULE_MATCHED";

export type RecommendationRuleId =
  | "RULE_REORDER"
  | "RULE_DO_NOT_REORDER_LOW_CONVERSION"
  | "RULE_RETURN_TO_WAREHOUSE"
  | "RULE_NO_ACTION";

export interface RecommendationResult {
  recommendation: RecommendationType;
  confidence: number;
  matchedRule: RecommendationRuleId;
  reasons: RecommendationReason[];
}

export interface RecommendationRule {
  id: RecommendationRuleId;
  matches(
    signals: AggregatedSignals,
    eligibility: EligibilityResult,
  ): boolean;
  buildResult(
    signals: AggregatedSignals,
    eligibility: EligibilityResult,
  ): RecommendationResult;
}
