import { DarkStoreModel } from "../dark-store/dark-store.model.js";
import { WarehouseProductModel } from "./warehouse-product.model.js";
import { WarehouseModel } from "./warehouse.model.js";
import {
  WAREHOUSE_ALLOCATION_STATUS,
  WAREHOUSE_DISTANCE_FALLBACK_KM,
} from "./allocation.constants.js";
import type {
  RecommendationForAllocation,
  WarehouseAllocationResult,
} from "./allocation.types.js";

type AddressLike = {
  city?: string;
  state?: string;
  pincode?: string;
};

type WarehouseCandidate = {
  warehouseId: string;
  availableQuantity: number;
  distanceKm: number;
};

export class WarehouseAllocationService {
  async allocateWarehouse(
    recommendation: RecommendationForAllocation,
  ): Promise<WarehouseAllocationResult> {
    const darkStore = await DarkStoreModel.findById(recommendation.darkStoreId).lean();
    if (!darkStore) {
      return this.outOfStock();
    }

    const warehouseProducts = await WarehouseProductModel.find({
      productId: recommendation.productId,
      availableQuantity: { $gte: recommendation.quantity },
    }).lean();

    if (warehouseProducts.length === 0) {
      return this.outOfStock();
    }

    const warehouseIds = warehouseProducts.map((item) => item.warehouseId);
    const warehouses = await WarehouseModel.find({
      _id: { $in: warehouseIds },
      status: "ACTIVE",
    }).lean();

    const warehouseById = new Map(
      warehouses.map((warehouse) => [warehouse._id.toString(), warehouse]),
    );

    const candidates: WarehouseCandidate[] = warehouseProducts
      .map((warehouseProduct) => {
        const warehouseId = warehouseProduct.warehouseId.toString();
        const warehouse = warehouseById.get(warehouseId);
        if (!warehouse) {
          return undefined;
        }

        return {
          warehouseId,
          availableQuantity: warehouseProduct.availableQuantity,
          distanceKm: this.calculateDistanceKm(
            darkStore.warehouseId.toString(),
            darkStore.address,
            warehouseId,
            warehouse.address,
          ),
        };
      })
      .filter((candidate): candidate is WarehouseCandidate => Boolean(candidate))
      .sort(
        (a, b) =>
          a.distanceKm - b.distanceKm ||
          b.availableQuantity - a.availableQuantity ||
          a.warehouseId.localeCompare(b.warehouseId),
      );

    const selectedWarehouse = candidates[0];
    if (!selectedWarehouse) {
      return this.outOfStock();
    }

    return {
      warehouseId: selectedWarehouse.warehouseId,
      allocatedQuantity: recommendation.quantity,
      distanceKm: selectedWarehouse.distanceKm,
      allocationStatus: WAREHOUSE_ALLOCATION_STATUS.ALLOCATED,
    };
  }

  private calculateDistanceKm(
    assignedWarehouseId: string,
    darkStoreAddress: AddressLike,
    warehouseId: string,
    warehouseAddress: AddressLike,
  ): number {
    if (assignedWarehouseId === warehouseId) {
      return WAREHOUSE_DISTANCE_FALLBACK_KM.ASSIGNED_WAREHOUSE;
    }

    if (
      darkStoreAddress.pincode &&
      darkStoreAddress.pincode === warehouseAddress.pincode
    ) {
      return WAREHOUSE_DISTANCE_FALLBACK_KM.SAME_PINCODE;
    }

    if (darkStoreAddress.city === warehouseAddress.city) {
      return WAREHOUSE_DISTANCE_FALLBACK_KM.SAME_CITY;
    }

    if (darkStoreAddress.state === warehouseAddress.state) {
      return WAREHOUSE_DISTANCE_FALLBACK_KM.SAME_STATE;
    }

    return WAREHOUSE_DISTANCE_FALLBACK_KM.DIFFERENT_STATE;
  }

  private outOfStock(): WarehouseAllocationResult {
    return {
      allocatedQuantity: 0,
      allocationStatus: WAREHOUSE_ALLOCATION_STATUS.OUT_OF_STOCK,
    };
  }
}

export const warehouseAllocationService = new WarehouseAllocationService();
