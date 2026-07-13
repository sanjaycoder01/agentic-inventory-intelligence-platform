import { api } from './api';

export const productService = {
  list: async () => {
    const res = await api.get('/products');
    // Backend returns { success, data: Product[] }
    return res.data?.data ?? res.data;
  },
};
