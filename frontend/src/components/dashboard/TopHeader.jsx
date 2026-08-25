import React, { useState } from 'react';
import { Search, HelpCircle, Bell, Menu } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const TopHeader = ({ onMenuToggle }) => {
  const { user } = useAuth();
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <header className="w-full h-16 bg-white border-b border-slate-100 px-4 sm:px-8 flex items-center justify-between gap-4 select-none">
      {/* Left: Mobile Hamburger & Search Input */}
      <div className="flex items-center gap-3 flex-1 max-w-md">
        {/* Mobile menu button */}
        <button
          type="button"
          onClick={onMenuToggle}
          className="lg:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Global Search Bar */}
        <div className="relative w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search, medicine, disease, courses..."
            className="w-full h-10 pl-10 pr-4 bg-slate-50/60 border border-slate-200 rounded-lg text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-[#E76120] focus:bg-white focus:ring-2 focus:ring-[#E76120]/15 transition-all"
          />
        </div>
      </div>

      {/* Right: Theme Toggle, Help, Notifications, User Avatar */}
      <div className="flex items-center gap-3 sm:gap-6 shrink-0">
        {/* Theme Toggle Switch */}
        <div className="hidden sm:flex items-center gap-2 text-xs sm:text-sm font-medium text-slate-600">
          <span className="text-slate-500">Theme</span>
          <button
            type="button"
            onClick={() => setIsDarkMode(!isDarkMode)}
            className={`
              w-10 h-5.5 rounded-full p-0.5 transition-colors cursor-pointer relative flex items-center
              ${isDarkMode ? 'bg-[#E76120]' : 'bg-slate-300'}
            `}
            aria-label="Toggle theme"
          >
            <div
              className={`
                w-4.5 h-4.5 rounded-full bg-white shadow-xs transition-transform duration-200
                ${isDarkMode ? 'translate-x-4.5' : 'translate-x-0'}
              `}
            />
          </button>
          <span className="text-xs text-slate-600 font-normal">Dark Mode</span>
        </div>

        {/* Action Icons */}
        <div className="flex items-center gap-2 sm:gap-3 text-slate-600">
          {/* Help Icon */}
          <button 
            type="button"
            className="p-1.5 rounded-full hover:bg-slate-100 transition-colors"
            title="Help & Support"
          >
            <HelpCircle className="w-5 h-5 text-slate-600" />
          </button>

          {/* Notification Bell */}
          <button 
            type="button"
            className="p-1.5 rounded-full hover:bg-slate-100 transition-colors relative"
            title="Notifications"
          >
            <Bell className="w-5 h-5 text-slate-600" />
            <span className="w-2 h-2 rounded-full bg-[#E76120] absolute top-1.5 right-1.5" />
          </button>
        </div>

        {/* User Profile Avatar */}
        <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
          <div className="w-9 h-9 rounded-full bg-[#284661] text-white font-semibold flex items-center justify-center text-sm shadow-xs overflow-hidden">
            {user?.name ? user.name.charAt(0).toUpperCase() : 'A'}
          </div>
        </div>
      </div>
    </header>
  );
};

export default TopHeader;
