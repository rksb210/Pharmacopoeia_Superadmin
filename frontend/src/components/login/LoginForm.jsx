import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { tokens } from '../../theme/tokens';
import InputField from '../common/InputField';
import Button from '../common/Button';
import { useAuth } from '../../context/AuthContext';
import AdminModal from '../admin/common/AdminModal';
import { Clock, CheckCircle2, AlertCircle } from 'lucide-react';

/**
 * LoginForm Component with Session Inactivity Notice and Forgot Password Flow
 */
export const LoginForm = ({ onLoginSuccess }) => {
  const { login, forgotPassword } = useAuth();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    identifier: '',
    password: '',
    rememberMe: false,
  });

  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Inactivity alert from URL
  const [inactivityNotice, setInactivityNotice] = useState('');

  // Forgot Password Modal State
  const [isForgotModalOpen, setIsForgotModalOpen] = useState(false);
  const [forgotIdentifier, setForgotIdentifier] = useState('');
  const [forgotError, setForgotError] = useState('');
  const [forgotSuccess, setForgotSuccess] = useState('');
  const [isForgotSubmitting, setIsForgotSubmitting] = useState(false);

  useEffect(() => {
    const reason = searchParams.get('reason');
    if (reason === 'inactivity') {
      setInactivityNotice('Your session expired due to 45 minutes of inactivity. Please sign in again.');
    } else if (reason === 'session_expired') {
      setInactivityNotice('Your session has expired. Please sign in again.');
    }
  }, [searchParams]);

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
    setInactivityNotice('');

    try {
      const res = await login(formData.identifier, formData.password, formData.rememberMe);
      if (onLoginSuccess) {
        onLoginSuccess(res);
      }
      // Redirect based on administrative role
      const adminRoles = ['superadmin', 'admin', 'subadmin', 'maker', 'reviewer', 'approver', 'editor', 'viewer'];
      const userRole = (res.user?.role || '').toLowerCase();
      if (adminRoles.includes(userRole)) {
        navigate('/admin/dashboard');
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      setApiError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleForgotPasswordSubmit = async (e) => {
    e?.preventDefault();
    if (!forgotIdentifier.trim()) {
      setForgotError('Please enter your email or username');
      return;
    }

    setIsForgotSubmitting(true);
    setForgotError('');
    setForgotSuccess('');

    try {
      const res = await forgotPassword(forgotIdentifier);
      setForgotSuccess(res.message || 'Password reset link generated successfully.');
      if (res.resetUrl) {
        // Provide clickable link for testing / development
        setForgotSuccess(`Reset Link generated: ${res.resetUrl}`);
      }
    } catch (err) {
      setForgotError(err.message || 'Failed to initiate password reset.');
    } finally {
      setIsForgotSubmitting(false);
    }
  };

  return (
    <>
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

        {/* Inactivity Notice Alert */}
        {inactivityNotice && (
          <div className="w-full mb-3 p-3 bg-amber-50 border border-amber-200 text-amber-800 text-xs rounded-xl flex items-center gap-2">
            <Clock className="w-4 h-4 shrink-0 text-amber-600" />
            <span>{inactivityNotice}</span>
          </div>
        )}

        {/* Global API Error Alert */}
        {apiError && (
          <div className="w-full mb-3 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
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
            placeholder="Enter email or username"
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

            <button
              type="button"
              onClick={() => {
                setForgotIdentifier(formData.identifier);
                setIsForgotModalOpen(true);
              }}
              style={{ color: tokens.colors.textLink }}
              className="font-medium hover:underline transition-all cursor-pointer text-xs sm:text-sm bg-transparent border-0 p-0"
            >
              Forgot Password?
            </button>
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

      {/* Forgot Password Modal */}
      <AdminModal
        isOpen={isForgotModalOpen}
        onClose={() => {
          setIsForgotModalOpen(false);
          setForgotError('');
          setForgotSuccess('');
        }}
        title="Reset Your Password"
        description="Enter your registered email or username. We'll verify your account and provide a reset link."
        confirmLabel="Send Reset Link"
        isConfirming={isForgotSubmitting}
        onConfirm={handleForgotPasswordSubmit}
        size="sm"
      >
        <div className="space-y-3.5">
          {forgotSuccess && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 mt-0.5" />
              <div>
                <p className="font-semibold">{forgotSuccess}</p>
                {forgotSuccess.includes('/reset-password/') && (
                  <a
                    href={forgotSuccess.split('Reset Link generated: ')[1]}
                    className="text-[#E76120] underline font-bold mt-1 block"
                  >
                    Click here to open Reset Password page
                  </a>
                )}
              </div>
            </div>
          )}

          {forgotError && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
              <span>{forgotError}</span>
            </div>
          )}

          <InputField
            id="forgotIdentifier"
            name="forgotIdentifier"
            label="Email address or username"
            type="text"
            placeholder="e.g. admin@nfi.gov.in"
            value={forgotIdentifier}
            onChange={(e) => {
              setForgotIdentifier(e.target.value);
              if (forgotError) setForgotError('');
            }}
            required
          />
        </div>
      </AdminModal>
    </>
  );
};

export default LoginForm;
