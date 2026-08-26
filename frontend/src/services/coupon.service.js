import api from './api';

export const couponService = {
  getStats: async () => {
    return api.get('/coupons/stats');
  },

  getCoupons: async (params = {}) => {
    return api.get('/coupons', { params });
  },

  getCouponById: async (id) => {
    return api.get(`/coupons/${id}`);
  },

  createCoupon: async (data) => {
    return api.post('/coupons', data);
  },

  updateCoupon: async (id, data) => {
    return api.put(`/coupons/${id}`, data);
  },

  toggleStatus: async (id, isActive) => {
    return api.patch(`/coupons/${id}/status`, { isActive });
  },

  validateCoupon: async (data) => {
    return api.post('/coupons/validate', data);
  },

  assignDirectDiscount: async (data) => {
    return api.post('/coupons/direct-assign', data);
  },
};

export default couponService;
