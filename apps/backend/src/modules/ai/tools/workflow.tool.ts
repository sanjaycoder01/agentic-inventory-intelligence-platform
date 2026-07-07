import { toolRegistry } from './tool.registry.js';
import { TOOL_NAMES } from './tool.constants.js';
import { workflowService } from '../../workflow/workflow.service.js';
import { warehouseAllocationService } from '../../warehouse/allocation.service.js';

toolRegistry.register({
  name: TOOL_NAMES.WORKFLOW,
  description: 'Orchestrates approval and allocations workflows',
  handler: async (args: { action: string; data?: any }) => {
    switch (args.action) {
      case 'run_recommendation_workflow':
        return workflowService.runApprovedRecommendationWorkflow(args.data);
      case 'allocate':
        return warehouseAllocationService.allocateWarehouse(args.data);
      default:
        throw new Error('Unsupported workflow action: ' + args.action);
    }
  }
});
