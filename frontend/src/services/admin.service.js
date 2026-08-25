import api from './api';

/**
 * Admin Management API client service
 */
export const adminService = {
  /**
   * Get KPI statistics for Admins
   */
  getStats: async () => {
    return api.get('/admins/stats');
  },

  /**
   * Get paginated list of Admins
   */
  getAdmins: async (params = {}) => {
    return api.get('/admins', { params });
  },

  /**
   * Get single Admin details
   */
  getAdminById: async (id) => {
    return api.get(`/admins/${id}`);
  },

  /**
   * Create new Admin
   */
  createAdmin: async (data) => {
    return api.post('/admins', data);
  },

  /**
   * Update Admin profile
   */
  updateAdmin: async (id, data) => {
    return api.put(`/admins/${id}`, data);
  },

  /**
   * Toggle Active / Inactive status
   */
  toggleStatus: async (id, isActive) => {
    return api.patch(`/admins/${id}/status`, { isActive });
  },

  /**
   * Reset Admin password
   */
  resetPassword: async (id, newPassword) => {
    return api.post(`/admins/${id}/reset-password`, { newPassword });
  },

  /**
   * Update custom permissions for an Admin
   */
  updatePermissions: async (id, customPermissions) => {
    return api.put(`/admins/${id}/permissions`, { customPermissions });
  },
};

export default adminService;
