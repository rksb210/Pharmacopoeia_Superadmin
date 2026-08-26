import api from './api';

export const feedbackService = {
  getStats: async () => {
    return api.get('/feedback/stats');
  },

  getFeedbackList: async (params = {}) => {
    return api.get('/feedback', { params });
  },

  getFeedbackById: async (id) => {
    return api.get(`/feedback/${id}`);
  },

  submitPublicFeedback: async (data) => {
    return api.post('/feedback/submit', data);
  },

  assignFeedback: async (id, assignedTo, note = '') => {
    return api.patch(`/feedback/${id}/assign`, { assignedTo, note });
  },

  updateStatus: async (id, status, note = '') => {
    return api.patch(`/feedback/${id}/status`, { status, note });
  },

  addReply: async (id, message, isInternalNote = false) => {
    return api.post(`/feedback/${id}/reply`, { message, isInternalNote });
  },
};

export default feedbackService;
