import { api } from './api';

export const productService = {
  list: async () => {
    const res = await api.get('/products');
    return res.data;
  },
};
