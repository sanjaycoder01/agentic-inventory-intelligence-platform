import { toolRegistry } from './tool.registry.js';
import { TOOL_NAMES } from './tool.constants.js';
import { analyticsService } from '../../analytics/analytics.service.js';

toolRegistry.register({
  name: TOOL_NAMES.DASHBOARD,
  description: 'Orchestrates dashboard status snapshots',
  handler: async (args: { dashboardType: string; params: any }) => {
    switch (args.dashboardType) {
      case 'executive':
        return analyticsService.getExecutiveDashboard();
      case 'dark_store':
        return args.params?.darkStoreId 
          ? analyticsService.getDarkStoreDashboardById(args.params.darkStoreId)
          : analyticsService.getDarkStoreDashboard();
      case 'warehouse':
        return args.params?.warehouseId
          ? analyticsService.getWarehouseDashboardById(args.params.warehouseId)
          : analyticsService.getWarehouseDashboard();
      default:
        throw new Error('Unsupported dashboard type: ' + args.dashboardType);
    }
  }
});
