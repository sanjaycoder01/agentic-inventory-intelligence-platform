import { RecommendationType } from "../intelligence/recommendation.types.js";
import { NOTIFICATION_EVENT_TYPES } from "../notifications/notification.constants.js";
import { notificationService } from "../notifications/notification.service.js";
import { purchaseOrderWorkflowService } from "../purchase-orders/purchase-order.service.js";
import { WAREHOUSE_ALLOCATION_STATUS } from "../warehouse/allocation.constants.js";
import { warehouseAllocationService } from "../warehouse/allocation.service.js";
import {
  WORKFLOW_FAILURE_REASONS,
  WORKFLOW_STATUSES,
  WORKFLOW_STEPS,
} from "./workflow.constants.js";
import type {
  ApprovedRecommendationWorkflowInput,
  WorkflowContext,
  WorkflowFailureReason,
  WorkflowResult,
  WorkflowStep,
} from "./workflow.types.js";

export class WorkflowService {
  async runApprovedRecommendationWorkflow(
    recommendation: ApprovedRecommendationWorkflowInput,
  ): Promise<WorkflowResult> {
    let context: WorkflowContext = { recommendation };

    const validationFailure = this.validateRecommendation(context);
    if (validationFailure) {
      return this.withFailureNotification(validationFailure);
    }

    await this.publishRecommendationApproved(context);

    context = this.withRecommendedQuantity(context);

    const quantityFailure = this.validateRecommendedQuantity(context);
    if (quantityFailure) {
      return this.withFailureNotification(quantityFailure);
    }

    try {
      context = await this.withAllocation(context);
    } catch (error) {
      return this.withFailureNotification(
        this.failed(
          context,
          WORKFLOW_STEPS.ALLOCATE_WAREHOUSE,
          WORKFLOW_FAILURE_REASONS.ALLOCATION_FAILED,
          error,
        ),
      );
    }

    const allocationFailure = this.validateAllocation(context);
    if (allocationFailure) {
      return this.withFailureNotification(allocationFailure);
    }

    await this.publishWarehouseAllocated(context);

    try {
      context = await this.withPurchaseOrder(context);
    } catch (error) {
      return this.withFailureNotification(
        this.failed(
          context,
          WORKFLOW_STEPS.CREATE_PURCHASE_ORDER,
          WORKFLOW_FAILURE_REASONS.PURCHASE_ORDER_FAILED,
          error,
        ),
      );
    }

    await this.publishPurchaseOrderCreated(context);

    const result = this.completed(context);
    await this.publishWorkflowCompleted(result);

    return result;
  }

  private validateRecommendation(
    context: WorkflowContext,
  ): WorkflowResult | undefined {
    const { recommendation } = context;

    if (recommendation.status !== "APPROVED") {
      return this.failed(
        context,
        WORKFLOW_STEPS.VALIDATE_RECOMMENDATION,
        WORKFLOW_FAILURE_REASONS.RECOMMENDATION_NOT_APPROVED,
      );
    }

    if (recommendation.recommendation !== RecommendationType.REORDER) {
      return this.failed(
        context,
        WORKFLOW_STEPS.VALIDATE_RECOMMENDATION,
        WORKFLOW_FAILURE_REASONS.RECOMMENDATION_NOT_REORDER,
      );
    }

    return undefined;
  }

  private withRecommendedQuantity(context: WorkflowContext): WorkflowContext {
    return {
      ...context,
      recommendedQuantity: purchaseOrderWorkflowService.getRecommendedQuantity({
        availableQuantity: context.recommendation.availableQuantity,
        reservedQuantity: context.recommendation.reservedQuantity,
      }),
    };
  }

  private validateRecommendedQuantity(
    context: WorkflowContext,
  ): WorkflowResult | undefined {
    if ((context.recommendedQuantity ?? 0) <= 0) {
      return this.failed(
        context,
        WORKFLOW_STEPS.VALIDATE_RECOMMENDATION,
        WORKFLOW_FAILURE_REASONS.NO_REPLENISHMENT_REQUIRED,
      );
    }

    return undefined;
  }

  private async withAllocation(
    context: WorkflowContext,
  ): Promise<WorkflowContext> {
    const allocation = await warehouseAllocationService.allocateWarehouse({
      productId: context.recommendation.productId,
      darkStoreId: context.recommendation.darkStoreId,
      quantity: context.recommendedQuantity!,
    });

    return { ...context, allocation };
  }

  private validateAllocation(
    context: WorkflowContext,
  ): WorkflowResult | undefined {
    if (
      context.allocation?.allocationStatus ===
      WAREHOUSE_ALLOCATION_STATUS.OUT_OF_STOCK
    ) {
      return this.failed(
        context,
        WORKFLOW_STEPS.ALLOCATE_WAREHOUSE,
        WORKFLOW_FAILURE_REASONS.ALLOCATION_OUT_OF_STOCK,
      );
    }

    if (!context.allocation?.warehouseId) {
      return this.failed(
        context,
        WORKFLOW_STEPS.ALLOCATE_WAREHOUSE,
        WORKFLOW_FAILURE_REASONS.ALLOCATION_FAILED,
      );
    }

    return undefined;
  }

  private async withPurchaseOrder(
    context: WorkflowContext,
  ): Promise<WorkflowContext> {
    const purchaseOrder = await purchaseOrderWorkflowService.createPurchaseOrder({
      recommendationId: context.recommendation.recommendationId,
      productId: context.recommendation.productId,
      darkStoreId: context.recommendation.darkStoreId,
      warehouseId: context.allocation!.warehouseId!,
      quantity: context.recommendedQuantity,
      availableQuantity: context.recommendation.availableQuantity,
      reservedQuantity: context.recommendation.reservedQuantity,
    });

    return { ...context, purchaseOrder };
  }

  private completed(context: WorkflowContext): WorkflowResult {
    return {
      recommendationId: context.recommendation.recommendationId,
      status: WORKFLOW_STATUSES.COMPLETED,
      currentStep: WORKFLOW_STEPS.COMPLETE_WORKFLOW,
      recommendedQuantity: context.recommendedQuantity,
      allocation: context.allocation,
      purchaseOrder: context.purchaseOrder,
    };
  }

  private failed(
    context: WorkflowContext,
    currentStep: WorkflowStep,
    failureReason: WorkflowFailureReason,
    error?: unknown,
  ): WorkflowResult {
    return {
      recommendationId: context.recommendation.recommendationId,
      status: WORKFLOW_STATUSES.FAILED,
      currentStep,
      recommendedQuantity: context.recommendedQuantity,
      allocation: context.allocation,
      purchaseOrder: context.purchaseOrder,
      failureReason,
      errorMessage: error instanceof Error ? error.message : undefined,
    };
  }

  private async withFailureNotification(
    result: WorkflowResult,
  ): Promise<WorkflowResult> {
    await notificationService.publish({
      eventType: NOTIFICATION_EVENT_TYPES.WORKFLOW_FAILED,
      entityType: "Workflow",
      entityId: result.recommendationId,
      payload: {
        recommendationId: result.recommendationId,
        currentStep: result.currentStep,
        failureReason: result.failureReason,
        errorMessage: result.errorMessage,
        recommendedQuantity: result.recommendedQuantity,
        allocation: result.allocation,
        purchaseOrder: result.purchaseOrder,
      },
    });

    return result;
  }

  private async publishRecommendationApproved(
    context: WorkflowContext,
  ): Promise<void> {
    await notificationService.publish({
      eventType: NOTIFICATION_EVENT_TYPES.RECOMMENDATION_APPROVED,
      entityType: "Recommendation",
      entityId: context.recommendation.recommendationId,
      payload: {
        recommendationId: context.recommendation.recommendationId,
        productId: context.recommendation.productId,
        darkStoreId: context.recommendation.darkStoreId,
        recommendation: context.recommendation.recommendation,
        status: context.recommendation.status,
      },
    });
  }

  private async publishWarehouseAllocated(
    context: WorkflowContext,
  ): Promise<void> {
    await notificationService.publish({
      eventType: NOTIFICATION_EVENT_TYPES.WAREHOUSE_ALLOCATED,
      entityType: "Warehouse",
      entityId: context.allocation!.warehouseId!,
      payload: {
        recommendationId: context.recommendation.recommendationId,
        productId: context.recommendation.productId,
        darkStoreId: context.recommendation.darkStoreId,
        warehouseId: context.allocation!.warehouseId,
        quantity: context.recommendedQuantity,
        allocatedQuantity: context.allocation!.allocatedQuantity,
        distanceKm: context.allocation!.distanceKm,
        allocationStatus: context.allocation!.allocationStatus,
      },
    });
  }

  private async publishPurchaseOrderCreated(
    context: WorkflowContext,
  ): Promise<void> {
    await notificationService.publish({
      eventType: NOTIFICATION_EVENT_TYPES.PURCHASE_ORDER_CREATED,
      entityType: "PurchaseOrder",
      entityId: context.purchaseOrder!.purchaseOrderId,
      payload: {
        recommendationId: context.recommendation.recommendationId,
        purchaseOrderId: context.purchaseOrder!.purchaseOrderId,
        productId: context.purchaseOrder!.productId,
        darkStoreId: context.purchaseOrder!.darkStoreId,
        warehouseId: context.purchaseOrder!.warehouseId,
        quantity: context.purchaseOrder!.quantity,
        status: context.purchaseOrder!.status,
      },
    });
  }

  private async publishWorkflowCompleted(
    result: WorkflowResult,
  ): Promise<void> {
    await notificationService.publish({
      eventType: NOTIFICATION_EVENT_TYPES.WORKFLOW_COMPLETED,
      entityType: "Workflow",
      entityId: result.recommendationId,
      payload: {
        recommendationId: result.recommendationId,
        recommendedQuantity: result.recommendedQuantity,
        allocation: result.allocation,
        purchaseOrder: result.purchaseOrder,
      },
    });
  }
}

export const workflowService = new WorkflowService();
