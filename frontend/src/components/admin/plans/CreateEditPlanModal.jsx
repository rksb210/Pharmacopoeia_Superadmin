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
  Layers,
  Sparkles,
  Calculator,
  Receipt,
  Globe,
  Truck,
  BookOpen,
} from 'lucide-react';

const TIERS = ['Individual', 'Institutional', 'Student', 'Doctor Professional', 'Corporate', 'General'];
const DELIVERY_TYPES = [
  { id: 'ONLINE', label: 'Online (Digital Only)', icon: Globe },
  { id: 'ONLINE_PHYSICAL', label: 'Hybrid (Online + Physical Book)', icon: Truck },
  { id: 'PHYSICAL', label: 'Physical Only ', icon: BookOpen },
];

const DEFAULT_SLABS = [
  { minQty: 1, maxQty: 5, discountPercent: 0, label: 'Starter (1 - 5 Users)' },
  { minQty: 6, maxQty: 10, discountPercent: 5, label: 'Team Tier (6 - 10 Users)' },
  { minQty: 11, maxQty: null, discountPercent: 10, label: 'Institutional (11+ Users)' },
];

const USER_TYPES = [
  'DOCTOR',
  'STUDENT',
  'NURSE',
  'PHARMACIST',
  'OTHERS',
  'INDUSTRY',
  'HOSPITALS',
  'UNIVERSITIES_COLLEGES',
  'RETAIL_PHARMACIST',
];

export const CreateEditPlanModal = ({
  isOpen,
  onClose,
  plan = null,
  onSuccess,
}) => {
  const [activeTab, setActiveTab] = useState('general'); // 'general' | 'validity' | 'users' | 'bulk' | 'rules' | 'features'

  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: '',
    tier: 'Individual',
    deliveryType: 'ONLINE',
    priceINR: 660,
    isGstApplicable: true,
    gstRatePercent: 18,
    bulkDiscountEnabled: false,
    bulkSlabs: DEFAULT_SLABS,
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

  const [testSlabQty, setTestSlabQty] = useState(8);
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
        deliveryType: plan.deliveryType || 'ONLINE',
        priceINR: plan.priceINR ?? 0,
        isGstApplicable: plan.isGstApplicable !== false,
        gstRatePercent: plan.gstRatePercent ?? 18,
        bulkDiscountEnabled: !!plan.bulkDiscountEnabled,
        bulkSlabs: plan.bulkSlabs?.length > 0 ? plan.bulkSlabs : DEFAULT_SLABS,
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
        deliveryType: 'ONLINE',
        priceINR: 660,
        isGstApplicable: true,
        gstRatePercent: 18,
        bulkDiscountEnabled: false,
        bulkSlabs: DEFAULT_SLABS,
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

  const generateSlug = (text) => {
    return (
      (text || '')
        .trim()
        .toUpperCase()
        .replace(/[^A-Z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '') || `NFI-PLAN-${Date.now().toString().slice(-4)}`
    );
  };

  const handleNameChange = (val) => {
    setFormData((prev) => ({
      ...prev,
      name: val,
      code: isEditMode && prev.code ? prev.code : generateSlug(val),
    }));
    if (errors.name) setErrors((prev) => ({ ...prev, name: '' }));
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

  const handleAddSlab = () => {
    const current = formData.bulkSlabs || [];
    const last = current[current.length - 1];
    const nextMin = last && Number(last.maxQty) ? Number(last.maxQty) + 1 : (last ? Number(last.minQty) + 5 : 1);
    const newSlab = {
      minQty: nextMin,
      maxQty: nextMin + 4,
      discountPercent: 10,
      label: `Volume Tier ${current.length + 1}`,
    };
    handleChange('bulkSlabs', [...current, newSlab]);
  };

  const handleUpdateSlab = (index, field, value) => {
    const current = [...(formData.bulkSlabs || [])];
    current[index] = { ...current[index], [field]: value };
    handleChange('bulkSlabs', current);
  };

  const handleRemoveSlab = (index) => {
    const current = (formData.bulkSlabs || []).filter((_, i) => i !== index);
    handleChange('bulkSlabs', current);
  };

  const validate = () => {
    const errs = {};
    if (!formData.name.trim()) errs.name = 'Plan name is required';
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
      const numSeats = formData.seatQuota === '' ? 1 : Number(formData.seatQuota || 1);
      const numDuration = formData.durationValue === '' ? 365 : Number(formData.durationValue);
      const numTrialDays = formData.trialEligibility?.trialDays === '' ? 0 : Number(formData.trialEligibility?.trialDays || 0);
      const numMaxDiscount = formData.discountRules?.maxDiscountPercent === '' ? 0 : Number(formData.discountRules?.maxDiscountPercent || 0);
      const numDefaultDiscount = formData.discountRules?.defaultDiscountPercent === '' ? 0 : Number(formData.discountRules?.defaultDiscountPercent || 0);
      const numGstRate = formData.gstRatePercent === '' ? 18 : Number(formData.gstRatePercent);
      const finalCode = isEditMode && plan?.code ? plan.code : (formData.code || generateSlug(formData.name));

      const payload = {
        ...formData,
        code: finalCode,
        tier: formData.tier || 'Individual',
        seatQuota: numSeats,
        isPopular: !!formData.isPopular,
        priceINR: numPrice,
        deliveryType: formData.deliveryType || 'ONLINE',
        isGstApplicable: formData.isGstApplicable !== false,
        gstRatePercent: numGstRate,
        bulkDiscountEnabled: !!formData.bulkDiscountEnabled,
        bulkSlabs: Array.isArray(formData.bulkSlabs)
          ? formData.bulkSlabs.map((s) => ({
              minQty: Number(s.minQty) || 1,
              maxQty: s.maxQty !== null && s.maxQty !== undefined && s.maxQty !== '' ? Number(s.maxQty) : null,
              discountPercent: Number(s.discountPercent) || 0,
              label: s.label || '',
            }))
          : [],
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

  // Calculations for live preview
  const basePriceNum = Number(formData.priceINR) || 0;
  const isGstOn = formData.isGstApplicable !== false;
  const gstRateNum = isGstOn ? (Number(formData.gstRatePercent) || 18) : 0;
  const gstAmountSingle = isGstOn ? Math.round((basePriceNum * gstRateNum) / 100) : 0;
  const finalPriceWithGstSingle = basePriceNum + gstAmountSingle;

  // Test Calculator calculation
  const testQtyNum = Math.max(1, Number(testSlabQty) || 1);
  const matchedTestSlab = (formData.bulkDiscountEnabled && Array.isArray(formData.bulkSlabs))
    ? formData.bulkSlabs.find((s) => {
        const min = Number(s.minQty) || 1;
        const max = s.maxQty !== null && s.maxQty !== undefined && s.maxQty !== '' ? Number(s.maxQty) : Infinity;
        return testQtyNum >= min && testQtyNum <= max;
      })
    : null;
  const testSlabDiscountRate = matchedTestSlab ? Number(matchedTestSlab.discountPercent) || 0 : 0;
  const testGross = basePriceNum * testQtyNum;
  const testDiscountVal = Math.round((testGross * testSlabDiscountRate) / 100);
  const testTaxable = testGross - testDiscountVal;
  const testGstVal = isGstOn ? Math.round((testTaxable * gstRateNum) / 100) : 0;
  const testTotalVal = testTaxable + testGstVal;

  return (
    <AdminModal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditMode ? `Edit Plan: ${plan?.name}` : 'Add New Subscription Plan'}
      description="Configure pricing, delivery format, GST rates, volume bulk slabs, validity policies, and concessions."
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
            { id: 'general', label: '1. General & GST' },
            { id: 'users', label: '2. User Eligibility' },
            { id: 'bulk', label: '3. Bulk Quantity Slabs' },
            /* { id: 'rules', label: 'Trial & Concessions' }, -- Commented out as requested */
            { id: 'features', label: '4. Inclusions Checklist' },
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

        {/* Tab 1: General & Pricing & GST */}
        {activeTab === 'general' && (
          <div className="space-y-3.5 animate-in fade-in-0 duration-150">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 items-start">
              <InputField
                id="name"
                label="Plan Name"
                placeholder="e.g. NFI 9th Edition Formulary - Individual Pass"
                value={formData.name}
                onChange={(e) => handleNameChange(e.target.value)}
                error={errors.name}
                required
              />

              <div className="flex flex-col gap-1.5 w-full">
                <label className="text-sm font-medium text-slate-700 select-none text-left">Delivery Format / Medium</label>
                <select
                  value={formData.deliveryType}
                  onChange={(e) => {
                    const val = e.target.value;
                    handleChange('deliveryType', val);
                    if (val === 'PHYSICAL') {
                      handleChange('isGstApplicable', false);
                    } else if (!formData.isGstApplicable) {
                      handleChange('isGstApplicable', true);
                    }
                  }}
                  style={{
                    height: tokens.dimensions.inputHeight,
                    borderRadius: tokens.borderRadius.input,
                    paddingLeft: tokens.dimensions.inputPaddingX,
                    paddingRight: tokens.dimensions.inputPaddingX,
                  }}
                  className="w-full border border-slate-200 bg-white text-slate-800 text-sm font-medium transition-all duration-150 outline-none hover:border-slate-300 focus:border-[#E76120] focus:ring-2 focus:ring-[#E76120]/15 cursor-pointer"
                >
                  {DELIVERY_TYPES.map((dt) => (
                    <option key={dt.id} value={dt.id}>
                      {dt.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Code Slug (Auto-generated in background) - Commented out from UI as requested */}
            {/*
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
            */}

            {/* Tier Category - Commented out as requested (Default is 'Individual') */}
            {/*
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
            */}

            {/* Price & GST Section */}
            <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-2xl space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 items-start">
                <InputField
                  id="priceINR"
                  label="Base Price in INR (₹) [Excl. GST]"
                  type="number"
                  min={0}
                  onKeyDown={handleNumberKeyDown}
                  placeholder="660"
                  value={formData.priceINR}
                  onChange={(e) => handleNumberChange('priceINR', e.target.value, { min: 0 })}
                  error={errors.priceINR}
                  required
                />

                <div className="flex flex-col justify-end pt-1">
                  <div className="flex items-center justify-between p-2.5 bg-white border border-slate-200 rounded-xl">
                    <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-800">
                      <input
                        type="checkbox"
                        checked={formData.isGstApplicable}
                        onChange={(e) => handleChange('isGstApplicable', e.target.checked)}
                        className="w-4 h-4 rounded text-[#E76120] focus:ring-[#E76120]"
                      />
                      <span>Apply 18% GST (Taxable)</span>
                    </label>

                    {formData.isGstApplicable && (
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          min={0}
                          max={100}
                          value={formData.gstRatePercent}
                          onChange={(e) => handleNumberChange('gstRatePercent', e.target.value, { min: 0, max: 100 })}
                          className="w-14 h-7 text-center font-bold bg-slate-50 border border-slate-200 rounded-lg text-xs"
                        />
                        <span className="font-bold text-slate-500 text-xs">%</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Dual-Price Live Summary Card */}
              <div className="p-3 bg-blue-50/70 border border-blue-200/70 rounded-xl flex flex-wrap items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2 text-[#284661] font-bold">
                  <Receipt className="w-4 h-4 shrink-0" />
                  <span>Dual Price Preview:</span>
                </div>
                <div className="flex items-center gap-4">
                  <div>
                    <span className="text-slate-500 block text-[10px]">Base Price</span>
                    <strong className="text-slate-800 text-xs">₹{basePriceNum.toLocaleString('en-IN')}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">
                      {isGstOn ? `GST (${gstRateNum}%)` : 'Tax'}
                    </span>
                    <strong className="text-slate-800 text-xs">
                      {isGstOn ? `+ ₹${gstAmountSingle.toLocaleString('en-IN')}` : '₹0 (Exempt)'}
                    </strong>
                  </div>
                  <div className="pl-2 border-l border-blue-200">
                    <span className="text-[#284661] block text-[10px] font-bold">Total with GST</span>
                    <strong className="text-[#284661] text-sm font-black">
                      ₹{finalPriceWithGstSingle.toLocaleString('en-IN')}
                    </strong>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 items-start">
              <InputField
                id="fixedDate"
                label="Valid Thru (Expiry Date)"
                type="date"
                value={formData.fixedDate}
                onChange={(e) => handleChange('fixedDate', e.target.value)}
              />

              {/* Seats Per Subscription - Commented out as requested (Default is 1 seat per subscription) */}
              {/*
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
              */}
            </div>

            <InputField
              id="description"
              label="Plan Description"
              placeholder="Detailed description of audience, benefits, and coverage..."
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
            />

            {/* Highlight as Recommended Tier - Commented out as requested */}
            {/*
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
            */}
          </div>
        )}

        {/* Tab 2: Validity Policy - Commented out as per Option B (Valid Thru handled directly in Tab 1) */}
        {/*
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
        */}

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
                    <span>
                      {ut === 'UNIVERSITIES_COLLEGES'
                        ? 'UNIVERSITIES / COLLEGES'
                        : ut === 'OTHERS'
                        ? 'OTHER HEALTH CARE PROFESSIONAL'
                        : ut.replace(/_/g, ' ')}
                    </span>
                    {isSelected && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Tab 4: Bulk Quantity Slabs */}
        {activeTab === 'bulk' && (
          <div className="space-y-4 animate-in fade-in-0 duration-150">
            {/* Header / Toggle */}
            <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <Layers className="w-4 h-4 text-[#284661]" />
                  <span className="font-bold text-slate-900 text-sm">Volume / Bulk Subscription Discounts</span>
                </div>
                <p className="text-slate-500 text-xs mt-0.5">
                  Automatically apply range discounts when institutes, hospitals, or groups buy multiple seats.
                </p>
              </div>

              <label className="flex items-center gap-2 cursor-pointer shrink-0 font-bold text-slate-800 bg-white px-3 py-1.5 border border-slate-200 rounded-xl shadow-2xs">
                <input
                  type="checkbox"
                  checked={formData.bulkDiscountEnabled}
                  onChange={(e) => handleChange('bulkDiscountEnabled', e.target.checked)}
                  className="w-4 h-4 rounded text-[#E76120] focus:ring-[#E76120]"
                />
                <span>Enable Bulk Slabs</span>
              </label>
            </div>

            {formData.bulkDiscountEnabled && (
              <div className="space-y-4">
                {/* Slabs Table Card */}
                <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-2xs">
                  <div className="p-3 bg-slate-50/80 border-b border-slate-200 flex items-center justify-between">
                    <span className="font-bold text-slate-800 text-xs">Configured Quantity Discount Slabs</span>
                    <button
                      type="button"
                      onClick={handleAddSlab}
                      className="px-2.5 py-1 bg-[#284661] text-white rounded-lg font-bold text-xs hover:bg-[#1e3448] transition-all flex items-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Slab Range</span>
                    </button>
                  </div>

                  <div className="divide-y divide-slate-100">
                    <div className="grid grid-cols-12 gap-2 p-2.5 bg-slate-100/70 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                      <span className="col-span-3">Min Seats (From)</span>
                      <span className="col-span-3">Max Seats (To)</span>
                      <span className="col-span-2">Discount (%)</span>
                      <span className="col-span-3">Tier Label (Optional)</span>
                      <span className="col-span-1 text-center">Action</span>
                    </div>

                    {(formData.bulkSlabs || []).length === 0 ? (
                      <div className="p-6 text-center text-slate-400">
                        No bulk slabs configured. Click "Add Slab Range" to define your first tiered discount.
                      </div>
                    ) : (
                      (formData.bulkSlabs || []).map((slab, idx) => (
                        <div key={idx} className="grid grid-cols-12 gap-2 p-2.5 items-center hover:bg-slate-50 transition-colors">
                          <div className="col-span-3">
                            <input
                              type="number"
                              min={1}
                              value={slab.minQty}
                              onChange={(e) => handleUpdateSlab(idx, 'minQty', Number(e.target.value) || 1)}
                              className="w-full h-8 px-2.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-800 focus:border-[#E76120] outline-none"
                            />
                          </div>

                          <div className="col-span-3">
                            <input
                              type="number"
                              min={Number(slab.minQty) || 1}
                              placeholder="Leave blank for ∞"
                              value={slab.maxQty ?? ''}
                              onChange={(e) =>
                                handleUpdateSlab(
                                  idx,
                                  'maxQty',
                                  e.target.value === '' ? null : Number(e.target.value)
                                )
                              }
                              className="w-full h-8 px-2.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-800 focus:border-[#E76120] outline-none"
                            />
                          </div>

                          <div className="col-span-2 relative">
                            <input
                              type="number"
                              min={0}
                              max={100}
                              value={slab.discountPercent}
                              onChange={(e) => handleUpdateSlab(idx, 'discountPercent', Number(e.target.value) || 0)}
                              className="w-full h-8 pl-2.5 pr-6 bg-white border border-slate-200 rounded-lg text-xs font-bold text-emerald-700 focus:border-[#E76120] outline-none"
                            />
                            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-[11px] pointer-events-none">
                              %
                            </span>
                          </div>

                          <div className="col-span-3">
                            <input
                              type="text"
                              placeholder="e.g. Small Team Tier"
                              value={slab.label || ''}
                              onChange={(e) => handleUpdateSlab(idx, 'label', e.target.value)}
                              className="w-full h-8 px-2.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-700 focus:border-[#E76120] outline-none"
                            />
                          </div>

                          <div className="col-span-1 flex justify-center">
                            <button
                              type="button"
                              onClick={() => handleRemoveSlab(idx)}
                              className="w-7 h-7 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 flex items-center justify-center transition-colors cursor-pointer"
                              title="Delete this slab"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Interactive Test Calculator Card */}
                <div className="p-3.5 bg-blue-50/70 border border-blue-200/80 rounded-2xl space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 font-bold text-[#284661] text-xs">
                      <Calculator className="w-4 h-4" />
                      <span>Interactive Live Slab &amp; Tax Test Calculator</span>
                    </div>
                    {matchedTestSlab ? (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800">
                        Active Slab: {matchedTestSlab.label || `${matchedTestSlab.minQty} - ${matchedTestSlab.maxQty || '∞'}`} ({matchedTestSlab.discountPercent}% OFF)
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600">
                        No Slab Matched (0% OFF)
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 items-center">
                    <div className="col-span-1">
                      <span className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Test Quantity</span>
                      <input
                        type="number"
                        min={1}
                        value={testSlabQty}
                        onChange={(e) => setTestSlabQty(Math.max(1, Number(e.target.value) || 1))}
                        className="w-full h-8 px-2 bg-white border border-slate-300 rounded-lg text-xs font-black text-slate-900 focus:border-[#E76120] outline-none"
                      />
                    </div>

                    <div className="p-2 bg-white rounded-lg border border-slate-200 min-w-0">
                      <span className="text-[10px] text-slate-400 block truncate">Gross Base</span>
                      <span className="text-xs font-bold text-slate-800 block truncate">
                        ₹{testGross.toLocaleString('en-IN')}
                      </span>
                    </div>

                    <div className="p-2 bg-emerald-50 rounded-lg border border-emerald-100 min-w-0">
                      <span className="text-[10px] text-emerald-700 font-bold block truncate">
                        Slab Off ({testSlabDiscountRate}%)
                      </span>
                      <span className="text-xs font-black text-emerald-800 block truncate">
                        - ₹{testDiscountVal.toLocaleString('en-IN')}
                      </span>
                    </div>

                    <div className="p-2 bg-white rounded-lg border border-slate-200 min-w-0">
                      <span className="text-[10px] text-slate-400 block truncate">
                        {isGstOn ? `18% GST` : 'GST (0%)'}
                      </span>
                      <span className="text-xs font-bold text-slate-800 block truncate">
                        + ₹{testGstVal.toLocaleString('en-IN')}
                      </span>
                    </div>

                    <div className="p-2 bg-[#284661] text-white rounded-lg min-w-0 shadow-2xs">
                      <span className="text-[10px] text-blue-200 block truncate">Total Payable</span>
                      <span className="text-xs font-black text-white block truncate">
                        ₹{testTotalVal.toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab 4: Trial & Concessions - Commented out as requested */}
        {/*
        {activeTab === 'rules' && (
          <div className="space-y-4 animate-in fade-in-0 duration-150">
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
        */}

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
