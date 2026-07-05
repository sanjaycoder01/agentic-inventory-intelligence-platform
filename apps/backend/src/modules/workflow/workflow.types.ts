import type { RecommendationSnapshotDTO } from "../intelligence/recommendation-persistence.types.js";
import type { PurchaseOrderResponseDTO } from "../purchase-orders/purchase-order.types.js";
import type { WarehouseAllocationResult } from "../warehouse/allocation.types.js";
import type {
  WORKFLOW_FAILURE_REASONS,
  WORKFLOW_STATUSES,
  WORKFLOW_STEPS,
} from "./workflow.constants.js";

export type WorkflowStatus =
  (typeof WORKFLOW_STATUSES)[keyof typeof WORKFLOW_STATUSES];

export type WorkflowStep =
  (typeof WORKFLOW_STEPS)[keyof typeof WORKFLOW_STEPS];

export type WorkflowFailureReason =
  (typeof WORKFLOW_FAILURE_REASONS)[keyof typeof WORKFLOW_FAILURE_REASONS];

export type ApprovedRecommendationWorkflowInput = RecommendationSnapshotDTO;

export interface WorkflowContext {
  recommendation: ApprovedRecommendationWorkflowInput;
  recommendedQuantity?: number;
  allocation?: WarehouseAllocationResult;
  purchaseOrder?: PurchaseOrderResponseDTO;
}

export interface WorkflowResult {
  recommendationId: string;
  status: WorkflowStatus;
  currentStep: WorkflowStep;
  recommendedQuantity?: number;
  allocation?: WarehouseAllocationResult;
  purchaseOrder?: PurchaseOrderResponseDTO;
  failureReason?: WorkflowFailureReason;
  errorMessage?: string;
}
