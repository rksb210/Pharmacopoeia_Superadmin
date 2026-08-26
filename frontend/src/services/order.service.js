import api from './api';

export const orderService = {
  getStats: async () => {
    return api.get('/orders/stats');
  },

  getOrders: async (params = {}) => {
    return api.get('/orders', { params });
  },

  getOrderById: async (id) => {
    return api.get(`/orders/${id}`);
  },

  processRefund: async (id, { refundAmount, reason }) => {
    return api.post(`/orders/${id}/refund`, { refundAmount, reason });
  },

  exportExcel: async (params = {}) => {
    return api.get('/orders/export', {
      params,
      responseType: 'blob',
    });
  },
};

export default orderService;
