import React from 'react';
import { NavLink } from 'react-router-dom';
import { LogOut, X } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { usePermission } from '../../../context/PermissionContext';
import { getFilteredAdminNav } from '../../../config/adminNav';
import { Badge } from '../../ui/badge';

export const AdminSidebar = ({
  isMobileOpen,
  setIsMobileOpen,
  isCollapsed,
}) => {
  const { user, logout } = useAuth();
  const { can } = usePermission();
  const navSections = getFilteredAdminNav(user, can);

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isMobileOpen && (
        <div
          onClick={() => setIsMobileOpen(false)}
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-40 lg:hidden transition-opacity"
          aria-hidden="true"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`
          fixed lg:static top-0 left-0 z-50 h-screen bg-white border-r border-slate-200/80
          flex flex-col justify-between select-none transition-all duration-300 ease-in-out
          ${isCollapsed ? 'w-[76px]' : 'w-[260px]'}
          ${isMobileOpen ? 'translate-x-0 w-[260px]' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        {/* Top Header & Emblem */}
        <div className="flex flex-col h-full overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <NavLink
              to="/admin/dashboard"
              className="flex items-center gap-3 min-w-0"
              onClick={() => setIsMobileOpen(false)}
            >
              <div className="w-10 h-10 shrink-0 flex items-center justify-center">
                <img
                  src="/assets/national-emblem-ipc.png"
                  alt="NFI Superadmin"
                  className="w-full h-full object-contain"
                />
              </div>

              {(!isCollapsed || isMobileOpen) && (
                <div className="flex flex-col min-w-0">
                  <span className="text-xs font-black text-[#284661] tracking-tight leading-tight truncate">
                    NFI SUPERADMIN
                  </span>
                  <span className="text-[10px] font-semibold text-[#E76120] uppercase tracking-wider">
                    Portal v1.0
                  </span>
                </div>
              )}
            </NavLink>

            {/* Mobile close button */}
            <button
              type="button"
              onClick={() => setIsMobileOpen(false)}
              className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              aria-label="Close menu"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Scrollable Navigation Items */}
          <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-5 scrollbar-thin scrollbar-thumb-slate-200">
            {navSections.map((section) => (
              <div key={section.title} className="space-y-1">
                {(!isCollapsed || isMobileOpen) && (
                  <h4 className="px-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                    {section.title}
                  </h4>
                )}

                <div className="space-y-1">
                  {section.items.map((item) => {
                    const Icon = item.icon;

                    return (
                      <NavLink
                        key={item.id}
                        to={item.path}
                        onClick={() => setIsMobileOpen(false)}
                        title={isCollapsed && !isMobileOpen ? item.title : undefined}
                        className={({ isActive }) => `
                          group flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold
                          transition-all duration-150 cursor-pointer
                          ${
                            isActive
                              ? 'bg-[#FFD243] text-slate-900 shadow-xs font-bold'
                              : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                          }
                          ${isCollapsed && !isMobileOpen ? 'justify-center px-2' : ''}
                        `}
                      >
                        <Icon
                          className={`w-4.5 h-4.5 shrink-0 transition-transform group-hover:scale-105`}
                        />

                        {(!isCollapsed || isMobileOpen) && (
                          <div className="flex items-center justify-between flex-1 min-w-0">
                            <span className="truncate">{item.title}</span>
                            {item.badge && (
                              <Badge
                                variant="nfiNavy"
                                className="text-[9px] px-1.5 py-0 font-bold uppercase tracking-tight"
                              >
                                {item.badge}
                              </Badge>
                            )}
                          </div>
                        )}
                      </NavLink>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>
        </div>

        {/* Bottom Section: Quick Switch to Public Portal & Logout */}
        <div className="p-3 border-t border-slate-100 space-y-1">
          <button
            type="button"
            onClick={logout}
            className={`
              w-full h-9.5 text-xs font-semibold text-red-600 hover:bg-red-50 active:bg-red-100
              rounded-xl flex items-center gap-2.5 transition-colors cursor-pointer
              ${isCollapsed && !isMobileOpen ? 'justify-center' : 'px-3'}
            `}
            title="Log out"
          >
            <LogOut className="w-4 h-4 text-red-500 shrink-0" />
            {(!isCollapsed || isMobileOpen) && <span>Logout</span>}
          </button>
        </div>
      </aside>
    </>
  );
};

export default AdminSidebar;
