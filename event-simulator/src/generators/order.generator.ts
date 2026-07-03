import { randomInt } from "../behavior/probability.js";
import type { ProductAwareCustomerDecision } from "../decision/decision.types.js";
import type { PersonaId } from "../scenarios/scenario.types.js";
import type { SimulatorEvent } from "./simulator-event.types.js";

export type SyntheticOrderStatus = "DELIVERED";

export interface OrderDTO {
  customerId: string;
  sessionId: string;
  darkStoreId: string;
  productId: string;
  quantity: number;
  orderStatus: SyntheticOrderStatus;
}

export type OrderEvent = SimulatorEvent<"ORDER", OrderDTO>;

type QuantityRange = {
  min: number;
  max: number;
};

const PERSONA_ORDER_QUANTITY_RANGES: Record<PersonaId, QuantityRange> = {
  STUDENT: { min: 1, max: 2 },
  FAMILY: { min: 3, max: 10 },
  OFFICE_EMPLOYEE: { min: 1, max: 4 },
  FREQUENT_BUYER: { min: 2, max: 6 },
  WINDOW_SHOPPER: { min: 1, max: 1 },
  IMPULSE_BUYER: { min: 1, max: 3 },
};

export function generateOrderEvent(
  decision: ProductAwareCustomerDecision,
): OrderEvent | null {
  if (!decision.placeOrder) {
    return null;
  }

  if (!decision.canPurchase || decision.blockReason === "OUT_OF_STOCK") {
    return null;
  }

  if (!decision.darkStoreId || !decision.product) {
    return null;
  }

  const quantity = getOrderQuantity(decision);

  if (quantity <= 0) {
    return null;
  }

  return {
    type: "ORDER",
    payload: {
      customerId: decision.customerId,
      sessionId: decision.customerId,
      darkStoreId: decision.darkStoreId,
      productId: decision.product.productId,
      quantity,
      orderStatus: "DELIVERED",
    },
    createdAt: new Date(),
  };
}

function getOrderQuantity(decision: ProductAwareCustomerDecision): number {
  const range = PERSONA_ORDER_QUANTITY_RANGES[decision.personaId];
  const personaQuantity = randomInt(range.min, range.max);

  return Math.min(personaQuantity, decision.product?.availableToSell ?? 0);
}
