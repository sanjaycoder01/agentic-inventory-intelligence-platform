import {
  SELL_THROUGH_BANDS,
  STRATEGY_THRESHOLDS,
  VELOCITY_THRESHOLDS,
} from "./sales-optimization.constants.js";
import type {
  InventoryAgeBand,
  VelocityClass,
} from "./sales-optimization.types.js";

/** Sell-through % = unitsSold / unitsReceived × 100 */
export function calculateSellThroughPercent(
  unitsSold: number,
  unitsReceived: number,
): number {
  if (unitsReceived <= 0) {
    return unitsSold > 0 ? 100 : 0;
  }
  return Math.min(100, (unitsSold / unitsReceived) * 100);
}

export function classifyInventoryAgeBand(ageDays: number): InventoryAgeBand {
  if (ageDays <= 30) return "0_30";
  if (ageDays <= 60) return "31_60";
  if (ageDays <= 90) return "61_90";
  if (ageDays <= 120) return "91_120";
  return "120_PLUS";
}

export function calculateAverageDailySales(
  unitsSold: number,
  windowDays: number,
): number {
  if (windowDays <= 0) return 0;
  return unitsSold / windowDays;
}

export function calculateDaysOfCover(
  currentInventory: number,
  averageDailySales: number,
): number | null {
  if (averageDailySales <= 0) return null;
  return currentInventory / averageDailySales;
}

/**
 * Demand trend: (recent half sales - prior half sales) / max(prior, 1)
 * Positive = rising demand.
 */
export function calculateDemandTrend(
  recentHalfSales: number,
  priorHalfSales: number,
): number {
  if (priorHalfSales <= 0) {
    return recentHalfSales > 0 ? 1 : 0;
  }
  return (recentHalfSales - priorHalfSales) / priorHalfSales;
}

export function classifyVelocity(averageDailySales: number): VelocityClass {
  if (averageDailySales >= VELOCITY_THRESHOLDS.FAST_MIN) return "FAST_MOVING";
  if (averageDailySales >= VELOCITY_THRESHOLDS.NORMAL_MIN) return "NORMAL";
  if (averageDailySales >= VELOCITY_THRESHOLDS.SLOW_MIN) return "SLOW";
  return "DEAD";
}

/**
 * Dead stock score 0–1: higher = more dead.
 * Combines low sell-through, high age, and low velocity.
 */
export function calculateDeadStockScore(input: {
  sellThroughPercent: number;
  inventoryAgeDays: number;
  averageDailySales: number;
}): number {
  const sellThroughFactor = 1 - Math.min(input.sellThroughPercent, 100) / 100;
  const ageFactor = Math.min(input.inventoryAgeDays / 120, 1);
  const velocityFactor =
    input.averageDailySales <= 0
      ? 1
      : Math.max(0, 1 - input.averageDailySales / VELOCITY_THRESHOLDS.FAST_MIN);

  return (
    Math.round(
      (sellThroughFactor * 0.4 + ageFactor * 0.35 + velocityFactor * 0.25) * 100,
    ) / 100
  );
}

/** Map sell-through % to PRD band label */
export function sellThroughBandLabel(sellThroughPercent: number): string {
  if (sellThroughPercent >= SELL_THROUGH_BANDS.EXCELLENT_MIN) return "EXCELLENT";
  if (sellThroughPercent >= SELL_THROUGH_BANDS.GOOD_MIN) return "GOOD";
  if (sellThroughPercent >= SELL_THROUGH_BANDS.SLOW_MIN) return "SLOW_MOVING";
  if (sellThroughPercent >= SELL_THROUGH_BANDS.POOR_MIN) return "POOR";
  return "DEAD_STOCK";
}

export function daysBetween(from: Date, to: Date = new Date()): number {
  const ms = to.getTime() - from.getTime();
  return Math.max(0, Math.floor(ms / (1000 * 60 * 60 * 24)));
}

export { STRATEGY_THRESHOLDS, SELL_THROUGH_BANDS, VELOCITY_THRESHOLDS };
