import api from './api';

export const planService = {
  getStats: async () => {
    return api.get('/plans/stats');
  },

  getPlans: async (params = {}) => {
    return api.get('/plans', { params });
  },

  getPlanById: async (id) => {
    return api.get(`/plans/${id}`);
  },

  getPlanSubscribers: async (id, params = {}) => {
    return api.get(`/plans/${id}/subscribers`, { params });
  },

  createPlan: async (data) => {
    return api.post('/plans', data);
  },

  updatePlan: async (id, data) => {
    return api.put(`/plans/${id}`, data);
  },

  toggleStatus: async (id, isActive) => {
    return api.patch(`/plans/${id}/status`, { isActive });
  },
};

export default planService;
