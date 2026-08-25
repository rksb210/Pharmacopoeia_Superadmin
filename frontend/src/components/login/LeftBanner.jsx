import React from 'react';
import { tokens } from '../../theme/tokens';

/**
 * LeftBanner Component
 * Visual/illustration card on the left side of the login page.
 * Responsively scales to fit within the viewport height without scrolling.
 */
export const LeftBanner = () => {
  return (
    <div
      style={{
        background: tokens.colors.bannerGradient,
        borderRadius: tokens.borderRadius.banner,
      }}
      className="w-full lg:w-[540px] xl:w-[580px] h-full max-h-[calc(100vh-76px)] max-h-[640px] xl:max-h-[700px] p-5 sm:p-6 lg:p-7 xl:p-8 flex flex-col justify-between items-center text-white relative shadow-2xl overflow-hidden select-none"
    >
      {/* Decorative subtle ambient glows */}
      <div className="absolute -top-24 -left-24 w-64 h-64 bg-white/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -right-24 w-72 h-72 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top / Center Visual: Illustration & Shield */}
      <div className="w-full flex-1 flex flex-col items-center justify-center py-2">
        <div className="relative mb-5 sm:mb-6 group">
          {/* Main Verified Card Asset / Illustration */}
          <div className="relative bg-white rounded-2xl p-3 sm:p-4 shadow-xl border border-white/20 transition-transform duration-300 group-hover:scale-[1.02] max-w-[240px] sm:max-w-[270px]">
            <img 
              src="/assets/ipc-verified-card.png" 
              alt="IPC Verified Monograph"
              className="w-full h-auto object-contain rounded-lg"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
          </div>

          {/* Floating Shield Badge Top-Right */}
          <div 
            style={{ backgroundColor: tokens.colors.brandNavy }}
            className="absolute -top-3 -right-3 w-9 h-9 sm:w-10 sm:h-10 rounded-xl shadow-lg border border-white/20 flex items-center justify-center text-white transition-transform duration-200 hover:rotate-6"
            title="Government Security Verified"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm-2 15l-4-4 1.41-1.41L10 13.17l6.59-6.59L18 8l-8 8z"/>
            </svg>
          </div>
        </div>

        {/* Text Section */}
        <div className="text-center max-w-[440px] space-y-2 sm:space-y-3 px-2">
          <h1 className="text-lg sm:text-xl xl:text-[24px] font-bold leading-snug tracking-tight text-white">
            Verified medicine information, every time you sign in.
          </h1>
          <p className="text-xs sm:text-sm text-white/80 leading-relaxed font-normal">
            Your access is protected by government-grade security — every monograph is sourced directly from the Indian Pharmacopoeia Commission.
          </p>
        </div>
      </div>

      {/* Bottom Trust Badges / Pills */}
      <div className="w-full pt-4 border-t border-white/10 flex flex-wrap items-center justify-center gap-2">
        {/* Pill 1: 256-bit encrypted */}
        <div className="bg-black/25 backdrop-blur-md border border-white/15 text-white/90 text-[11px] font-medium px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-sm hover:bg-black/35 transition-colors">
          <span className="text-amber-400 text-xs">🔒</span>
          <span>256-bit encrypted</span>
        </div>

        {/* Pill 2: Govt. of India platform */}
        <div className="bg-black/25 backdrop-blur-md border border-white/15 text-white/90 text-[11px] font-medium px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-sm hover:bg-black/35 transition-colors">
          <span className="text-amber-400 text-xs">🏛️</span>
          <span>Govt. of India platform</span>
        </div>

        {/* Pill 3: IPC verified content */}
        <div className="bg-black/25 backdrop-blur-md border border-white/15 text-white/90 text-[11px] font-medium px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-sm hover:bg-black/35 transition-colors">
          <span className="text-emerald-400 text-xs font-bold">✓</span>
          <span>IPC verified content</span>
        </div>
      </div>
    </div>
  );
};

export default LeftBanner;
