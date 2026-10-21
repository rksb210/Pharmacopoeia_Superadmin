import api from './api';

export const bulkImportService = {
  downloadTemplate: async (userType = 'UNIVERSITIES_COLLEGES') => {
    const response = await api.get('/bulk-subscriptions/template', {
      params: { userType },
      responseType: 'blob',
    });
    return response;
  },

  uploadAndValidate: async (formData) => {
    return api.post('/bulk-subscriptions/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },

  validateDirectRows: async (payload) => {
    return api.post('/bulk-subscriptions/validate-direct', payload);
  },

  confirmImport: async (payloadOrJobId) => {
    const body =
      typeof payloadOrJobId === 'string' ? { jobId: payloadOrJobId } : payloadOrJobId;
    return api.post('/bulk-subscriptions/confirm', body);
  },

  getHistory: async (params = {}) => {
    return api.get('/bulk-subscriptions/history', { params });
  },

  getJobById: async (id) => {
    return api.get(`/bulk-subscriptions/${id}`);
  },

  approveBatch: async (id, payload = {}) => {
    return api.post(`/bulk-subscriptions/${id}/approve`, payload);
  },

  rejectBatch: async (id, payload = {}) => {
    return api.post(`/bulk-subscriptions/${id}/reject`, payload);
  },

  resubmitBatch: async (id, payload = {}) => {
    return api.post(`/bulk-subscriptions/${id}/resubmit`, payload);
  },

  downloadErrorReport: async (id) => {
    const response = await api.get(`/bulk-subscriptions/${id}/error-report`, {
      responseType: 'blob',
    });
    return response;
  },
};

export default bulkImportService;
