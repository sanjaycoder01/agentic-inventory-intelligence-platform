import { api } from './api';

export const analyticsService = {
  getExecutiveDashboard: async () => {
    const res = await api.get('/analytics/executive-dashboard');
    return res.data;
  },
  getDemandAnalytics: async () => {
    const res = await api.get('/analytics/demand');
    return res.data;
  },
  getOrderAnalytics: async () => {
    const res = await api.get('/analytics/orders');
    return res.data;
  },
  getRatingAnalytics: async () => {
    const res = await api.get('/analytics/ratings');
    return res.data;
  },
  getInventorySummary: async () => {
    const res = await api.get('/analytics/inventory');
    return res.data;
  },
  getRecommendationAnalytics: async () => {
    const res = await api.get('/analytics/recommendations');
    return res.data;
  },
  getDarkStoreDashboard: async () => {
    const res = await api.get('/analytics/dark-stores');
    return res.data;
  },
  getWarehouseDashboard: async () => {
    const res = await api.get('/analytics/warehouses');
    return res.data;
  },
};
