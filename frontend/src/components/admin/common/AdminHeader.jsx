import React, { useState } from 'react';
import { Search, Bell, Menu, PanelLeftClose, PanelLeftOpen, HelpCircle } from 'lucide-react';
import UserProfileDropdown from './UserProfileDropdown';

export const AdminHeader = ({
  onMobileMenuToggle,
  isSidebarCollapsed,
  onSidebarCollapseToggle,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  // Mock initial admin notifications for notification indicator
  const notifications = [
    { id: 1, title: 'New Monograph Submission', time: '10m ago', unread: true },
    { id: 2, title: 'Bulk Subscription Request', time: '1h ago', unread: true },
    { id: 3, title: 'System Security Audit Completed', time: '3h ago', unread: false },
  ];

  const unreadCount = notifications.filter((n) => n.unread).length;

  return (
    <header className="w-full h-16 bg-white border-b border-slate-200/80 px-4 sm:px-6 flex items-center justify-between gap-3 select-none sticky top-0 z-30 shadow-2xs">
      {/* Left Area: Mobile Drawer Toggle & Desktop Collapse Button & Global Search */}
      <div className="flex items-center gap-3 flex-1 max-w-xl">
        {/* Mobile Hamburger Button */}
        <button
          type="button"
          onClick={onMobileMenuToggle}
          aria-label="Toggle navigation drawer"
          className="lg:hidden p-2 rounded-xl text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Desktop Sidebar Collapse Toggle */}
        <button
          type="button"
          onClick={onSidebarCollapseToggle}
          aria-label="Toggle sidebar collapse"
          className="hidden lg:flex p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer"
          title={isSidebarCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
        >
          {isSidebarCollapsed ? (
            <PanelLeftOpen className="w-5 h-5" />
          ) : (
            <PanelLeftClose className="w-5 h-5" />
          )}
        </button>

        {/* Global Admin Search Bar */}
        {/* <div className="relative w-full max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search users, monographs, subscriptions..."
            className="w-full h-9.5 pl-9.5 pr-4 bg-slate-50/80 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-[#E76120] focus:bg-white focus:ring-2 focus:ring-[#E76120]/15 transition-all"
          />
        </div> */}
      </div>

      {/* Right Area: Theme Toggle, Notifications, User Dropdown */}
      <div className="flex items-center gap-2 sm:gap-4 shrink-0">
        {/* Theme Switcher */}
        <div className="hidden md:flex items-center gap-2 text-xs font-medium text-slate-600">
          <span className="text-slate-400">Theme</span>
          <button
            type="button"
            onClick={() => setIsDarkMode(!isDarkMode)}
            className={`
              w-9 h-5 rounded-full p-0.5 transition-colors cursor-pointer relative flex items-center
              ${isDarkMode ? 'bg-[#E76120]' : 'bg-slate-300'}
            `}
            aria-label="Toggle theme"
          >
            <div
              className={`
                w-4 h-4 rounded-full bg-white shadow-xs transition-transform duration-200
                ${isDarkMode ? 'translate-x-4' : 'translate-x-0'}
              `}
            />
          </button>
        </div>

        {/* Help & Documentation */}
        <button
          type="button"
          className="hidden sm:flex p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer"
          title="Admin Documentation & Support"
        >
          <HelpCircle className="w-5 h-5" />
        </button>

        {/* Notification Icon & Dropdown Popover */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors relative cursor-pointer"
            title="Notifications"
            aria-expanded={showNotifications}
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#E76120] ring-2 ring-white" />
            )}
          </button>

          {/* Notifications Flyout */}
          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-xl border border-slate-100 p-4 z-50 animate-in fade-in-0 zoom-in-95 duration-150">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <span className="text-xs font-bold text-slate-800">Admin Alerts</span>
                <span className="text-[11px] font-semibold text-[#E76120] hover:underline cursor-pointer">
                  Mark all read
                </span>
              </div>
              <div className="divide-y divide-slate-100 my-1 max-h-60 overflow-y-auto">
                {notifications.map((item) => (
                  <div key={item.id} className="py-2.5 flex items-start gap-2.5">
                    <span className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${item.unread ? 'bg-[#E76120]' : 'bg-slate-300'}`} />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium text-slate-800 leading-tight">{item.title}</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">{item.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Divider */}
        <div className="h-6 w-px bg-slate-200 hidden sm:block" />

        {/* User Profile Menu */}
        <UserProfileDropdown />
      </div>
    </header>
  );
};

export default AdminHeader;
