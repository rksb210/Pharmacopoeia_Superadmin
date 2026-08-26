import api from './api';

export const reportService = {
  getOverview: async (params = {}) => {
    return api.get('/reports/overview', { params });
  },

  getUserReports: async (params = {}) => {
    return api.get('/reports/users', { params });
  },

  getSubscriptionReports: async (params = {}) => {
    return api.get('/reports/subscriptions', { params });
  },

  getContentReports: async (params = {}) => {
    return api.get('/reports/content', { params });
  },

  getWorkflowReports: async (params = {}) => {
    return api.get('/reports/workflow', { params });
  },

  getCommerceReports: async (params = {}) => {
    return api.get('/reports/commerce', { params });
  },

  getCRMReports: async (params = {}) => {
    return api.get('/reports/crm', { params });
  },

  exportExcel: async (domain, params = {}) => {
    return api.get(`/reports/export/${domain}`, {
      params,
      responseType: 'blob',
    });
  },
};

export default reportService;
