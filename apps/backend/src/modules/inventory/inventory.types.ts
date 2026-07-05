import type { DarkStoreProductDocument } from "../dark-store/dark-store-product.model.js";

export interface InventoryResponseDTO {
  id: string;
  darkStoreId: string;
  productId: string;
  availableQuantity: number;
  reservedQuantity: number;
  damagedQuantity: number;
  averageRating: number;
  totalRatings: number;
  lastTransferredAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface LowStockProductDTO extends InventoryResponseDTO {
  minimumStockLevel: number;
  shortage: number;
}

type InventoryLike = DarkStoreProductDocument & {
  _id: { toString(): string };
  darkStoreId: { toString(): string };
  productId: { toString(): string };
  createdAt: Date;
  updatedAt: Date;
};

export function toInventoryResponseDTO(
  inventory: InventoryLike,
): InventoryResponseDTO {
  return {
    id: inventory._id.toString(),
    darkStoreId: inventory.darkStoreId.toString(),
    productId: inventory.productId.toString(),
    availableQuantity: inventory.availableQuantity,
    reservedQuantity: inventory.reservedQuantity,
    damagedQuantity: inventory.damagedQuantity,
    averageRating: inventory.averageRating,
    totalRatings: inventory.totalRatings,
    lastTransferredAt: inventory.lastTransferredAt ?? undefined,
    createdAt: inventory.createdAt,
    updatedAt: inventory.updatedAt,
  };
}

export function toInventoryResponseList(
  inventory: InventoryLike[],
): InventoryResponseDTO[] {
  return inventory.map(toInventoryResponseDTO);
}

export function toLowStockProductDTO(
  inventory: InventoryLike,
  minimumStockLevel: number,
): LowStockProductDTO {
  const availableQuantity = inventory.availableQuantity;
  const shortage = Math.max(0, minimumStockLevel - availableQuantity);

  return {
    ...toInventoryResponseDTO(inventory),
    minimumStockLevel,
    shortage,
  };
}
