import { RecommendationType } from "../intelligence/recommendation.types.js";
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
      return validationFailure;
    }

    context = this.withRecommendedQuantity(context);

    const quantityFailure = this.validateRecommendedQuantity(context);
    if (quantityFailure) {
      return quantityFailure;
    }

    try {
      context = await this.withAllocation(context);
    } catch (error) {
      return this.failed(
        context,
        WORKFLOW_STEPS.ALLOCATE_WAREHOUSE,
        WORKFLOW_FAILURE_REASONS.ALLOCATION_FAILED,
        error,
      );
    }

    const allocationFailure = this.validateAllocation(context);
    if (allocationFailure) {
      return allocationFailure;
    }

    try {
      context = await this.withPurchaseOrder(context);
    } catch (error) {
      return this.failed(
        context,
        WORKFLOW_STEPS.CREATE_PURCHASE_ORDER,
        WORKFLOW_FAILURE_REASONS.PURCHASE_ORDER_FAILED,
        error,
      );
    }

    return this.completed(context);
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
}

export const workflowService = new WorkflowService();
