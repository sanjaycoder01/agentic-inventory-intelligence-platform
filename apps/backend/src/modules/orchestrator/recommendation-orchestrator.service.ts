import { ValidationError } from "../../middleware/app-errors.js";
import { purchaseOrderWorkflowService } from "../purchase-orders/purchase-order.service.js";
import { WAREHOUSE_ALLOCATION_STATUS } from "../warehouse/allocation.constants.js";
import { warehouseAllocationService } from "../warehouse/allocation.service.js";
import {
  ORCHESTRATOR_ACTIONS,
  ORCHESTRATOR_SERVICES,
  ORCHESTRATOR_STATUSES,
} from "./orchestrator.constants.js";
import type {
  OrchestrationResult,
  PersistedRecommendation,
} from "./recommendation-orchestrator.types.js";

export class RecommendationOrchestratorService {
  async orchestrateRecommendation(
    recommendation: PersistedRecommendation,
  ): Promise<OrchestrationResult> {
    if (recommendation.status !== "PENDING") {
      return {
        recommendationId: recommendation.recommendationId,
        action: ORCHESTRATOR_ACTIONS.IGNORE,
        status: ORCHESTRATOR_STATUSES.SKIPPED,
        nextService: ORCHESTRATOR_SERVICES.NONE,
      };
    }

    switch (recommendation.recommendation) {
      case "REORDER":
        return this.handleReorder(recommendation);
      case "RETURN_TO_WAREHOUSE":
        return this.handleWarehouseReturn(recommendation);
      case "DO_NOT_REORDER":
      case "DONT_REORDER":
      case "NO_ACTION":
        return this.handleNoAction(recommendation);
      default:
        throw new ValidationError(
          `Unsupported recommendation type: ${recommendation.recommendation}`,
        );
    }
  }

  async handleReorder(
    recommendation: PersistedRecommendation,
  ): Promise<OrchestrationResult> {
    const quantity = purchaseOrderWorkflowService.getRecommendedQuantity({
      availableQuantity: recommendation.availableQuantity,
      reservedQuantity: recommendation.reservedQuantity,
      recommendedQuantity: recommendation.recommendedQuantity,
      cartCount24h: recommendation.cartCount24h,
      windowHours: recommendation.windowHours,
    });

    if (quantity <= 0) {
      return {
        recommendationId: recommendation.recommendationId,
        action: ORCHESTRATOR_ACTIONS.CLOSE_RECOMMENDATION,
        status: ORCHESTRATOR_STATUSES.COMPLETED,
        nextService: ORCHESTRATOR_SERVICES.RECOMMENDATION,
      };
    }

    const allocation = await warehouseAllocationService.allocateWarehouse({
      productId: recommendation.productId,
      darkStoreId: recommendation.darkStoreId,
      quantity,
    });

    if (
      allocation.allocationStatus === WAREHOUSE_ALLOCATION_STATUS.OUT_OF_STOCK ||
      !allocation.warehouseId
    ) {
      return {
        recommendationId: recommendation.recommendationId,
        action: ORCHESTRATOR_ACTIONS.PURCHASE_ORDER,
        status: ORCHESTRATOR_STATUSES.FAILED,
        nextService: ORCHESTRATOR_SERVICES.WAREHOUSE_ALLOCATION,
      };
    }

    const purchaseOrder = await purchaseOrderWorkflowService.createPurchaseOrder({
      recommendationId: recommendation.recommendationId,
      productId: recommendation.productId,
      darkStoreId: recommendation.darkStoreId,
      warehouseId: allocation.warehouseId,
      quantity,
      availableQuantity: recommendation.availableQuantity,
      reservedQuantity: recommendation.reservedQuantity,
      recommendedQuantity: recommendation.recommendedQuantity,
      cartCount24h: recommendation.cartCount24h,
      windowHours: recommendation.windowHours,
    });

    return {
      recommendationId: recommendation.recommendationId,
      action: ORCHESTRATOR_ACTIONS.PURCHASE_ORDER,
      status: ORCHESTRATOR_STATUSES.TRIGGERED,
      nextService: ORCHESTRATOR_SERVICES.PURCHASE_ORDER,
      purchaseOrderId: purchaseOrder.purchaseOrderId,
    };
  }

  handleWarehouseReturn(
    recommendation: PersistedRecommendation,
  ): OrchestrationResult {
    return {
      recommendationId: recommendation.recommendationId,
      action: ORCHESTRATOR_ACTIONS.WAREHOUSE_TRANSFER,
      status: ORCHESTRATOR_STATUSES.TRIGGERED,
      nextService: ORCHESTRATOR_SERVICES.WAREHOUSE_TRANSFER,
    };
  }

  handleNoAction(recommendation: PersistedRecommendation): OrchestrationResult {
    return {
      recommendationId: recommendation.recommendationId,
      action: ORCHESTRATOR_ACTIONS.CLOSE_RECOMMENDATION,
      status: ORCHESTRATOR_STATUSES.COMPLETED,
      nextService: ORCHESTRATOR_SERVICES.RECOMMENDATION,
    };
  }
}

export const recommendationOrchestratorService =
  new RecommendationOrchestratorService();
