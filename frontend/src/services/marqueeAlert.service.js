import api from './api';

export const marqueeAlertService = {
  /**
   * Get Active Marquee Alerts for the current logged-in user
   */
  getActiveAlerts: async (userType) => {
    return api.get('/marquee-alerts/active', {
      params: userType ? { userType } : {},
    });
  },

  /**
   * List all Marquee Alerts with filters (Admin Master)
   */
  getAlertsList: async (params = {}) => {
    return api.get('/marquee-alerts', { params });
  },

  /**
   * Create New Marquee Alert
   */
  createAlert: async (data) => {
    return api.post('/marquee-alerts', data);
  },

  /**
   * Update Marquee Alert
   */
  updateAlert: async (id, data) => {
    return api.put(`/marquee-alerts/${id}`, data);
  },

  /**
   * Toggle Active / Inactive Status
   */
  toggleStatus: async (id, isActive) => {
    return api.patch(`/marquee-alerts/${id}/status`, { isActive });
  },

  /**
   * Delete Marquee Alert
   */
  deleteAlert: async (id) => {
    return api.delete(`/marquee-alerts/${id}`);
  },
};

export default marqueeAlertService;
