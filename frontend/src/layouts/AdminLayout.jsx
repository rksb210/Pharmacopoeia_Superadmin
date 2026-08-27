import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import AdminSidebar from '../components/admin/common/AdminSidebar';
import AdminHeader from '../components/admin/common/AdminHeader';
import { useAuth } from '../context/AuthContext';
import { usePermission } from '../context/PermissionContext';
import { ShieldAlert, RefreshCw, LogOut } from 'lucide-react';

export const AdminLayout = () => {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { user, logout } = useAuth();
  const { permissions, loading, isSuperAdmin, refreshPermissions } = usePermission();

  const hasZeroPermissions = !isSuperAdmin && !loading && Array.isArray(permissions) && permissions.length === 0;

  return (
    <div className="flex h-screen w-screen bg-[#F8FAFC] overflow-hidden font-sans text-slate-900">
      {/* Responsive Admin Sidebar */}
      <AdminSidebar
        isMobileOpen={isMobileOpen}
        setIsMobileOpen={setIsMobileOpen}
        isCollapsed={isCollapsed}
      />

      {/* Main App Content Area */}
      <div className="flex-1 flex flex-col h-full min-w-0 overflow-hidden">
        {/* Sticky Admin Header */}
        <AdminHeader
          onMobileMenuToggle={() => setIsMobileOpen(!isMobileOpen)}
          isSidebarCollapsed={isCollapsed}
          onSidebarCollapseToggle={() => setIsCollapsed(!isCollapsed)}
        />

        {/* Scrollable Page Body with Outlet or Zero-Permission Banner */}
        <main className="flex-1 overflow-y-auto relative scrollbar-thin scrollbar-thumb-slate-200">
          {hasZeroPermissions ? (
            <div className="flex-1 flex items-center justify-center p-6 min-h-[75vh] select-none">
              <div className="max-w-md w-full bg-white border border-slate-200/90 rounded-3xl p-8 text-center space-y-5 shadow-xs">
                <div className="w-16 h-16 rounded-2xl bg-amber-50 border border-amber-200 text-[#E76120] flex items-center justify-center mx-auto shadow-2xs">
                  <ShieldAlert className="w-8 h-8 text-[#E76120]" />
                </div>
                <div className="space-y-2">
                  <h2 className="text-lg font-bold text-[#284661]">No Permissions Assigned</h2>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Hello <strong className="text-slate-900">{user?.name}</strong>, your account does not currently have permissions assigned to access any administrative modules.
                  </p>
                  <p className="text-[11px] text-slate-400">
                    Please contact your Super Administrator to assign the required module permissions.
                  </p>
                </div>
                <div className="pt-2 flex flex-col gap-2">
                  <button
                    type="button"
                    onClick={refreshPermissions}
                    className="w-full py-2.5 px-4 rounded-xl bg-[#284661] text-white text-xs font-bold hover:bg-[#1f374d] transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-xs"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Refresh Permissions</span>
                  </button>
                  <button
                    type="button"
                    onClick={logout}
                    className="w-full py-2 px-4 rounded-xl border border-slate-200 text-slate-600 text-xs font-semibold hover:bg-slate-50 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5 text-slate-400" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <Outlet />
          )}
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
