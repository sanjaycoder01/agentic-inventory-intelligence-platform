import { describe, expect, it } from "vitest";
import { calculateRatingScore } from "./rating.types.js";

describe("rating score", () => {
  it("normalizes average rating to a 0-1 score", () => {
    expect(calculateRatingScore(4.5)).toBe(0.9);
    expect(calculateRatingScore(5)).toBe(1);
    expect(calculateRatingScore(0)).toBe(0);
  });

  it("clamps invalid averages to the scoring range", () => {
    expect(calculateRatingScore(6)).toBe(1);
    expect(calculateRatingScore(-1)).toBe(0);
  });
});

describe("rating service", () => {
  it.todo("submits ratings and updates dark store product aggregates");
  it.todo("rejects duplicate ratings for an order");
});
