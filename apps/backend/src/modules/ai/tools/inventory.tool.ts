import { toolRegistry } from './tool.registry.js';
import { TOOL_NAMES } from './tool.constants.js';
import { inventoryService } from '../../inventory/inventory.service.js';

toolRegistry.register({
  name: TOOL_NAMES.INVENTORY,
  description: 'Orchestrates inventory status checks',
  handler: async (args: { action: string; darkStoreId: string; productId?: string }) => {
    switch (args.action) {
      case 'summary':
        return inventoryService.getInventory(args.darkStoreId);
      case 'low_stock':
        return inventoryService.getLowStockProducts(args.darkStoreId);
      case 'lookup':
        if (!args.productId) throw new Error('productId is required');
        return inventoryService.getInventoryByProduct(args.darkStoreId, args.productId);
      default:
        throw new Error('Unsupported inventory action: ' + args.action);
    }
  }
});
