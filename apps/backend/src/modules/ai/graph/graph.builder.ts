import { StateGraph } from '@langchain/langgraph';
import { AgentState } from './graph.types.js';
import { GRAPH_NODES } from './graph.constants.js';
import { plannerNode, toolExecutorNode, llmResponderNode, formatterNode } from './graph.nodes.js';

const graphStateChannels = {
  conversationId: { value: (a: string, b: string) => b, default: () => '' },
  userQuestion: { value: (a: string, b: string) => b, default: () => '' },
  selectedTools: { value: (a: string[], b: string[]) => b, default: () => [] },
  toolResults: { value: (a: any[], b: any[]) => b, default: () => [] },
  llmResponse: { value: (a: string, b: string) => b, default: () => '' },
  finalResponse: { value: (a: string, b: string) => b, default: () => '' },
};

export function compileGraph() {
  const workflow = new StateGraph<AgentState>({
    channels: graphStateChannels
  })
    .addNode(GRAPH_NODES.PLANNER, plannerNode)
    .addNode(GRAPH_NODES.TOOL_EXECUTOR, toolExecutorNode)
    .addNode(GRAPH_NODES.LLM_RESPONDER, llmResponderNode)
    .addNode(GRAPH_NODES.FORMATTER, formatterNode)
    .addEdge(GRAPH_NODES.PLANNER, GRAPH_NODES.TOOL_EXECUTOR)
    .addEdge(GRAPH_NODES.TOOL_EXECUTOR, GRAPH_NODES.LLM_RESPONDER)
    .addEdge(GRAPH_NODES.LLM_RESPONDER, GRAPH_NODES.FORMATTER)
    .setEntryPoint(GRAPH_NODES.PLANNER);

  return workflow.compile();
}

export const agentGraph = compileGraph();
