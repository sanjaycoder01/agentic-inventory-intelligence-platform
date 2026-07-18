import { claudeClient } from "../ai/llm/claude.client.js";
import { demandIntelligenceFactorLines } from "../demand/demand.types.js";
import type { AggregatedSignals } from "./recommendation.types.js";
import type { RecommendationResult } from "./recommendation.types.js";
import { explanationTemplates } from "./explanation.templates.js";
import type { ExplanationResult } from "./explanation.types.js";
import { calculateReorderQuantity, calculateReplenishmentScore } from "./scoring.js";
import { RecommendationType } from "./recommendation.types.js";

function formatScore(score: number): string {
  return score.toFixed(2);
}

const EXPLANATION_SYSTEM_PROMPT = `You explain inventory replenishment decisions for a dark store admin.
Rules:
- Use ONLY the facts provided in the user message.
- Do NOT invent numbers, percentages, or quantities that are not in the facts.
- Do NOT change the decision — only explain it in plain language (2-3 sentences).
- Never compute scores; scores are already decided deterministically.
- When demand intelligence windows, velocity, trend, or baseline multiplier are present, mention them briefly.`;

export class ExplanationService {
  /** Deterministic template explanation (always available as fallback). */
  explain(
    recommendation: RecommendationResult,
    signals: AggregatedSignals,
    options?: { blocked?: boolean; recommendedQuantity?: number },
  ): ExplanationResult {
    const template = explanationTemplates[recommendation.matchedRule];
    const replenishmentScore =
      signals.replenishmentScore ??
      calculateReplenishmentScore(
        signals.demandScore,
        signals.ratingScore,
        signals.conversionScore,
      );

    const demandFactors = signals.demandIntelligence
      ? demandIntelligenceFactorLines(signals.demandIntelligence)
      : [`Demand Score: ${formatScore(signals.demandScore)}`];

    const factors = [
      `Replenishment Score: ${formatScore(replenishmentScore)}`,
      ...demandFactors,
      `Conversion Score: ${formatScore(signals.conversionScore)}`,
      `Rating Score: ${formatScore(signals.ratingScore)}`,
      `Available Inventory: ${signals.availableQuantity}`,
      `Reserved Inventory: ${signals.reservedQuantity}`,
      `Warehouse Stock: ${signals.warehouseStock}`,
      `Average Rating: ${formatScore(signals.averageRating)}`,
      `Total Ratings: ${signals.totalRatings}`,
      `Confidence: ${formatScore(recommendation.confidence)}`,
    ];

    if (options?.recommendedQuantity != null) {
      factors.push(`Recommended Quantity: ${options.recommendedQuantity}`);
    }

    if (options?.blocked) {
      factors.push("Status: BLOCKED");
      return {
        summary:
          "Blocked — main warehouse cannot fulfill the recommended reorder quantity.",
        factors,
        matchedRule: recommendation.matchedRule,
      };
    }

    return {
      summary: template.summary,
      factors,
      matchedRule: recommendation.matchedRule,
    };
  }

  /**
   * PRD: Claude explains the deterministic decision in plain language.
   * Falls back to templates if the API key is missing or the call fails.
   */
  async explainWithLlm(
    recommendation: RecommendationResult,
    signals: AggregatedSignals,
    options?: { blocked?: boolean; recommendedQuantity?: number },
  ): Promise<ExplanationResult> {
    const fallback = this.explain(recommendation, signals, options);

    const recommendedQuantity =
      options?.recommendedQuantity ??
      (recommendation.recommendation === RecommendationType.REORDER
        ? calculateReorderQuantity({
            cartCount: signals.cartCount24h ?? 0,
            windowHours: signals.windowHours,
          })
        : undefined);

    const di = signals.demandIntelligence;

    try {
      const facts = [
        `Decision: ${options?.blocked ? "BLOCKED" : recommendation.recommendation}`,
        `Matched rule: ${recommendation.matchedRule}`,
        `Reasons: ${recommendation.reasons.join(", ")}`,
        `Replenishment score: ${formatScore(
          signals.replenishmentScore ??
            calculateReplenishmentScore(
              signals.demandScore,
              signals.ratingScore,
              signals.conversionScore,
            ),
        )}`,
        `Demand score: ${formatScore(signals.demandScore)}`,
        di
          ? `Demand windows — 5m: ${di.last5Min}, 30m: ${di.last30Min}, 2h: ${di.last2Hours}, 24h: ${di.last24Hours}`
          : null,
        di
          ? `Demand velocity: ${di.velocity} (${di.velocityPercent}%)`
          : null,
        di ? `Demand trend: ${di.trend}` : null,
        di ? `Baseline multiplier: ${di.baselineMultiplier}x` : null,
        `Conversion score: ${formatScore(signals.conversionScore)}`,
        `Rating score: ${formatScore(signals.ratingScore)}`,
        `Store available qty: ${signals.availableQuantity}`,
        `Warehouse stock: ${signals.warehouseStock}`,
        recommendedQuantity != null
          ? `Recommended reorder qty: ${recommendedQuantity}`
          : null,
        `Cart adds (24h): ${signals.cartCount24h ?? 0}`,
        `Average rating: ${formatScore(signals.averageRating)} (${signals.totalRatings} ratings)`,
      ]
        .filter(Boolean)
        .join("\n");

      const response = await claudeClient.generateResponse(
        [
          {
            role: "user",
            content: `Write a short plain-language explanation of this inventory recommendation decision for a dark store admin.\n\nFacts:\n${facts}`,
          },
        ],
        EXPLANATION_SYSTEM_PROMPT,
      );

      const summary = response.content?.trim();
      if (!summary) {
        return fallback;
      }

      return {
        ...fallback,
        summary,
      };
    } catch {
      return fallback;
    }
  }
}

export const explanationService = new ExplanationService();
