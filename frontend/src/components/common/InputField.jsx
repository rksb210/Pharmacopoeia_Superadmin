import React, { useState } from 'react';
import { tokens } from '../../theme/tokens';

/**
 * Reusable InputField Component
 * Sizing: Height 44px, Padding 12px, Border-radius 8px
 * Supports text, password (with show/hide toggle), email, etc.
 */
export const InputField = ({
  id,
  name,
  label,
  type = 'text',
  placeholder = '',
  value,
  onChange,
  onBlur,
  error,
  required = false,
  autoComplete,
  className = '',
  disabled = false,
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === 'password';
  const effectiveType = isPassword ? (showPassword ? 'text' : 'password') : type;

  return (
    <div className={`flex flex-col gap-1.5 w-full ${className}`}>
      {label && (
        <label 
          htmlFor={id || name}
          className="text-sm font-medium text-slate-700 select-none text-left"
        >
          {label}
        </label>
      )}

      <div className="relative w-full">
        <input
          id={id || name}
          name={name}
          type={effectiveType}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          disabled={disabled}
          required={required}
          autoComplete={autoComplete}
          style={{
            height: tokens.dimensions.inputHeight,
            borderRadius: tokens.borderRadius.input,
            paddingLeft: tokens.dimensions.inputPaddingX,
            paddingRight: isPassword ? '40px' : tokens.dimensions.inputPaddingX,
          }}
          className={`
            w-full border bg-white text-slate-800 text-sm placeholder:text-slate-400
            transition-all duration-150 outline-none
            ${error 
              ? 'border-red-500 focus:ring-2 focus:ring-red-200' 
              : 'border-slate-200 hover:border-slate-300 focus:border-[#E76120] focus:ring-2 focus:ring-[#E76120]/15'
            }
            disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed
          `}
        />

        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none p-1 rounded transition-colors"
            tabIndex={-1}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
          >
            {showPassword ? (
              // Eye off icon
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
              </svg>
            ) : (
              // Eye icon
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            )}
          </button>
        )}
      </div>

      {error && (
        <span className="text-xs text-red-500 text-left mt-0.5">{error}</span>
      )}
    </div>
  );
};

export default InputField;
