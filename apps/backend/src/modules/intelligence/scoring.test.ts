import { describe, expect, it } from "vitest";
import { evaluateEligibility } from "./eligibility.js";
import { eligibilityService } from "./eligibility.service.js";
import {
  REPLENISHMENT_SCORE_THRESHOLD,
  REPLENISHMENT_SCORE_WEIGHTS,
  REORDER_QUANTITY_DEFAULTS,
} from "./intelligence.constants.js";
import { recommendationService } from "./recommendation.service.js";
import {
  calculateReorderQuantity,
  calculateReplenishmentScore,
  passesReplenishmentScoreGate,
  scoreProduct,
} from "./scoring.js";
import type { AggregatedSignals } from "./recommendation.types.js";

describe("scoring — milk vs MacBook", () => {
  it("scores high-demand perishable milk for replenishment", () => {
    const scores = scoreProduct({
      cartCount: 20,
      avgRating: 4.2,
      conversionRate: 0.6,
      availableQuantity: 5,
      safetyStock: 10,
      category: "perishable",
    });

    const eligibility = evaluateEligibility(scores, 5, 10, "perishable");

    expect(scores.demandScore).toBeGreaterThan(0.8);
    expect(eligibility.action).toBe("REPLENISH");
  });

  it("holds steady for low-demand durable MacBook with adequate stock", () => {
    const scores = scoreProduct({
      cartCount: 0,
      avgRating: 4.8,
      conversionRate: 0.1,
      availableQuantity: 50,
      safetyStock: 10,
      category: "electronics",
    });

    const eligibility = evaluateEligibility(scores, 50, 10, "electronics");

    expect(scores.demandScore).toBeLessThan(0.5);
    expect(eligibility.action).toBe("HOLD");
  });

  it("flags excess perishable stock for warehouse return", () => {
    const scores = scoreProduct({
      cartCount: 1,
      avgRating: 3.5,
      conversionRate: 0.05,
      availableQuantity: 100,
      safetyStock: 20,
      category: "perishable",
    });

    const eligibility = evaluateEligibility(scores, 100, 20, "perishable");

    expect(eligibility.action).toBe("RETURN_TO_WAREHOUSE");
  });
});

describe("PRD replenishment score", () => {
  it("weights sum to 1.0", () => {
    const sum =
      REPLENISHMENT_SCORE_WEIGHTS.DEMAND +
      REPLENISHMENT_SCORE_WEIGHTS.RATING +
      REPLENISHMENT_SCORE_WEIGHTS.CONVERSION;
    expect(sum).toBe(1);
  });

  it("computes overall score as w1*demand + w2*rating + w3*conversion", () => {
    const score = calculateReplenishmentScore(1, 1, 1);
    expect(score).toBe(1);

    const mixed = calculateReplenishmentScore(0.5, 0.8, 0.4);
    expect(mixed).toBeCloseTo(0.5 * 0.4 + 0.8 * 0.3 + 0.4 * 0.3);
  });

  it("hard-gates reorder candidacy on overall score threshold", () => {
    expect(passesReplenishmentScoreGate(0.6)).toBe(true);
    expect(passesReplenishmentScoreGate(0.59)).toBe(false);
    expect(REPLENISHMENT_SCORE_THRESHOLD).toBe(0.6);
  });

  it("blocks high-demand low-rating low-conversion MacBook via score gate", () => {
    // High demand, poor rating, poor conversion → below threshold
    const replenishmentScore = calculateReplenishmentScore(0.9, 0.3, 0.2);
    expect(replenishmentScore).toBeCloseTo(0.51);
    expect(passesReplenishmentScoreGate(replenishmentScore)).toBe(false);

    const signals: AggregatedSignals = {
      productId: "macbook",
      darkStoreId: "store-1",
      demandScore: 0.9,
      ratingScore: 0.3,
      conversionScore: 0.2,
      replenishmentScore,
      cartCount24h: 40,
      windowHours: 24,
      availableQuantity: 5,
      reservedQuantity: 0,
      warehouseStock: 50,
      averageRating: 1.5,
      totalRatings: 10,
    };

    const eligibility = eligibilityService.evaluate(signals);
    expect(eligibility.eligible).toBe(false);
    expect(eligibility.reasons).toContain("SCORE_BELOW_THRESHOLD");

    const recommendation = recommendationService.recommend(signals, eligibility);
    expect(recommendation.recommendation).not.toBe("REORDER");
  });

  it("allows milk-like strong signals through the score gate when stock is low", () => {
    const replenishmentScore = calculateReplenishmentScore(0.9, 0.84, 0.7);
    expect(passesReplenishmentScoreGate(replenishmentScore)).toBe(true);

    const signals: AggregatedSignals = {
      productId: "milk",
      darkStoreId: "store-1",
      demandScore: 0.9,
      ratingScore: 0.84,
      conversionScore: 0.7,
      replenishmentScore,
      cartCount24h: 24,
      windowHours: 24,
      availableQuantity: 5,
      reservedQuantity: 0,
      warehouseStock: 100,
      averageRating: 4.2,
      totalRatings: 20,
    };

    const eligibility = eligibilityService.evaluate(signals);
    expect(eligibility.eligible).toBe(true);

    const recommendation = recommendationService.recommend(signals, eligibility);
    expect(recommendation.recommendation).toBe("REORDER");
  });
});

describe("PRD reorder quantity", () => {
  it("computes demandRatePerDay × leadTimeDays × safetyBuffer", () => {
    // 24 cart adds in 24h → 24/day; × 2 days × 1.2 buffer = 57.6 → ceil 58
    const qty = calculateReorderQuantity({ cartCount: 24, windowHours: 24 });
    expect(qty).toBe(
      Math.ceil(
        24 *
          REORDER_QUANTITY_DEFAULTS.LEAD_TIME_DAYS *
          REORDER_QUANTITY_DEFAULTS.SAFETY_BUFFER,
      ),
    );
    expect(qty).toBe(58);
  });

  it("returns 0 when there is no demand", () => {
    expect(calculateReorderQuantity({ cartCount: 0 })).toBe(0);
  });
});
