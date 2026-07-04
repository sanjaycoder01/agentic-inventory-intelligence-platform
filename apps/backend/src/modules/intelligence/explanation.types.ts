import type { RecommendationRuleId } from "./recommendation.types.js";

export interface ExplanationTemplate {
  summary: string;
}

export interface ExplanationResult {
  summary: string;
  factors: string[];
  matchedRule: RecommendationRuleId;
}
