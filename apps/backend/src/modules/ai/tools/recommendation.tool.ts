import { toolRegistry } from './tool.registry.js';
import { TOOL_NAMES } from './tool.constants.js';
import { recommendationPersistenceService } from '../../intelligence/recommendation-persistence.service.js';

toolRegistry.register({
  name: TOOL_NAMES.RECOMMENDATION,
  description: 'Orchestrates recommendations flow status and details',
  handler: async (args: { action: string; recommendationId?: string; status?: string }) => {
    switch (args.action) {
      case 'list_pending':
        return recommendationPersistenceService.getPendingRecommendations();
      case 'details':
        if (!args.recommendationId) throw new Error('recommendationId is required');
        return recommendationPersistenceService.getRecommendation(args.recommendationId);
      default:
        throw new Error('Unsupported recommendation action: ' + args.action);
    }
  }
});
