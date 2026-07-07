import { AgentState } from './graph.types.js';
import { toolRegistry } from '../tools/tool.registry.js';
import { claudeClient } from '../llm/claude.client.js';
import { TOOL_NAMES } from '../tools/tool.constants.js';

export async function plannerNode(state: AgentState): Promise<Partial<AgentState>> {
  const tools: string[] = [];
  const q = state.userQuestion.toLowerCase();
  if (q.includes('selling') || q.includes('demand') || q.includes('analytics')) {
    tools.push(TOOL_NAMES.ANALYTICS);
  }
  if (q.includes('inventory') || q.includes('stock')) {
    tools.push(TOOL_NAMES.INVENTORY);
  }
  if (q.includes('recommendation')) {
    tools.push(TOOL_NAMES.RECOMMENDATION);
  }
  if (q.includes('purchase order') || q.includes('po')) {
    tools.push(TOOL_NAMES.PURCHASE_ORDER);
  }
  if (q.includes('workflow')) {
    tools.push(TOOL_NAMES.WORKFLOW);
  }
  if (q.includes('notification')) {
    tools.push(TOOL_NAMES.NOTIFICATION);
  }
  if (q.includes('dashboard')) {
    tools.push(TOOL_NAMES.DASHBOARD);
  }
  return { selectedTools: tools };
}

export async function toolExecutorNode(state: AgentState): Promise<Partial<AgentState>> {
  const results: any[] = [];
  for (const toolName of state.selectedTools) {
    try {
      const res = await toolRegistry.execute(toolName, { type: 'demand', action: 'list_pending', darkStoreId: '507f1f77bcf86cd799439011' });
      results.push({ tool: toolName, success: true, data: res });
    } catch (err: any) {
      results.push({ tool: toolName, success: false, error: err.message });
    }
  }
  return { toolResults: results };
}

export async function llmResponderNode(state: AgentState): Promise<Partial<AgentState>> {
  const content = 'Question: ' + state.userQuestion + '. Tool Results: ' + JSON.stringify(state.toolResults);
  const claudeRes = await claudeClient.generateResponse([
    { role: 'user', content }
  ]);
  return { llmResponse: claudeRes.content };
}

export async function formatterNode(state: AgentState): Promise<Partial<AgentState>> {
  return { finalResponse: state.llmResponse.trim() };
}
