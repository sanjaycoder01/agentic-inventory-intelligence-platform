import type { ProductAwareCustomerDecision } from "../decision/decision.types.js";
import type { OrderEvent } from "./order.generator.js";
import type { SimulatorEvent } from "./simulator-event.types.js";

export interface RatingDTO {
  orderId: string;
  productId: string;
  darkStoreId: string;
  customerId: string;
  rating: number;
  review: null;
}

export type RatingEvent = SimulatorEvent<"RATING", RatingDTO>;

export function generateRatingEvent(
  decision: ProductAwareCustomerDecision,
  orderEvent: OrderEvent | null,
): RatingEvent | null {
  if (!decision.leaveRating) {
    return null;
  }

  if (!orderEvent) {
    return null;
  }

  if (orderEvent.payload.orderStatus !== "DELIVERED") {
    return null;
  }

  if (decision.rating === undefined) {
    return null;
  }

  return {
    simulationRunId: orderEvent.simulationRunId,
    type: "RATING",
    payload: {
      orderId: orderEvent.payload.orderId,
      productId: orderEvent.payload.productId,
      darkStoreId: orderEvent.payload.darkStoreId,
      customerId: decision.customerId,
      rating: toStarRating(decision.rating),
      review: null,
    },
    createdAt: new Date(),
  };
}

function toStarRating(rating: number): number {
  return Math.min(Math.max(Math.round(rating), 1), 5);
}
