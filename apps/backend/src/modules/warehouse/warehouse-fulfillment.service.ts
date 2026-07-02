import { inventoryService } from "../inventory/inventory.service.js";

export class WarehouseFulfillmentService {
  async checkFulfillment(productId: string, quantity: number) {
    const inventory = await inventoryService.getByProductId(productId);
    if (!inventory) {
      return { canFulfill: false, reason: "Product not found" };
    }

    const canFulfill = inventory.availableQuantity >= quantity;
    return {
      canFulfill,
      availableQuantity: inventory.availableQuantity,
      requestedQuantity: quantity,
      reason: canFulfill ? "Stock available" : "Insufficient warehouse stock",
    };
  }

  async getStockSummary() {
    const items = await inventoryService.list();
    return items.map((item) => ({
      productId: item.productId,
      productName: item.productName,
      availableQuantity: item.availableQuantity,
      safetyStock: item.safetyStock,
      batchCount: item.batches.length,
    }));
  }
}

export const warehouseFulfillmentService = new WarehouseFulfillmentService();
