import { api } from './api';

export const salesOptimizationService = {
  listPending: async () => {
    const res = await api.get('/sales-optimization');
    return res.data?.data ?? res.data;
  },
  generate: async (params?: { productId?: string; darkStoreId?: string }) => {
    const res = await api.post('/sales-optimization/generate', params ?? {});
    return res.data;
  },
  approve: async (id: string, approvedBy?: string) => {
    const res = await api.post(`/sales-optimization/${id}/approve`, { approvedBy });
    return res.data;
  },
  reject: async (id: string, rejectedBy?: string, rejectionReason?: string) => {
    const res = await api.post(`/sales-optimization/${id}/reject`, {
      rejectedBy,
      rejectionReason,
    });
    return res.data;
  },
};
