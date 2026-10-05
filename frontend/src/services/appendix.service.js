import api from './api';

export const appendixService = {
  // Statistics
  getStats: async () => api.get('/appendices/stats'),

  // Get paginated list of appendices
  getAppendices: async (params = {}) => api.get('/appendices', { params }),

  // Get single appendix by ID
  getAppendixById: async (id) => api.get(`/appendices/${id}`),

  // Create new appendix
  createAppendix: async (data) => api.post('/appendices', data),

  // Update appendix
  updateAppendix: async (id, data) => api.put(`/appendices/${id}`, data),

  // Toggle active status
  toggleAppendixStatus: async (id, isActive) => api.patch(`/appendices/${id}/status`, { isActive }),

  // Delete appendix
  deleteAppendix: async (id) => api.delete(`/appendices/${id}`),
};

export default appendixService;
