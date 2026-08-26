import api from './api';

export const notificationService = {
  getStats: async () => {
    return api.get('/notifications/stats');
  },

  getNotifications: async (params = {}) => {
    return api.get('/notifications', { params });
  },

  getNotificationById: async (id) => {
    return api.get(`/notifications/${id}`);
  },

  createNotification: async (data) => {
    return api.post('/notifications', data);
  },

  updateNotification: async (id, data) => {
    return api.put(`/notifications/${id}`, data);
  },

  toggleStatus: async (id, isActive) => {
    return api.patch(`/notifications/${id}/status`, { isActive });
  },

  dispatchNotification: async (id) => {
    return api.post(`/notifications/${id}/dispatch`);
  },

  getMyFeed: async () => {
    return api.get('/notifications/inbox/my-feed');
  },

  markAsRead: async (id) => {
    return api.post(`/notifications/${id}/read`);
  },
};

export default notificationService;
