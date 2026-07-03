import type { ProductAwareCustomerDecision } from "../decision/decision.types.js";
import type { CartEvent } from "../dispatch/event.dispatcher.js";
import type { SimulatorEvent } from "./simulator-event.types.js";

export type CartEventType = "ADD_TO_CART" | "REMOVE_FROM_CART";

export interface CartDTO {
  productId: string;
  darkStoreId: string;
  quantity: number;
  sessionId: string;
  eventType: CartEventType;
}

export function generateCartEvents(
  decision: ProductAwareCustomerDecision,
  simulationRunId: string,
): CartEvent[] {
  if (!decision.addToCart || !decision.darkStoreId || !decision.product) {
    return [];
  }

  const events: CartEvent[] = [
    createCartEvent(
      simulationRunId,
      decision,
      "ADD_TO_CART",
    ),
  ];

  if (decision.removeFromCart) {
    events.push(
      createCartEvent(
        simulationRunId,
        decision,
        "REMOVE_FROM_CART",
      ),
    );
  }

  return events;
}

function createCartEvent(
  simulationRunId: string,
  decision: ProductAwareCustomerDecision,
  eventType: CartEventType,
): SimulatorEvent<"CART", CartDTO> {
  return {
    simulationRunId,
    type: "CART",
    payload: {
      productId: decision.product!.productId,
      darkStoreId: decision.darkStoreId!,
      quantity: Math.max(1, decision.quantity),
      sessionId: decision.customerId,
      eventType,
    },
    createdAt: new Date(),
  };
}
