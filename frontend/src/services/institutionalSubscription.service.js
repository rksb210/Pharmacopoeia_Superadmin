import api from './api';

export const institutionalSubscriptionService = {
  /**
   * Get 4 KPI summary cards
   */
  getStats: async () => {
    const res = await api.get('/institutional-subscriptions/stats');
    return res?.stats || {};
  },

  /**
   * Get segmented batch ledger (All, Universities, Industry)
   */
  getBatches: async (params = {}) => {
    return api.get('/institutional-subscriptions/batches', { params });
  },

  /**
   * Get specific batch roster & invoice
   */
  getBatchRoster: async (batchId) => {
    return api.get(`/institutional-subscriptions/batches/${batchId}/roster`);
  },

  /**
   * Download batch roster CSV
   */
  exportBatchRosterCSV: async (batchId) => {
    const response = await api.get(
      `/institutional-subscriptions/batches/${batchId}/export-roster`,
      { responseType: 'blob' }
    );
    const blob = new Blob([response], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `NFI_Batch_Roster_${batchId}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  },

  /**
   * Get global enrolled members directory
   */
  getMembers: async (params = {}) => {
    return api.get('/institutional-subscriptions/members', { params });
  },

  /**
   * Toggle member seat active/inactive
   */
  toggleMemberStatus: async (memberId) => {
    return api.patch(`/institutional-subscriptions/members/${memberId}/status`);
  },

  /**
   * Get Institution master summary
   */
  getInstitutions: async (params = {}) => {
    const res = await api.get('/institutional-subscriptions/institutions', { params });
    return res?.institutions || [];
  },
};

export default institutionalSubscriptionService;
