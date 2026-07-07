export interface MemoryItem {
  conversationId: string;
  question: string;
  toolCalls: any[];
  response: string;
  timestamp: Date;
}
