import {
  REPLENISHMENT_SCORE_THRESHOLD,
  REPLENISHMENT_SCORE_WEIGHTS,
  REORDER_QUANTITY_DEFAULTS,
} from "./intelligence.constants.js";

export interface ScoreInput {
  cartCount: number;
  avgRating: number;
  conversionRate: number;
  availableQuantity: number;
  safetyStock: number;
  category: string;
}

export interface ProductScores {
  demandScore: number;
  ratingScore: number;
  conversionScore: number;
  compositeScore: number;
}

export interface ReorderQuantityInput {
  /** Cart-add (or purchase) volume in the demand window */
  cartCount: number;
  windowHours?: number;
  leadTimeDays?: number;
  safetyBuffer?: number;
}

export function calculateDemandScore(cartCount: number, category: string): number {
  const baseline = category === "perishable" ? 5 : 2;
  return Math.min(cartCount / baseline, 1);
}

export function calculateRatingScore(avgRating: number): number {
  return avgRating / 5;
}

export function calculateConversionScore(conversionRate: number): number {
  return Math.min(conversionRate, 1);
}

/** Overall replenishment score: w1*demand + w2*rating + w3*conversion */
export function calculateCompositeScore(
  scores: Omit<ProductScores, "compositeScore">,
): number {
  return (
    scores.demandScore * REPLENISHMENT_SCORE_WEIGHTS.DEMAND +
    scores.ratingScore * REPLENISHMENT_SCORE_WEIGHTS.RATING +
    scores.conversionScore * REPLENISHMENT_SCORE_WEIGHTS.CONVERSION
  );
}

export function calculateReplenishmentScore(
  demandScore: number,
  ratingScore: number,
  conversionScore: number,
): number {
  return calculateCompositeScore({ demandScore, ratingScore, conversionScore });
}

/** Hard gate — below threshold the product is not a reorder candidate */
export function passesReplenishmentScoreGate(
  replenishmentScore: number,
  threshold: number = REPLENISHMENT_SCORE_THRESHOLD,
): boolean {
  return replenishmentScore >= threshold;
}

/**
 * Recommended reorder qty = demandRatePerDay × leadTimeDays × safetyBuffer
 * demandRatePerDay is derived from cart-add volume over the signal window.
 */
export function calculateReorderQuantity(input: ReorderQuantityInput): number {
  const windowHours =
    input.windowHours ?? REORDER_QUANTITY_DEFAULTS.DEMAND_WINDOW_HOURS;
  const leadTimeDays =
    input.leadTimeDays ?? REORDER_QUANTITY_DEFAULTS.LEAD_TIME_DAYS;
  const safetyBuffer =
    input.safetyBuffer ?? REORDER_QUANTITY_DEFAULTS.SAFETY_BUFFER;

  if (input.cartCount <= 0 || windowHours <= 0) {
    return 0;
  }

  const demandRatePerDay = input.cartCount / (windowHours / 24);
  return Math.max(0, Math.ceil(demandRatePerDay * leadTimeDays * safetyBuffer));
}

export function scoreProduct(input: ScoreInput): ProductScores {
  const demandScore = calculateDemandScore(input.cartCount, input.category);
  const ratingScore = calculateRatingScore(input.avgRating);
  const conversionScore = calculateConversionScore(input.conversionRate);
  const compositeScore = calculateCompositeScore({
    demandScore,
    ratingScore,
    conversionScore,
  });

  return { demandScore, ratingScore, conversionScore, compositeScore };
}
