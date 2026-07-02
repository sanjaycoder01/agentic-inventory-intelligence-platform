import type { OrderDocument } from "./order.model.js";

export interface OrderResponseDTO {
  id: string;
  orderId: string;
  productId: string;
  darkStoreId: string;
  quantity: number;
  sellingPrice: number;
  orderStatus: string;
  orderedAt: Date;
  deliveredAt?: Date;
  sessionId: string;
  createdAt: Date;
}

export interface ProductOrderAnalyticsDTO {
  productId: string;
  orderCount: number;
  totalQuantity: number;
  totalRevenue: number;
  conversionRate: number;
  conversionScore: number;
  windowHours: number;
  orders: OrderResponseDTO[];
}

export interface ConversionScoreDTO {
  productId: string;
  orderCount: number;
  cartCount24h: number;
  conversionRate: number;
  conversionScore: number;
  windowHours: number;
}

export interface TopSellingProductDTO {
  productId: string;
  orderCount: number;
  totalQuantity: number;
  totalRevenue: number;
}

type OrderLike = OrderDocument & {
  _id: { toString(): string };
  productId: { toString(): string };
  darkStoreId: { toString(): string };
  createdAt: Date;
};

export function toOrderResponseDTO(order: OrderLike): OrderResponseDTO {
  return {
    id: order._id.toString(),
    orderId: order.orderId,
    productId: order.productId.toString(),
    darkStoreId: order.darkStoreId.toString(),
    quantity: order.quantity,
    sellingPrice: order.sellingPrice,
    orderStatus: order.orderStatus,
    orderedAt: order.orderedAt,
    deliveredAt: order.deliveredAt,
    sessionId: order.sessionId,
    createdAt: order.createdAt,
  };
}

export function toOrderResponseList(orders: OrderLike[]): OrderResponseDTO[] {
  return orders.map(toOrderResponseDTO);
}

export function calculateConversionScore(conversionRate: number) {
  return Math.min(conversionRate, 1);
}
