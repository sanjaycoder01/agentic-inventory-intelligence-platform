import type { CartEventDocument } from "./demand.model.js";

export interface CartEventResponseDTO {
  id: string;
  eventId: string;
  productId: string;
  darkStoreId: string;
  quantity: number;
  eventType: string;
  eventTimestamp: Date;
  sessionId: string;
  createdAt: Date;
}

export interface ProductDemandDTO {
  productId: string;
  cartCount24h: number;
  demandScore: number;
  windowHours: number;
}

export interface TrendingProductDTO {
  productId: string;
  cartCount24h: number;
  demandScore: number;
}

type CartEventLike = CartEventDocument & {
  _id: { toString(): string };
  productId: { toString(): string };
  darkStoreId: { toString(): string };
  createdAt: Date;
};

export function toCartEventResponseDTO(event: CartEventLike): CartEventResponseDTO {
  return {
    id: event._id.toString(),
    eventId: event.eventId,
    productId: event.productId.toString(),
    darkStoreId: event.darkStoreId.toString(),
    quantity: event.quantity,
    eventType: event.eventType,
    eventTimestamp: event.eventTimestamp,
    sessionId: event.sessionId,
    createdAt: event.createdAt,
  };
}
