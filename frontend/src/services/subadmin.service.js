import api from './api';

/**
 * Sub Admin Management API client service
 */
export const subadminService = {
  getStats: async () => {
    return api.get('/sub-admins/stats');
  },

  getSubAdmins: async (params = {}) => {
    return api.get('/sub-admins', { params });
  },

  getSubAdminById: async (id) => {
    return api.get(`/sub-admins/${id}`);
  },

  createSubAdmin: async (data) => {
    return api.post('/sub-admins', data);
  },

  updateSubAdmin: async (id, data) => {
    return api.put(`/sub-admins/${id}`, data);
  },

  toggleStatus: async (id, isActive) => {
    return api.patch(`/sub-admins/${id}/status`, { isActive });
  },

  resetPassword: async (id, newPassword) => {
    return api.post(`/sub-admins/${id}/reset-password`, { newPassword });
  },

  updatePermissions: async (id, customPermissions) => {
    return api.put(`/sub-admins/${id}/permissions`, { customPermissions });
  },
};

export default subadminService;
