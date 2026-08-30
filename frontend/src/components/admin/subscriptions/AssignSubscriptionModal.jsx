import React, { useState, useEffect } from 'react';
import AdminModal from '../common/AdminModal';
import InputField from '../../common/InputField';
import { Badge } from '../../ui/badge';
import { CreditCard, Clock, Gift, Percent, AlertCircle, Search, ShieldCheck } from 'lucide-react';
import subscriberService from '../../../services/subscriber.service';
import planService from '../../../services/plan.service';

export const AssignSubscriptionModal = ({
  isOpen,
  onClose,
  onAssignSuccess,
}) => {
  const [subscribers, setSubscribers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [userSearch, setUserSearch] = useState('');
  
  const [plans, setPlans] = useState([]);
  const [loadingPlans, setLoadingPlans] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);

  const [subType, setSubType] = useState('paid'); // 'paid' | 'trial' | 'complimentary' | 'discounted'
  const [discountPercent, setDiscountPercent] = useState(20);
  const [trialDays, setTrialDays] = useState(14);
  const [compMonths, setCompMonths] = useState(12);
  const [paymentMethod, setPaymentMethod] = useState('UPI / BharatPay');
  const [transactionRef, setTransactionRef] = useState('');
  const [notes, setNotes] = useState('');

  const [loadingUsers, setLoadingUsers] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Fetch active plans from database
  useEffect(() => {
    if (!isOpen) return;

    const fetchPlans = async () => {
      setLoadingPlans(true);
      try {
        const res = await planService.getPlans({ status: 'active' });
        if (res && res.plans && res.plans.length > 0) {
          const formattedPlans = res.plans.map((p) => ({
            name: p.name,
            code: p.code,
            tier: p.tier,
            amount: p.priceINR || 0,
            desc: p.description || 'Full digital monograph formulary access.',
            validityType: p.validityType,
            fixedDate: p.fixedDate,
          }));
          setPlans(formattedPlans);
          setSelectedPlan(formattedPlans[0]);
        }
      } catch (err) {
        console.warn('Failed to load active plans:', err.message);
      } finally {
        setLoadingPlans(false);
      }
    };

    fetchPlans();
  }, [isOpen]);

  // Search subscribers
  useEffect(() => {
    if (!isOpen) return;

    const fetchSubscribers = async () => {
      setLoadingUsers(true);
      try {
        const res = await subscriberService.getSubscribers({
          search: userSearch,
          limit: 10,
        });
        if (res && res.subscribers) {
          setSubscribers(res.subscribers);
          if (!selectedUser && res.subscribers.length > 0) {
            setSelectedUser(res.subscribers[0]);
          }
        }
      } catch (err) {
        console.warn('Failed to search subscribers:', err.message);
      } finally {
        setLoadingUsers(false);
      }
    };

    const timer = setTimeout(fetchSubscribers, 300);
    return () => clearTimeout(timer);
  }, [userSearch, isOpen]);

  // Compute amounts
  const baseAmount = selectedPlan?.amount || 0;
  const calculatedDiscount =
    subType === 'discounted' ? Math.round((baseAmount * discountPercent) / 100) : 0;
  const finalPrice =
    subType === 'trial' || subType === 'complimentary'
      ? 0
      : Math.max(0, baseAmount - calculatedDiscount);

  const handleSubmit = async (e) => {
    e?.preventDefault();
    if (!selectedUser) {
      setError('Please select a subscriber to assign subscription.');
      return;
    }
    if (!selectedPlan) {
      setError('Please select a formulary plan tier.');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      await onAssignSuccess({
        userId: selectedUser._id,
        type: subType,
        planName: selectedPlan.name,
        planCode: selectedPlan.code,
        tier: selectedPlan.tier,
        amount: baseAmount,
        discountPercent: subType === 'discounted' ? discountPercent : 0,
        paymentMethod,
        transactionRef,
        notes,
        customDays: trialDays,
        customMonths: compMonths,
      });
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to assign subscription.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AdminModal
      isOpen={isOpen}
      onClose={onClose}
      title="Provision &amp; Assign Subscription"
      description="Issue official digital formulary access with automatic BRD fixed expiry enforcement."
      confirmLabel="Activate Subscription"
      isConfirming={isSubmitting}
      onConfirm={handleSubmit}
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-xs select-none font-sans">
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
            <span>{error}</span>
          </div>
        )}

        {/* 1. Subscriber Selector */}
        <div className="space-y-1.5">
          <label className="font-bold text-slate-800 text-xs block">
            Target Subscriber Account
          </label>
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search subscriber by name, email, or username..."
              value={userSearch}
              onChange={(e) => setUserSearch(e.target.value)}
              className="w-full h-9 pl-8 pr-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-[#E76120]"
            />
          </div>

          <div className="max-h-32 overflow-y-auto divide-y divide-slate-100 border border-slate-200 rounded-xl bg-white mt-1">
            {loadingUsers ? (
              <p className="p-3 text-slate-400 text-center">Searching subscribers...</p>
            ) : subscribers.length === 0 ? (
              <p className="p-3 text-slate-400 text-center">No matching subscribers found.</p>
            ) : (
              subscribers.map((sub) => (
                <div
                  key={sub._id}
                  onClick={() => setSelectedUser(sub)}
                  className={`p-2.5 flex items-center justify-between cursor-pointer transition-colors ${
                    selectedUser?._id === sub._id
                      ? 'bg-blue-50/70 border-l-4 border-[#284661]'
                      : 'hover:bg-slate-50'
                  }`}
                >
                  <div>
                    <span className="font-bold text-slate-900 block">{sub.name}</span>
                    <span className="text-[11px] text-slate-400">{sub.email}</span>
                  </div>
                  <Badge variant="outline" className="text-[9px] uppercase font-bold">
                    {sub.userType}
                  </Badge>
                </div>
              ))
            )}
          </div>
        </div>

        {/* 2. Subscription Type Selection */}
        <div className="space-y-1.5">
          <label className="font-bold text-slate-800 text-xs block">Subscription Category</label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <button
              type="button"
              onClick={() => setSubType('paid')}
              className={`p-2.5 rounded-xl border flex flex-col items-center gap-1 font-bold transition-all cursor-pointer ${
                subType === 'paid'
                  ? 'bg-blue-50 border-[#284661] text-[#284661] shadow-2xs'
                  : 'bg-white border-slate-200 text-slate-600'
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
                  : 'bg-white border-slate-200 text-slate-600'
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
                  : 'bg-white border-slate-200 text-slate-600'
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
                  : 'bg-white border-slate-200 text-slate-600'
              }`}
            >
              <Percent className="w-4 h-4" />
              <span>Concession</span>
            </button>
          </div>
        </div>

        {/* 3. Plan Selection */}
        <div className="space-y-1.5">
          <label className="font-bold text-slate-800 text-xs block">Select Formulary Tier</label>
          {loadingPlans ? (
            <div className="h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center text-xs text-slate-400">
              Loading active plans...
            </div>
          ) : (
            <select
              value={selectedPlan?.code || ''}
              onChange={(e) => {
                const p = plans.find((plan) => plan.code === e.target.value);
                if (p) setSelectedPlan(p);
              }}
              className="w-full h-10 px-3 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:border-[#E76120] cursor-pointer"
            >
              {plans.map((plan) => (
                <option key={plan.code} value={plan.code}>
                  {plan.name} — ₹{plan.amount.toLocaleString('en-IN')}
                </option>
              ))}
            </select>
          )}
          {selectedPlan?.desc && <p className="text-[11px] text-slate-400">{selectedPlan.desc}</p>}
        </div>

        {/* 4. Type Specific Settings */}
        {subType === 'paid' && (
          <div className="p-3 bg-blue-50/70 border border-blue-100 rounded-xl flex items-center gap-2 text-blue-900">
            <ShieldCheck className="w-4 h-4 text-[#284661] shrink-0" />
            <span>
              <strong>BRD Business Rule Active:</strong> This purchased subscription will be valid until{' '}
              <strong>
                {selectedPlan?.fixedDate
                  ? new Date(selectedPlan.fixedDate).toLocaleDateString('en-GB', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })
                  : '31 December 2031'}
              </strong>.
            </span>
          </div>
        )}

        {subType === 'trial' && (
          <div className="flex flex-col gap-1">
            <label className="font-semibold text-slate-700">Trial Period (Days)</label>
            <select
              value={trialDays}
              onChange={(e) => setTrialDays(e.target.value)}
              className="h-9 px-3 bg-white border border-slate-200 rounded-xl font-bold text-xs"
            >
              <option value={7}>7 Days Trial</option>
              <option value={14}>14 Days (Standard Evaluation)</option>
              <option value={30}>30 Days Trial</option>
            </select>
          </div>
        )}

        {subType === 'complimentary' && (
          <div className="flex flex-col gap-1">
            <label className="font-semibold text-slate-700">Complimentary Validity (Months)</label>
            <select
              value={compMonths}
              onChange={(e) => setCompMonths(e.target.value)}
              className="h-9 px-3 bg-white border border-slate-200 rounded-xl font-bold text-xs"
            >
              <option value={6}>6 Months VIP Pass</option>
              <option value={12}>12 Months (1 Year VIP Access)</option>
              <option value={24}>24 Months Institutional Grant</option>
            </select>
          </div>
        )}

        {subType === 'discounted' && (
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className="font-semibold text-slate-700">Discount Concession Rate</label>
              <select
                value={discountPercent}
                onChange={(e) => setDiscountPercent(Number(e.target.value))}
                className="h-9 px-3 bg-white border border-slate-200 rounded-xl font-bold text-xs"
              >
                <option value={10}>10% Special Concession</option>
                <option value={20}>20% Academic Concession</option>
                <option value={30}>30% Government Subsidized</option>
                <option value={50}>50% Institutional Rebate</option>
              </select>
            </div>

            <div className="p-2.5 bg-emerald-50 border border-emerald-100 rounded-xl flex flex-col justify-center">
              <span className="text-[10px] text-emerald-700 font-bold uppercase">Payable Amount</span>
              <span className="text-sm font-black text-emerald-900">
                ₹{finalPrice.toLocaleString('en-IN')}{' '}
                <span className="line-through text-xs text-slate-400 font-normal">
                  ₹{baseAmount.toLocaleString('en-IN')}
                </span>
              </span>
            </div>
          </div>
        )}

        {/* 5. Invoicing & Payment Info */}
        {(subType === 'paid' || subType === 'discounted') && (
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className="font-semibold text-slate-700">Payment Gateway / Method</label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="h-9 px-3 bg-white border border-slate-200 rounded-xl font-bold text-xs"
              >
                <option value="UPI / BharatPay">UPI / BharatPay</option>
                <option value="NetBanking / NEFT">NetBanking / NEFT</option>
                <option value="Credit / Debit Card">Credit / Debit Card</option>
                <option value="Government Treasury Challan">Government Treasury Challan</option>
              </select>
            </div>

            <InputField
              id="txnRef"
              label="Transaction / Reference ID"
              placeholder="e.g. TXN-894109823"
              value={transactionRef}
              onChange={(e) => setTransactionRef(e.target.value)}
            />
          </div>
        )}

        {/* 6. Notes */}
        <InputField
          id="notes"
          label="Administrative Remarks (Optional)"
          placeholder="e.g. Approved via Directorate General order..."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
      </form>
    </AdminModal>
  );
};

export default AssignSubscriptionModal;
