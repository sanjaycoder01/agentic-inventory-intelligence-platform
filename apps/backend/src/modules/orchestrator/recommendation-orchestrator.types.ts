import type { RecommendationSnapshotDTO } from "../intelligence/recommendation-persistence.types.js";
import type {
  ORCHESTRATOR_ACTIONS,
  ORCHESTRATOR_SERVICES,
  ORCHESTRATOR_STATUSES,
} from "./orchestrator.constants.js";

export type PersistedRecommendation = RecommendationSnapshotDTO;

export type OrchestrationAction =
  (typeof ORCHESTRATOR_ACTIONS)[keyof typeof ORCHESTRATOR_ACTIONS];

export type OrchestrationStatus =
  (typeof ORCHESTRATOR_STATUSES)[keyof typeof ORCHESTRATOR_STATUSES];

export type NextService =
  (typeof ORCHESTRATOR_SERVICES)[keyof typeof ORCHESTRATOR_SERVICES];

export interface OrchestrationResult {
  recommendationId: string;
  action: OrchestrationAction;
  status: OrchestrationStatus;
  nextService: NextService;
  purchaseOrderId?: string;
}
