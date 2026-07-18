import type { DemandIntelligenceMetrics } from "../demand/demand-intelligence.types.js";

export interface ProductSignals {
  productId: string;
  darkStoreId: string;
  demandScore: number;
  conversionScore: number;
  ratingScore: number;
  /** Weighted overall replenishment score (0–1) */
  replenishmentScore: number;
  /** Cart-add volume in the demand window — used for reorder qty */
  cartCount24h: number;
  windowHours: number;
  availableQuantity: number;
  reservedQuantity: number;
  warehouseStock: number;
  averageRating: number;
  totalRatings: number;
  /** Multi-window demand intelligence (explainability + dashboard) */
  demandIntelligence?: DemandIntelligenceMetrics;
}

export interface SignalAggregatorDependencies {
  demandService: {
    getDemandScore(productId: string, darkStoreId?: string): Promise<number>;
    getProductDemand(
      productId: string,
      darkStoreId?: string,
    ): Promise<{
      cartCount24h: number;
      demandScore: number;
      windowHours: number;
      demandIntelligence?: DemandIntelligenceMetrics;
    }>;
  };
  orderService: {
    getConversionScore(productId: string): Promise<{
      conversionScore: number;
    }>;
  };
  ratingService: {
    getRatingScore(productId: string): Promise<{
      ratingScore: number;
      averageRating: number;
      totalRatings: number;
    }>;
  };
  inventoryService: {
    getInventoryByProduct(
      darkStoreId: string,
      productId: string,
    ): Promise<{
      availableQuantity: number;
      reservedQuantity: number;
    }>;
  };
  warehouseService: {
    getStockSummary(): Promise<
      Array<{
        productId: { toString(): string } | string;
        availableQuantity: number;
      }>
    >;
  };
}
