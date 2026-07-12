export type VelocityClass = "FAST_MOVING" | "NORMAL" | "SLOW" | "DEAD";

export type InventoryAgeBand = "0_30" | "31_60" | "61_90" | "91_120" | "120_PLUS";

export type SalesStrategyType =
  | "DISCOUNT"
  | "BUNDLE"
  | "RUN_ADS"
  | "PRICE_REVIEW"
  | "QUALITY_CHECK"
  | "CLEARANCE"
  | "LIQUIDATE"
  | "HOMEPAGE_HIGHLIGHT"
  | "MONITOR"
  | "NO_ACTION";

export interface ProductSalesMetrics {
  productId: string;
  darkStoreId: string;
  unitsSold: number;
  unitsReceived: number;
  sellThroughPercent: number;
  inventoryAgeDays: number;
  inventoryAgeBand: InventoryAgeBand;
  daysSinceLastSale: number | null;
  averageDailySales: number;
  cartAdds: number;
  conversionRate: number;
  averageRating: number;
  ratingScore: number;
  currentInventory: number;
  warehouseInventory: number;
  daysOfCover: number | null;
  demandTrend: number;
  velocity: number;
  velocityClass: VelocityClass;
  deadStockScore: number;
  windowDays: number;
}

export interface StrategyResult {
  strategy: SalesStrategyType;
  matchedRule: string;
  confidence: number;
  reasons: string[];
  discountPercent?: number;
  actionable: boolean;
}
