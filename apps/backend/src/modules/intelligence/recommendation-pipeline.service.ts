import { randomUUID } from "node:crypto";
import { NotFoundError, ValidationError } from "../../middleware/app-errors.js";
import { DarkStoreModel } from "../dark-store/dark-store.model.js";
import { ProductModel } from "../products/product.model.js";
import { agentDecisionService } from "./agent-decision.service.js";
import { eligibilityService } from "./eligibility.service.js";
import { explanationService } from "./explanation.service.js";
import { recommendationPersistenceService } from "./recommendation-persistence.service.js";
import { recommendationService } from "./recommendation.service.js";
import { signalAggregatorService } from "./signal-aggregator.service.js";
import { RecommendationType } from "./recommendation.types.js";
import { calculateReorderQuantity } from "./scoring.js";
import type {
  GenerateRecommendationsInput,
  GenerateRecommendationsResult,
  ProductPipelineResult,
} from "./recommendation-pipeline.types.js";
import type { RecommendationSnapshotDTO } from "./recommendation-persistence.types.js";

export class RecommendationPipelineService {
  async generate(
    input: GenerateRecommendationsInput = {},
  ): Promise<GenerateRecommendationsResult> {
    const darkStoreId = await this.resolveDarkStoreId(input.darkStoreId);
    const productIds = await this.resolveProductIds(input.productId);

    const results: ProductPipelineResult[] = [];
    const recommendations: RecommendationSnapshotDTO[] = [];

    for (const productId of productIds) {
      try {
        const outcome = await this.runForProduct(productId, darkStoreId);
        results.push(outcome);

        if (outcome.recommendationId) {
          const saved =
            await recommendationPersistenceService.getRecommendation(
              outcome.recommendationId,
            );
          recommendations.push(saved);
        }
      } catch (error) {
        results.push({
          productId,
          darkStoreId,
          status: "failed",
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    return {
      darkStoreId,
      processed: results.length,
      created: results.filter((result) => result.status === "created").length,
      skipped: results.filter((result) => result.status === "skipped").length,
      failed: results.filter((result) => result.status === "failed").length,
      results,
      recommendations,
    };
  }

  async runForProduct(
    productId: string,
    darkStoreId: string,
  ): Promise<ProductPipelineResult> {
    const runId = randomUUID();

    const signals = await signalAggregatorService.aggregateSignals(
      productId,
      darkStoreId,
    );
    await agentDecisionService.log({
      runId,
      nodeName: "AGGREGATE_SIGNALS",
      productId,
      darkStoreId,
      inputSummary: { productId, darkStoreId },
      outputSummary: {
        demandScore: signals.demandScore,
        conversionScore: signals.conversionScore,
        ratingScore: signals.ratingScore,
        replenishmentScore: signals.replenishmentScore,
        availableQuantity: signals.availableQuantity,
        warehouseStock: signals.warehouseStock,
        cartCount24h: signals.cartCount24h,
      },
      reasoningText: "Aggregated demand, conversion, rating, and inventory signals.",
    });

    const eligibility = eligibilityService.evaluate(signals);
    await agentDecisionService.log({
      runId,
      nodeName: "ELIGIBILITY",
      productId,
      darkStoreId,
      inputSummary: {
        replenishmentScore: eligibility.replenishmentScore,
        checks: eligibility.checks,
      },
      outputSummary: {
        eligible: eligibility.eligible,
        reasons: eligibility.reasons,
      },
      reasoningText: eligibility.eligible
        ? "Composite score exceeded threshold with low store stock and warehouse availability."
        : `Not eligible: ${eligibility.reasons.join(", ") || "threshold not met"}.`,
    });

    const recommendation = recommendationService.recommend(
      signals,
      eligibility,
    );
    await agentDecisionService.log({
      runId,
      nodeName: "RECOMMENDATION",
      productId,
      darkStoreId,
      inputSummary: {
        eligible: eligibility.eligible,
        checks: eligibility.checks,
      },
      outputSummary: {
        recommendation: recommendation.recommendation,
        matchedRule: recommendation.matchedRule,
        reasons: recommendation.reasons,
        confidence: recommendation.confidence,
      },
      reasoningText: `Matched rule ${recommendation.matchedRule}.`,
    });

    const recommendedQuantity =
      recommendation.recommendation === RecommendationType.REORDER
        ? calculateReorderQuantity({
            cartCount: signals.cartCount24h,
            windowHours: signals.windowHours,
          })
        : 0;

    let blocked = false;
    let eligible = eligibility.eligible;

    if (
      recommendation.recommendation === RecommendationType.REORDER &&
      recommendedQuantity > 0 &&
      signals.warehouseStock < recommendedQuantity
    ) {
      blocked = true;
      eligible = false;
    }

    await agentDecisionService.log({
      runId,
      nodeName: "WAREHOUSE_CHECK",
      productId,
      darkStoreId,
      inputSummary: {
        recommendedQuantity,
        warehouseStock: signals.warehouseStock,
        recommendation: recommendation.recommendation,
      },
      outputSummary: { blocked, canFulfill: !blocked },
      reasoningText: blocked
        ? "Blocked — insufficient warehouse stock for recommended quantity."
        : "Warehouse can fulfill recommended quantity (or no reorder qty required).",
    });

    const explanation = await explanationService.explainWithLlm(
      recommendation,
      signals,
      { blocked, recommendedQuantity },
    );
    await agentDecisionService.log({
      runId,
      nodeName: "EXPLANATION",
      productId,
      darkStoreId,
      inputSummary: {
        recommendation: recommendation.recommendation,
        matchedRule: recommendation.matchedRule,
        blocked,
      },
      outputSummary: { summary: explanation.summary },
      reasoningText: "Generated plain-language explanation (LLM with template fallback).",
    });

    await recommendationPersistenceService.expirePendingForProduct(
      productId,
      darkStoreId,
    );

    const saved = await recommendationPersistenceService.saveRecommendation({
      signals,
      eligibility: { ...eligibility, eligible },
      recommendation,
      explanation,
      status: blocked ? "BLOCKED" : "PENDING",
      recommendedQuantity:
        recommendation.recommendation === RecommendationType.REORDER
          ? recommendedQuantity
          : undefined,
    });

    await agentDecisionService.log({
      runId,
      nodeName: "PERSIST",
      productId,
      darkStoreId,
      relatedRecommendationId: saved.recommendationId,
      inputSummary: {
        recommendation: recommendation.recommendation,
        blocked,
        eligible,
      },
      outputSummary: {
        recommendationId: saved.recommendationId,
        status: saved.status,
      },
      reasoningText: "Persisted recommendation for admin review.",
    });

    return {
      productId,
      darkStoreId,
      status: "created",
      recommendationId: saved.recommendationId,
      recommendation: saved.recommendation,
      eligible: saved.eligible,
      blocked,
    };
  }

  private async resolveDarkStoreId(darkStoreId?: string): Promise<string> {
    if (darkStoreId) {
      const store = await DarkStoreModel.findById(darkStoreId);
      if (!store) {
        throw new NotFoundError(`Dark store ${darkStoreId} not found`);
      }
      return store._id.toString();
    }

    const defaultStore = await DarkStoreModel.findOne({ status: "ACTIVE" });
    if (!defaultStore) {
      throw new NotFoundError("No active dark store found");
    }

    return defaultStore._id.toString();
  }

  private async resolveProductIds(productId?: string): Promise<string[]> {
    if (productId) {
      const product = await ProductModel.findById(productId);
      if (!product) {
        throw new NotFoundError(`Product ${productId} not found`);
      }
      if (!product.isActive) {
        throw new ValidationError(`Product ${productId} is not active`);
      }
      return [product._id.toString()];
    }

    const products = await ProductModel.find({ isActive: true })
      .select("_id")
      .sort({ name: 1 });

    if (products.length === 0) {
      throw new NotFoundError("No active products found");
    }

    return products.map((product) => product._id.toString());
  }
}

export const recommendationPipelineService = new RecommendationPipelineService();
