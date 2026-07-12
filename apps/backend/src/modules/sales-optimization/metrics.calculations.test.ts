import { describe, expect, it } from "vitest";
import {
  calculateDeadStockScore,
  calculateDemandTrend,
  calculateSellThroughPercent,
  classifyInventoryAgeBand,
  classifyVelocity,
  sellThroughBandLabel,
} from "./metrics.calculations.js";
import { strategyEngine } from "./strategy.engine.js";
import type { ProductSalesMetrics } from "./sales-optimization.types.js";

function baseMetrics(
  overrides: Partial<ProductSalesMetrics> = {},
): ProductSalesMetrics {
  return {
    productId: "p1",
    darkStoreId: "s1",
    unitsSold: 10,
    unitsReceived: 50,
    sellThroughPercent: 20,
    inventoryAgeDays: 45,
    inventoryAgeBand: "31_60",
    daysSinceLastSale: 5,
    averageDailySales: 0.5,
    cartAdds: 30,
    conversionRate: 0.33,
    averageRating: 4,
    ratingScore: 0.8,
    currentInventory: 40,
    warehouseInventory: 100,
    daysOfCover: 80,
    demandTrend: 0,
    velocity: 0.5,
    velocityClass: "SLOW",
    deadStockScore: 0.5,
    windowDays: 30,
    ...overrides,
  };
}

describe("sales optimization metrics", () => {
  it("computes sell-through percent", () => {
    expect(calculateSellThroughPercent(25, 100)).toBe(25);
    expect(calculateSellThroughPercent(0, 0)).toBe(0);
  });

  it("classifies inventory age bands", () => {
    expect(classifyInventoryAgeBand(10)).toBe("0_30");
    expect(classifyInventoryAgeBand(45)).toBe("31_60");
    expect(classifyInventoryAgeBand(75)).toBe("61_90");
    expect(classifyInventoryAgeBand(100)).toBe("91_120");
    expect(classifyInventoryAgeBand(150)).toBe("120_PLUS");
  });

  it("classifies velocity", () => {
    expect(classifyVelocity(6)).toBe("FAST_MOVING");
    expect(classifyVelocity(2)).toBe("NORMAL");
    expect(classifyVelocity(0.5)).toBe("SLOW");
    expect(classifyVelocity(0)).toBe("DEAD");
  });

  it("maps sell-through bands per PRD", () => {
    expect(sellThroughBandLabel(95)).toBe("EXCELLENT");
    expect(sellThroughBandLabel(80)).toBe("GOOD");
    expect(sellThroughBandLabel(50)).toBe("SLOW_MOVING");
    expect(sellThroughBandLabel(30)).toBe("POOR");
    expect(sellThroughBandLabel(10)).toBe("DEAD_STOCK");
  });

  it("computes demand trend and dead stock score", () => {
    expect(calculateDemandTrend(20, 10)).toBe(1);
    expect(calculateDeadStockScore({
      sellThroughPercent: 10,
      inventoryAgeDays: 120,
      averageDailySales: 0,
    })).toBeGreaterThan(0.7);
  });
});

describe("strategy engine", () => {
  it("recommends clearance for dead stock sell-through", () => {
    const result = strategyEngine.evaluate(
      baseMetrics({ sellThroughPercent: 15, inventoryAgeDays: 40 }),
    );
    expect(result.strategy).toBe("CLEARANCE");
  });

  it("recommends discount for low sell-through and high age", () => {
    const result = strategyEngine.evaluate(
      baseMetrics({
        sellThroughPercent: 22,
        inventoryAgeDays: 95,
      }),
    );
    expect(result.strategy).toBe("DISCOUNT");
    expect(result.discountPercent).toBe(20);
  });

  it("recommends homepage highlight for slow-moving band", () => {
    const result = strategyEngine.evaluate(
      baseMetrics({
        sellThroughPercent: 55,
        inventoryAgeDays: 20,
        ratingScore: 0.9,
        conversionRate: 0.5,
        currentInventory: 20,
        cartAdds: 5,
      }),
    );
    expect(result.strategy).toBe("HOMEPAGE_HIGHLIGHT");
  });

  it("recommends no action for excellent fast movers", () => {
    const result = strategyEngine.evaluate(
      baseMetrics({
        sellThroughPercent: 95,
        inventoryAgeDays: 10,
        averageDailySales: 8,
        velocityClass: "FAST_MOVING",
        ratingScore: 0.9,
        conversionRate: 0.7,
        currentInventory: 15,
        cartAdds: 10,
      }),
    );
    expect(result.strategy).toBe("NO_ACTION");
  });

  it("flags quality check for low ratings", () => {
    const result = strategyEngine.evaluate(
      baseMetrics({
        sellThroughPercent: 60,
        ratingScore: 0.3,
        inventoryAgeDays: 20,
        conversionRate: 0.5,
        currentInventory: 20,
        cartAdds: 5,
      }),
    );
    expect(result.strategy).toBe("QUALITY_CHECK");
  });
});
