import { InventoryModel } from "./inventory.model.js";

/**
 * Temporary compatibility layer for modules not yet migrated to dark-store
 * inventory operations. New code should use inventory.service.ts directly.
 */
export class InventoryLegacyService {
  async list() {
    return InventoryModel.find().sort({ productName: 1 });
  }

  async getByProductId(productId: string) {
    return InventoryModel.findOne({ productId });
  }

  /** FEFO: allocate from batches with earliest expiry first */
  async allocateStock(productId: string, quantity: number) {
    const inventory = await InventoryModel.findOne({ productId });
    if (!inventory || inventory.availableQuantity < quantity) {
      throw new Error("Insufficient stock");
    }

    inventory.batches.sort((a, b) => {
      const aExpiry = a.expiryDate?.getTime() ?? Number.MAX_SAFE_INTEGER;
      const bExpiry = b.expiryDate?.getTime() ?? Number.MAX_SAFE_INTEGER;
      return aExpiry - bExpiry;
    });

    let remaining = quantity;
    for (const batch of inventory.batches) {
      if (remaining <= 0) break;
      const take = Math.min(batch.quantity, remaining);
      batch.quantity -= take;
      remaining -= take;
    }

    for (let i = inventory.batches.length - 1; i >= 0; i--) {
      if (inventory.batches[i].quantity <= 0) {
        inventory.batches.splice(i, 1);
      }
    }
    inventory.availableQuantity -= quantity;
    await inventory.save();
    return inventory;
  }
}

export const inventoryLegacyService = new InventoryLegacyService();
