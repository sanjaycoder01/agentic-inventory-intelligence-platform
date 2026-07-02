import { inventoryLegacyService } from "../inventory/inventory-legacy.service.js";

export class ReturnsService {
  /** Process near-expiry or excess stock returns back to main warehouse */
  async processReturn(productId: string, quantity: number, reason: string) {
    const inventory = await inventoryLegacyService.getByProductId(productId);
    if (!inventory) {
      throw new Error(`Product ${productId} not found`);
    }

    inventory.availableQuantity += quantity;
    inventory.batches.push({
      quantity,
      expiryDate: undefined,
      receivedAt: new Date(),
    });
    await inventory.save();

    return {
      productId,
      quantity,
      reason,
      newAvailableQuantity: inventory.availableQuantity,
      processedAt: new Date().toISOString(),
    };
  }
}

export const returnsService = new ReturnsService();
