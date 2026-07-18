/**
 * Demand Intelligence configuration — multi-window demand for replenishment.
 * Tune via env overrides where noted; defaults match quick-commerce signal windows.
 */

/** Rolling windows in minutes */
export const DEMAND_WINDOWS = {
  /** DEMAND_WINDOW_5_MIN */
  FIVE_MIN: Number(process.env.DEMAND_WINDOW_5_MIN ?? 5),
  /** DEMAND_WINDOW_30_MIN */
  THIRTY_MIN: Number(process.env.DEMAND_WINDOW_30_MIN ?? 30),
  /** DEMAND_WINDOW_2_HOUR (minutes) */
  TWO_HOURS: Number(process.env.DEMAND_WINDOW_2_HOUR ?? 120),
  /** BASELINE_WINDOW_24_HOUR (minutes) */
  TWENTY_FOUR_HOURS: Number(process.env.BASELINE_WINDOW_24_HOUR ?? 1440),
} as const;

/** Velocity classification thresholds (percent vs 30‑min rate) */
export const DEMAND_VELOCITY_THRESHOLDS = {
  /** RISING when velocityPercent >= this */
  HIGH: Number(process.env.VELOCITY_HIGH_THRESHOLD ?? 20),
  /** FALLING when velocityPercent <= -this */
  LOW: Number(process.env.VELOCITY_LOW_THRESHOLD ?? 20),
} as const;

/** Baseline multiplier → demand trend bands */
export const DEMAND_MULTIPLIER_THRESHOLDS = {
  VERY_HIGH: Number(process.env.MULTIPLIER_VERY_HIGH ?? 3),
  HIGH: Number(process.env.MULTIPLIER_HIGH ?? 1.75),
  LOW: Number(process.env.MULTIPLIER_LOW ?? 0.75),
  VERY_LOW: Number(process.env.MULTIPLIER_VERY_LOW ?? 0.35),
} as const;

/**
 * Blended demand score weights — must sum to 1.0.
 * recent: short-window intensity; velocity: change rate;
 * baseline: vs historical hourly avg; volume: 24h absolute scale.
 */
export const DEMAND_SCORE_WEIGHTS = {
  RECENT: Number(process.env.DEMAND_SCORE_WEIGHT_RECENT ?? 0.35),
  VELOCITY: Number(process.env.DEMAND_SCORE_WEIGHT_VELOCITY ?? 0.25),
  BASELINE: Number(process.env.DEMAND_SCORE_WEIGHT_BASELINE ?? 0.25),
  VOLUME: Number(process.env.DEMAND_SCORE_WEIGHT_VOLUME ?? 0.15),
} as const;

/** Soft caps used when normalizing absolute cart volumes into [0, 1] */
export const DEMAND_VOLUME_CAPS = {
  /** Carts in last 5 minutes → 1.0 at this count */
  FIVE_MIN: Number(process.env.DEMAND_CAP_5_MIN ?? 40),
  /** Carts in last 30 minutes → 1.0 at this count */
  THIRTY_MIN: Number(process.env.DEMAND_CAP_30_MIN ?? 120),
  /** Carts in last 24 hours → 1.0 at this count (volume component) */
  TWENTY_FOUR_HOURS: Number(process.env.DEMAND_CAP_24_HOUR ?? 800),
} as const;
