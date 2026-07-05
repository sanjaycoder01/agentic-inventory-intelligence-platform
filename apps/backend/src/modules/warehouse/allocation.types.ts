import type {
  WAREHOUSE_ALLOCATION_STATUS,
  WAREHOUSE_DISTANCE_FALLBACK_KM,
} from "./allocation.constants.js";

export type WarehouseAllocationStatus =
  (typeof WAREHOUSE_ALLOCATION_STATUS)[keyof typeof WAREHOUSE_ALLOCATION_STATUS];

export type WarehouseDistanceFallbackKm =
  (typeof WAREHOUSE_DISTANCE_FALLBACK_KM)[keyof typeof WAREHOUSE_DISTANCE_FALLBACK_KM];

export interface RecommendationForAllocation {
  productId: string;
  darkStoreId: string;
  quantity: number;
}

export interface WarehouseAllocationResult {
  warehouseId?: string;
  allocatedQuantity: number;
  distanceKm?: number;
  allocationStatus: WarehouseAllocationStatus;
}
