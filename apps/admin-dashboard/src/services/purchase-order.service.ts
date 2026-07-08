import { api } from './api';

export const purchaseOrderService = {
  list: async (status?: string) => {
    const res = await api.get('/purchase-orders', { params: { status } });
    return res.data;
  },
  create: async (data: any) => {
    const res = await api.post('/purchase-orders', data);
    return res.data;
  },
};
