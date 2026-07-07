export interface DemandAnalyticsDTO {
  productId: string;
  totalAdds: number;
  totalRemoves: number;
  netDemand: number;
  demandScore: number;
}

export interface TrendingProductDTO {
  productId: string;
  netDemand: number;
}

export interface HourlyDemandDTO {
  hour: string;
  adds: number;
  removes: number;
  netDemand: number;
}

export interface DailyDemandDTO {
  date: string;
  netDemand: number;
}

export interface OrderAnalyticsDTO {
  productId: string;
  totalOrders: number;
  completedOrders: number;
  cancelledOrders: number;
  totalQuantitySold: number;
}

export interface TopSellingProductDTO {
  productId: string;
  quantitySold: number;
}

export interface ConversionAnalyticsDTO {
  productId: string;
  completedOrders: number;
  netDemand: number;
  conversionRate: number;
}

export interface RevenueAnalyticsDTO {
  productId: string;
  quantitySold: number;
  revenue: number;
}

export interface RatingAnalyticsDTO {
  productId: string;
  averageRating: number;
  totalRatings: number;
  fiveStar: number;
  fourStar: number;
  threeStar: number;
  twoStar: number;
  oneStar: number;
}

export interface TopRatedProductDTO {
  productId: string;
  averageRating: number;
  totalRatings: number;
}

export interface RatingDistributionDTO {
  oneStar: number;
  twoStar: number;
  threeStar: number;
  fourStar: number;
  fiveStar: number;
}

export interface RatingTrendDTO {
  day: string;
  averageRating: number;
}

export interface InventoryHealthDTO {
  productId: string;
  darkStoreId: string;
  availableQuantity: number;
  reservedQuantity: number;
  reorderLevel: number;
  healthStatus: "OUT_OF_STOCK" | "LOW_STOCK" | "HEALTHY" | "OVERSTOCK";
}

export interface LowStockProductDTO {
  productId: string;
  darkStoreId: string;
  availableQuantity: number;
  reservedQuantity: number;
  reorderLevel: number;
}

export interface OutOfStockProductDTO {
  productId: string;
  darkStoreId: string;
  availableQuantity: number;
  reservedQuantity: number;
}

export interface OverStockProductDTO {
  productId: string;
  darkStoreId: string;
  availableQuantity: number;
  reservedQuantity: number;
  reorderLevel: number;
}

export interface InventorySummaryDTO {
  totalProducts: number;
  totalAvailable: number;
  totalReserved: number;
  lowStockCount: number;
  outOfStockCount: number;
}

export interface RecommendationAnalyticsDTO {
  pending: number;
  approved: number;
  rejected: number;
  expired: number;
  total: number;
}

export interface RecommendationTypeDTO {
  REORDER: number;
  RETURN_TO_WAREHOUSE: number;
  DO_NOT_REORDER: number;
  NO_ACTION: number;
}

export interface RecommendationTrendDTO {
  day: string;
  recommendations: number;
}

export interface RecommendationConfidenceDTO {
  bucket: string;
  count: number;
}

export interface DarkStoreDashboardDTO {
  darkStoreId: string;
  totalProducts: number;
  availableInventory: number;
  reservedInventory: number;
  totalOrders: number;
  completedOrders: number;
  averageRating: number;
  pendingRecommendations: number;
  approvedRecommendations: number;
}
