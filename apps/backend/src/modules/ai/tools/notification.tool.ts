import { toolRegistry } from './tool.registry.js';
import { TOOL_NAMES } from './tool.constants.js';
import { notificationService } from '../../notifications/notification.service.js';

toolRegistry.register({
  name: TOOL_NAMES.NOTIFICATION,
  description: 'Orchestrates notifications checks',
  handler: async (args: { action: string }) => {
    switch (args.action) {
      case 'list_pending':
        return notificationService.getPendingNotifications();
      default:
        throw new Error('Unsupported notification action: ' + args.action);
    }
  }
});
