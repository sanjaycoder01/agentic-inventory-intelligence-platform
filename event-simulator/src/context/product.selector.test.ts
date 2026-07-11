import { describe, expect, it, vi } from "vitest";
import type { DarkStoreContext } from "./context.types.js";
import { selectProductForCustomer } from "./product.selector.js";
import { createCustomer } from "../behavior/customer.factory.js";
import { highDemandScenario } from "../scenarios/highDemand.scenario.js";

const breadContext: DarkStoreContext = {
  darkStore: {
    id: "ds-1",
    code: "DS-001",
    name: "Test Store",
    city: "Bengaluru",
  },
  catalogProducts: [
    {
      darkStoreId: "ds-1",
      productId: "prod-bread",
      productName: "Sourdough Bread",
      category: "perishable",
    },
  ],
  inventory: [
    {
      darkStoreId: "ds-1",
      productId: "prod-bread",
      productName: "Sourdough Bread",
      category: "perishable",
      availableQuantity: 100,
    },
  ],
};

describe("selectProductForCustomer", () => {
  it("falls back to the full catalog when scenario targets do not match", () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    const customer = createCustomer(highDemandScenario, ["ds-1"]);

    const product = selectProductForCustomer(
      highDemandScenario,
      customer,
      breadContext,
    );

    expect(product).toBeDefined();
    expect(product?.productName).toBe("Sourdough Bread");
    expect(warnSpy).toHaveBeenCalledOnce();
    warnSpy.mockRestore();
  });

  it("matches partial product names case-insensitively", () => {
    const milkContext: DarkStoreContext = {
      ...breadContext,
      catalogProducts: [
        {
          darkStoreId: "ds-1",
          productId: "prod-milk",
          productName: "Organic Whole Milk",
          category: "Dairy",
        },
      ],
      inventory: [
        {
          darkStoreId: "ds-1",
          productId: "prod-milk",
          productName: "Organic Whole Milk",
          category: "Dairy",
          availableQuantity: 50,
        },
      ],
    };
    const customer = createCustomer(highDemandScenario, ["ds-1"]);

    const product = selectProductForCustomer(
      highDemandScenario,
      customer,
      milkContext,
    );

    expect(product?.productName).toBe("Organic Whole Milk");
  });
});
