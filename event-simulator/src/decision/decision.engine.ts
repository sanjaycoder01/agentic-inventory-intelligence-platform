import { decideCustomerBehavior } from "../behavior/behavior.engine.js";
import type { Customer } from "../behavior/behavior.types.js";
import { randomInt } from "../behavior/probability.js";
import {
  getMaxPurchasableQuantity,
} from "../context/inventory.context.js";
import { selectDarkStoreContext } from "../context/darkStore.context.js";
import { selectProductForCustomer } from "../context/product.selector.js";
import type { DarkStoreContext } from "../context/context.types.js";
import type { Scenario } from "../scenarios/scenario.types.js";
import type { ProductAwareCustomerDecision } from "./decision.types.js";

export function decideCustomerAction(
  scenario: Scenario,
  customer: Customer,
  contexts: DarkStoreContext[],
): ProductAwareCustomerDecision {
  const context = selectDarkStoreContext(
    scenario,
    contexts,
    customer.darkStoreId,
  );
  const baseDecision = decideCustomerBehavior(scenario, customer);

  if (!context) {
    return {
      ...baseDecision,
      addToCart: false,
      removeFromCart: false,
      placeOrder: false,
      leaveRating: false,
      rating: undefined,
      customerId: customer.id,
      quantity: 0,
      canPurchase: false,
      blockReason: "NO_DARK_STORE_CONTEXT",
    };
  }

  const product = selectProductForCustomer(scenario, customer, context);

  if (!product) {
    return {
      ...baseDecision,
      addToCart: false,
      removeFromCart: false,
      placeOrder: false,
      leaveRating: false,
      rating: undefined,
      customerId: customer.id,
      darkStoreId: context.darkStore.id,
      quantity: 0,
      canPurchase: false,
      blockReason: "NO_CATALOG_PRODUCT",
    };
  }

  const desiredQuantity = randomInt(1, 3);
  const purchasableQuantity = getMaxPurchasableQuantity(
    context.inventory,
    product.productId,
    desiredQuantity,
  );
  const canPurchase = purchasableQuantity > 0;
  const quantity = canPurchase ? purchasableQuantity : desiredQuantity;
  const placeOrder = baseDecision.placeOrder && canPurchase;
  const leaveRating = placeOrder && baseDecision.leaveRating;

  return {
    ...baseDecision,
    placeOrder,
    leaveRating,
    rating: leaveRating ? baseDecision.rating : undefined,
    customerId: customer.id,
    darkStoreId: context.darkStore.id,
    product,
    quantity,
    canPurchase,
    blockReason: canPurchase ? undefined : "OUT_OF_STOCK",
  };
}
