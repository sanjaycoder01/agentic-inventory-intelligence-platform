import { toolRegistry } from './tool.registry.js';
import { TOOL_NAMES } from './tool.constants.js';
import { purchaseOrderWorkflowService } from '../../purchase-orders/purchase-order.service.js';

toolRegistry.register({
  name: TOOL_NAMES.PURCHASE_ORDER,
  description: 'Orchestrates purchase orders status and creation',
  handler: async (args: { action: string; status?: string; purchaseOrderId?: string; data?: any }) => {
    switch (args.action) {
      case 'list':
        return purchaseOrderWorkflowService.getPurchaseOrdersByStatus(args.status as any || 'DRAFT');
      case 'create':
        return purchaseOrderWorkflowService.createPurchaseOrder(args.data);
      case 'details':
        if (!args.purchaseOrderId) throw new Error('purchaseOrderId is required');
        return purchaseOrderWorkflowService.getPurchaseOrder(args.purchaseOrderId);
      default:
        throw new Error('Unsupported PO action: ' + args.action);
    }
  }
});
