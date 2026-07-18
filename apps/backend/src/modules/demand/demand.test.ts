import { describe, expect, it } from "vitest";
import { calculateDemandIntelligence } from "./demand-intelligence.calculations.js";

/** Legacy relative catalog score (still used by trending) */
function calculateRelativeDemandScore(cartCount: number, maxCartCount: number) {
  if (maxCartCount <= 0) {
    return 0;
  }

  return Math.min(cartCount / maxCartCount, 1);
}

describe("demand score (legacy relative)", () => {
  it("normalizes cart count against the maximum in the window", () => {
    expect(calculateRelativeDemandScore(50, 100)).toBe(0.5);
    expect(calculateRelativeDemandScore(100, 100)).toBe(1);
    expect(calculateRelativeDemandScore(150, 100)).toBe(1);
  });

  it("returns zero when there is no demand in the window", () => {
    expect(calculateRelativeDemandScore(0, 0)).toBe(0);
    expect(calculateRelativeDemandScore(10, 0)).toBe(0);
  });
});

describe("demand intelligence (product demand DTO shape)", () => {
  it("exposes explainable intermediates with a 0–1 demandScore", () => {
    const demandIntelligence = calculateDemandIntelligence({
      last5Min: 20,
      last30Min: 40,
      last2Hours: 80,
      last24Hours: 480,
    });

    expect(demandIntelligence).toMatchObject({
      last5Min: 20,
      last30Min: 40,
      last2Hours: 80,
      last24Hours: 480,
      velocity: "RISING",
      trend: "VERY_HIGH",
    });
    expect(demandIntelligence.baselineMultiplier).toBeCloseTo(4, 5);
    expect(typeof demandIntelligence.velocityPercent).toBe("number");
    expect(demandIntelligence.demandScore).toBeGreaterThanOrEqual(0);
    expect(demandIntelligence.demandScore).toBeLessThanOrEqual(1);
  });
});

describe("demand service", () => {
  it.todo("records cart events");
  it.todo("returns trending products");
});
