import Role from '../models/role.model.js';

// In-memory role permission cache (refreshed on role update or TTL)
const rolePermissionCache = new Map();
let cacheTimestamp = Date.now();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Fetch and cache permissions for all roles
 */
export const getCachedRolePermissions = async (roleCode) => {
  const isCacheExpired = Date.now() - cacheTimestamp > CACHE_TTL_MS;

  if (isCacheExpired || rolePermissionCache.size === 0) {
    rolePermissionCache.clear();
    const roles = await Role.find({ isActive: true }).select('code permissionCodes').lean();
    roles.forEach((r) => {
      rolePermissionCache.set(r.code.toLowerCase(), r.permissionCodes || []);
    });
    cacheTimestamp = Date.now();
  }

  return rolePermissionCache.get(roleCode?.toLowerCase()) || [];
};

/**
 * Clear RBAC in-memory cache (call after role updates)
 */
export const invalidateRBACCache = () => {
  rolePermissionCache.clear();
  cacheTimestamp = 0;
};

/**
 * Helper to compute effective permissions for a user
 * @param {Object} user - User document
 * @returns {Promise<Array<String>>} Array of uppercase permission codes
 */
export const getUserEffectivePermissions = async (user) => {
  if (!user) return [];

  // Superadmin has all permissions wildcard
  if (user.role === 'superadmin') {
    return ['*'];
  }

  // If user has custom permissions explicitly configured by superadmin (even if empty [])
  if (user.hasCustomPermissions) {
    return (user.customPermissions || []).map((p) => p.toUpperCase());
  }

  // Fallback to Role model permissions
  const rolePermissions = await getCachedRolePermissions(user.role);
  return rolePermissions;
};

/**
 * Check if permission list satisfies the requested permission
 * @param {Array<String>} permissions - User's effective permissions
 * @param {String} module - Module name (e.g. CONTENT)
 * @param {String} section - Section name (e.g. MONOGRAPHS)
 * @param {String} action - Action name (e.g. EDIT)
 * @returns {Boolean}
 */
export const checkPermissionMatch = (permissions, module, section, action) => {
  if (!permissions || permissions.length === 0) return false;

  // Wildcard superadmin
  if (permissions.includes('*')) return true;

  const targetCode = `${module}:${section}:${action}`.toUpperCase();
  const moduleWildcard = `${module}:*`.toUpperCase();
  const sectionWildcard = `${module}:${section}:*`.toUpperCase();

  return (
    permissions.includes(targetCode) ||
    permissions.includes(sectionWildcard) ||
    permissions.includes(moduleWildcard)
  );
};

/**
 * Reusable Middleware to enforce required permission on a route
 * @param {String} module - Module e.g. "CONTENT"
 * @param {String} section - Section e.g. "MONOGRAPHS"
 * @param {String} action - Action e.g. "VIEW", "ADD", "EDIT", "DELETE", "APPROVE", "PUBLISH"
 */
export const requirePermission = (module, section, action) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          code: 'UNAUTHORIZED',
          message: 'Authentication required to access this resource.',
        });
      }

      // Bypass for Superadmin
      if (req.user.role === 'superadmin') {
        return next();
      }

      // Fetch user's effective permissions
      const effectivePermissions = await getUserEffectivePermissions(req.user);
      const isAllowed = checkPermissionMatch(effectivePermissions, module, section, action);

      if (!isAllowed) {
        return res.status(403).json({
          success: false,
          code: 'FORBIDDEN',
          message: `Access denied. You do not have permission to ${action} ${module}/${section}.`,
          requiredPermission: `${module}:${section}:${action}`.toUpperCase(),
        });
      }

      next();
    } catch (error) {
      console.error('[RBAC Middleware Error]:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal authorization error',
      });
    }
  };
};

/**
 * Reusable Middleware to enforce ANY permission from a list
 * @param {Array<{module: string, section: string, action: string}>} permissionList
 */
export const requireAnyPermission = (permissionList = []) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          code: 'UNAUTHORIZED',
          message: 'Authentication required.',
        });
      }

      if (req.user.role === 'superadmin') {
        return next();
      }

      const effectivePermissions = await getUserEffectivePermissions(req.user);
      const hasAny = permissionList.some(({ module, section, action }) =>
        checkPermissionMatch(effectivePermissions, module, section, action)
      );

      if (!hasAny) {
        return res.status(403).json({
          success: false,
          code: 'FORBIDDEN',
          message: 'Access denied. You lack the required permissions to perform this operation.',
        });
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

export default {
  requirePermission,
  requireAnyPermission,
  getUserEffectivePermissions,
  invalidateRBACCache,
};
