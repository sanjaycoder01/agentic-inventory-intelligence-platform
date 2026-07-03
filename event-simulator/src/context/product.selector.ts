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

  return products.filter((product) =>
    scenario.targetProducts.some(
      (target) =>
        product.productId === target ||
        product.productName === target ||
        product.category === target,
    ),
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
