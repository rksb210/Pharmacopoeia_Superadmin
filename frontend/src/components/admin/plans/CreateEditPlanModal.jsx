import React, { useState, useEffect } from 'react';
import AdminModal from '../common/AdminModal';
import InputField from '../../common/InputField';
import { Badge } from '../../ui/badge';
import { Button } from '../../ui/button';
import { tokens } from '../../../theme/tokens';
import {
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  CreditCard,
  Calendar,
  Users,
  Percent,
} from 'lucide-react';

const TIERS = ['Individual', 'Institutional', 'Student', 'Doctor Professional', 'Corporate', 'General'];
const USER_TYPES = ['STUDENT', 'DOCTOR', 'PHARMACIST', 'NURSE', 'INDUSTRY', 'OTHERS'];

export const CreateEditPlanModal = ({
  isOpen,
  onClose,
  plan = null,
  onSuccess,
}) => {
  const [activeTab, setActiveTab] = useState('general'); // 'general' | 'validity' | 'users' | 'rules' | 'features'

  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: '',
    tier: 'Individual',
    priceINR: 3500,
    validityType: 'fixed_date',
    fixedDate: '2031-12-31T23:59:59.999Z',
    durationValue: 365,
    applicableUserTypes: ['ALL'],
    features: ['Full Digital Monograph Formulary Database (9th Edition)'],
    trialEligibility: { isAllowed: true, trialDays: 14 },
    complimentaryEligibility: { isAllowed: true, defaultMonths: 12 },
    discountRules: { isDiscountAllowed: true, maxDiscountPercent: 50, defaultDiscountPercent: 0 },
    seatQuota: 1,
    isPopular: false,
    sortOrder: 1,
    reason: '',
  });

  const [newFeatureText, setNewFeatureText] = useState('');
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isEditMode = !!plan;

  useEffect(() => {
    if (plan) {
      setFormData({
        name: plan.name || '',
        code: plan.code || '',
        description: plan.description || '',
        tier: plan.tier || 'Individual',
        priceINR: plan.priceINR ?? 0,
        validityType: plan.validityType || 'fixed_date',
        fixedDate: plan.fixedDate
          ? new Date(plan.fixedDate).toISOString().split('T')[0]
          : '2031-12-31',
        durationValue: plan.durationValue ?? 365,
        applicableUserTypes: plan.applicableUserTypes || ['ALL'],
        features: plan.features?.length > 0 ? plan.features : ['Full Digital Monograph Database'],
        trialEligibility: plan.trialEligibility || { isAllowed: true, trialDays: 14 },
        complimentaryEligibility: plan.complimentaryEligibility || { isAllowed: true, defaultMonths: 12 },
        discountRules: plan.discountRules || { isDiscountAllowed: true, maxDiscountPercent: 50, defaultDiscountPercent: 0 },
        seatQuota: plan.seatQuota ?? 1,
        isPopular: !!plan.isPopular,
        sortOrder: plan.sortOrder || 1,
        reason: '',
      });
    } else {
      setFormData({
        name: '',
        code: '',
        description: '',
        tier: 'Individual',
        priceINR: 3500,
        validityType: 'fixed_date',
        fixedDate: '2031-12-31',
        durationValue: 365,
        applicableUserTypes: ['ALL'],
        features: [
          'Full Digital Monograph Formulary Database (9th Edition)',
          'Drug Interaction Checker & Clinical Alerts',
          'Pediatric & Geriatric Dosage Calculator',
        ],
        trialEligibility: { isAllowed: true, trialDays: 14 },
        complimentaryEligibility: { isAllowed: true, defaultMonths: 12 },
        discountRules: { isDiscountAllowed: true, maxDiscountPercent: 50, defaultDiscountPercent: 0 },
        seatQuota: 1,
        isPopular: false,
        sortOrder: 1,
        reason: '',
      });
    }
    setActiveTab('general');
    setErrors({});
    setApiError('');
  }, [plan, isOpen]);

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: '' }));
    if (apiError) setApiError('');
  };

  const handleNestedChange = (parent, field, value) => {
    setFormData((prev) => ({
      ...prev,
      [parent]: {
        ...prev[parent],
        [field]: value,
      },
    }));
  };

  const handleNumberKeyDown = (e) => {
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

  const handleNestedNumberChange = (parent, field, rawValue, options = {}) => {
    const { min = 0, max = null } = options;
    if (rawValue === '' || rawValue === undefined || rawValue === null) {
      handleNestedChange(parent, field, '');
      return;
    }

    let cleanStr = String(rawValue);
    if (/^0\d+/.test(cleanStr)) {
      cleanStr = cleanStr.replace(/^0+/, '');
      if (cleanStr === '') cleanStr = '0';
    }

    let num = Number(cleanStr);
    if (isNaN(num)) return;
    if (min !== null && num < min) num = min;
    if (max !== null && num > max) num = max;

    handleNestedChange(parent, field, num);
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

  const addFeature = () => {
    if (!newFeatureText.trim()) return;
    handleChange('features', [...formData.features, newFeatureText.trim()]);
    setNewFeatureText('');
  };

  const removeFeature = (index) => {
    const updated = formData.features.filter((_, i) => i !== index);
    handleChange('features', updated);
  };

  const validate = () => {
    const errs = {};
    if (!formData.name.trim()) errs.name = 'Plan name is required';
    if (!formData.code.trim()) errs.code = 'Plan code slug is required';
    const numPrice = formData.priceINR === '' ? -1 : Number(formData.priceINR);
    if (formData.priceINR === '' || isNaN(numPrice) || numPrice < 0) {
      errs.priceINR = 'Valid price is required';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e?.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    setApiError('');

    try {
      const numPrice = formData.priceINR === '' ? 0 : Number(formData.priceINR);
      const numSeats = formData.seatQuota === '' ? 1 : Number(formData.seatQuota);
      const numDuration = formData.durationValue === '' ? 365 : Number(formData.durationValue);
      const numTrialDays = formData.trialEligibility?.trialDays === '' ? 0 : Number(formData.trialEligibility?.trialDays || 0);
      const numMaxDiscount = formData.discountRules?.maxDiscountPercent === '' ? 0 : Number(formData.discountRules?.maxDiscountPercent || 0);
      const numDefaultDiscount = formData.discountRules?.defaultDiscountPercent === '' ? 0 : Number(formData.discountRules?.defaultDiscountPercent || 0);

      const payload = {
        ...formData,
        priceINR: numPrice,
        seatQuota: numSeats,
        durationValue: numDuration,
        trialEligibility: {
          ...formData.trialEligibility,
          trialDays: numTrialDays,
        },
        discountRules: {
          ...formData.discountRules,
          maxDiscountPercent: numMaxDiscount,
          defaultDiscountPercent: numDefaultDiscount,
        },
      };

      await onSuccess(payload, isEditMode ? plan._id : null);
      onClose();
    } catch (err) {
      setApiError(err.message || 'Failed to save plan.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AdminModal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditMode ? `Configure Plan: ${plan?.name}` : 'Provision New Subscription Tier'}
      description="Configure pricing, validity policies, applicable user categories, and concession rules."
      confirmLabel={isEditMode ? 'Save Plan Configurations' : 'Create Subscription Plan'}
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
        <div className="flex items-center gap-1.5 border-b border-slate-100 pb-2 overflow-x-auto">
          {[
            { id: 'general', label: '1. General & Price' },
            { id: 'validity', label: '2. Validity Policy' },
            { id: 'users', label: '3. User Eligibility' },
            { id: 'rules', label: '4. Trial & Concessions' },
            { id: 'features', label: '5. Inclusions Checklist' },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all whitespace-nowrap cursor-pointer ${
                activeTab === tab.id
                  ? 'bg-[#284661] text-white shadow-2xs'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab 1: General & Pricing */}
        {activeTab === 'general' && (
          <div className="space-y-3.5 animate-in fade-in-0 duration-150">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <InputField
                id="name"
                label="Plan Name"
                placeholder="e.g. NFI 9th Edition Formulary - Individual Pass"
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                error={errors.name}
                required
              />

              <InputField
                id="code"
                label="Code Slug (Unique ID)"
                placeholder="e.g. NFI-INDIVIDUAL-PASS"
                value={formData.code}
                onChange={(e) => handleChange('code', e.target.value.toUpperCase())}
                disabled={isEditMode}
                error={errors.code}
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 items-start">
              <div className="flex flex-col gap-1.5 w-full">
                <label className="text-sm font-medium text-slate-700 select-none text-left">Tier Category</label>
                <select
                  value={formData.tier}
                  onChange={(e) => handleChange('tier', e.target.value)}
                  style={{
                    height: tokens.dimensions.inputHeight,
                    borderRadius: tokens.borderRadius.input,
                    paddingLeft: tokens.dimensions.inputPaddingX,
                    paddingRight: tokens.dimensions.inputPaddingX,
                  }}
                  className="w-full border border-slate-200 bg-white text-slate-800 text-sm font-medium transition-all duration-150 outline-none hover:border-slate-300 focus:border-[#E76120] focus:ring-2 focus:ring-[#E76120]/15 cursor-pointer"
                >
                  {TIERS.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>

              <InputField
                id="priceINR"
                label="Base Price in INR (₹)"
                type="number"
                min={0}
                onKeyDown={handleNumberKeyDown}
                placeholder="3500"
                value={formData.priceINR}
                onChange={(e) => handleNumberChange('priceINR', e.target.value, { min: 0 })}
                error={errors.priceINR}
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 items-start">
              <InputField
                id="fixedDate"
                label="Valid Thru (Expiry Date)"
                type="date"
                value={formData.fixedDate}
                onChange={(e) => handleChange('fixedDate', e.target.value)}
              />

              <InputField
                id="seatQuota"
                label="Seats Per Subscription"
                helperText="[0 = Unlimited]"
                type="number"
                min={0}
                onKeyDown={handleNumberKeyDown}
                placeholder="1"
                value={formData.seatQuota}
                onChange={(e) => handleNumberChange('seatQuota', e.target.value, { min: 0 })}
              />
            </div>

            <InputField
              id="description"
              label="Plan Description"
              placeholder="Detailed description of audience, benefits, and coverage..."
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
            />

            <div className="flex items-center gap-4 pt-1">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.isPopular}
                  onChange={(e) => handleChange('isPopular', e.target.checked)}
                  className="w-4 h-4 rounded text-[#E76120] focus:ring-[#E76120]"
                />
                <span className="font-semibold text-slate-800">Highlight as Recommended Tier</span>
              </label>
            </div>
          </div>
        )}

        {/* Tab 2: Validity Policy */}
        {activeTab === 'validity' && (
          <div className="space-y-3.5 animate-in fade-in-0 duration-150">
            <div className="p-3.5 bg-blue-50/70 border border-blue-100 rounded-2xl flex items-center gap-2 text-blue-900">
              <ShieldCheck className="w-4 h-4 text-[#284661] shrink-0" />
              <span>
                <strong>BRD Business Policy:</strong> Purchased commercial passes default to fixed validity through 31 December 2031.
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 items-start">
              <div className="flex flex-col gap-1.5 w-full">
                <label className="text-sm font-medium text-slate-700 select-none text-left">Validity Calculation Mode</label>
                <select
                  value={formData.validityType}
                  onChange={(e) => handleChange('validityType', e.target.value)}
                  style={{
                    height: tokens.dimensions.inputHeight,
                    borderRadius: tokens.borderRadius.input,
                    paddingLeft: tokens.dimensions.inputPaddingX,
                    paddingRight: tokens.dimensions.inputPaddingX,
                  }}
                  className="w-full border border-slate-200 bg-white text-slate-800 text-sm font-medium transition-all duration-150 outline-none hover:border-slate-300 focus:border-[#E76120] focus:ring-2 focus:ring-[#E76120]/15 cursor-pointer"
                >
                  <option value="fixed_date">Fixed Date (BRD 31-12-2031 Rule)</option>
                  <option value="duration_years">Duration in Years (e.g. 1 Year License)</option>
                  <option value="duration_months">Duration in Months</option>
                  <option value="duration_days">Duration in Days</option>
                </select>
              </div>

              {formData.validityType === 'fixed_date' ? (
                <InputField
                  id="fixedDate"
                  label="Fixed Expiry Date"
                  type="date"
                  value={formData.fixedDate}
                  onChange={(e) => handleChange('fixedDate', e.target.value)}
                />
              ) : (
                <InputField
                  id="durationValue"
                  label="Duration Length"
                  helperText={
                    formData.validityType === 'duration_years'
                      ? '[In Years]'
                      : formData.validityType === 'duration_months'
                      ? '[In Months]'
                      : '[In Days]'
                  }
                  type="number"
                  min={1}
                  onKeyDown={handleNumberKeyDown}
                  placeholder="365"
                  value={formData.durationValue}
                  onChange={(e) => handleNumberChange('durationValue', e.target.value, { min: 1 })}
                />
              )}
            </div>
          </div>
        )}

        {/* Tab 3: User Eligibility */}
        {activeTab === 'users' && (
          <div className="space-y-3 animate-in fade-in-0 duration-150">
            <p className="text-slate-500 text-xs">
              Select which public user categories are allowed to purchase or register under this plan.
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-1">
              <button
                type="button"
                onClick={() => toggleUserType('ALL')}
                className={`p-3 rounded-xl border flex items-center justify-between font-bold cursor-pointer transition-all ${
                  formData.applicableUserTypes.includes('ALL')
                    ? 'bg-blue-50 border-[#284661] text-[#284661]'
                    : 'bg-white border-slate-200 text-slate-600'
                }`}
              >
                <span>Universal (All Users)</span>
                {formData.applicableUserTypes.includes('ALL') && <CheckCircle2 className="w-4 h-4" />}
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
                    className={`p-3 rounded-xl border flex items-center justify-between font-bold cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-emerald-50 border-emerald-600 text-emerald-800'
                        : 'bg-white border-slate-200 text-slate-600'
                    }`}
                  >
                    <span>{ut}</span>
                    {isSelected && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Tab 4: Trial & Concessions */}
        {activeTab === 'rules' && (
          <div className="space-y-4 animate-in fade-in-0 duration-150">
            {/* Trial Rules */}
            <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-2xl space-y-2.5">
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-900">
                  <input
                    type="checkbox"
                    checked={formData.trialEligibility?.isAllowed}
                    onChange={(e) =>
                      handleNestedChange('trialEligibility', 'isAllowed', e.target.checked)
                    }
                    className="w-4 h-4 rounded text-[#E76120]"
                  />
                  <span>Allow Free Promotional Trial Evaluation</span>
                </label>
              </div>

              {formData.trialEligibility?.isAllowed && (
                <div className="w-full sm:w-1/2">
                  <InputField
                    id="trialDays"
                    label="Evaluation Duration (Days)"
                    type="number"
                    min={0}
                    onKeyDown={handleNumberKeyDown}
                    placeholder="14"
                    value={formData.trialEligibility?.trialDays ?? ''}
                    onChange={(e) =>
                      handleNestedNumberChange('trialEligibility', 'trialDays', e.target.value, { min: 0 })
                    }
                  />
                </div>
              )}
            </div>

            {/* Concession / Discount Rules */}
            <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-2xl space-y-2.5">
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-900">
                  <input
                    type="checkbox"
                    checked={formData.discountRules?.isDiscountAllowed}
                    onChange={(e) =>
                      handleNestedChange('discountRules', 'isDiscountAllowed', e.target.checked)
                    }
                    className="w-4 h-4 rounded text-[#E76120]"
                  />
                  <span>Allow Discount Vouchers &amp; Academic Concessions</span>
                </label>
              </div>

              {formData.discountRules?.isDiscountAllowed && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-start">
                  <InputField
                    id="maxDiscount"
                    label="Maximum Permitted Discount (%)"
                    type="number"
                    min={0}
                    max={100}
                    onKeyDown={handleNumberKeyDown}
                    placeholder="50"
                    value={formData.discountRules?.maxDiscountPercent ?? ''}
                    onChange={(e) =>
                      handleNestedNumberChange(
                        'discountRules',
                        'maxDiscountPercent',
                        e.target.value,
                        { min: 0, max: 100 }
                      )
                    }
                  />

                  <InputField
                    id="defaultDiscount"
                    label="Default Concession Rate (%)"
                    type="number"
                    min={0}
                    max={100}
                    onKeyDown={handleNumberKeyDown}
                    placeholder="0"
                    value={formData.discountRules?.defaultDiscountPercent ?? ''}
                    onChange={(e) =>
                      handleNestedNumberChange(
                        'discountRules',
                        'defaultDiscountPercent',
                        e.target.value,
                        { min: 0, max: 100 }
                      )
                    }
                  />
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 5: Feature Checklist */}
        {activeTab === 'features' && (
          <div className="space-y-3 animate-in fade-in-0 duration-150">
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Add a new feature benefit inclusion..."
                value={newFeatureText}
                onChange={(e) => setNewFeatureText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addFeature();
                  }
                }}
                className="flex-1 h-9 px-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-[#E76120]"
              />
              <Button
                type="button"
                variant="nfiYellow"
                size="sm"
                onClick={addFeature}
                className="rounded-xl font-bold h-9"
              >
                <Plus className="w-4 h-4 mr-1" />
                <span>Add</span>
              </Button>
            </div>

            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {formData.features?.map((feat, idx) => (
                <div
                  key={idx}
                  className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between gap-2"
                >
                  <span className="font-semibold text-slate-800 flex-1">{feat}</span>
                  <button
                    type="button"
                    onClick={() => removeFeature(idx)}
                    className="text-slate-400 hover:text-red-600 transition-colors p-1 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Audit Justification for Edit Mode */}
        {isEditMode && (
          <InputField
            id="reason"
            label="Pricing Change Justification (Audit Trail)"
            placeholder="e.g. Approved price revision via IPC Council Order 2026/04..."
            value={formData.reason}
            onChange={(e) => handleChange('reason', e.target.value)}
          />
        )}
      </form>
    </AdminModal>
  );
};

export default CreateEditPlanModal;
