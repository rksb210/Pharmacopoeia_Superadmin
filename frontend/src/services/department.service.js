import api from './api';

export const departmentService = {
  getStats: async () => api.get('/departments/stats'),
  getDepartments: async (params = {}) => api.get('/departments', { params }),
  getActiveDepartments: async () => api.get('/departments/active'),
  getDepartmentById: async (id) => api.get(`/departments/${id}`),
  createDepartment: async (data) => api.post('/departments', data),
  updateDepartment: async (id, data) => api.put(`/departments/${id}`, data),
  toggleStatus: async (id, isActive) => api.patch(`/departments/${id}/status`, { isActive }),
  deleteDepartment: async (id) => api.delete(`/departments/${id}`),
};

export default departmentService;
