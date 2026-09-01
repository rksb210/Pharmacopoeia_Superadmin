import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import { useAuth } from './AuthContext';

const PermissionContext = createContext(null);

export const PermissionProvider = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const [permissions, setPermissions] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch permissions for active user session
  const fetchPermissions = useCallback(async () => {
    if (!isAuthenticated) {
      setPermissions([]);
      setLoading(false);
      return;
    }

    try {
      const res = await api.get('/rbac/my-permissions');
      if (res && res.permissions) {
        setPermissions(res.permissions);
      }
    } catch (err) {
      console.warn('[RBAC] Could not fetch permissions, falling back to role-based defaults:', err.message);
      // Fallback for offline/development
      if (user?.role === 'superadmin') {
        setPermissions(['*']);
      } else {
        setPermissions([]);
      }
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, user]);

  useEffect(() => {
    fetchPermissions();
  }, [fetchPermissions]);

  /**
   * Check if current user has permission for a specific action on a module/section
   * @param {String} action - Action (e.g. 'VIEW', 'ADD', 'EDIT', 'DELETE', 'APPROVE', 'PUBLISH')
   * @param {String} module - Module (e.g. 'CONTENT', 'USERS', 'COMMERCIAL')
   * @param {String} section - Section (e.g. 'MONOGRAPHS', 'WORKFLOW', 'ROLES')
   * @returns {Boolean}
   */
  const can = useCallback(
    (action, module, section = null) => {
      if (!user) return false;
      if (user.role === 'superadmin' || permissions.includes('*')) return true;

      const act = (action || '').toUpperCase();
      if (['EXPORT', 'DOWNLOAD', 'PRINT'].includes(act)) return true;

      const mod = (module || '').toUpperCase();
      const sec = (section || '').toUpperCase();

      if (sec) {
        const fullCode = `${mod}:${sec}:${act}`;
        const sectionWildcard = `${mod}:${sec}:*`;
        const moduleWildcard = `${mod}:*`;
        return (
          permissions.includes(fullCode) ||
          permissions.includes(sectionWildcard) ||
          permissions.includes(moduleWildcard)
        );
      }

      // If no section provided, check module-level permissions
      const moduleActionCode = `${mod}:${act}`;
      const moduleWildcard = `${mod}:*`;
      return (
        permissions.some((p) => p.startsWith(`${mod}:`) && p.endsWith(`:${act}`)) ||
        permissions.includes(moduleWildcard) ||
        permissions.includes(moduleActionCode)
      );
    },
    [user, permissions]
  );

  /**
   * Check exact permission code (e.g. 'CONTENT:MONOGRAPHS:EDIT')
   */
  const hasPermission = useCallback(
    (permissionCode) => {
      if (!user) return false;
      if (user.role === 'superadmin' || permissions.includes('*')) return true;
      const code = (permissionCode || '').toUpperCase();
      if (code.endsWith(':EXPORT') || code.endsWith(':DOWNLOAD') || code.endsWith(':PRINT')) {
        return true;
      }
      return permissions.includes(code);
    },
    [user, permissions]
  );

  /**
   * Check if user has ANY of the permissions in the list
   */
  const canAny = useCallback(
    (permissionList = []) => {
      if (!user) return false;
      if (user.role === 'superadmin' || permissions.includes('*')) return true;
      return permissionList.some(({ action, module, section }) => can(action, module, section));
    },
    [user, permissions, can]
  );

  /**
   * Check if user has ALL of the permissions in the list
   */
  const canAll = useCallback(
    (permissionList = []) => {
      if (!user) return false;
      if (user.role === 'superadmin' || permissions.includes('*')) return true;
      return permissionList.every(({ action, module, section }) => can(action, module, section));
    },
    [user, permissions, can]
  );

  return (
    <PermissionContext.Provider
      value={{
        permissions,
        loading,
        can,
        hasPermission,
        canAny,
        canAll,
        isSuperAdmin: user?.role === 'superadmin',
        refreshPermissions: fetchPermissions,
      }}
    >
      {children}
    </PermissionContext.Provider>
  );
};

export const usePermission = () => {
  const context = useContext(PermissionContext);
  if (!context) {
    throw new Error('usePermission must be used within a PermissionProvider');
  }
  return context;
};

export default PermissionContext;
