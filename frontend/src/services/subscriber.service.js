import api from './api';

export const subscriberService = {
  getUserTypes: async () => {
    return api.get('/subscribers/types');
  },

  getStats: async () => {
    return api.get('/subscribers/stats');
  },

  getSubscribers: async (params = {}) => {
    return api.get('/subscribers', { params });
  },

  getIndustries: async (params = {}) => {
    return api.get('/subscribers/industries', { params });
  },

  getSubscriberById: async (id) => {
    return api.get(`/subscribers/${id}`);
  },

  createSubscriber: async (data) => {
    return api.post('/subscribers', data);
  },

  updateSubscriber: async (id, data) => {
    return api.put(`/subscribers/${id}`, data);
  },

  toggleStatus: async (id, isActive) => {
    return api.patch(`/subscribers/${id}/status`, { isActive });
  },

  resetPassword: async (id, newPassword) => {
    return api.post(`/subscribers/${id}/reset-password`, { newPassword });
  },

  assignTrial: async (id, days) => {
    return api.post(`/subscribers/${id}/trial`, { days });
  },

  assignComplimentary: async (id, planName, months) => {
    return api.post(`/subscribers/${id}/complimentary`, { planName, months });
  },

  assignDiscount: async (id, discountPercent, notes) => {
    return api.post(`/subscribers/${id}/discount`, { discountPercent, notes });
  },
};

export default subscriberService;
