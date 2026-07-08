import { api } from './api';

export const notificationService = {
  listPending: async () => {
    const res = await api.get('/notifications');
    return res.data;
  },
};
