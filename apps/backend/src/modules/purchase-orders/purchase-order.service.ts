import { randomUUID } from "node:crypto";
import { NotFoundError, ValidationError } from "../../middleware/app-errors.js";
import { PURCHASE_ORDER_DEFAULTS } from "./purchase-order.constants.js";
import { PurchaseOrderModel } from "./po.model.js";
import type {
  PurchaseOrderRecommendationInput,
  PurchaseOrderResponseDTO,
  PurchaseOrderStatus,
} from "./purchase-order.types.js";
import { toPurchaseOrderResponseDTO } from "./purchase-order.types.js";

export class PurchaseOrderWorkflowService {
  getRecommendedQuantity(
    recommendation: Pick<
      PurchaseOrderRecommendationInput,
      "availableQuantity" | "reservedQuantity"
    >,
  ): number {
    return this.calculateRecommendedQuantity(recommendation);
  }

  async createPurchaseOrder(
    recommendation: PurchaseOrderRecommendationInput,
  ): Promise<PurchaseOrderResponseDTO> {
    const quantity =
      recommendation.quantity ?? this.calculateRecommendedQuantity(recommendation);

    if (quantity <= 0) {
      throw new ValidationError(
        `Recommendation ${recommendation.recommendationId} does not require a purchase order`,
      );
    }

    const purchaseOrder = await PurchaseOrderModel.create({
      purchaseOrderId: randomUUID(),
      recommendationId: recommendation.recommendationId,
      productId: recommendation.productId,
      darkStoreId: recommendation.darkStoreId,
      warehouseId: recommendation.warehouseId,
      quantity,
      orderType: PURCHASE_ORDER_DEFAULTS.ORDER_TYPE,
      status: "DRAFT",
      createdBy: PURCHASE_ORDER_DEFAULTS.CREATED_BY,
    });

    return toPurchaseOrderResponseDTO(purchaseOrder);
  }

  async getPurchaseOrder(
    purchaseOrderId: string,
  ): Promise<PurchaseOrderResponseDTO> {
    const purchaseOrder = await PurchaseOrderModel.findOne({ purchaseOrderId });
    if (!purchaseOrder) {
      throw new NotFoundError(`Purchase order ${purchaseOrderId} not found`);
    }

    return toPurchaseOrderResponseDTO(purchaseOrder);
  }

  async getPurchaseOrdersByStatus(
    status: PurchaseOrderStatus,
  ): Promise<PurchaseOrderResponseDTO[]> {
    const purchaseOrders = await PurchaseOrderModel.find({ status }).sort({
      createdAt: -1,
    });

    return purchaseOrders.map(toPurchaseOrderResponseDTO);
  }

  private calculateRecommendedQuantity(
    recommendation: Pick<
      PurchaseOrderRecommendationInput,
      "availableQuantity" | "reservedQuantity"
    >,
  ): number {
    const currentStock =
      recommendation.availableQuantity + (recommendation.reservedQuantity ?? 0);

    return Math.max(0, PURCHASE_ORDER_DEFAULTS.TARGET_STOCK - currentStock);
  }
}

export const purchaseOrderWorkflowService = new PurchaseOrderWorkflowService();
