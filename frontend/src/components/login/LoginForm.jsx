import React, { useState } from 'react';
import { tokens } from '../../theme/tokens';
import InputField from '../common/InputField';
import Button from '../common/Button';
import { useAuth } from '../../context/AuthContext';

/**
 * LoginForm Component
 * Right login section connected to Backend API.
 * Width: 420px, Gap: 24px, Button: #FFD243
 */
export const LoginForm = ({ onLoginSuccess }) => {
  const { login } = useAuth();

  const [formData, setFormData] = useState({
    identifier: '',
    password: '',
    rememberMe: false,
  });

  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));

    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
    if (apiError) {
      setApiError('');
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.identifier.trim()) {
      newErrors.identifier = 'Please enter your email or username';
    }
    if (!formData.password) {
      newErrors.password = 'Please enter your password';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    setApiError('');

    try {
      const res = await login(formData.identifier, formData.password, formData.rememberMe);
      if (onLoginSuccess) {
        onLoginSuccess(res);
      }
    } catch (err) {
      setApiError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div 
      style={{ maxWidth: tokens.dimensions.formWidth }}
      className="w-full flex flex-col items-center mx-auto"
    >
      {/* Top Branding Section: Emblem & Title */}
      <div className="flex flex-col items-center text-center mb-4 sm:mb-5">
        {/* National Emblem & IPC Logo */}
        <div className="w-14 h-14 sm:w-16 sm:h-16 mb-2 flex items-center justify-center">
          <img 
            src="/assets/national-emblem-ipc.png" 
            alt="National Formulary of India - IPC"
            className="w-full h-full object-contain"
          />
        </div>

        {/* Portal Title */}
        <h2 
          style={{ color: tokens.colors.brandNavy }}
          className="text-lg sm:text-xl font-bold tracking-tight mb-0.5"
        >
          National Formulary of India
        </h2>

        {/* Subtitle */}
        <p className="text-xs sm:text-sm text-slate-500 font-medium">
          Indian Pharmacopoeia Commission
        </p>
      </div>

      {/* Global API Error Alert */}
      {apiError && (
        <div className="w-full mb-3 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg flex items-center gap-2">
          <svg className="w-4 h-4 shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          <span>{apiError}</span>
        </div>
      )}

      {/* Form Fields Section */}
      <form 
        onSubmit={handleSubmit} 
        noValidate 
        className="w-full flex flex-col gap-3.5 sm:gap-4"
      >
        {/* Identifier (Email / Username) */}
        <InputField
          id="identifier"
          name="identifier"
          label="Email or username"
          type="text"
          placeholder="Enter email"
          value={formData.identifier}
          onChange={handleChange}
          error={errors.identifier}
          required
          autoComplete="username"
        />

        {/* Password */}
        <InputField
          id="password"
          name="password"
          label="Password"
          type="password"
          placeholder="Enter password"
          value={formData.password}
          onChange={handleChange}
          error={errors.password}
          required
          autoComplete="current-password"
        />

        {/* Options Row: Remember Me & Forgot Password */}
        <div className="flex items-center justify-between text-xs sm:text-sm pt-0.5 select-none">
          <label className="flex items-center gap-2 text-slate-600 cursor-pointer hover:text-slate-800 transition-colors">
            <input
              type="checkbox"
              name="rememberMe"
              checked={formData.rememberMe}
              onChange={handleChange}
              className="w-4 h-4 rounded border-slate-300 text-[#E76120] focus:ring-[#E76120]/30 cursor-pointer accent-[#E76120]"
            />
            <span>Remember me</span>
          </label>

          <a
            href="#forgot-password"
            onClick={(e) => e.preventDefault()}
            style={{ color: tokens.colors.textLink }}
            className="font-medium hover:underline transition-all"
          >
            Forgot Password?
          </a>
        </div>

        {/* Login Button */}
        <div className="pt-1">
          <Button
            type="submit"
            loading={isSubmitting}
            variant="primary"
          >
            Log In
          </Button>
        </div>

        {/* Divider: "or" */}
        <div className="relative flex items-center justify-center my-1.5">
          <div className="w-full border-t border-slate-200" />
          <span className="bg-white px-3 text-xs text-slate-400 font-medium absolute">
            or
          </span>
        </div>

        {/* Create Account Link */}
        <div className="text-center text-xs sm:text-sm text-slate-600 select-none">
          <span>New to NFI? </span>
          <a
            href="#create-account"
            onClick={(e) => e.preventDefault()}
            style={{ color: tokens.colors.textLink }}
            className="font-semibold hover:underline transition-all ml-1"
          >
            Create Account
          </a>
        </div>
      </form>
    </div>
  );
};

export default LoginForm;
