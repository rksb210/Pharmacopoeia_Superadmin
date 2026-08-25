import api from './api';

export const dashboardService = {
  /**
   * Fetch aggregated, role-aware dashboard overview
   */
  getOverview: async () => {
    return api.get('/dashboard/overview');
  },
};

export default dashboardService;
