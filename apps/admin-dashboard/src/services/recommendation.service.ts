import { api } from './api';

export const recommendationService = {
  listPending: async () => {
    const res = await api.get('/recommendations');
    return res.data;
  },
  approve: async (id: string, approvedBy?: string) => {
    const res = await api.post(`/recommendations/${id}/approve`, { approvedBy });
    return res.data;
  },
  reject: async (id: string, rejectedBy?: string, rejectionReason?: string) => {
    const res = await api.post(`/recommendations/${id}/reject`, { rejectedBy, rejectionReason });
    return res.data;
  },
};
