import { describe, expect, it } from "vitest";
import { evaluateEligibility } from "./eligibility.js";
import { scoreProduct } from "./scoring.js";

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
