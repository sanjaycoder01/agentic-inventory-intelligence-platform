import { api } from './api';

export const inventoryService = {
  getSummary: async (darkStoreId: string) => {
    const res = await api.get(`/inventory/${darkStoreId}/summary`);
    return res.data;
  },
  getLowStock: async (darkStoreId: string) => {
    const res = await api.get(`/inventory/${darkStoreId}/low-stock`);
    return res.data;
  },
  lookup: async (darkStoreId: string, productId: string) => {
    const res = await api.get(`/inventory/${darkStoreId}/product/${productId}`);
    return res.data;
  },
};
