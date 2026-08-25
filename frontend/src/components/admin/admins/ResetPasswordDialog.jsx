import React, { useState } from 'react';
import AdminModal from '../common/AdminModal';
import InputField from '../../common/InputField';
import { KeyRound, CheckCircle2, AlertCircle } from 'lucide-react';
import { Button } from '../../ui/button';

export const ResetPasswordDialog = ({
  isOpen,
  onClose,
  admin,
  onResetConfirm,
}) => {
  const [newPassword, setNewPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const generateRandomPassword = () => {
    const chars = 'abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789!@#$%';
    let pass = '';
    for (let i = 0; i < 10; i++) {
      pass += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setNewPassword(pass);
    setError('');
  };

  const handleClose = () => {
    setNewPassword('');
    setError('');
    setSuccess(false);
    onClose();
  };

  const handleSubmit = async (e) => {
    e?.preventDefault();
    if (!newPassword || newPassword.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      if (onResetConfirm) {
        await onResetConfirm(admin._id, newPassword);
      }
      setSuccess(true);
      setTimeout(() => {
        handleClose();
      }, 1800);
    } catch (err) {
      setError(err.message || 'Failed to reset password.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AdminModal
      isOpen={isOpen}
      onClose={handleClose}
      title="Reset Administrator Password"
      description={`Set a new temporary password for ${admin?.name} (${admin?.email}).`}
      confirmLabel="Apply New Password"
      isConfirming={isSubmitting}
      onConfirm={handleSubmit}
      size="sm"
    >
      <div className="space-y-4 text-xs select-none">
        {success && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
            <span className="font-semibold">Password reset successfully!</span>
          </div>
        )}

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
            <span>{error}</span>
          </div>
        )}

        <div className="space-y-2">
          <InputField
            id="adminNewPassword"
            name="adminNewPassword"
            label="New Password"
            type="text"
            placeholder="Enter or generate new password"
            value={newPassword}
            onChange={(e) => {
              setNewPassword(e.target.value);
              if (error) setError('');
            }}
            required
          />

          <button
            type="button"
            onClick={generateRandomPassword}
            className="text-xs font-bold text-[#E76120] hover:underline flex items-center gap-1 cursor-pointer"
          >
            <KeyRound className="w-3.5 h-3.5" />
            <span>Generate Secure Password</span>
          </button>
        </div>

        <p className="text-slate-400 text-[11px] leading-relaxed">
          The administrator will be able to log in with this new password immediately and update it from their account settings.
        </p>
      </div>
    </AdminModal>
  );
};

export default ResetPasswordDialog;
