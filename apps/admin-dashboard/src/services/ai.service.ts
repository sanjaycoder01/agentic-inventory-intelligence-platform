import { api } from './api';

export const aiService = {
  ask: async (message: string, conversationId?: string) => {
    const res = await api.post('/ai/ask', { message, conversationId });
    return res.data;
  },
};
