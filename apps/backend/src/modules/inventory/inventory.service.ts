import { InventoryModel } from "./inventory.model.js";

export class InventoryService {
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

    const sortedBatches = [...inventory.batches].sort((a, b) => {
      const aExpiry = a.expiryDate?.getTime() ?? Number.MAX_SAFE_INTEGER;
      const bExpiry = b.expiryDate?.getTime() ?? Number.MAX_SAFE_INTEGER;
      return aExpiry - bExpiry;
    });

    let remaining = quantity;
    for (const batch of sortedBatches) {
      if (remaining <= 0) break;
      const take = Math.min(batch.quantity, remaining);
      batch.quantity -= take;
      remaining -= take;
    }

    inventory.batches = sortedBatches.filter((b) => b.quantity > 0);
    inventory.availableQuantity -= quantity;
    await inventory.save();
    return inventory;
  }
}

export const inventoryService = new InventoryService();
