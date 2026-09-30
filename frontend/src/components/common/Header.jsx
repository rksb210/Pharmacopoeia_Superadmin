import React from 'react';
import { tokens } from '../../theme/tokens';

/**
 * Header Component
 * Top bar matching the Government of India / MoHFW header specifications.
 * Background: #E76120, Height: 44px
 */
export const Header = () => {

  return (
    <header 
      className="w-full h-[44px] flex items-center justify-center text-white text-xs sm:text-[13px] font-medium select-none z-50 px-4 sm:px-8 transition-all"
      style={{ backgroundColor: tokens.colors.headerBg }}
    >
      {/* Centered Government Details */}
      <div className="flex items-center justify-center gap-1.5 sm:gap-2 text-center truncate">
        <span className="truncate hover:opacity-95 transition-opacity">
          Government of India
        </span>
        <span className="opacity-70">·</span>
        <span className="truncate hover:opacity-95 transition-opacity">
          Ministry of Health &amp; Family Welfare
        </span>
      </div>
    </header>
  );
};

export default Header;
