import React, { useState, useEffect } from 'react';
import AdminModal from '../common/AdminModal';
import InputField from '../../common/InputField';
import { Badge } from '../../ui/badge';
import { tokens } from '../../../theme/tokens';
import {
  Ticket,
  Percent,
  Calendar,
  Users,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';

const USER_TYPES = ['STUDENT', 'DOCTOR', 'PHARMACIST', 'NURSE', 'INDUSTRY', 'OTHERS'];

export const CreateEditCouponModal = ({
  isOpen,
  onClose,
  coupon = null,
  onSuccess,
}) => {
  const [activeTab, setActiveTab] = useState('basics'); // 'basics' | 'limits' | 'targeting'

  const [formData, setFormData] = useState({
    code: '',
    title: '',
    description: '',
    discountType: 'percentage',
    discountValue: 20,
    maxDiscountINR: 1500,
    minOrderAmountINR: 0,
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    usageLimit: 500,
    perUserLimit: 1,
    applicablePlans: ['ALL'],
    applicableUserTypes: ['ALL'],
    specificEmails: '',
  });

  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isEditMode = !!coupon;

  useEffect(() => {
    if (coupon) {
      setFormData({
        code: coupon.code || '',
        title: coupon.title || '',
        description: coupon.description || '',
        discountType: coupon.discountType || 'percentage',
        discountValue: coupon.discountValue ?? 0,
        maxDiscountINR: coupon.maxDiscountINR ?? 0,
        minOrderAmountINR: coupon.minOrderAmountINR ?? 0,
        startDate: coupon.startDate
          ? new Date(coupon.startDate).toISOString().split('T')[0]
          : new Date().toISOString().split('T')[0],
        endDate: coupon.endDate
          ? new Date(coupon.endDate).toISOString().split('T')[0]
          : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        usageLimit: coupon.usageLimit ?? 0,
        perUserLimit: coupon.perUserLimit ?? 1,
        applicablePlans: coupon.applicablePlans || ['ALL'],
        applicableUserTypes: coupon.applicableUserTypes || ['ALL'],
        specificEmails: coupon.specificEmails?.join(', ') || '',
      });
    } else {
      setFormData({
        code: '',
        title: '',
        description: '',
        discountType: 'percentage',
        discountValue: 20,
        maxDiscountINR: 1500,
        minOrderAmountINR: 0,
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        usageLimit: 500,
        perUserLimit: 1,
        applicablePlans: ['ALL'],
        applicableUserTypes: ['ALL'],
        specificEmails: '',
      });
    }
    setActiveTab('basics');
    setErrors({});
    setApiError('');
  }, [coupon, isOpen]);

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: '' }));
    if (apiError) setApiError('');
  };

  const handleNumberKeyDown = (e) => {
    // Prevent typing negative sign '-', '+', and exponent 'e'/'E'
    if (['-', '+', 'e', 'E'].includes(e.key)) {
      e.preventDefault();
    }
  };

  const handleNumberChange = (field, rawValue, options = {}) => {
    const { min = 0, max = null } = options;
    if (rawValue === '' || rawValue === undefined || rawValue === null) {
      handleChange(field, '');
      return;
    }

    // Clean leading zeros if multiple characters (e.g. "022" -> "22", but retain "0")
    let cleanStr = String(rawValue);
    if (/^0\d+/.test(cleanStr)) {
      cleanStr = cleanStr.replace(/^0+/, '');
      if (cleanStr === '') cleanStr = '0';
    }

    let num = Number(cleanStr);
    if (isNaN(num)) return;
    if (min !== null && num < min) num = min;
    if (max !== null && num > max) num = max;

    handleChange(field, num);
  };

  const toggleUserType = (ut) => {
    let current = [...formData.applicableUserTypes];
    if (ut === 'ALL') {
      current = ['ALL'];
    } else {
      current = current.filter((t) => t !== 'ALL');
      if (current.includes(ut)) {
        current = current.filter((t) => t !== ut);
      } else {
        current.push(ut);
      }
      if (current.length === 0) current = ['ALL'];
    }
    handleChange('applicableUserTypes', current);
  };

  const validate = () => {
    const errs = {};
    if (!formData.code.trim()) errs.code = 'Coupon code is required';
    if (!formData.title.trim()) errs.title = 'Coupon title is required';

    const numDiscount = formData.discountValue === '' ? 0 : Number(formData.discountValue);
    if (formData.discountValue === '' || isNaN(numDiscount) || numDiscount <= 0) {
      errs.discountValue = 'Valid discount value is required';
    } else if (formData.discountType === 'percentage' && numDiscount > 100) {
      errs.discountValue = 'Percentage cannot exceed 100%';
    }
    if (!formData.endDate) errs.endDate = 'End date is required';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e?.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    setApiError('');

    try {
      const emailList = formData.specificEmails
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);

      const numDiscountValue = formData.discountValue === '' ? 0 : Number(formData.discountValue);
      const numMaxDiscount = formData.maxDiscountINR === '' ? 0 : Number(formData.maxDiscountINR);
      const numMinOrder = formData.minOrderAmountINR === '' ? 0 : Number(formData.minOrderAmountINR);
      const numUsageLimit = formData.usageLimit === '' ? 0 : Number(formData.usageLimit);
      const numPerUserLimit = formData.perUserLimit === '' ? 1 : Number(formData.perUserLimit);

      await onSuccess(
        {
          ...formData,
          discountValue: numDiscountValue,
          maxDiscountINR: numMaxDiscount,
          minOrderAmountINR: numMinOrder,
          usageLimit: numUsageLimit,
          perUserLimit: numPerUserLimit,
          specificEmails: emailList,
        },
        isEditMode ? coupon._id : null
      );
      onClose();
    } catch (err) {
      setApiError(err.message || 'Failed to save coupon.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AdminModal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditMode ? `Edit Voucher: ${coupon?.code}` : 'Create Promotional Coupon Voucher'}
      description="Configure promotional concession codes, percentage/fixed discounts, usage limits, and user type targeting."
      confirmLabel={isEditMode ? 'Save Coupon' : 'Create Voucher'}
      isConfirming={isSubmitting}
      onConfirm={handleSubmit}
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-xs select-none font-sans">
        {apiError && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
            <span>{apiError}</span>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="flex items-center gap-1.5 border-b border-slate-100 pb-2">
          {[
            { id: 'basics', label: '1. Voucher Basics' },
            { id: 'limits', label: '2. Validity & Limits' },
            { id: 'targeting', label: '3. Targeting & Eligibility' },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
                activeTab === tab.id
                  ? 'bg-[#284661] text-white shadow-2xs'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab 1: Basics */}
        {activeTab === 'basics' && (
          <div className="space-y-3.5 animate-in fade-in-0 duration-150">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <InputField
                id="code"
                label="Coupon Promo Code (Uppercase Slug)"
                placeholder="e.g. NFI-DOC2026"
                value={formData.code}
                onChange={(e) => handleChange('code', e.target.value.toUpperCase())}
                disabled={isEditMode}
                error={errors.code}
                required
              />

              <InputField
                id="title"
                label="Voucher Title / Campaign Name"
                placeholder="e.g. IMA National Doctors Day Concession"
                value={formData.title}
                onChange={(e) => handleChange('title', e.target.value)}
                error={errors.title}
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 items-start">
              <div className="flex flex-col gap-1.5 w-full">
                <label className="text-sm font-medium text-slate-700 select-none text-left">
                  Discount Calculation Mode
                </label>
                <select
                  value={formData.discountType}
                  onChange={(e) => {
                    const newType = e.target.value;
                    let newDiscountVal = formData.discountValue;
                    if (newType === 'percentage' && typeof newDiscountVal === 'number' && newDiscountVal > 100) {
                      newDiscountVal = 100;
                    }
                    setFormData((prev) => ({
                      ...prev,
                      discountType: newType,
                      discountValue: newDiscountVal,
                    }));
                    if (errors.discountValue) setErrors((prev) => ({ ...prev, discountValue: '' }));
                  }}
                  style={{
                    height: tokens.dimensions.inputHeight,
                    borderRadius: tokens.borderRadius.input,
                    paddingLeft: tokens.dimensions.inputPaddingX,
                    paddingRight: tokens.dimensions.inputPaddingX,
                  }}
                  className="w-full border border-slate-200 bg-white text-slate-800 text-sm font-medium transition-all duration-150 outline-none hover:border-slate-300 focus:border-[#E76120] focus:ring-2 focus:ring-[#E76120]/15"
                >
                  <option value="percentage">Percentage (%) Concession</option>
                  <option value="fixed_amount">Fixed Amount (₹) Off</option>
                </select>
              </div>

              <InputField
                id="discountValue"
                label={
                  formData.discountType === 'percentage'
                    ? 'Discount Percentage (%)'
                    : 'Discount Amount (₹)'
                }
                type="number"
                min={0}
                max={formData.discountType === 'percentage' ? 100 : undefined}
                onKeyDown={handleNumberKeyDown}
                placeholder={formData.discountType === 'percentage' ? '20' : '1000'}
                value={formData.discountValue}
                onChange={(e) =>
                  handleNumberChange('discountValue', e.target.value, {
                    min: 0,
                    max: formData.discountType === 'percentage' ? 100 : null,
                  })
                }
                error={errors.discountValue}
                required
              />

              {formData.discountType === 'percentage' ? (
                <InputField
                  id="maxDiscount"
                  label="Maximum Discount Cap (₹)"
                  helperText="[0 = No Cap]"
                  type="number"
                  min={0}
                  onKeyDown={handleNumberKeyDown}
                  placeholder="1500"
                  value={formData.maxDiscountINR}
                  onChange={(e) =>
                    handleNumberChange('maxDiscountINR', e.target.value, { min: 0 })
                  }
                />
              ) : (
                <InputField
                  id="minSpend"
                  label="Minimum Order Spend (₹)"
                  helperText="[0 = None]"
                  type="number"
                  min={0}
                  onKeyDown={handleNumberKeyDown}
                  placeholder="3000"
                  value={formData.minOrderAmountINR}
                  onChange={(e) =>
                    handleNumberChange('minOrderAmountINR', e.target.value, { min: 0 })
                  }
                />
              )}
            </div>

            <InputField
              id="description"
              label="Campaign Description & Terms"
              placeholder="Terms of redemption, target beneficiaries, campaign summary..."
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
            />
          </div>
        )}

        {/* Tab 2: Validity & Limits */}
        {activeTab === 'limits' && (
          <div className="space-y-3.5 animate-in fade-in-0 duration-150">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <InputField
                id="startDate"
                label="Activation Start Date"
                type="date"
                value={formData.startDate}
                onChange={(e) => handleChange('startDate', e.target.value)}
              />

              <InputField
                id="endDate"
                label="Expiration Date"
                type="date"
                value={formData.endDate}
                onChange={(e) => handleChange('endDate', e.target.value)}
                error={errors.endDate}
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 items-start">
              <InputField
                id="usageLimit"
                label="Global Total Redemption Limit"
                helperText="[0 = Unlimited]"
                type="number"
                min={0}
                onKeyDown={handleNumberKeyDown}
                placeholder="500"
                value={formData.usageLimit}
                onChange={(e) =>
                  handleNumberChange('usageLimit', e.target.value, { min: 0 })
                }
              />

              <InputField
                id="perUserLimit"
                label="Redemptions Permitted Per User"
                helperText="[Default: 1]"
                type="number"
                min={0}
                onKeyDown={handleNumberKeyDown}
                placeholder="1"
                value={formData.perUserLimit}
                onChange={(e) =>
                  handleNumberChange('perUserLimit', e.target.value, { min: 0 })
                }
              />
            </div>
          </div>
        )}

        {/* Tab 3: Targeting & Eligibility */}
        {activeTab === 'targeting' && (
          <div className="space-y-3.5 animate-in fade-in-0 duration-150">
            <div className="space-y-1.5">
              <label className="font-semibold text-slate-700 block">
                Eligible User Categories
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => toggleUserType('ALL')}
                  className={`p-2.5 rounded-xl border flex items-center justify-between font-bold cursor-pointer transition-all ${
                    formData.applicableUserTypes.includes('ALL')
                      ? 'bg-blue-50 border-[#284661] text-[#284661]'
                      : 'bg-white border-slate-200 text-slate-600'
                  }`}
                >
                  <span>Universal (All Users)</span>
                  {formData.applicableUserTypes.includes('ALL') && <CheckCircle2 className="w-3.5 h-3.5" />}
                </button>

                {USER_TYPES.map((ut) => {
                  const isSelected =
                    formData.applicableUserTypes.includes(ut) &&
                    !formData.applicableUserTypes.includes('ALL');

                  return (
                    <button
                      key={ut}
                      type="button"
                      onClick={() => toggleUserType(ut)}
                      className={`p-2.5 rounded-xl border flex items-center justify-between font-bold cursor-pointer transition-all ${
                        isSelected
                          ? 'bg-emerald-50 border-emerald-600 text-emerald-800'
                          : 'bg-white border-slate-200 text-slate-600'
                      }`}
                    >
                      <span>{ut}</span>
                      {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />}
                    </button>
                  );
                })}
              </div>
            </div>

            <InputField
              id="specificEmails"
              label="Restricted Email Addresses / Domains (Comma separated)"
              placeholder="e.g. aiims.edu, dr.sen@hospital.org, @pgimer.edu.in"
              value={formData.specificEmails}
              onChange={(e) => handleChange('specificEmails', e.target.value)}
            />
          </div>
        )}
      </form>
    </AdminModal>
  );
};

export default CreateEditCouponModal;
