import api from './api';

export const auditService = {
  getStats: async (params = {}) => {
    return api.get('/audit-logs/stats', { params });
  },

  getAuditLogs: async (params = {}) => {
    return api.get('/audit-logs', { params });
  },

  getAuditLogById: async (id) => {
    return api.get(`/audit-logs/${id}`);
  },

  exportExcel: async (params = {}) => {
    return api.get('/audit-logs/export', {
      params,
      responseType: 'blob',
    });
  },
};

export default auditService;
