import React from 'react';
import { usePermission } from '../../../context/PermissionContext';
import { ShieldAlert, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

/**
 * Reusable PermissionGuard Component
 * Declaratively controls rendering of action buttons, tabs, tables, or entire pages based on RBAC permissions.
 */
export const PermissionGuard = ({
  module,
  section = null,
  action = 'VIEW',
  permissionCode = null,
  fallback,
  pageLevel = false,
  children,
}) => {
  const { can, hasPermission, isSuperAdmin, loading } = usePermission();
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="py-20 flex flex-col items-center justify-center gap-2">
        <div className="w-8 h-8 border-3 border-[#FFD243] border-t-[#E76120] rounded-full animate-spin" />
        <span className="text-xs text-slate-400 font-medium">Checking authorization...</span>
      </div>
    );
  }

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
    if (fallback !== undefined) {
      return fallback;
    }

    if (pageLevel) {
      return (
        <div className="flex-1 flex items-center justify-center p-6 min-h-[70vh] select-none">
          <div className="max-w-md w-full bg-white border border-slate-200/80 rounded-3xl p-8 text-center space-y-4 shadow-sm">
            <div className="w-14 h-14 rounded-2xl bg-amber-50 border border-amber-200 text-[#E76120] flex items-center justify-center mx-auto">
              <ShieldAlert className="w-7 h-7" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#284661]">Access Restricted</h2>
              <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                You do not have permission to view or manage this section. Please contact your Super Administrator to request access.
              </p>
            </div>
            <div className="pt-2">
              <button
                type="button"
                onClick={() => navigate('/admin/dashboard')}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Go to Dashboard</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return null;
  }

  return children;
};

export default PermissionGuard;
