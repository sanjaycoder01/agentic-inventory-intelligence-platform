import { describe, expect, it } from "vitest";
import { toProductResponseDTO } from "./product.types.js";

describe("toProductResponseDTO", () => {
  it("maps a product document to a response DTO", () => {
    const createdAt = new Date("2026-01-01T00:00:00.000Z");
    const updatedAt = new Date("2026-01-02T00:00:00.000Z");

    const dto = toProductResponseDTO({
      _id: { toString: () => "product-123" },
      sku: "MILK-001",
      name: "Organic Whole Milk",
      category: "perishable",
      brand: "FarmFresh",
      unit: "liter",
      sellingPrice: 4.99,
      reorderThreshold: 20,
      safetyStock: 10,
      shelfLifeDays: 7,
      isActive: true,
      createdAt,
      updatedAt,
    });

    expect(dto).toEqual({
      id: "product-123",
      sku: "MILK-001",
      name: "Organic Whole Milk",
      category: "perishable",
      brand: "FarmFresh",
      unit: "liter",
      sellingPrice: 4.99,
      reorderThreshold: 20,
      safetyStock: 10,
      shelfLifeDays: 7,
      isActive: true,
      createdAt,
      updatedAt,
    });
  });
});

describe("product validation", () => {
  it.todo("rejects invalid create payload");
  it.todo("rejects duplicate SKU via service");
});
