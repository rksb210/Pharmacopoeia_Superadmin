import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import Header from '../components/common/Header';
import InputField from '../components/common/InputField';
import Button from '../components/common/Button';
import { useAuth } from '../context/AuthContext';
import { tokens } from '../theme/tokens';
import { CheckCircle2, AlertCircle, ArrowLeft } from 'lucide-react';

export const ResetPasswordPage = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const { resetPassword } = useAuth();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!password || password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      await resetPassword(token, password, confirmPassword);
      setSuccess(true);
      setTimeout(() => {
        navigate('/login');
      }, 2500);
    } catch (err) {
      setError(err.message || 'Password reset failed. The link may have expired.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="h-screen w-screen flex flex-col bg-white overflow-hidden font-sans select-none">
      <Header />

      <main className="flex-1 w-full flex items-center justify-center px-4 sm:px-6 py-6">
        <div className="w-full max-w-[440px] bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-8 shadow-xl space-y-6">
          {/* Header */}
          <div className="text-center space-y-2">
            <div className="w-14 h-14 mx-auto mb-2">
              <img
                src="/assets/national-emblem-ipc.png"
                alt="IPC"
                className="w-full h-full object-contain"
              />
            </div>
            <h2
              style={{ color: tokens.colors.brandNavy }}
              className="text-xl font-bold tracking-tight"
            >
              Reset Your Password
            </h2>
            <p className="text-xs text-slate-500 font-medium">
              National Formulary of India — Superadmin Portal
            </p>
          </div>

          {/* Success Message */}
          {success ? (
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-center space-y-2">
              <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
              <p className="text-sm font-bold text-emerald-900">
                Password Reset Successfully!
              </p>
              <p className="text-xs text-emerald-700">
                Redirecting you to the login screen...
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                  <span>{error}</span>
                </div>
              )}

              <InputField
                id="password"
                name="password"
                label="New Password"
                type="password"
                placeholder="Enter new password (min. 6 characters)"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (error) setError('');
                }}
                required
              />

              <InputField
                id="confirmPassword"
                name="confirmPassword"
                label="Confirm New Password"
                type="password"
                placeholder="Re-enter new password"
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  if (error) setError('');
                }}
                required
              />

              <Button
                type="submit"
                loading={isSubmitting}
                variant="primary"
                className="w-full mt-2"
              >
                Set New Password
              </Button>
            </form>
          )}

          <div className="pt-2 text-center">
            <Link
              to="/login"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#E76120] hover:underline"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Login</span>
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ResetPasswordPage;
