import type { RecommendationSnapshotDTO } from "./recommendation-persistence.types.js";

export interface GenerateRecommendationsInput {
  darkStoreId?: string;
  productId?: string;
}

export interface ProductPipelineResult {
  productId: string;
  darkStoreId: string;
  status: "created" | "skipped" | "failed";
  recommendationId?: string;
  recommendation?: string;
  eligible?: boolean;
  blocked?: boolean;
  error?: string;
}

export interface GenerateRecommendationsResult {
  darkStoreId: string;
  processed: number;
  created: number;
  skipped: number;
  failed: number;
  results: ProductPipelineResult[];
  recommendations: RecommendationSnapshotDTO[];
}
