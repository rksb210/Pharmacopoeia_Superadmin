import React, { useState } from 'react';
import AdminModal from '../common/AdminModal';
import InputField from '../../common/InputField';
import { Gift, Clock, Percent, AlertCircle, CheckCircle2 } from 'lucide-react';

export const AssignSubscriptionModal = ({
  isOpen,
  onClose,
  subscriber,
  onAssignTrial,
  onAssignComplimentary,
  onAssignDiscount,
}) => {
  const [activeAction, setActiveAction] = useState('trial'); // 'trial' | 'complimentary' | 'discount'
  const [trialDays, setTrialDays] = useState(14);
  const [compPlanName, setCompPlanName] = useState('VIP Institutional Complimentary License');
  const [compMonths, setCompMonths] = useState(12);
  const [discountPercent, setDiscountPercent] = useState(20);
  const [discountNotes, setDiscountNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  if (!subscriber) return null;

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setError('');
    setSuccessMsg('');

    try {
      if (activeAction === 'trial') {
        await onAssignTrial(subscriber._id, trialDays);
        setSuccessMsg(`Granted ${trialDays}-day Free Trial to ${subscriber.name}!`);
      } else if (activeAction === 'complimentary') {
        await onAssignComplimentary(subscriber._id, compPlanName, compMonths);
        setSuccessMsg(`Granted ${compMonths}-month Complimentary License!`);
      } else if (activeAction === 'discount') {
        await onAssignDiscount(subscriber._id, discountPercent, discountNotes);
        setSuccessMsg(`Assigned ${discountPercent}% Discount Voucher!`);
      }

      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err) {
      setError(err.message || 'Operation failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AdminModal
      isOpen={isOpen}
      onClose={onClose}
      title={`Subscription Management: ${subscriber.name}`}
      description={`Grant promotional trials, institutional complimentary access, or discount rates.`}
      confirmLabel="Apply Subscription Action"
      isConfirming={isSubmitting}
      onConfirm={handleSubmit}
      size="md"
    >
      <div className="space-y-4 text-xs select-none font-sans">
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
            <span className="font-semibold">{successMsg}</span>
          </div>
        )}

        {/* Action Selector */}
        <div className="grid grid-cols-3 gap-2">
          <button
            type="button"
            onClick={() => setActiveAction('trial')}
            className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 font-bold transition-all cursor-pointer ${
              activeAction === 'trial'
                ? 'bg-amber-50/80 border-[#E76120] text-[#E76120] shadow-2xs'
                : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>Free Trial</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveAction('complimentary')}
            className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 font-bold transition-all cursor-pointer ${
              activeAction === 'complimentary'
                ? 'bg-purple-50/80 border-purple-600 text-purple-700 shadow-2xs'
                : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
            }`}
          >
            <Gift className="w-4 h-4" />
            <span>Complimentary</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveAction('discount')}
            className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 font-bold transition-all cursor-pointer ${
              activeAction === 'discount'
                ? 'bg-emerald-50/80 border-emerald-600 text-emerald-700 shadow-2xs'
                : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
            }`}
          >
            <Percent className="w-4 h-4" />
            <span>Apply Discount</span>
          </button>
        </div>

        {/* Form Sections */}
        {activeAction === 'trial' && (
          <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-xl space-y-3">
            <h4 className="font-bold text-slate-900">Grant Promotional Free Trial</h4>
            <div className="flex flex-col gap-1.5">
              <label className="text-slate-600 font-semibold">Trial Duration (Days)</label>
              <select
                value={trialDays}
                onChange={(e) => setTrialDays(e.target.value)}
                className="h-10 px-3 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-800 outline-none focus:border-[#E76120]"
              >
                <option value={7}>7 Days (1 Week Trial)</option>
                <option value={14}>14 Days (Standard Trial)</option>
                <option value={30}>30 Days (1 Month Trial)</option>
                <option value={60}>60 Days (Extended Trial)</option>
              </select>
            </div>
          </div>
        )}

        {activeAction === 'complimentary' && (
          <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-xl space-y-3">
            <h4 className="font-bold text-slate-900">Grant Complimentary Institutional License</h4>
            <InputField
              id="compPlan"
              label="Complimentary License Label"
              value={compPlanName}
              onChange={(e) => setCompPlanName(e.target.value)}
            />
            <div className="flex flex-col gap-1.5">
              <label className="text-slate-600 font-semibold">License Validity (Months)</label>
              <select
                value={compMonths}
                onChange={(e) => setCompMonths(e.target.value)}
                className="h-10 px-3 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-800 outline-none focus:border-[#E76120]"
              >
                <option value={3}>3 Months</option>
                <option value={6}>6 Months</option>
                <option value={12}>12 Months (1 Year Full Pass)</option>
                <option value={24}>24 Months (2 Years VIP Pass)</option>
              </select>
            </div>
          </div>
        )}

        {activeAction === 'discount' && (
          <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-xl space-y-3">
            <h4 className="font-bold text-slate-900">Assign Subscription Discount Rate</h4>
            <div className="flex flex-col gap-1.5">
              <label className="text-slate-600 font-semibold">Discount Percentage (%)</label>
              <select
                value={discountPercent}
                onChange={(e) => setDiscountPercent(e.target.value)}
                className="h-10 px-3 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-800 outline-none focus:border-[#E76120]"
              >
                <option value={10}>10% Off</option>
                <option value={15}>15% Off</option>
                <option value={20}>20% Off (Academic Special)</option>
                <option value={30}>30% Off (Government Subsidized)</option>
                <option value={50}>50% Off (Institutional Rebate)</option>
              </select>
            </div>
            <InputField
              id="discNotes"
              label="Discount Reason / Voucher Code"
              placeholder="e.g. MOHFW-ACADEMIC-REBATE"
              value={discountNotes}
              onChange={(e) => setDiscountNotes(e.target.value)}
            />
          </div>
        )}
      </div>
    </AdminModal>
  );
};

export default AssignSubscriptionModal;
