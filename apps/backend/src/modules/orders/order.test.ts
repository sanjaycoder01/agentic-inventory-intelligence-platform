import { describe, expect, it } from "vitest";
import { calculateConversionScore } from "./order.types.js";

describe("conversion score", () => {
  it("normalizes conversion rate to a 0-1 score", () => {
    expect(calculateConversionScore(0.75)).toBe(0.75);
    expect(calculateConversionScore(1.2)).toBe(1);
    expect(calculateConversionScore(0)).toBe(0);
  });
});

describe("order service", () => {
  it.todo("rejects orders that exceed available inventory");
  it.todo("deducts inventory through the inventory service");
});
