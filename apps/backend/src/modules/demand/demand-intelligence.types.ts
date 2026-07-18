export type DemandVelocityLabel = "RISING" | "STABLE" | "FALLING";

export type DemandTrendLabel =
  | "VERY_LOW"
  | "LOW"
  | "NORMAL"
  | "HIGH"
  | "VERY_HIGH";

/** Multi-window cart volumes (net ADD − REMOVE, floored at 0) */
export interface DemandWindowCounts {
  last5Min: number;
  last30Min: number;
  last2Hours: number;
  last24Hours: number;
}

/**
 * Full demand intelligence snapshot — explainable intermediates + final score.
 * This is the demand component only; conversion/rating remain separate.
 */
export interface DemandIntelligenceMetrics extends DemandWindowCounts {
  velocity: DemandVelocityLabel;
  /** Percent change of 5‑min rate vs 30‑min rate (can be negative) */
  velocityPercent: number;
  /** Recent hourly rate vs historical avg hourly rate from 24h window */
  baselineMultiplier: number;
  trend: DemandTrendLabel;
  /** Normalized 0–1 demand score for replenishment composite */
  demandScore: number;
}

export interface ProductDemandDTO {
  productId: string;
  /** Backward-compatible alias of last24Hours */
  cartCount24h: number;
  demandScore: number;
  windowHours: number;
  demandIntelligence: DemandIntelligenceMetrics;
}
