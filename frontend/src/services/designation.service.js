import api from './api';

export const designationService = {
  getStats: async () => api.get('/designations/stats'),
  getDesignations: async (params = {}) => api.get('/designations', { params }),
  getActiveDesignations: async () => api.get('/designations/active'),
  getByDepartment: async (departmentId, params = {}) => api.get(`/designations/by-department/${departmentId}`, { params }),
  getDesignationById: async (id) => api.get(`/designations/${id}`),
  createDesignation: async (data) => api.post('/designations', data),
  updateDesignation: async (id, data) => api.put(`/designations/${id}`, data),
  toggleStatus: async (id, isActive) => api.patch(`/designations/${id}/status`, { isActive }),
  deleteDesignation: async (id) => api.delete(`/designations/${id}`),
};

export default designationService;
