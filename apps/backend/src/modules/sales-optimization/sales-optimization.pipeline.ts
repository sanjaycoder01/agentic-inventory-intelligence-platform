import { randomUUID } from "node:crypto";
import { NotFoundError, ValidationError } from "../../middleware/app-errors.js";
import { DarkStoreModel } from "../dark-store/dark-store.model.js";
import { ProductModel } from "../products/product.model.js";
import { agentDecisionService } from "../intelligence/agent-decision.service.js";
import { RecommendationModel } from "../intelligence/recommendation.model.js";
import { salesOptimizationExplanationService } from "./explanation.service.js";
import { salesMetricsService } from "./metrics.service.js";
import {
  strategyEngine,
  strategyToRecommendationType,
} from "./strategy.engine.js";
import type {
  ProductSalesMetrics,
  SalesStrategyType,
} from "./sales-optimization.types.js";

export interface GenerateSalesOptInput {
  darkStoreId?: string;
  productId?: string;
}

export interface SalesOptProductResult {
  productId: string;
  darkStoreId: string;
  status: "created" | "failed";
  recommendationId?: string;
  strategy?: string;
  error?: string;
}

const STOCK_REQUIRED_STRATEGIES = new Set<SalesStrategyType>([
  "DISCOUNT",
  "CLEARANCE",
  "LIQUIDATE",
  "BUNDLE",
  "RUN_ADS",
  "HOMEPAGE_HIGHLIGHT",
]);

export class SalesOptimizationPipelineService {
  async generate(input: GenerateSalesOptInput = {}) {
    const darkStoreId = await this.resolveDarkStoreId(input.darkStoreId);
    const productIds = await this.resolveProductIds(input.productId);

    const results: SalesOptProductResult[] = [];
    const recommendations = [];

    for (const productId of productIds) {
      try {
        const outcome = await this.runForProduct(productId, darkStoreId);
        results.push(outcome);
        if (outcome.recommendationId) {
          const saved = await RecommendationModel.findOne({
            recommendationId: outcome.recommendationId,
          }).lean();
          if (saved) recommendations.push(saved);
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
      created: results.filter((r) => r.status === "created").length,
      failed: results.filter((r) => r.status === "failed").length,
      results,
      recommendations,
    };
  }

  async runForProduct(
    productId: string,
    darkStoreId: string,
  ): Promise<SalesOptProductResult> {
    const runId = randomUUID();

    const metrics = await salesMetricsService.computeForProduct(
      productId,
      darkStoreId,
    );
    await agentDecisionService.log({
      runId,
      nodeName: "AGGREGATE_METRICS",
      productId,
      darkStoreId,
      inputSummary: { productId, darkStoreId },
      outputSummary: metrics as unknown as Record<string, unknown>,
      reasoningText:
        "Computed sell-through, age, velocity, and related metrics.",
    });

    const strategy = strategyEngine.evaluate(metrics);
    await agentDecisionService.log({
      runId,
      nodeName: "STRATEGY",
      productId,
      darkStoreId,
      inputSummary: {
        sellThroughPercent: metrics.sellThroughPercent,
        inventoryAgeDays: metrics.inventoryAgeDays,
        velocityClass: metrics.velocityClass,
      },
      outputSummary: strategy as unknown as Record<string, unknown>,
      reasoningText: `Matched strategy rule ${strategy.matchedRule}.`,
    });

    const validation = this.validateInventory(metrics, strategy.strategy);
    await agentDecisionService.log({
      runId,
      nodeName: "INVENTORY_VALIDATION",
      productId,
      darkStoreId,
      inputSummary: {
        currentInventory: metrics.currentInventory,
        strategy: strategy.strategy,
      },
      outputSummary: validation,
      reasoningText: validation.ok
        ? "Inventory state supports the proposed sales action."
        : validation.reason,
    });

    const explanation =
      await salesOptimizationExplanationService.explainWithLlm(
        metrics,
        strategy,
      );
    await agentDecisionService.log({
      runId,
      nodeName: "SALES_EXPLANATION",
      productId,
      darkStoreId,
      inputSummary: { strategy: strategy.strategy },
      outputSummary: { summary: explanation.summary },
      reasoningText: "Generated plain-language sales optimization explanation.",
    });

    await RecommendationModel.updateMany(
      {
        productId,
        darkStoreId,
        intelligenceType: "SALES_OPTIMIZATION",
        status: { $in: ["PENDING", "BLOCKED"] },
      },
      { status: "EXPIRED" },
    );

    const recommendationType = strategyToRecommendationType(strategy.strategy);
    const status =
      strategy.actionable && !validation.ok ? "BLOCKED" : "PENDING";

    const saved = await RecommendationModel.create({
      recommendationId: randomUUID(),
      intelligenceType: "SALES_OPTIMIZATION",
      productId,
      darkStoreId,
      recommendationType,
      recommendationReason: explanation.summary,
      matchedRule: strategy.matchedRule,
      eligible: strategy.actionable && validation.ok,
      demandScore: Math.min(1, metrics.averageDailySales / 10),
      conversionScore: metrics.conversionRate,
      ratingScore: metrics.ratingScore,
      overallScore: strategy.confidence,
      availableQuantity: metrics.currentInventory,
      reservedQuantity: 0,
      warehouseStock: metrics.warehouseInventory,
      summary: explanation.summary,
      factors: [
        ...explanation.factors,
        ...(validation.ok ? [] : [`Validation: ${validation.reason}`]),
      ],
      metrics,
      strategy: strategy.strategy,
      discountPercent: strategy.discountPercent,
      status,
      generatedAt: new Date(),
    });

    await agentDecisionService.log({
      runId,
      nodeName: "SALES_PERSIST",
      productId,
      darkStoreId,
      relatedRecommendationId: saved.recommendationId,
      inputSummary: { strategy: strategy.strategy, status },
      outputSummary: { recommendationId: saved.recommendationId },
      reasoningText: "Persisted sales optimization recommendation.",
    });

    return {
      productId,
      darkStoreId,
      status: "created",
      recommendationId: saved.recommendationId,
      strategy: strategy.strategy,
    };
  }

  private validateInventory(
    metrics: ProductSalesMetrics,
    strategy: SalesStrategyType,
  ): { ok: boolean; reason: string } {
    if (
      STOCK_REQUIRED_STRATEGIES.has(strategy) &&
      metrics.currentInventory <= 0
    ) {
      return {
        ok: false,
        reason: "No dark-store inventory available for a sales action.",
      };
    }

    return { ok: true, reason: "Inventory available." };
  }

  private async resolveDarkStoreId(darkStoreId?: string): Promise<string> {
    if (darkStoreId) {
      const store = await DarkStoreModel.findById(darkStoreId);
      if (!store) throw new NotFoundError(`Dark store ${darkStoreId} not found`);
      return store._id.toString();
    }
    const defaultStore = await DarkStoreModel.findOne({ status: "ACTIVE" });
    if (!defaultStore) throw new NotFoundError("No active dark store found");
    return defaultStore._id.toString();
  }

  private async resolveProductIds(productId?: string): Promise<string[]> {
    if (productId) {
      const product = await ProductModel.findById(productId);
      if (!product) throw new NotFoundError(`Product ${productId} not found`);
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
    return products.map((p) => p._id.toString());
  }
}

export const salesOptimizationPipelineService =
  new SalesOptimizationPipelineService();
