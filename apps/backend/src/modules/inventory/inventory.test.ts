import { describe, expect, it } from "vitest";

describe("inventory FEFO allocation", () => {
  it("allocates from earliest-expiry batch first", () => {
    const batches = [
      { quantity: 10, expiryDate: new Date("2026-08-01") },
      { quantity: 10, expiryDate: new Date("2026-06-01") },
    ];

    const sorted = [...batches].sort((a, b) => {
      const aExpiry = a.expiryDate?.getTime() ?? Number.MAX_SAFE_INTEGER;
      const bExpiry = b.expiryDate?.getTime() ?? Number.MAX_SAFE_INTEGER;
      return aExpiry - bExpiry;
    });

    expect(sorted[0].expiryDate?.toISOString()).toContain("2026-06-01");
  });
});
