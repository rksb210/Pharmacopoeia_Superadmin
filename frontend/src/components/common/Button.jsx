import React from 'react';
import { tokens } from '../../theme/tokens';

/**
 * Reusable Button Component
 * Matches design specification: Background #FFD243, Height 44px, Border-radius 8px
 */
export const Button = ({
  children,
  type = 'button',
  onClick,
  disabled = false,
  loading = false,
  className = '',
  variant = 'primary', // 'primary' | 'outline' | 'secondary'
  style = {},
}) => {
  const getVariantStyles = () => {
    switch (variant) {
      case 'primary':
        return {
          backgroundColor: tokens.colors.loginButton,
          color: tokens.colors.textPrimary,
        };
      case 'secondary':
        return {
          backgroundColor: tokens.colors.brandNavy,
          color: '#FFFFFF',
        };
      case 'outline':
        return {
          backgroundColor: 'transparent',
          border: `1px solid ${tokens.colors.borderDefault}`,
          color: tokens.colors.textPrimary,
        };
      default:
        return {};
    }
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      style={{
        height: tokens.dimensions.buttonHeight,
        borderRadius: tokens.borderRadius.button,
        ...getVariantStyles(),
        ...style,
      }}
      className={`
        w-full font-semibold text-sm sm:text-base flex items-center justify-center gap-2
        transition-all duration-150 shadow-sm select-none cursor-pointer
        hover:brightness-95 active:scale-[0.99]
        disabled:opacity-60 disabled:cursor-not-allowed disabled:active:scale-100
        ${className}
      `}
    >
      {loading ? (
        <span className="inline-flex items-center gap-2">
          <svg className="animate-spin h-4 w-4 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span>Processing...</span>
        </span>
      ) : (
        children
      )}
    </button>
  );
};

export default Button;
