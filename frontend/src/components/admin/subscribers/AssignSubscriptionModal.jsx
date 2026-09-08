import React, { useState } from 'react';
import AdminModal from '../common/AdminModal';
import InputField from '../../common/InputField';
import { Clock, Percent, AlertCircle, CheckCircle2 } from 'lucide-react';

export const AssignSubscriptionModal = ({
  isOpen,
  onClose,
  subscriber,
  onAssignTrial,
  onAssignComplimentary,
  onAssignDiscount,
}) => {
  const [activeAction, setActiveAction] = useState('trial'); // 'trial' | 'discount'
  const [trialDays, setTrialDays] = useState(14);
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
        setSuccessMsg(`Granted ${trialDays}-day Evaluation Access to ${subscriber.name}!`);
      } else if (activeAction === 'discount') {
        await onAssignDiscount(subscriber._id, discountPercent, discountNotes);
        setSuccessMsg(`Assigned ${discountPercent}% Concession Rate!`);
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
        {/* Action Selector */}
        <div className="grid grid-cols-2 gap-2.5">
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
            <span>Free Trial / Evaluation</span>
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
            <span>Apply Concession / Discount</span>
          </button>
        </div>

        {/* Form Sections */}
        {activeAction === 'trial' && (
          <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-xl space-y-3">
            <h4 className="font-bold text-slate-900">Grant Free Trial / Evaluation Access</h4>
            <div className="flex flex-col gap-1.5">
              <label className="text-slate-600 font-semibold">Evaluation / Access Duration</label>
              <select
                value={trialDays}
                onChange={(e) => setTrialDays(e.target.value)}
                className="h-10 px-3 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-800 outline-none focus:border-[#E76120]"
              >
                <option value={7}>7 Days (1 Week Quick Evaluation)</option>
                <option value={14}>14 Days (Standard Evaluation Trial)</option>
                <option value={30}>30 Days (1 Month Evaluation Pass)</option>
                <option value={90}>90 Days (3 Months Evaluation Pass)</option>
                <option value={180}>180 Days (6 Months VIP Complimentary Pass)</option>
                <option value={365}>365 Days (1 Year Full Access Grant)</option>
                <option value={730}>730 Days (2 Years Institutional Grant)</option>
              </select>
            </div>
          </div>
        )}

        {activeAction === 'discount' && (
          <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-xl space-y-3">
            <h4 className="font-bold text-slate-900">Assign Subscription Concession / Discount Rate</h4>
            {(!subscriber.subscription || subscriber.subscription.status === 'none') && (
              <div className="p-2.5 bg-blue-50 border border-blue-200 rounded-xl text-[11px] text-blue-800 font-medium">
                Note: Subscriber is currently on Free Tier. Concession rate will be applied when enrolling in a commercial paid formulary pass.
              </div>
            )}
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
