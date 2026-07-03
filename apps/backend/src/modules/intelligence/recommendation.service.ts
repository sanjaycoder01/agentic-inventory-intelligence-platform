import { recommendationRules } from "./recommendation.rules.js";
import type {
  AggregatedSignals,
  EligibilityResult,
  RecommendationResult,
  RecommendationRule,
} from "./recommendation.types.js";

export class RecommendationService {
  constructor(private readonly rules: RecommendationRule[] = recommendationRules) {}

  recommend(
    signals: AggregatedSignals,
    eligibility: EligibilityResult,
  ): RecommendationResult {
    const matchedRule = this.rules.find((rule) =>
      rule.matches(signals, eligibility),
    );

    if (!matchedRule) {
      throw new Error("Recommendation engine has no fallback rule configured");
    }

    return matchedRule.buildResult(signals, eligibility);
  }

  async generateForProduct(_productId: string): Promise<any> {
    throw new Error(
      "generateForProduct is deprecated. Use signalAggregatorService, eligibilityService, and recommend instead.",
    );
  }

  async listRecommendations(): Promise<any> {
    throw new Error(
      "listRecommendations is deprecated. Use the Phase 5 intelligence pipeline instead.",
    );
  }
}

export const recommendationService = new RecommendationService();
