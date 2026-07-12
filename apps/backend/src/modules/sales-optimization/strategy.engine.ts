import {
  SELL_THROUGH_BANDS,
  STRATEGY_THRESHOLDS,
} from "./sales-optimization.constants.js";
import type {
  ProductSalesMetrics,
  StrategyResult,
  SalesStrategyType,
} from "./sales-optimization.types.js";

type StrategyRule = {
  id: string;
  matches: (m: ProductSalesMetrics) => boolean;
  build: (m: ProductSalesMetrics) => StrategyResult;
};

function clampConfidence(n: number): number {
  return Math.round(Math.max(0, Math.min(1, n)) * 100) / 100;
}

const strategyRules: StrategyRule[] = [
  {
    id: "RULE_LIQUIDATE",
    matches: (m) =>
      m.inventoryAgeDays >= STRATEGY_THRESHOLDS.LIQUIDATE_AGE_DAYS &&
      m.sellThroughPercent < STRATEGY_THRESHOLDS.CLEARANCE_SELL_THROUGH &&
      m.deadStockScore >= STRATEGY_THRESHOLDS.DEAD_STOCK_SCORE,
    build: (m) => ({
      strategy: "LIQUIDATE",
      matchedRule: "RULE_LIQUIDATE",
      confidence: clampConfidence(m.deadStockScore),
      reasons: ["AGE_120_PLUS", "VERY_LOW_SELL_THROUGH", "HIGH_DEAD_STOCK_SCORE"],
      discountPercent: 50,
      actionable: true,
    }),
  },
  {
    id: "RULE_CLEARANCE",
    matches: (m) =>
      m.sellThroughPercent < STRATEGY_THRESHOLDS.CLEARANCE_SELL_THROUGH,
    build: (m) => ({
      strategy: "CLEARANCE",
      matchedRule: "RULE_CLEARANCE",
      confidence: clampConfidence(1 - m.sellThroughPercent / 100),
      reasons: ["DEAD_STOCK_BAND", "SELL_THROUGH_BELOW_20"],
      discountPercent: 40,
      actionable: true,
    }),
  },
  {
    id: "RULE_DISCOUNT_AGED",
    matches: (m) =>
      m.sellThroughPercent < STRATEGY_THRESHOLDS.LOW_SELL_THROUGH &&
      m.inventoryAgeDays > STRATEGY_THRESHOLDS.HIGH_INVENTORY_AGE_DAYS,
    build: (m) => ({
      strategy: "DISCOUNT",
      matchedRule: "RULE_DISCOUNT_AGED",
      confidence: clampConfidence(
        (1 - m.sellThroughPercent / 100) * 0.6 +
          Math.min(m.inventoryAgeDays / 120, 1) * 0.4,
      ),
      reasons: ["LOW_SELL_THROUGH", "INVENTORY_AGE_OVER_90"],
      discountPercent: 20,
      actionable: true,
    }),
  },
  {
    id: "RULE_QUALITY_CHECK",
    matches: (m) => m.ratingScore < STRATEGY_THRESHOLDS.LOW_RATING,
    build: (m) => ({
      strategy: "QUALITY_CHECK",
      matchedRule: "RULE_QUALITY_CHECK",
      confidence: clampConfidence(1 - m.ratingScore),
      reasons: ["LOW_RATING"],
      actionable: true,
    }),
  },
  {
    id: "RULE_RUN_ADS",
    matches: (m) =>
      m.currentInventory >= STRATEGY_THRESHOLDS.HIGH_INVENTORY_QTY &&
      m.conversionRate < STRATEGY_THRESHOLDS.LOW_CONVERSION,
    build: (m) => ({
      strategy: "RUN_ADS",
      matchedRule: "RULE_RUN_ADS",
      confidence: clampConfidence(
        (1 - m.conversionRate) * 0.5 +
          Math.min(m.currentInventory / 100, 1) * 0.5,
      ),
      reasons: ["HIGH_INVENTORY", "LOW_CONVERSION"],
      actionable: true,
    }),
  },
  {
    id: "RULE_PRICE_REVIEW",
    matches: (m) =>
      m.cartAdds >= STRATEGY_THRESHOLDS.HIGH_CART_LOW_ORDERS_CARTS &&
      m.conversionRate < STRATEGY_THRESHOLDS.HIGH_CART_LOW_ORDERS_CONVERSION,
    build: (m) => ({
      strategy: "PRICE_REVIEW",
      matchedRule: "RULE_PRICE_REVIEW",
      confidence: clampConfidence(1 - m.conversionRate),
      reasons: ["HIGH_CART_ADDS", "LOW_ORDER_CONVERSION"],
      actionable: true,
    }),
  },
  {
    id: "RULE_BUNDLE",
    matches: (m) =>
      m.sellThroughPercent >= SELL_THROUGH_BANDS.POOR_MIN &&
      m.sellThroughPercent < SELL_THROUGH_BANDS.SLOW_MIN &&
      m.velocityClass === "SLOW",
    build: (m) => ({
      strategy: "BUNDLE",
      matchedRule: "RULE_BUNDLE",
      confidence: clampConfidence(1 - m.sellThroughPercent / 100),
      reasons: ["POOR_SELL_THROUGH_BAND", "SLOW_VELOCITY"],
      actionable: true,
    }),
  },
  {
    id: "RULE_HOMEPAGE",
    matches: (m) =>
      m.sellThroughPercent >= SELL_THROUGH_BANDS.SLOW_MIN &&
      m.sellThroughPercent < SELL_THROUGH_BANDS.GOOD_MIN,
    build: (m) => ({
      strategy: "HOMEPAGE_HIGHLIGHT",
      matchedRule: "RULE_HOMEPAGE",
      confidence: clampConfidence(0.55),
      reasons: ["SLOW_MOVING_BAND"],
      actionable: true,
    }),
  },
  {
    id: "RULE_MONITOR",
    matches: (m) =>
      m.sellThroughPercent >= SELL_THROUGH_BANDS.GOOD_MIN &&
      m.sellThroughPercent < SELL_THROUGH_BANDS.EXCELLENT_MIN,
    build: () => ({
      strategy: "MONITOR",
      matchedRule: "RULE_MONITOR",
      confidence: 0.4,
      reasons: ["GOOD_SELL_THROUGH_BAND"],
      actionable: false,
    }),
  },
  {
    id: "RULE_NO_ACTION",
    matches: () => true,
    build: (m) => ({
      strategy: "NO_ACTION",
      matchedRule: "RULE_NO_ACTION",
      confidence: clampConfidence(
        m.velocityClass === "FAST_MOVING" ? 0.9 : 0.5,
      ),
      reasons:
        m.velocityClass === "FAST_MOVING"
          ? ["FAST_MOVING", "HEALTHY_CONVERSION"]
          : ["NO_STRATEGY_MATCH"],
      actionable: false,
    }),
  },
];

export class StrategyEngine {
  evaluate(metrics: ProductSalesMetrics): StrategyResult {
    const rule = strategyRules.find((r) => r.matches(metrics));
    if (!rule) {
      throw new Error("Sales strategy engine has no fallback rule");
    }
    return rule.build(metrics);
  }
}

export const strategyEngine = new StrategyEngine();

export function strategyToRecommendationType(
  strategy: SalesStrategyType,
): string {
  return strategy;
}
