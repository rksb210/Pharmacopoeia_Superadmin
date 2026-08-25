import React, { useState } from 'react';
import { tokens } from '../../theme/tokens';

/**
 * Header Component
 * Top bar matching the Government of India / MoHFW header specifications.
 * Background: #E76120, Height: 44px, Padding: 100px (desktop)
 */
export const Header = () => {
  const [currentLang, setCurrentLang] = useState('English');

  return (
    <header 
      className="w-full h-[44px] flex items-center justify-between text-white text-xs sm:text-[13px] font-medium select-none z-50 px-4 sm:px-8 lg:px-[100px] transition-all"
      style={{ backgroundColor: tokens.colors.headerBg }}
    >
      {/* Left side: Government Details */}
      <div className="flex items-center gap-1.5 sm:gap-2 truncate">
        <span className="truncate hover:opacity-95 transition-opacity">
          Government of India
        </span>
        <span className="opacity-70">·</span>
        <span className="truncate hover:opacity-95 transition-opacity">
          Ministry of Health &amp; Family Welfare
        </span>
      </div>

      {/* Right side: Accessibility, Language & Controls */}
      <div className="flex items-center gap-2 sm:gap-4 shrink-0">
        {/* Language switch */}
        <div className="flex items-center gap-1">
          <button 
            type="button"
            onClick={() => setCurrentLang('Hindi')} 
            className={`hover:underline cursor-pointer transition-opacity ${currentLang === 'Hindi' ? 'font-bold opacity-100' : 'opacity-85'}`}
          >
            हिंदी
          </button>
          <span className="opacity-70">|</span>
          <button 
            type="button"
            onClick={() => setCurrentLang('English')} 
            className={`hover:underline cursor-pointer transition-opacity ${currentLang === 'English' ? 'font-bold opacity-100' : 'opacity-85'}`}
          >
            English
          </button>
        </div>

        <span className="opacity-70 hidden md:inline">·</span>

        {/* Screen Reader Access */}
        <button 
          type="button"
          className="hidden md:inline hover:underline cursor-pointer opacity-90 hover:opacity-100 transition-opacity"
        >
          Screen Reader Access
        </button>

        <span className="opacity-70 hidden sm:inline">·</span>

        {/* Font Size Adjusters */}
        <div className="flex items-center gap-1.5 text-xs font-semibold">
          <button 
            type="button" 
            className="hover:opacity-100 opacity-80 px-1 py-0.5 rounded hover:bg-white/10 transition-colors"
            title="Decrease font size"
          >
            A-
          </button>
          <button 
            type="button" 
            className="hover:opacity-100 opacity-90 px-1 py-0.5 rounded hover:bg-white/10 transition-colors"
            title="Normal font size"
          >
            A
          </button>
          <button 
            type="button" 
            className="hover:opacity-100 opacity-80 px-1 py-0.5 rounded hover:bg-white/10 transition-colors"
            title="Increase font size"
          >
            A+
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
