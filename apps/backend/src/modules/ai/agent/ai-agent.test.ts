import { describe, it, expect, vi } from 'vitest';

vi.mock('../../analytics/analytics.service.js', () => ({
  analyticsService: {
    getDemandAnalytics: vi.fn().mockResolvedValue([]),
    getOrderAnalytics: vi.fn().mockResolvedValue([]),
    getRatingAnalytics: vi.fn().mockResolvedValue([]),
    getInventorySummary: vi.fn().mockResolvedValue({}),
    getExecutiveDashboard: vi.fn().mockResolvedValue({}),
    getDarkStoreDashboard: vi.fn().mockResolvedValue([]),
    getWarehouseDashboard: vi.fn().mockResolvedValue([]),
  }
}));

vi.mock('../../intelligence/recommendation-persistence.service.js', () => ({
  recommendationPersistenceService: {
    getPendingRecommendations: vi.fn().mockResolvedValue([]),
    getRecommendation: vi.fn().mockResolvedValue({}),
  }
}));

vi.mock('../../inventory/inventory.service.js', () => ({
  inventoryService: {
    getInventory: vi.fn().mockResolvedValue([]),
    getLowStockProducts: vi.fn().mockResolvedValue([]),
    getInventoryByProduct: vi.fn().mockResolvedValue({}),
  }
}));

vi.mock('../../purchase-orders/purchase-order.service.js', () => ({
  purchaseOrderWorkflowService: {
    getPurchaseOrdersByStatus: vi.fn().mockResolvedValue([]),
    createPurchaseOrder: vi.fn().mockResolvedValue({}),
    getPurchaseOrder: vi.fn().mockResolvedValue({}),
  }
}));

vi.mock('../../workflow/workflow.service.js', () => ({
  workflowService: {
    runApprovedRecommendationWorkflow: vi.fn().mockResolvedValue({}),
  }
}));

vi.mock('../../warehouse/allocation.service.js', () => ({
  warehouseAllocationService: {
    allocateWarehouse: vi.fn().mockResolvedValue({}),
  }
}));

vi.mock('../../notifications/notification.service.js', () => ({
  notificationService: {
    getPendingNotifications: vi.fn().mockResolvedValue([]),
  }
}));

import { aiAgentService } from './ai-agent.service.js';
import { conversationMemory } from '../memory/conversation.memory.js';
import { validationService } from '../safety/validation.service.js';
import { toolRegistry } from '../tools/tool.registry.js';

describe('AI Agent Service & Components', () => {
  it('should validate inputs correctly', () => {
    const result = validationService.validatePrompt('short prompt');
    expect(result.valid).toBe(true);
    const resultLong = validationService.validatePrompt('a'.repeat(20000));
    expect(resultLong.valid).toBe(false);
  });

  it('should store and fetch conversation history', async () => {
    const convId = 'test-conv';
    await conversationMemory.saveMessage(convId, {
      question: 'Why Amul?',
      toolCalls: [],
      response: 'Popular Milk',
    });
    const history = await conversationMemory.getHistory(convId);
    expect(history.length).toBe(1);
    expect(history[0].question).toBe('Why Amul?');
  });

  it('should list registered tools', () => {
    const tools = toolRegistry.listTools();
    expect(tools).toContain('analytics_tool');
    expect(tools).toContain('inventory_tool');
  });

  it('should plan and respond correctly', async () => {
    const res = await aiAgentService.ask({
      conversationId: 'test-ask',
      message: 'Why is Amul Milk selling well today?'
    });
    expect(res.conversationId).toBe('test-ask');
    expect(res.reply).toContain('Amul Milk has high demand');
  });
});
