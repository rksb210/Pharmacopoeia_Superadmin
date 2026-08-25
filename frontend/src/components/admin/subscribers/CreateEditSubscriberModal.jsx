import React, { useState, useEffect } from 'react';
import AdminModal from '../common/AdminModal';
import InputField from '../../common/InputField';
import DynamicUserTypeFields from './DynamicUserTypeFields';
import { AlertCircle } from 'lucide-react';

export const CreateEditSubscriberModal = ({
  isOpen,
  onClose,
  subscriber = null,
  userTypes = [],
  onSuccess,
}) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    username: '',
    phoneNumber: '',
    password: '',
    userType: 'STUDENT',
    dynamicFields: {},
    notes: '',
  });

  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isEditMode = !!subscriber;

  useEffect(() => {
    if (subscriber) {
      setFormData({
        name: subscriber.name || '',
        email: subscriber.email || '',
        username: subscriber.username || '',
        phoneNumber: subscriber.phoneNumber || '',
        password: '',
        userType: subscriber.userType || 'STUDENT',
        dynamicFields: subscriber.dynamicFields || {},
        notes: subscriber.notes || '',
      });
    } else {
      setFormData({
        name: '',
        email: '',
        username: '',
        phoneNumber: '',
        password: '',
        userType: 'STUDENT',
        dynamicFields: {},
        notes: '',
      });
    }
    setErrors({});
    setApiError('');
  }, [subscriber, isOpen]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
    if (apiError) setApiError('');
  };

  const handleDynamicChange = (newDynamicFields) => {
    setFormData((prev) => ({ ...prev, dynamicFields: newDynamicFields }));
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = 'Full name is required';
    if (!formData.email.trim()) {
      newErrors.email = 'Email address is required';
    } else if (!/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/.test(formData.email.trim())) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!formData.username.trim()) {
      newErrors.username = 'Username is required';
    } else if (formData.username.trim().length < 3) {
      newErrors.username = 'Username must be at least 3 characters';
    }

    if (!isEditMode && (!formData.password || formData.password.length < 6)) {
      newErrors.password = 'Password must be at least 6 characters long';
    }

    // Validate dynamic fields based on type
    const uType = formData.userType.toUpperCase();
    const dFields = formData.dynamicFields || {};

    if (uType === 'STUDENT' && !dFields.apaarId?.trim()) {
      newErrors.apaarId = 'APAAR ID is required';
    }
    if ((uType === 'DOCTOR' || uType === 'PHARMACIST' || uType === 'NURSE')) {
      if (!dFields.registrationNo?.trim()) newErrors.registrationNo = 'Registration number is required';
      if (!dFields.stateCouncil?.trim()) newErrors.stateCouncil = 'State council is required';
    }
    if (uType === 'INDUSTRY') {
      if (!dFields.companyName?.trim()) newErrors.companyName = 'Company name is required';
      if (!dFields.gstin?.trim()) newErrors.gstin = 'GSTIN is required';
      if (!dFields.pan?.trim()) newErrors.pan = 'PAN is required';
    }
    if (uType === 'OTHERS' && !dFields.designation?.trim()) {
      newErrors.designation = 'Designation is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e?.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    setApiError('');

    try {
      if (onSuccess) {
        await onSuccess(formData, isEditMode ? subscriber._id : null);
      }
      onClose();
    } catch (err) {
      setApiError(err.message || 'Failed to save subscriber record.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AdminModal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditMode ? `Edit Subscriber: ${subscriber?.name}` : 'Provision New Subscriber'}
      description={
        isEditMode
          ? 'Update public user credentials, verification attributes, and profile.'
          : 'Register a new public subscriber with dynamic credentials according to their User Type.'
      }
      confirmLabel={isEditMode ? 'Save Changes' : 'Register Subscriber'}
      isConfirming={isSubmitting}
      onConfirm={handleSubmit}
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {apiError && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
            <span>{apiError}</span>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <InputField
            id="name"
            name="name"
            label="Full Name"
            placeholder="e.g. Dr. Ananya Sen"
            value={formData.name}
            onChange={handleChange}
            error={errors.name}
            required
          />

          <InputField
            id="email"
            name="email"
            label="Email Address"
            type="email"
            placeholder="e.g. ananya.sen@hospital.org"
            value={formData.email}
            onChange={handleChange}
            error={errors.email}
            required
          />

          <InputField
            id="username"
            name="username"
            label="Portal Username"
            placeholder="e.g. ananya_sen"
            value={formData.username}
            onChange={handleChange}
            error={errors.username}
            required
          />

          <InputField
            id="phoneNumber"
            name="phoneNumber"
            label="Phone Number"
            placeholder="e.g. +91 98765 43210"
            value={formData.phoneNumber}
            onChange={handleChange}
          />

          {/* Configurable User Type Dropdown */}
          <div className="flex flex-col gap-1.5 w-full">
            <label className="text-sm font-medium text-slate-700 select-none text-left">
              Configurable User Type
            </label>
            <select
              name="userType"
              value={formData.userType}
              onChange={handleChange}
              disabled={isEditMode}
              className="w-full h-11 px-3 border border-slate-200 rounded-lg text-xs font-bold text-slate-800 bg-white outline-none focus:border-[#E76120] focus:ring-2 focus:ring-[#E76120]/15 cursor-pointer"
            >
              {userTypes.map((t) => (
                <option key={t.code} value={t.code}>
                  {t.name} ({t.code})
                </option>
              ))}
            </select>
          </div>

          {!isEditMode && (
            <InputField
              id="password"
              name="password"
              label="Temporary Password"
              type="password"
              placeholder="Min. 6 characters"
              value={formData.password}
              onChange={handleChange}
              error={errors.password}
              required
            />
          )}
        </div>

        {/* Dynamic Fields Section */}
        <DynamicUserTypeFields
          userType={formData.userType}
          dynamicFields={formData.dynamicFields}
          onChange={handleDynamicChange}
          errors={errors}
        />

        <div className="flex flex-col gap-1.5 w-full">
          <label className="text-sm font-medium text-slate-700 select-none text-left">
            Administrative Notes (Optional)
          </label>
          <textarea
            name="notes"
            rows={2}
            value={formData.notes}
            onChange={handleChange}
            placeholder="Institutional background, verification notes..."
            className="w-full p-3 border border-slate-200 rounded-lg text-xs text-slate-800 outline-none focus:border-[#E76120] focus:ring-2 focus:ring-[#E76120]/15"
          />
        </div>
      </form>
    </AdminModal>
  );
};

export default CreateEditSubscriberModal;
