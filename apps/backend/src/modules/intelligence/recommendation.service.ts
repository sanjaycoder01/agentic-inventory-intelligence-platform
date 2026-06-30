import { demandService } from "../demand/demand.service.js";
import { inventoryService } from "../inventory/inventory.service.js";
import { evaluateEligibility } from "./eligibility.js";
import { scoreProduct } from "./scoring.js";

const LOOKBACK_DAYS = 7;

export class RecommendationService {
  async generateForProduct(productId: string) {
    const inventory = await inventoryService.getByProductId(productId);
    if (!inventory) {
      throw new Error(`Product ${productId} not found`);
    }

    const since = new Date();
    since.setDate(since.getDate() - LOOKBACK_DAYS);

    const [cartCount, conversionRate] = await Promise.all([
      demandService.getCartCount(productId, since),
      demandService.getConversionRate(productId, since),
    ]);

    const scores = scoreProduct({
      cartCount,
      avgRating: 4,
      conversionRate,
      availableQuantity: inventory.availableQuantity,
      safetyStock: inventory.safetyStock,
      category: inventory.category,
    });

    const eligibility = evaluateEligibility(
      scores,
      inventory.availableQuantity,
      inventory.safetyStock,
      inventory.category,
    );

    return {
      productId,
      productName: inventory.productName,
      scores,
      eligibility,
      generatedAt: new Date().toISOString(),
    };
  }

  async listRecommendations() {
    const items = await inventoryService.list();
    return Promise.all(items.map((item) => this.generateForProduct(item.productId)));
  }
}

export const recommendationService = new RecommendationService();
