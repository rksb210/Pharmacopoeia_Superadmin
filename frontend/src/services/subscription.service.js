import api from './api';

export const subscriptionService = {
  getStats: async () => {
    return api.get('/subscriptions/stats');
  },

  getConfigs: async () => {
    return api.get('/subscriptions/config');
  },

  updateConfig: async (data) => {
    return api.put('/subscriptions/config', data);
  },

  getSubscriptions: async (params = {}) => {
    return api.get('/subscriptions', { params });
  },

  getSubscriptionById: async (id) => {
    return api.get(`/subscriptions/${id}`);
  },

  assignSubscription: async (data) => {
    return api.post('/subscriptions/assign', data);
  },

  renewSubscription: async (id, data) => {
    return api.post(`/subscriptions/${id}/renew`, data);
  },

  cancelSubscription: async (id, reason) => {
    return api.post(`/subscriptions/${id}/cancel`, { reason });
  },

  changeStatus: async (id, status, reason) => {
    return api.patch(`/subscriptions/${id}/status`, { status, reason });
  },

  getUserTimeline: async (userId) => {
    return api.get(`/subscriptions/user/${userId}/timeline`);
  },
};

export default subscriptionService;
