import { MemoryItem } from './memory.types.js';
import { MEMORY_CONSTANTS } from './memory.constants.js';

export class ConversationMemory {
  private store: Map<string, MemoryItem[]> = new Map();

  async getHistory(conversationId: string): Promise<MemoryItem[]> {
    return this.store.get(conversationId) || [];
  }

  async saveMessage(conversationId: string, item: Omit<MemoryItem, 'conversationId' | 'timestamp'>): Promise<void> {
    const history = this.store.get(conversationId) || [];
    history.push({
      ...item,
      conversationId,
      timestamp: new Date(),
    });
    if (history.length > MEMORY_CONSTANTS.MAX_HISTORY) {
      history.shift();
    }
    this.store.set(conversationId, history);
  }

  async clearHistory(conversationId: string): Promise<void> {
    this.store.delete(conversationId);
  }
}

export const conversationMemory = new ConversationMemory();
