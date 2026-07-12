import { claudeClient } from "../ai/llm/claude.client.js";
import type { ProductSalesMetrics, StrategyResult } from "./sales-optimization.types.js";

const SYSTEM = `You explain sales optimization recommendations for a dark store admin.
Rules:
- Use ONLY the facts provided.
- Do NOT invent numbers.
- Do NOT change the strategy decision — only explain it in 2-3 sentences.
- Never compute metrics; they are already decided deterministically.`;

const TEMPLATE: Record<string, string> = {
  LIQUIDATE:
    "Inventory has aged beyond 120 days with very low sell-through, so liquidation is recommended to free capital and space.",
  CLEARANCE:
    "Sell-through is below 20% (dead stock band), so an aggressive clearance discount is recommended.",
  DISCOUNT:
    "Sell-through remains weak while inventory age exceeds 90 days, so a promotional discount is recommended.",
  RUN_ADS:
    "Store inventory is high while conversion stays low, so a marketing / ads push is recommended.",
  BUNDLE:
    "Sell-through is in the poor band with slow velocity, so bundling with a complementary product is recommended.",
  PRICE_REVIEW:
    "Cart interest is high but conversion is low, so a price review is recommended.",
  QUALITY_CHECK:
    "Average rating is weak relative to demand signals, so a quality investigation is recommended.",
  HOMEPAGE_HIGHLIGHT:
    "Sell-through is in the slow-moving band, so homepage placement is recommended to improve visibility.",
  MONITOR:
    "Sell-through is healthy; continue monitoring without a promotional change.",
  NO_ACTION:
    "Velocity and sell-through do not indicate a sales intervention at this time.",
};

export class SalesOptimizationExplanationService {
  explain(metrics: ProductSalesMetrics, strategy: StrategyResult): {
    summary: string;
    factors: string[];
  } {
    const factors = [
      `Sell-through: ${metrics.sellThroughPercent.toFixed(1)}%`,
      `Inventory age: ${metrics.inventoryAgeDays} days (${metrics.inventoryAgeBand})`,
      `Velocity: ${metrics.velocityClass} (${metrics.averageDailySales}/day)`,
      `Dead stock score: ${metrics.deadStockScore}`,
      `Conversion: ${(metrics.conversionRate * 100).toFixed(1)}%`,
      `Rating: ${metrics.averageRating.toFixed(2)}`,
      `Current inventory: ${metrics.currentInventory}`,
      `Warehouse inventory: ${metrics.warehouseInventory}`,
      `Strategy: ${strategy.strategy}`,
      `Confidence: ${strategy.confidence}`,
    ];
    if (strategy.discountPercent != null) {
      factors.push(`Suggested discount: ${strategy.discountPercent}%`);
    }

    return {
      summary: TEMPLATE[strategy.strategy] ?? TEMPLATE.NO_ACTION,
      factors,
    };
  }

  async explainWithLlm(
    metrics: ProductSalesMetrics,
    strategy: StrategyResult,
  ): Promise<{ summary: string; factors: string[] }> {
    const fallback = this.explain(metrics, strategy);
    try {
      const facts = [
        `Strategy: ${strategy.strategy}`,
        `Rule: ${strategy.matchedRule}`,
        `Reasons: ${strategy.reasons.join(", ")}`,
        `Sell-through %: ${metrics.sellThroughPercent}`,
        `Inventory age days: ${metrics.inventoryAgeDays}`,
        `Units sold: ${metrics.unitsSold}`,
        `Units received: ${metrics.unitsReceived}`,
        `Avg daily sales: ${metrics.averageDailySales}`,
        `Velocity class: ${metrics.velocityClass}`,
        `Dead stock score: ${metrics.deadStockScore}`,
        `Conversion: ${metrics.conversionRate}`,
        `Rating: ${metrics.averageRating}`,
        `Current inventory: ${metrics.currentInventory}`,
        strategy.discountPercent != null
          ? `Discount %: ${strategy.discountPercent}`
          : null,
      ]
        .filter(Boolean)
        .join("\n");

      const response = await claudeClient.generateResponse(
        [
          {
            role: "user",
            content: `Explain this sales optimization decision for a store admin.\n\nFacts:\n${facts}`,
          },
        ],
        SYSTEM,
      );
      const summary = response.content?.trim();
      return summary ? { ...fallback, summary } : fallback;
    } catch {
      return fallback;
    }
  }
}

export const salesOptimizationExplanationService =
  new SalesOptimizationExplanationService();
