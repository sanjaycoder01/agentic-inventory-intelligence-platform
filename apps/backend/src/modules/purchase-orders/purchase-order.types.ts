import type {
  PurchaseOrderDocument,
  PurchaseOrderStatus,
} from "./po.model.js";

export type { PurchaseOrderStatus };

export interface PurchaseOrderRecommendationInput {
  recommendationId: string;
  productId: string;
  darkStoreId: string;
  warehouseId: string;
  quantity?: number;
  availableQuantity: number;
  reservedQuantity?: number;
  /** Precomputed PRD qty (demand × lead time × buffer) */
  recommendedQuantity?: number;
  /** Cart-add volume for demand-rate qty when recommendedQuantity is absent */
  cartCount24h?: number;
  windowHours?: number;
}

export interface PurchaseOrderResponseDTO {
  purchaseOrderId: string;
  recommendationId: string;
  productId: string;
  darkStoreId: string;
  warehouseId: string;
  quantity: number;
  status: PurchaseOrderStatus;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

type PurchaseOrderLike = PurchaseOrderDocument & {
  purchaseOrderId: string;
  recommendationId: string;
  productId: { toString(): string };
  darkStoreId: { toString(): string };
  warehouseId: { toString(): string };
  quantity: number;
  status: PurchaseOrderStatus;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
};

export function toPurchaseOrderResponseDTO(
  purchaseOrder: PurchaseOrderLike,
): PurchaseOrderResponseDTO {
  return {
    purchaseOrderId: purchaseOrder.purchaseOrderId,
    recommendationId: purchaseOrder.recommendationId,
    productId: purchaseOrder.productId.toString(),
    darkStoreId: purchaseOrder.darkStoreId.toString(),
    warehouseId: purchaseOrder.warehouseId.toString(),
    quantity: purchaseOrder.quantity,
    status: purchaseOrder.status,
    createdBy: purchaseOrder.createdBy,
    createdAt: purchaseOrder.createdAt,
    updatedAt: purchaseOrder.updatedAt,
  };
}
