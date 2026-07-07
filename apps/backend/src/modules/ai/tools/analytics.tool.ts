import { toolRegistry } from './tool.registry.js';
import { TOOL_NAMES } from './tool.constants.js';
import { analyticsService } from '../../analytics/analytics.service.js';

toolRegistry.register({
  name: TOOL_NAMES.ANALYTICS,
  description: 'Orchestrates queries for analytical demand, orders, ratings, and inventory pipelines',
  handler: async (args: { type: string; params: any }) => {
    switch (args.type) {
      case 'demand':
        return analyticsService.getDemandAnalytics();
      case 'orders':
        return analyticsService.getOrderAnalytics();
      case 'ratings':
        return analyticsService.getRatingAnalytics();
      case 'inventory':
        return analyticsService.getInventorySummary();
      default:
        throw new Error('Unsupported analytics type: ' + args.type);
    }
  }
});
