import type { AggregatedSignals } from "./recommendation.types.js";
import type { RecommendationResult } from "./recommendation.types.js";
import { explanationTemplates } from "./explanation.templates.js";
import type { ExplanationResult } from "./explanation.types.js";

function formatScore(score: number): string {
  return score.toFixed(2);
}

export class ExplanationService {
  explain(
    recommendation: RecommendationResult,
    signals: AggregatedSignals,
  ): ExplanationResult {
    const template = explanationTemplates[recommendation.matchedRule];

    return {
      summary: template.summary,
      factors: [
        `Demand Score: ${formatScore(signals.demandScore)}`,
        `Conversion Score: ${formatScore(signals.conversionScore)}`,
        `Rating Score: ${formatScore(signals.ratingScore)}`,
        `Available Inventory: ${signals.availableQuantity}`,
        `Reserved Inventory: ${signals.reservedQuantity}`,
        `Warehouse Stock: ${signals.warehouseStock}`,
        `Average Rating: ${formatScore(signals.averageRating)}`,
        `Total Ratings: ${signals.totalRatings}`,
        `Confidence: ${formatScore(recommendation.confidence)}`,
      ],
      matchedRule: recommendation.matchedRule,
    };
  }
}

export const explanationService = new ExplanationService();
