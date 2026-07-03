export interface ProductSignals {
  productId: string;
  darkStoreId: string;
  demandScore: number;
  conversionScore: number;
  ratingScore: number;
  availableQuantity: number;
  reservedQuantity: number;
  warehouseStock: number;
  averageRating: number;
  totalRatings: number;
}

export interface SignalAggregatorDependencies {
  demandService: {
    getDemandScore(productId: string): Promise<number>;
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
