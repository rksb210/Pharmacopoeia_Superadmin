/**
 * Centralized Design Tokens for NFI (National Formulary of India)
 * 
 * Modify any theme colors, typography, dimensions, or border-radii
 * in this single file to update them across the entire application.
 */

export const tokens = {
  colors: {
    // Brand & Theme Colors
    headerBg: '#E76120',
    primaryOrange: '#E76120',
    loginButton: '#FFD243',
    loginButtonHover: '#F5C422',
    brandNavy: '#284661',
    brandNavyDark: '#1B3145',
    
    // Gradients
    bannerGradient: 'linear-gradient(180deg, #923000 0%, #7B5E00 100%)',
    
    // Text Colors
    textPrimary: '#1E293B',
    textSecondary: '#64748B',
    textMuted: '#94A3B8',
    textWhite: '#FFFFFF',
    textLink: '#E76120',
    
    // Backgrounds & Borders
    bgPage: '#FFFFFF',
    bgBanner: '#923000',
    inputBg: '#FFFFFF',
    borderDefault: '#E2E8F0',
    borderFocus: '#E76120',
    dividerColor: '#E2E8F0',
    
    // Badge & Pill Colors
    badgeBg: 'rgba(255, 255, 255, 0.15)',
    badgeBorder: 'rgba(255, 255, 255, 0.25)',
    badgeText: '#FFFFFF',
    shieldBg: '#284661',
  },

  typography: {
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    fontSize: {
      xs: '0.75rem',    // 12px
      sm: '0.875rem',   // 14px
      base: '1rem',      // 16px
      lg: '1.125rem',   // 18px
      xl: '1.25rem',    // 20px
      '2xl': '1.5rem',   // 24px
      '3xl': '1.875rem', // 30px
    },
    fontWeight: {
      normal: '400',
      medium: '500',
      semibold: '600',
      bold: '700',
    },
  },

  dimensions: {
    headerHeight: '44px',
    headerPaddingX: '100px',
    bannerWidth: '600px',
    bannerHeight: '728px',
    formWidth: '420px',
    inputHeight: '44px',
    buttonHeight: '44px',
    inputPaddingX: '12px',
    formGap: '24px',
  },

  borderRadius: {
    banner: '32px',
    input: '8px',
    button: '8px',
    card: '16px',
    pill: '9999px',
  },

  shadows: {
    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    card: '0 10px 25px -5px rgba(0, 0, 0, 0.15)',
    bannerCard: '0 20px 40px -15px rgba(0, 0, 0, 0.3)',
  },

  breakpoints: {
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
    '2xl': '1536px',
  },
};

export default tokens;
