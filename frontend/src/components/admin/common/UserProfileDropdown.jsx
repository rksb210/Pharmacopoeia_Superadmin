import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, Settings, Shield, ChevronDown, KeyRound } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { Badge } from '../../ui/badge';
import ChangePasswordModal from './ChangePasswordModal';

export const UserProfileDropdown = () => {
  const { user, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  // Close dropdown on click outside or escape key
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') setIsOpen(false);
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const handleLogout = async () => {
    setIsOpen(false);
    await logout();
    navigate('/login');
  };

  const displayName = user?.name || 'Administrator';
  const displayEmail = user?.email || 'admin@nfi.gov.in';
  const roleName = (user?.role || 'admin').toUpperCase();
  const initial = displayName.charAt(0).toUpperCase();

  return (
    <>
      <div className="relative select-none" ref={dropdownRef}>
        {/* Trigger Button */}
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          aria-expanded={isOpen}
          aria-haspopup="true"
          className="flex items-center gap-2.5 p-1 rounded-xl hover:bg-slate-100/80 transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#E76120]/30"
        >
          {/* Avatar circle */}
          <div className="w-9 h-9 rounded-full bg-[#284661] text-white font-bold flex items-center justify-center text-sm shadow-xs ring-2 ring-white">
            {initial}
          </div>

          {/* User Info (Hidden on small screens) */}
          <div className="hidden md:flex flex-col text-left">
            <span className="text-xs font-bold text-slate-800 leading-tight truncate max-w-[130px]">
              {displayName}
            </span>
            <span className="text-[11px] font-medium text-slate-400 capitalize">
              {user?.role || 'Admin'}
            </span>
          </div>

          <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
        </button>

        {/* Dropdown Menu */}
        {isOpen && (
          <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-slate-100 py-2 z-50 animate-in fade-in-0 zoom-in-95 duration-150">
            {/* Header section with User Info */}
            <div className="px-4 py-3 border-b border-slate-100 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#284661] text-white font-bold flex items-center justify-center text-base shrink-0">
                {initial}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-slate-900 truncate">{displayName}</p>
                <p className="text-[11px] text-slate-400 truncate mt-0.5">{displayEmail}</p>
                <div className="mt-1.5">
                  <Badge variant={user?.role === 'superadmin' ? 'nfiYellow' : 'nfiNavy'} className="text-[10px] px-2 py-0">
                    {roleName}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Quick Menu Links */}
            <div className="py-1">
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  setIsChangePasswordOpen(true);
                }}
                className="w-full px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 flex items-center gap-2.5 transition-colors cursor-pointer text-left"
              >
                <KeyRound className="w-4 h-4 text-slate-400" />
                <span>Change Password</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  navigate('/admin/settings');
                }}
                className="w-full px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 flex items-center gap-2.5 transition-colors cursor-pointer text-left"
              >
                <Settings className="w-4 h-4 text-slate-400" />
                <span>Admin Settings</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  navigate('/admin/audit-logs');
                }}
                className="w-full px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 flex items-center gap-2.5 transition-colors cursor-pointer text-left"
              >
                <Shield className="w-4 h-4 text-slate-400" />
                <span>Security &amp; Audit Logs</span>
              </button>
            </div>

            {/* Logout Section */}
            <div className="pt-1 border-t border-slate-100">
              <button
                type="button"
                onClick={handleLogout}
                className="w-full px-4 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 flex items-center gap-2.5 transition-colors cursor-pointer text-left"
              >
                <LogOut className="w-4 h-4 text-red-500" />
                <span>Log out</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Change Password Modal */}
      <ChangePasswordModal
        isOpen={isChangePasswordOpen}
        onClose={() => setIsChangePasswordOpen(false)}
      />
    </>
  );
};

export default UserProfileDropdown;
