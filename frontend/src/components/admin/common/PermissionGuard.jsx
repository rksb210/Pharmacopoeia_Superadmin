import React from 'react';
import { usePermission } from '../../../context/PermissionContext';

/**
 * Reusable PermissionGuard Component
 * Declaratively controls rendering of action buttons, tabs, tables, or sections based on RBAC permissions.
 *
 * Usage:
 * <PermissionGuard module="CONTENT" section="MONOGRAPHS" action="ADD" fallback={<DisabledBtn />}>
 *   <Button>Add Monograph</Button>
 * </PermissionGuard>
 */
export const PermissionGuard = ({
  module,
  section = null,
  action = 'VIEW',
  permissionCode = null,
  fallback = null,
  children,
}) => {
  const { can, hasPermission, isSuperAdmin } = usePermission();

  if (isSuperAdmin) {
    return children;
  }

  let isAllowed = false;

  if (permissionCode) {
    isAllowed = hasPermission(permissionCode);
  } else if (module) {
    isAllowed = can(action, module, section);
  }

  if (!isAllowed) {
    return fallback;
  }

  return children;
};

export default PermissionGuard;
