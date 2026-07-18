import { describe, expect, it } from "vitest";
import {
  calculateBaselineMultiplier,
  calculateDemandIntelligence,
  calculateDemandVelocity,
  calculateIntelligentDemandScore,
  classifyDemandTrend,
} from "./demand-intelligence.calculations.js";

describe("demand velocity", () => {
  it("marks rising demand when 5-min rate exceeds 30-min rate", () => {
    // 20 in 5 min vs 40 in 30 min → rates 4 vs 1.33 → ~+200%
    const result = calculateDemandVelocity(20, 40);
    expect(result.velocity).toBe("RISING");
    expect(result.velocityPercent).toBeGreaterThan(20);
  });

  it("marks falling demand when recent rate drops", () => {
    // 2 in 5 min vs 40 in 30 min → rates 0.4 vs 1.33 → negative
    const result = calculateDemandVelocity(2, 40);
    expect(result.velocity).toBe("FALLING");
    expect(result.velocityPercent).toBeLessThan(-20);
  });

  it("marks stable demand when rates are similar", () => {
    // 5 in 5 min vs 30 in 30 min → both 1/min → ~0%
    const result = calculateDemandVelocity(5, 30);
    expect(result.velocity).toBe("STABLE");
    expect(Math.abs(result.velocityPercent)).toBeLessThan(20);
  });

  it("treats sudden spike from zero baseline as rising", () => {
    const result = calculateDemandVelocity(15, 0);
    expect(result.velocity).toBe("RISING");
    expect(result.velocityPercent).toBe(100);
  });

  it("returns zero velocity with no activity", () => {
    const result = calculateDemandVelocity(0, 0);
    expect(result.velocity).toBe("STABLE");
    expect(result.velocityPercent).toBe(0);
  });
});

describe("baseline multiplier", () => {
  it("computes hourly spike vs 24h average (PRD example)", () => {
    // 24h=480 → 20/h; last30=25 → 50/h → 2.5x
    expect(calculateBaselineMultiplier(25, 480)).toBeCloseTo(2.5, 5);
  });

  it("returns 0 when there is no recent or historical demand", () => {
    expect(calculateBaselineMultiplier(0, 0)).toBe(0);
  });

  it("returns a high multiplier when history is empty but recent is hot", () => {
    expect(calculateBaselineMultiplier(30, 0)).toBeGreaterThanOrEqual(3);
  });
});

describe("demand trend classification", () => {
  it("classifies bands from baseline multiplier", () => {
    expect(classifyDemandTrend(3.5)).toBe("VERY_HIGH");
    expect(classifyDemandTrend(2.1)).toBe("HIGH");
    expect(classifyDemandTrend(1.0)).toBe("NORMAL");
    expect(classifyDemandTrend(0.5)).toBe("LOW");
    expect(classifyDemandTrend(0.1)).toBe("VERY_LOW");
  });
});

describe("intelligent demand score", () => {
  it("normalizes to [0, 1]", () => {
    const high = calculateIntelligentDemandScore({
      last5Min: 100,
      last30Min: 300,
      last24Hours: 5000,
      velocityPercent: 200,
      baselineMultiplier: 5,
    });
    expect(high).toBeGreaterThanOrEqual(0);
    expect(high).toBeLessThanOrEqual(1);

    const none = calculateIntelligentDemandScore({
      last5Min: 0,
      last30Min: 0,
      last24Hours: 0,
      velocityPercent: 0,
      baselineMultiplier: 0,
    });
    expect(none).toBe(0);
  });

  it("scores rising spike higher than quiet normal demand", () => {
    const spike = calculateIntelligentDemandScore({
      last5Min: 30,
      last30Min: 50,
      last24Hours: 200,
      velocityPercent: 150,
      baselineMultiplier: 2.5,
    });
    const normal = calculateIntelligentDemandScore({
      last5Min: 3,
      last30Min: 18,
      last24Hours: 200,
      velocityPercent: 0,
      baselineMultiplier: 1,
    });
    expect(spike).toBeGreaterThan(normal);
  });
});

describe("calculateDemandIntelligence", () => {
  it("assembles rising / HIGH metrics for a sudden spike", () => {
    // last30=25, last24=480 → hourly 50 vs avg 20 → 2.5x (HIGH)
    // last5=20 vs last30=25 → rates 4 vs ~0.83 → RISING
    const metrics = calculateDemandIntelligence({
      last5Min: 20,
      last30Min: 25,
      last2Hours: 80,
      last24Hours: 480,
    });

    expect(metrics.last5Min).toBe(20);
    expect(metrics.last30Min).toBe(25);
    expect(metrics.last2Hours).toBe(80);
    expect(metrics.last24Hours).toBe(480);
    expect(metrics.velocity).toBe("RISING");
    expect(metrics.baselineMultiplier).toBeCloseTo(2.5, 5);
    expect(metrics.trend).toBe("HIGH");
    expect(metrics.demandScore).toBeGreaterThan(0.4);
    expect(metrics.demandScore).toBeLessThanOrEqual(1);
  });

  it("assembles falling demand when recent rate drops", () => {
    const metrics = calculateDemandIntelligence({
      last5Min: 1,
      last30Min: 40,
      last2Hours: 100,
      last24Hours: 600,
    });

    expect(metrics.velocity).toBe("FALLING");
    expect(metrics.demandScore).toBeGreaterThanOrEqual(0);
  });

  it("handles no activity", () => {
    const metrics = calculateDemandIntelligence({
      last5Min: 0,
      last30Min: 0,
      last2Hours: 0,
      last24Hours: 0,
    });

    expect(metrics.velocity).toBe("STABLE");
    expect(metrics.baselineMultiplier).toBe(0);
    expect(metrics.trend).toBe("VERY_LOW");
    expect(metrics.demandScore).toBe(0);
  });

  it("handles normal steady demand", () => {
    // Equal per-minute rates → STABLE; last30*2 == last24/24 → 1.0x baseline
    const metrics = calculateDemandIntelligence({
      last5Min: 5,
      last30Min: 30,
      last2Hours: 120,
      last24Hours: 1440,
    });

    expect(metrics.velocity).toBe("STABLE");
    expect(metrics.baselineMultiplier).toBeCloseTo(1, 1);
    expect(metrics.trend).toBe("NORMAL");
    expect(metrics.demandScore).toBeGreaterThan(0);
    expect(metrics.demandScore).toBeLessThan(1);
  });

  it("marks sudden volume spike as VERY_HIGH when multiplier ≥ 3", () => {
    const metrics = calculateDemandIntelligence({
      last5Min: 20,
      last30Min: 40,
      last2Hours: 80,
      last24Hours: 480,
    });

    expect(metrics.velocity).toBe("RISING");
    expect(metrics.baselineMultiplier).toBeCloseTo(4, 5);
    expect(metrics.trend).toBe("VERY_HIGH");
  });
});
