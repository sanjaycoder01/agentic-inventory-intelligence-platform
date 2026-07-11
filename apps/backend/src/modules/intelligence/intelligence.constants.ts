export const INTELLIGENCE_ELIGIBILITY_THRESHOLDS = {
  MIN_DEMAND_SCORE: 0.6,
  MIN_CONVERSION_SCORE: 0.4,
  MIN_RATING_SCORE: 0.7,
  MAX_AVAILABLE_STOCK: 20,
  MIN_WAREHOUSE_STOCK: 1,
} as const;

/** PRD replenishment score weights — must sum to 1.0 */
export const REPLENISHMENT_SCORE_WEIGHTS = {
  DEMAND: 0.4,
  RATING: 0.3,
  CONVERSION: 0.3,
} as const;

/** Hard gate: product is not a reorder candidate below this overall score */
export const REPLENISHMENT_SCORE_THRESHOLD = 0.6;

/** Deterministic reorder quantity: demandRatePerDay × leadTimeDays × safetyBuffer */
export const REORDER_QUANTITY_DEFAULTS = {
  LEAD_TIME_DAYS: 2,
  SAFETY_BUFFER: 1.2,
  DEMAND_WINDOW_HOURS: 24,
} as const;
