import React, { useState, useEffect, useRef } from 'react';
import { Search, Bell, Menu, PanelLeftClose, PanelLeftOpen, HelpCircle, ArrowRight } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import UserProfileDropdown from './UserProfileDropdown';
import notificationService from '../../../services/notification.service';

export const AdminHeader = ({
  onMobileMenuToggle,
  isSidebarCollapsed,
  onSidebarCollapseToggle,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [readIds, setReadIds] = useState(new Set());
  const notifRef = useRef(null);

  // Fetch real notifications from Database
  const fetchLiveNotifications = async () => {
    try {
      const res = await notificationService.getNotifications({ limit: 6 });
      if (res && res.notifications) {
        setNotifications(res.notifications);
      }
    } catch (err) {
      console.warn('Failed to load header notifications:', err.message);
    }
  };

  useEffect(() => {
    fetchLiveNotifications();
    const interval = setInterval(fetchLiveNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const formatTimeAgo = (dateStr) => {
    if (!dateStr) return 'Recently';
    const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
    return new Date(dateStr).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
  };

  const handleMarkAllRead = () => {
    const allIds = new Set(notifications.map((n) => n._id));
    setReadIds(allIds);
  };

  const unreadCount = notifications.filter(
    (n) => !readIds.has(n._id) && (n.status === 'active' || n.status === 'sent')
  ).length;

  return (
    <header className="w-full h-16 bg-white border-b border-slate-200/80 px-4 sm:px-6 flex items-center justify-between gap-3 select-none sticky top-0 z-30 shadow-2xs">
      {/* Left Area: Mobile Drawer Toggle & Desktop Collapse Button */}
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

        {/* Global Admin Search Bar (Commented out) */}
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

      {/* Right Area: Notifications, User Dropdown */}
      <div className="flex items-center gap-2 sm:gap-4 shrink-0">
        {/* Theme Switcher (Commented out) */}
        {/* <div className="hidden md:flex items-center gap-2 text-xs font-medium text-slate-600">
          <span className="text-slate-400">Theme</span>
          <button
            type="button"
            className="w-9 h-5 rounded-full p-0.5 transition-colors cursor-pointer relative flex items-center bg-slate-300"
            aria-label="Toggle theme"
          >
            <div className="w-4 h-4 rounded-full bg-white shadow-xs transition-transform duration-200 translate-x-0" />
          </button>
        </div> */}

        {/* Help & Documentation (Commented out) */}
        {/* <button
          type="button"
          className="hidden sm:flex p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer"
          title="Admin Documentation & Support"
        >
          <HelpCircle className="w-5 h-5" />
        </button> */}

        {/* Notification Icon & Dynamic Dropdown Popover */}
        <div className="relative" ref={notifRef}>
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

          {/* Dynamic Notifications Flyout */}
          {showNotifications && (
            <div className="fixed sm:absolute top-16 sm:top-auto sm:mt-2 left-3 right-3 sm:left-auto sm:right-0 sm:w-80 max-w-[calc(100vw-24px)] sm:max-w-none bg-white rounded-2xl shadow-xl border border-slate-100 p-4 z-50 animate-in fade-in-0 zoom-in-95 duration-150 font-sans">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <span className="text-xs font-bold text-slate-800">System Broadcasts &amp; Alerts</span>
                {unreadCount > 0 && (
                  <button
                    type="button"
                    onClick={handleMarkAllRead}
                    className="text-[11px] font-semibold text-[#E76120] hover:underline cursor-pointer"
                  >
                    Mark all read
                  </button>
                )}
              </div>

              <div className="divide-y divide-slate-100 my-1 max-h-[60vh] sm:max-h-64 overflow-y-auto">
                {notifications.length === 0 ? (
                  <p className="text-xs text-slate-400 text-center py-6">No recent system notifications.</p>
                ) : (
                  notifications.map((item) => {
                    const isUnread = !readIds.has(item._id) && (item.status === 'active' || item.status === 'sent');
                    return (
                      <div
                        key={item._id}
                        onClick={() => {
                          setReadIds((prev) => new Set([...prev, item._id]));
                        }}
                        className="py-2.5 flex items-start gap-2.5 hover:bg-slate-50/80 px-1 rounded-lg transition-colors cursor-pointer"
                      >
                        <span
                          className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${
                            isUnread ? 'bg-[#E76120]' : 'bg-slate-300'
                          }`}
                        />
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-bold text-slate-800 leading-tight truncate">
                            {item.title}
                          </p>
                          <p className="text-[11px] text-slate-500 line-clamp-2 mt-0.5 leading-snug">
                            {item.message}
                          </p>
                          <div className="flex items-center justify-between mt-1 text-[10px] text-slate-400">
                            <span className="uppercase font-semibold text-[9px] text-[#284661]">
                              {item.category || item.channel || 'System'}
                            </span>
                            <span>{formatTimeAgo(item.createdAt)}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* View All Footer */}
              <div className="pt-2.5 border-t border-slate-100 text-center">
                <NavLink
                  to="/admin/notifications"
                  onClick={() => setShowNotifications(false)}
                  className="text-xs font-bold text-[#E76120] hover:underline inline-flex items-center gap-1"
                >
                  <span>Manage All Notifications</span>
                  <ArrowRight className="w-3 h-3" />
                </NavLink>
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
