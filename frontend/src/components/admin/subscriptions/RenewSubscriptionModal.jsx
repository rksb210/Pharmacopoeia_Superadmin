import React, { useState } from 'react';
import AdminModal from '../common/AdminModal';
import InputField from '../../common/InputField';
import { RotateCw, AlertCircle, Calendar } from 'lucide-react';

export const RenewSubscriptionModal = ({
  isOpen,
  onClose,
  subscription,
  onRenewSuccess,
}) => {
  const [renewDays, setRenewDays] = useState(14);
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (!subscription) return null;

  const isPaid = subscription.type === 'paid' || subscription.type === 'discounted';

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setError('');

    try {
      await onRenewSuccess(subscription._id, {
        renewDays,
        renewMonths: Math.round(renewDays / 30),
        notes,
      });
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to renew subscription.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AdminModal
      isOpen={isOpen}
      onClose={onClose}
      title={`Renew / Extend Subscription: ${subscription.subscriptionId}`}
      description={`Re-activate or extend digital formulary pass for ${subscription.user?.name || 'Subscriber'}.`}
      confirmLabel="Confirm Renewal"
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

        <div className="p-3 bg-blue-50/70 border border-blue-100 rounded-xl space-y-1 text-blue-950">
          <p>
            <strong>Plan:</strong> {subscription.planName} ({subscription.tier})
          </p>
          <p>
            <strong>Current Expiry:</strong>{' '}
            {new Date(subscription.endDate).toLocaleDateString('en-IN')}
          </p>
          {isPaid && (
            <p className="text-[11px] text-[#284661] font-bold">
              ● Purchased subscription renewal confirms validity through{' '}
              {subscription.endDate
                ? new Date(subscription.endDate).toLocaleDateString('en-GB', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })
                : '31 Dec 2031'}
              .
            </p>
          )}
        </div>

        {!isPaid && (
          <div className="flex flex-col gap-1">
            <label className="font-semibold text-slate-700">Extension Period</label>
            <select
              value={renewDays}
              onChange={(e) => setRenewDays(Number(e.target.value))}
              className="h-9 px-3 bg-white border border-slate-200 rounded-xl font-bold text-xs"
            >
              <option value={7}>7 Days</option>
              <option value={14}>14 Days</option>
              <option value={30}>30 Days</option>
              <option value={90}>90 Days</option>
              <option value={180}>180 Days</option>
              <option value={365}>1 Year</option>
              <option value={730}>2 Year</option>
              <option value={1095}>3 Year</option>
              <option value={1460}>4 Year</option>
              <option value={1825}>5 Year</option>
            </select>
          </div>
        )}

        <InputField
          id="notes"
          label="Renewal Justification / Reference"
          placeholder="e.g. Annual renewal request verified via payment gateway"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
      </div>
    </AdminModal>
  );
};

export default RenewSubscriptionModal;
