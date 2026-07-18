import {
  DEMAND_MULTIPLIER_THRESHOLDS,
  DEMAND_SCORE_WEIGHTS,
  DEMAND_VELOCITY_THRESHOLDS,
  DEMAND_VOLUME_CAPS,
  DEMAND_WINDOWS,
} from "./demand-intelligence.constants.js";
import type {
  DemandIntelligenceMetrics,
  DemandTrendLabel,
  DemandVelocityLabel,
  DemandWindowCounts,
} from "./demand-intelligence.types.js";

function clamp01(n: number): number {
  if (!Number.isFinite(n) || n <= 0) return 0;
  if (n >= 1) return 1;
  return n;
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

function safeNonNeg(n: number): number {
  if (!Number.isFinite(n) || n < 0) return 0;
  return n;
}

/**
 * Velocity = how much faster/slower the last-5-min rate is vs the last-30-min rate.
 * Example: last30=40, last5=20 → rates 4/min vs 1.33/min → +200% (RISING).
 */
export function calculateDemandVelocity(
  last5Min: number,
  last30Min: number,
  fiveMinWindow = DEMAND_WINDOWS.FIVE_MIN,
  thirtyMinWindow = DEMAND_WINDOWS.THIRTY_MIN,
): { velocity: DemandVelocityLabel; velocityPercent: number } {
  const recent = safeNonNeg(last5Min);
  const window30 = safeNonNeg(last30Min);

  const recentRate = recent / fiveMinWindow;
  const baselineRate = window30 / thirtyMinWindow;

  let velocityPercent: number;
  if (baselineRate <= 0) {
    velocityPercent = recentRate > 0 ? 100 : 0;
  } else {
    velocityPercent = ((recentRate - baselineRate) / baselineRate) * 100;
  }

  velocityPercent = round1(velocityPercent);

  let velocity: DemandVelocityLabel = "STABLE";
  if (velocityPercent >= DEMAND_VELOCITY_THRESHOLDS.HIGH) {
    velocity = "RISING";
  } else if (velocityPercent <= -DEMAND_VELOCITY_THRESHOLDS.LOW) {
    velocity = "FALLING";
  }

  return { velocity, velocityPercent };
}

/**
 * baselineMultiplier = (last-30-min expressed as hourly rate) / (24h avg hourly rate).
 * Example: 24h=480 → avg/h=20; last30=25 → hourly=50 → multiplier=2.5.
 */
export function calculateBaselineMultiplier(
  last30Min: number,
  last24Hours: number,
  thirtyMinWindow = DEMAND_WINDOWS.THIRTY_MIN,
  twentyFourHoursWindow = DEMAND_WINDOWS.TWENTY_FOUR_HOURS,
): number {
  const recent = safeNonNeg(last30Min);
  const day = safeNonNeg(last24Hours);

  const hoursInDay = twentyFourHoursWindow / 60;
  const avgPerHour = hoursInDay > 0 ? day / hoursInDay : 0;
  const recentHourlyRate = recent * (60 / thirtyMinWindow);

  if (avgPerHour <= 0) {
    return recentHourlyRate > 0 ? DEMAND_MULTIPLIER_THRESHOLDS.VERY_HIGH : 0;
  }

  return round2(recentHourlyRate / avgPerHour);
}

export function classifyDemandTrend(
  baselineMultiplier: number,
): DemandTrendLabel {
  if (baselineMultiplier >= DEMAND_MULTIPLIER_THRESHOLDS.VERY_HIGH) {
    return "VERY_HIGH";
  }
  if (baselineMultiplier >= DEMAND_MULTIPLIER_THRESHOLDS.HIGH) {
    return "HIGH";
  }
  if (baselineMultiplier >= DEMAND_MULTIPLIER_THRESHOLDS.LOW) {
    return "NORMAL";
  }
  if (baselineMultiplier >= DEMAND_MULTIPLIER_THRESHOLDS.VERY_LOW) {
    return "LOW";
  }
  return "VERY_LOW";
}

/**
 * Blend recent intensity, velocity, baseline spike, and 24h volume into [0, 1].
 * Does not touch conversion/rating — only the demand component of replenishment.
 */
export function calculateIntelligentDemandScore(input: {
  last5Min: number;
  last30Min: number;
  last24Hours: number;
  velocityPercent: number;
  baselineMultiplier: number;
}): number {
  const last5Min = safeNonNeg(input.last5Min);
  const last30Min = safeNonNeg(input.last30Min);
  const last24Hours = safeNonNeg(input.last24Hours);

  // No carts in any window → zero demand (do not treat 0% velocity as "neutral 0.5")
  if (last5Min <= 0 && last30Min <= 0 && last24Hours <= 0) {
    return 0;
  }

  const recentScore = clamp01(
    0.6 * clamp01(last5Min / DEMAND_VOLUME_CAPS.FIVE_MIN) +
      0.4 * clamp01(last30Min / DEMAND_VOLUME_CAPS.THIRTY_MIN),
  );

  // Map roughly [-100%, +100%] → [0, 1]; clamp extremes
  const velocityScore = clamp01((input.velocityPercent + 100) / 200);

  const baselineScore = clamp01(
    safeNonNeg(input.baselineMultiplier) /
      DEMAND_MULTIPLIER_THRESHOLDS.VERY_HIGH,
  );

  const volumeScore = clamp01(last24Hours / DEMAND_VOLUME_CAPS.TWENTY_FOUR_HOURS);

  const score =
    recentScore * DEMAND_SCORE_WEIGHTS.RECENT +
    velocityScore * DEMAND_SCORE_WEIGHTS.VELOCITY +
    baselineScore * DEMAND_SCORE_WEIGHTS.BASELINE +
    volumeScore * DEMAND_SCORE_WEIGHTS.VOLUME;

  return round2(clamp01(score));
}

/** Pure demand intelligence from windowed cart counts. */
export function calculateDemandIntelligence(
  counts: DemandWindowCounts,
): DemandIntelligenceMetrics {
  const last5Min = safeNonNeg(counts.last5Min);
  const last30Min = safeNonNeg(counts.last30Min);
  const last2Hours = safeNonNeg(counts.last2Hours);
  const last24Hours = safeNonNeg(counts.last24Hours);

  const { velocity, velocityPercent } = calculateDemandVelocity(
    last5Min,
    last30Min,
  );
  const baselineMultiplier = calculateBaselineMultiplier(
    last30Min,
    last24Hours,
  );
  const trend = classifyDemandTrend(baselineMultiplier);
  const demandScore = calculateIntelligentDemandScore({
    last5Min,
    last30Min,
    last24Hours,
    velocityPercent,
    baselineMultiplier,
  });

  return {
    last5Min,
    last30Min,
    last2Hours,
    last24Hours,
    velocity,
    velocityPercent,
    baselineMultiplier,
    trend,
    demandScore,
  };
}
