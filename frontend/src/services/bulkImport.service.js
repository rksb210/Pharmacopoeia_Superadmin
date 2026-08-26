import api from './api';

export const bulkImportService = {
  downloadTemplate: async () => {
    const response = await api.get('/bulk-subscriptions/template', {
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

  confirmImport: async (jobId) => {
    return api.post('/bulk-subscriptions/confirm', { jobId });
  },

  getHistory: async (params = {}) => {
    return api.get('/bulk-subscriptions/history', { params });
  },

  getJobById: async (id) => {
    return api.get(`/bulk-subscriptions/${id}`);
  },

  downloadErrorReport: async (id) => {
    const response = await api.get(`/bulk-subscriptions/${id}/error-report`, {
      responseType: 'blob',
    });
    return response;
  },
};

export default bulkImportService;
