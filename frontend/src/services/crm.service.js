import api from './api';

export const crmService = {
  getStats: async () => {
    return api.get('/crm/stats');
  },

  getCustomers: async (params = {}) => {
    return api.get('/crm/customers', { params });
  },

  getCustomerProfile360: async (id) => {
    return api.get(`/crm/customers/${id}/360`);
  },

  addCustomerNote: async (id, note, priority = 'medium') => {
    return api.post(`/crm/customers/${id}/notes`, { note, priority });
  },
};

export default crmService;
