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
      const rawPhone = (subscriber.phoneNumber || '').replace(/\D/g, '').slice(-10);
      setFormData({
        name: subscriber.name || '',
        email: subscriber.email || '',
        username: subscriber.username || '',
        phoneNumber: rawPhone,
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

  const handlePhoneChange = (e) => {
    const onlyDigits = e.target.value.replace(/\D/g, '').slice(0, 10);
    setFormData((prev) => ({ ...prev, phoneNumber: onlyDigits }));
    if (errors.phoneNumber) setErrors((prev) => ({ ...prev, phoneNumber: '' }));
    if (apiError) setApiError('');
  };

  const handlePhoneKeyDown = (e) => {
    if (
      ['Backspace', 'Tab', 'Enter', 'Delete', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key) ||
      (e.ctrlKey || e.metaKey)
    ) {
      return;
    }
    if (!/^\d$/.test(e.key)) {
      e.preventDefault();
    }
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

    if (formData.phoneNumber && formData.phoneNumber.trim()) {
      const digits = formData.phoneNumber.replace(/\D/g, '');
      if (digits.length !== 10) {
        newErrors.phoneNumber = 'Phone number must be exactly 10 digits';
      } else if (!/^[6-9]\d{9}$/.test(digits)) {
        newErrors.phoneNumber = 'Enter a valid Indian mobile number (starting with 6, 7, 8, or 9)';
      }
    }

    // Validate dynamic fields based on type
    const uType = formData.userType.toUpperCase();
    const dFields = formData.dynamicFields || {};

    if (uType === 'STUDENT' && !dFields.apaarId?.trim()) {
      newErrors.apaarId = 'APAAR ID is required';
    }
    if ((uType === 'DOCTOR' || uType === 'PHARMACIST' || uType === 'NURSE')) {
      if (!dFields.registrationNo?.trim()) newErrors.registrationNo = 'Registration number is required';
      if (!dFields.stateCouncil?.trim()) newErrors.stateCouncil = 'State is required';
    }
    if (uType === 'INDUSTRY') {
      if (!dFields.companyName?.trim()) {
        newErrors.companyName = 'Company name is required';
      }

      const gstinVal = (dFields.gstin || '').trim().toUpperCase();
      const panVal = (dFields.pan || '').trim().toUpperCase();

      if (!gstinVal && !panVal) {
        newErrors.gstin = 'Either GSTIN or Corporate PAN is required';
        newErrors.pan = 'Either Corporate PAN or GSTIN is required';
      } else {
        if (gstinVal) {
          const gstinRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
          if (!gstinRegex.test(gstinVal)) {
            newErrors.gstin = 'Invalid GSTIN format. Must be 15 characters (e.g. 22AAAAA0000A1Z5)';
          }
        }
        if (panVal) {
          const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
          if (!panRegex.test(panVal)) {
            newErrors.pan = 'Invalid PAN format. Must be 10 characters (e.g. AAAAA9999A)';
          }
        }
      }
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
      const digits = formData.phoneNumber ? formData.phoneNumber.replace(/\D/g, '').slice(-10) : '';
      const payload = {
        ...formData,
        phoneNumber: digits ? `+91 ${digits}` : '',
        dynamicFields: {
          ...formData.dynamicFields,
          ...(formData.userType.toUpperCase() === 'INDUSTRY' && {
            gstin: (formData.dynamicFields?.gstin || '').trim().toUpperCase(),
            pan: (formData.dynamicFields?.pan || '').trim().toUpperCase(),
          }),
        },
      };

      if (onSuccess) {
        await onSuccess(payload, isEditMode ? subscriber._id : null);
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

          <div className="flex flex-col gap-1.5 w-full">
            <label className="text-sm font-medium text-slate-700 select-none text-left">
              Phone Number
            </label>
            <div
              className={`flex items-center w-full h-11 border ${
                errors.phoneNumber
                  ? 'border-red-500 ring-2 ring-red-200'
                  : 'border-slate-200 hover:border-slate-300 focus-within:border-[#E76120] focus-within:ring-2 focus-within:ring-[#E76120]/15'
              } rounded-lg bg-white overflow-hidden transition-all`}
            >
              <div className="flex items-center gap-1 px-3 bg-slate-50 border-r border-slate-200 text-slate-700 font-bold text-xs shrink-0 select-none h-full">
                <span className="text-sm">🇮🇳</span>
                <span>+91</span>
              </div>
              <input
                id="phoneNumber"
                type="text"
                name="phoneNumber"
                inputMode="numeric"
                maxLength={10}
                placeholder="98765 43210"
                value={formData.phoneNumber}
                onChange={handlePhoneChange}
                onKeyDown={handlePhoneKeyDown}
                className="w-full h-full px-3 text-xs font-semibold text-slate-800 placeholder:text-slate-400 outline-none bg-transparent"
              />
            </div>
            {errors.phoneNumber && (
              <span className="text-xs text-red-500 text-left mt-0.5">{errors.phoneNumber}</span>
            )}
          </div>

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
