import React, { useState } from 'react';
import { KeyRound, CheckCircle2, AlertCircle } from 'lucide-react';
import AdminModal from './AdminModal';
import InputField from '../../common/InputField';
import { useAuth } from '../../../context/AuthContext';

export const ChangePasswordModal = ({ isOpen, onClose }) => {
  const { changePassword } = useAuth();

  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
    if (apiError) setApiError('');
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.currentPassword) {
      newErrors.currentPassword = 'Enter your current password';
    }
    if (!formData.newPassword || formData.newPassword.length < 6) {
      newErrors.newPassword = 'New password must be at least 6 characters';
    }
    if (formData.newPassword && formData.newPassword === formData.currentPassword) {
      newErrors.newPassword = 'New password must be different from current password';
    }
    if (formData.confirmPassword !== formData.newPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleClose = () => {
    setFormData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    setErrors({});
    setApiError('');
    setSuccessMessage('');
    onClose();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    setApiError('');
    setSuccessMessage('');

    try {
      const res = await changePassword(
        formData.currentPassword,
        formData.newPassword,
        formData.confirmPassword
      );
      setSuccessMessage(res.message || 'Password changed successfully!');
      setTimeout(() => {
        handleClose();
      }, 1500);
    } catch (err) {
      setApiError(err.message || 'Failed to update password.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AdminModal
      isOpen={isOpen}
      onClose={handleClose}
      title="Change Administrator Password"
      description="Update your credentials. Ensure you use a strong password with at least 6 characters."
      confirmLabel="Update Password"
      isConfirming={isSubmitting}
      onConfirm={handleSubmit}
      size="sm"
    >
      <form onSubmit={handleSubmit} className="space-y-3.5">
        {/* Success Alert */}
        {successMessage && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs rounded-xl flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
            <span className="font-semibold">{successMessage}</span>
          </div>
        )}

        {/* Error Alert */}
        {apiError && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
            <span>{apiError}</span>
          </div>
        )}

        <InputField
          id="currentPassword"
          name="currentPassword"
          label="Current Password"
          type="password"
          placeholder="Enter current password"
          value={formData.currentPassword}
          onChange={handleChange}
          error={errors.currentPassword}
          required
        />

        <InputField
          id="newPassword"
          name="newPassword"
          label="New Password"
          type="password"
          placeholder="Enter new password (min. 6 chars)"
          value={formData.newPassword}
          onChange={handleChange}
          error={errors.newPassword}
          required
        />

        <InputField
          id="confirmPassword"
          name="confirmPassword"
          label="Confirm New Password"
          type="password"
          placeholder="Re-enter new password"
          value={formData.confirmPassword}
          onChange={handleChange}
          error={errors.confirmPassword}
          required
        />
      </form>
    </AdminModal>
  );
};

export default ChangePasswordModal;
