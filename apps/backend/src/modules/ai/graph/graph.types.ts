export interface AgentState {
  conversationId: string;
  userQuestion: string;
  selectedTools: string[];
  toolResults: any[];
  llmResponse: string;
  finalResponse: string;
}
