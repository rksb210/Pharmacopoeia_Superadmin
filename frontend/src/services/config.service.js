import api from './api';

export const configService = {
  getPublicConfig: async () => {
    return api.get('/config/public');
  },

  getFullConfig: async () => {
    return api.get('/config');
  },

  updateConfig: async (updates) => {
    return api.put('/config', updates);
  },

  restoreVersion: async (version) => {
    return api.post(`/config/restore/${version}`);
  },
};

export default configService;
