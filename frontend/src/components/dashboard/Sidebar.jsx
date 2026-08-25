import React from 'react';
import { 
  LayoutDashboard, 
  Search, 
  Scan, 
  Info, 
  GraduationCap, 
  Bookmark, 
  Tag, 
  Settings, 
  LogOut 
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const Sidebar = ({ activeTab = 'Dashboard', onTabChange, isMobileOpen, setIsMobileOpen }) => {
  const { logout } = useAuth();

  const navItems = [
    { name: 'Dashboard', icon: LayoutDashboard },
    { name: 'NFI Library', icon: Search },
    { name: 'Kaym', icon: Scan },
    { name: 'Adit', icon: Info },
    { name: 'Diksha', icon: GraduationCap },
    { name: 'Bookmarks', icon: Bookmark },
    { name: 'Subscription', icon: Tag },
    { name: 'Settings', icon: Settings },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div 
          onClick={() => setIsMobileOpen(false)}
          className="fixed inset-0 bg-black/40 backdrop-blur-xs z-40 lg:hidden" 
        />
      )}

      <aside className={`
        fixed lg:static top-0 left-0 z-50 h-screen w-[220px] bg-white border-r border-slate-100
        flex flex-col justify-between py-6 px-4 select-none transition-transform duration-200
        ${isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Top Section: Emblem Logo & Navigation */}
        <div className="flex flex-col items-center w-full">
          {/* Emblem & IPC Logo */}
          <div className="w-16 h-16 mb-8 flex items-center justify-center">
            <img 
              src="/assets/national-emblem-ipc.png" 
              alt="National Formulary of India - IPC"
              className="w-full h-full object-contain"
            />
          </div>

          {/* Navigation Links */}
          <nav className="w-full space-y-1.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.name;

              return (
                <button
                  key={item.name}
                  type="button"
                  onClick={() => {
                    if (onTabChange) onTabChange(item.name);
                    if (setIsMobileOpen) setIsMobileOpen(false);
                  }}
                  className={`
                    w-full flex items-center gap-3.5 px-4 py-2.5 rounded-[12px] text-sm font-medium
                    transition-all duration-150 cursor-pointer
                    ${isActive 
                      ? 'bg-[#FFD243] text-slate-900 font-bold shadow-xs' 
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                    }
                  `}
                >
                  <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-slate-900' : 'text-slate-500'}`} />
                  <span className="truncate">{item.name}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Bottom Section: Logout Button */}
        <div className="w-full pt-4">
          <button
            type="button"
            onClick={logout}
            className="w-full h-11 border border-red-300 text-red-500 hover:bg-red-50 active:bg-red-100 font-medium rounded-xl flex items-center justify-center gap-2 text-sm transition-colors cursor-pointer shadow-2xs"
          >
            <LogOut className="w-4 h-4" />
            <span>Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
