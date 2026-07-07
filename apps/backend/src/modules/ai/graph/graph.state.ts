import { AgentState } from './graph.types.js';

export const initialAgentState: AgentState = {
  conversationId: '',
  userQuestion: '',
  selectedTools: [],
  toolResults: [],
  llmResponse: '',
  finalResponse: '',
};
