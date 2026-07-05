import type {
  RecommendationDocument,
  RecommendationStatus,
} from "./recommendation.model.js";
import type { EligibilityResult } from "./eligibility.types.js";
import type { ExplanationResult } from "./explanation.types.js";
import type {
  AggregatedSignals,
  RecommendationResult,
} from "./recommendation.types.js";

export type { RecommendationStatus };

export interface SaveRecommendationInput {
  signals: AggregatedSignals;
  eligibility: EligibilityResult;
  recommendation: RecommendationResult;
  explanation: ExplanationResult;
}

export interface RecommendationSnapshotDTO {
  recommendationId: string;
  productId: string;
  darkStoreId: string;
  warehouseId?: string;
  recommendation: string;
  matchedRule: string;
  confidence: number;
  eligible: boolean;
  demandScore: number;
  conversionScore: number;
  ratingScore: number;
  availableQuantity: number;
  reservedQuantity?: number;
  warehouseStock: number;
  summary: string;
  factors: string[];
  status: RecommendationStatus;
  createdAt: Date;
  updatedAt: Date;
  approvedBy?: string | null;
  approvedAt?: Date | null;
  rejectedBy?: string | null;
  rejectedAt?: Date | null;
  rejectionReason?: string | null;
}

type RecommendationLike = RecommendationDocument & {
  recommendationId: string;
  productId: { toString(): string };
  darkStoreId: { toString(): string };
  warehouseId?: { toString(): string } | null;
  recommendationType: string;
  matchedRule: string;
  overallScore: number;
  eligible: boolean;
  demandScore: number;
  conversionScore: number;
  ratingScore: number;
  availableQuantity: number;
  reservedQuantity?: number | null;
  warehouseStock: number;
  summary: string;
  factors: string[];
  status: RecommendationStatus;
  createdAt: Date;
  updatedAt: Date;
  approvedBy?: string | null;
  approvedAt?: Date | null;
  rejectedBy?: string | null;
  rejectedAt?: Date | null;
  rejectionReason?: string | null;
};

export function toRecommendationSnapshotDTO(
  recommendation: RecommendationLike,
): RecommendationSnapshotDTO {
  return {
    recommendationId: recommendation.recommendationId,
    productId: recommendation.productId.toString(),
    darkStoreId: recommendation.darkStoreId.toString(),
    warehouseId: recommendation.warehouseId?.toString(),
    recommendation: recommendation.recommendationType,
    matchedRule: recommendation.matchedRule,
    confidence: recommendation.overallScore,
    eligible: recommendation.eligible,
    demandScore: recommendation.demandScore,
    conversionScore: recommendation.conversionScore,
    ratingScore: recommendation.ratingScore,
    availableQuantity: recommendation.availableQuantity,
    reservedQuantity: recommendation.reservedQuantity ?? undefined,
    warehouseStock: recommendation.warehouseStock,
    summary: recommendation.summary,
    factors: recommendation.factors,
    status: recommendation.status,
    createdAt: recommendation.createdAt,
    updatedAt: recommendation.updatedAt,
    approvedBy: recommendation.approvedBy ?? undefined,
    approvedAt: recommendation.approvedAt ?? undefined,
    rejectedBy: recommendation.rejectedBy ?? undefined,
    rejectedAt: recommendation.rejectedAt ?? undefined,
    rejectionReason: recommendation.rejectionReason ?? undefined,
  };
}
