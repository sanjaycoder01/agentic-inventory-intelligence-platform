import { api } from './api';

export const aiService = {
  ask: async (message: string, conversationId?: string) => {
    try {
      const res = await api.post('/assistant/chat', { message, conversationId });
      return res.data;
    } catch {
      const res = await api.post('/ai/ask', { message, conversationId });
      return res.data;
    }
  },
};
