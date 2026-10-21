import React, { useState, useEffect } from 'react';
import AdminModal from '../common/AdminModal';
import { Badge } from '../../ui/badge';
import {
  CreditCard,
  Clock,
  Gift,
  Percent,
  AlertTriangle,
  RotateCcw,
  CheckCircle2,
  ShieldCheck,
  User,
  XCircle,
} from 'lucide-react';
import planService from '../../../services/plan.service';

export const SubscriptionResubmitModal = ({
  isOpen,
  onClose,
  subscription,
  onResubmitSuccess,
}) => {
  const [plans, setPlans] = useState([]);
  const [loadingPlans, setLoadingPlans] = useState(false);

  const [subType, setSubType] = useState('paid');
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [trialDays, setTrialDays] = useState(14);
  const [discountPercent, setDiscountPercent] = useState(0);
  const [notes, setNotes] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Fetch active formulary plans
  useEffect(() => {
    if (!isOpen) return;

    const fetchPlans = async () => {
      setLoadingPlans(true);
      try {
        const res = await planService.getPlans({ status: 'active' });
        if (res && res.plans && res.plans.length > 0) {
          setPlans(res.plans);
        }
      } catch (err) {
        console.warn('Failed to load plans:', err.message);
      } finally {
        setLoadingPlans(false);
      }
    };

    fetchPlans();
  }, [isOpen]);

  // Pre-fill state whenever subscription changes or modal opens
  useEffect(() => {
    if (!subscription || !isOpen) return;

    setSubType(subscription.type || 'paid');
    setDiscountPercent(subscription.discountPercent || 0);
    setNotes('');
    setError('');

    if (plans.length > 0) {
      const match = plans.find((p) => p.code === subscription.planCode) || plans[0];
      setSelectedPlan(match);
    }
  }, [subscription, isOpen, plans]);

  if (!subscription) return null;

  const subscriber = subscription.user || {};
  const subscriberName =
    subscriber.name ||
    subscription.userName ||
    subscription.shippingAddress?.fullName ||
    'Subscriber';
  const subscriberEmail =
    subscriber.email ||
    subscription.userEmail ||
    subscription.shippingAddress?.email ||
    'N/A';
  const userType = subscriber.userType || subscription.userType || 'GENERAL';

  // Calculate pricing preview for selected plan
  let basePrice = selectedPlan?.priceINR || 0;
  let singleUnitTotal = basePrice;
  if (selectedPlan) {
    const rate = selectedPlan.isGstApplicable ? selectedPlan.gstRatePercent || 18 : 0;
    const gstAmt = Math.round((basePrice * rate) / 100);
    singleUnitTotal = basePrice + gstAmt;
  }

  let finalPayable = singleUnitTotal;
  if (subType === 'trial' || subType === 'complimentary') {
    finalPayable = 0;
  } else if (subType === 'discounted') {
    const discAmt = Math.round((singleUnitTotal * (Number(discountPercent) || 0)) / 100);
    finalPayable = Math.max(0, singleUnitTotal - discAmt);
  }

  const handleResubmit = async () => {
    setError('');

    if (!selectedPlan) {
      setError('Please select a valid formulary plan.');
      return;
    }

    if (subType === 'discounted' && (Number(discountPercent) <= 0 || Number(discountPercent) > 100)) {
      setError('Please provide a valid discount percentage (1 - 100%).');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        type: subType,
        planCode: selectedPlan.code,
        planName: selectedPlan.name,
        tier: selectedPlan.tier,
        amount: selectedPlan.priceINR,
        deliveryType: selectedPlan.deliveryType,
        discountPercent: subType === 'discounted' ? Number(discountPercent) : 0,
        customDays: subType === 'trial' ? Number(trialDays) : undefined,
        notes: notes.trim(),
      };

      await onResubmitSuccess(subscription._id, payload);
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to resubmit subscription request.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AdminModal
      isOpen={isOpen}
      onClose={onClose}
      title="Edit & Resubmit Subscription"
      description={`Update parameters for request ${subscription.subscriptionId} and resubmit to Approver.`}
      confirmLabel="Resubmit for Review"
      confirmVariant="nfiYellow"
      isConfirming={isSubmitting}
      onConfirm={handleResubmit}
      size="md"
    >
      <div className="space-y-4 text-xs select-none font-sans">
        {/* Error notification */}
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 text-red-600" />
            <span className="font-semibold">{error}</span>
          </div>
        )}

        {/* Previous Rejection Alert Banner */}
        <div className="p-3.5 bg-rose-50/80 border border-rose-200/90 rounded-2xl space-y-1.5">
          <div className="flex items-center gap-2 font-bold text-rose-900">
            <XCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>Previous Rejection Feedback</span>
          </div>
          <p className="text-slate-800 bg-white/90 p-2 rounded-xl border border-rose-100 font-semibold break-words">
            "{subscription.rejectionReason || subscription.approvalComments || 'Turned down during administrative review.'}"
          </p>
          <span className="text-[10px] text-slate-500 block">
            Please rectify the above remarks and resubmit. The request will move back to{' '}
            <strong className="text-amber-800 font-bold">"In Review"</strong> for the Approver's decision.
          </span>
        </div>

        {/* Subscriber Card (Read-only) */}
        <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-blue-100 text-[#284661] flex items-center justify-center shrink-0 font-bold">
              <User className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <span className="font-bold text-slate-900 block truncate">{subscriberName}</span>
              <span className="text-[11px] text-slate-500 block truncate">{subscriberEmail}</span>
            </div>
          </div>
          <Badge variant="outline" className="text-[9px] uppercase font-bold shrink-0">
            {userType}
          </Badge>
        </div>

        {/* 1. Subscription Category Selection */}
        <div className="space-y-1.5">
          <label className="font-bold text-slate-800 text-xs block">Updated Category</label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <button
              type="button"
              onClick={() => setSubType('paid')}
              className={`p-2.5 rounded-xl border flex flex-col items-center gap-1 font-bold transition-all cursor-pointer ${
                subType === 'paid'
                  ? 'bg-blue-50 border-[#284661] text-[#284661] shadow-2xs'
                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              <CreditCard className="w-4 h-4" />
              <span>Standard Paid</span>
            </button>

            <button
              type="button"
              onClick={() => setSubType('trial')}
              className={`p-2.5 rounded-xl border flex flex-col items-center gap-1 font-bold transition-all cursor-pointer ${
                subType === 'trial'
                  ? 'bg-amber-50 border-[#E76120] text-[#E76120] shadow-2xs'
                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              <Clock className="w-4 h-4" />
              <span>Free Trial</span>
            </button>

            <button
              type="button"
              onClick={() => setSubType('complimentary')}
              className={`p-2.5 rounded-xl border flex flex-col items-center gap-1 font-bold transition-all cursor-pointer ${
                subType === 'complimentary'
                  ? 'bg-purple-50 border-purple-600 text-purple-700 shadow-2xs'
                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              <Gift className="w-4 h-4" />
              <span>Complimentary</span>
            </button>

            <button
              type="button"
              onClick={() => setSubType('discounted')}
              className={`p-2.5 rounded-xl border flex flex-col items-center gap-1 font-bold transition-all cursor-pointer ${
                subType === 'discounted'
                  ? 'bg-emerald-50 border-emerald-600 text-emerald-700 shadow-2xs'
                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              <Percent className="w-4 h-4" />
              <span>Concession</span>
            </button>
          </div>
        </div>

        {/* 2. Formulary Plan Dropdown */}
        <div className="space-y-1.5">
          <label className="font-bold text-slate-800 text-xs block">Select Formulary Plan</label>
          {loadingPlans ? (
            <div className="h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center text-xs text-slate-400">
              Loading active plans...
            </div>
          ) : (
            <select
              value={selectedPlan?.code || ''}
              onChange={(e) => {
                const found = plans.find((p) => p.code === e.target.value);
                setSelectedPlan(found || null);
              }}
              className="w-full h-10 px-3 bg-white border border-slate-200 rounded-xl text-xs font-semibold focus:border-[#E76120] outline-none"
            >
              {plans.map((p) => (
                <option key={p.code} value={p.code}>
                  {p.name} — Base ₹{p.priceINR?.toLocaleString('en-IN')} (Tier: {p.tier})
                </option>
              ))}
            </select>
          )}
        </div>

        {/* 3. Category-Specific Fields */}
        {subType === 'paid' && (
          <div className="p-3 bg-blue-50/70 border border-blue-100 rounded-xl flex items-center gap-2 text-blue-900">
            <ShieldCheck className="w-4 h-4 text-[#284661] shrink-0" />
            <span>
              Purchased access will be valid until <strong>31 December 2031</strong> (NFI 7th Edition Cutoff).
            </span>
          </div>
        )}

        {subType === 'trial' && (
          <div className="flex flex-col gap-1">
            <label className="font-semibold text-slate-700">Trial Duration</label>
            <select
              value={trialDays}
              onChange={(e) => setTrialDays(Number(e.target.value))}
              className="h-9 px-3 bg-white border border-slate-200 rounded-xl font-bold text-xs"
            >
              <option value={7}>7 Days</option>
              <option value={14}>14 Days (Standard)</option>
              <option value={30}>30 Days</option>
              <option value={90}>90 Days</option>
            </select>
          </div>
        )}

        {subType === 'complimentary' && (
          <div className="p-3 bg-purple-50/70 border border-purple-200 rounded-xl flex items-center gap-2 text-purple-900">
            <Gift className="w-4 h-4 text-purple-600 shrink-0" />
            <span>
              <strong>100% Free VIP Pass:</strong> Valid until <strong>31 December 2031</strong> completely free of charge.
            </span>
          </div>
        )}

        {subType === 'discounted' && (
          <div className="flex flex-col gap-1">
            <label className="font-semibold text-slate-700 flex items-center justify-between">
              <span>Concession Rate (%)</span>
              <span className="text-[10px] text-slate-400">Min: 1% · Max: 100%</span>
            </label>
            <input
              type="number"
              min={1}
              max={100}
              placeholder="Enter discount % (e.g. 15, 25)"
              value={discountPercent}
              onChange={(e) => setDiscountPercent(e.target.value)}
              className="h-9 px-3 bg-white border border-slate-200 rounded-xl text-xs font-bold outline-none focus:border-[#E76120]"
            />
          </div>
        )}

        {/* 4. Notes / Reason for Approver */}
        <div className="space-y-1">
          <label className="font-bold text-slate-800 text-xs block">
            Remarks for Approver <span className="text-slate-400 font-normal">(Optional)</span>
          </label>
          <textarea
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="E.g., Adjusted discount to 10% per reviewer instructions, please approve."
            className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs outline-none focus:border-[#E76120] resize-none"
          />
        </div>

        {/* Pricing Summary Strip */}
        <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
          <span className="text-slate-500 font-medium">Final Revised Amount:</span>
          <span className="font-bold text-slate-900 text-sm">
            {finalPayable === 0 ? '₹0 (Waived)' : `₹${finalPayable.toLocaleString('en-IN')}`}
          </span>
        </div>
      </div>
    </AdminModal>
  );
};

export default SubscriptionResubmitModal;
