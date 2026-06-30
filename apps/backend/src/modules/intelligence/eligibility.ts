import type { ProductScores } from "./scoring.js";

export type RecommendationAction =
  | "REPLENISH"
  | "HOLD"
  | "REDUCE"
  | "PROMOTE"
  | "RETURN_TO_WAREHOUSE";

export interface EligibilityResult {
  eligible: boolean;
  action: RecommendationAction;
  reason: string;
}

const COMPOSITE_THRESHOLD = 0.6;
const LOW_STOCK_RATIO = 1.2;

export function evaluateEligibility(
  scores: ProductScores,
  availableQuantity: number,
  safetyStock: number,
  category: string,
): EligibilityResult {
  const stockRatio = availableQuantity / Math.max(safetyStock, 1);

  if (category === "perishable" && stockRatio > 2 && scores.demandScore < 0.3) {
    return {
      eligible: true,
      action: "RETURN_TO_WAREHOUSE",
      reason: "Excess perishable stock with low demand",
    };
  }

  if (stockRatio < LOW_STOCK_RATIO && scores.compositeScore >= COMPOSITE_THRESHOLD) {
    return {
      eligible: true,
      action: "REPLENISH",
      reason: "High demand signals with stock below safety threshold",
    };
  }

  if (scores.compositeScore >= COMPOSITE_THRESHOLD && stockRatio >= LOW_STOCK_RATIO) {
    return {
      eligible: true,
      action: "PROMOTE",
      reason: "Strong demand with adequate stock — optimize sales",
    };
  }

  if (scores.compositeScore < 0.3 && stockRatio > 1.5) {
    return {
      eligible: true,
      action: "REDUCE",
      reason: "Slow-moving inventory detected",
    };
  }

  return {
    eligible: false,
    action: "HOLD",
    reason: "No action required at current thresholds",
  };
}
