import type { Customer } from "../behavior/behavior.types.js";
import { pickOne } from "../behavior/probability.js";
import type { Scenario } from "../scenarios/scenario.types.js";
import {
  getAvailableToSell,
  getInventoryForProduct,
} from "./inventory.context.js";
import type {
  DarkStoreCatalogProduct,
  DarkStoreContext,
  SelectedProduct,
} from "./context.types.js";

const loggedScenarioFallbacks = new Set<string>();

export function selectProductForCustomer(
  scenario: Scenario,
  customer: Customer,
  context: DarkStoreContext,
): SelectedProduct | undefined {
  const scenarioProducts = filterScenarioProducts(
    scenario,
    context.catalogProducts,
  );

  if (scenarioProducts.length === 0) {
    return undefined;
  }

  const preferredProducts = scenarioProducts.filter((product) =>
    customer.preferredCategories.includes(product.category),
  );
  const preferredInStock = preferredProducts.filter((product) =>
    isInStock(product, context),
  );
  const scenarioInStock = scenarioProducts.filter((product) =>
    isInStock(product, context),
  );

  const selectedCatalogProduct = pickFromFirstAvailableList([
    preferredInStock,
    scenarioInStock,
    preferredProducts,
    scenarioProducts,
  ]);

  return selectedCatalogProduct
    ? toSelectedProduct(selectedCatalogProduct, context)
    : undefined;
}

function filterScenarioProducts(
  scenario: Scenario,
  products: DarkStoreCatalogProduct[],
): DarkStoreCatalogProduct[] {
  if (scenario.targetProducts.includes("ALL")) {
    return products;
  }

  const matched = products.filter((product) =>
    scenario.targetProducts.some((target) =>
      matchesProductTarget(product, target),
    ),
  );

  if (matched.length === 0 && products.length > 0) {
    const fallbackKey = `${scenario.id}:${scenario.targetProducts.join(",")}:${products.length}`;
    if (!loggedScenarioFallbacks.has(fallbackKey)) {
      loggedScenarioFallbacks.add(fallbackKey);
      console.warn(
        JSON.stringify({
          action: "ScenarioProductFallback",
          scenarioId: scenario.id,
          scenarioTargets: scenario.targetProducts,
          catalogProductCount: products.length,
          sampleProductNames: products
            .slice(0, 5)
            .map((product) => product.productName),
          message:
            "No catalog products matched scenario targets; using full catalog.",
        }),
      );
    }
    return products;
  }

  return matched;
}

function matchesProductTarget(
  product: DarkStoreCatalogProduct,
  target: string,
): boolean {
  if (product.productId === target) {
    return true;
  }

  const normalizedTarget = target.trim().toLowerCase();
  const normalizedName = product.productName.trim().toLowerCase();
  const normalizedCategory = product.category.trim().toLowerCase();

  return (
    normalizedName === normalizedTarget ||
    normalizedCategory === normalizedTarget ||
    normalizedName.includes(normalizedTarget)
  );
}

function isInStock(
  product: DarkStoreCatalogProduct,
  context: DarkStoreContext,
): boolean {
  return (
    getAvailableToSell(
      getInventoryForProduct(context.inventory, product.productId),
    ) > 0
  );
}

function pickFromFirstAvailableList<T>(lists: T[][]): T | undefined {
  const firstAvailableList = lists.find((list) => list.length > 0);

  return firstAvailableList ? pickOne(firstAvailableList) : undefined;
}

function toSelectedProduct(
  product: DarkStoreCatalogProduct,
  context: DarkStoreContext,
): SelectedProduct {
  const inventory = getInventoryForProduct(context.inventory, product.productId);
  const availableToSell = getAvailableToSell(inventory);

  return {
    darkStoreId: context.darkStore.id,
    productId: product.productId,
    productName: product.productName,
    category: product.category,
    availableToSell,
    inCatalog: true,
    inStock: availableToSell > 0,
  };
}
