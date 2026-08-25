import api from './api';

/**
 * RBAC & Roles API Client Service
 */
export const rbacService = {
  getRoles: async () => {
    return api.get('/rbac/roles');
  },

  getRoleById: async (id) => {
    return api.get(`/rbac/roles/${id}`);
  },

  getPermissions: async () => {
    return api.get('/rbac/permissions');
  },

  getMyPermissions: async () => {
    return api.get('/rbac/my-permissions');
  },

  createRole: async (data) => {
    return api.post('/rbac/roles', data);
  },

  updateRole: async (id, data) => {
    return api.put(`/rbac/roles/${id}`, data);
  },

  deleteRole: async (id) => {
    return api.delete(`/rbac/roles/${id}`);
  },

  toggleStatus: async (id, isActive) => {
    return api.patch(`/rbac/roles/${id}/status`, { isActive });
  },

  assignUsers: async (id, userIds) => {
    return api.post(`/rbac/roles/${id}/assign-users`, { userIds });
  },
};

export default rbacService;
