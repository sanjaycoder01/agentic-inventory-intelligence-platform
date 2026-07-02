import { describe, expect, it } from "vitest";

function calculateDemandScore(cartCount: number, maxCartCount: number) {
  if (maxCartCount <= 0) {
    return 0;
  }

  return Math.min(cartCount / maxCartCount, 1);
}

describe("demand score", () => {
  it("normalizes cart count against the maximum in the window", () => {
    expect(calculateDemandScore(50, 100)).toBe(0.5);
    expect(calculateDemandScore(100, 100)).toBe(1);
    expect(calculateDemandScore(150, 100)).toBe(1);
  });

  it("returns zero when there is no demand in the window", () => {
    expect(calculateDemandScore(0, 0)).toBe(0);
    expect(calculateDemandScore(10, 0)).toBe(0);
  });
});

describe("demand service", () => {
  it.todo("records cart events");
  it.todo("returns trending products");
});
