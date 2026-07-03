import type { InventoryState } from "./context.types.js";

export function getInventoryForProduct(
  inventory: InventoryState[],
  productId: string,
): InventoryState | undefined {
  return inventory.find((item) => item.productId === productId);
}

export function getAvailableToSell(inventory?: InventoryState): number {
  if (!inventory) {
    return 0;
  }

  const reservedQuantity = inventory.reservedQuantity ?? 0;
  const damagedQuantity = inventory.damagedQuantity ?? 0;

  return Math.max(
    0,
    inventory.availableQuantity - reservedQuantity - damagedQuantity,
  );
}

export function hasPurchasableInventory(
  inventory: InventoryState[],
  productId: string,
): boolean {
  return getAvailableToSell(getInventoryForProduct(inventory, productId)) > 0;
}

export function getMaxPurchasableQuantity(
  inventory: InventoryState[],
  productId: string,
  desiredQuantity: number,
): number {
  const availableToSell = getAvailableToSell(
    getInventoryForProduct(inventory, productId),
  );

  return Math.min(Math.max(0, desiredQuantity), availableToSell);
}
