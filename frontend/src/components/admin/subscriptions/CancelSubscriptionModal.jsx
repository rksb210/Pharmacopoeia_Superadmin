import React, { useState } from 'react';
import AdminModal from '../common/AdminModal';
import InputField from '../../common/InputField';
import { XCircle, AlertTriangle } from 'lucide-react';

export const CancelSubscriptionModal = ({
  isOpen,
  onClose,
  subscription,
  onCancelSuccess,
}) => {
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (!subscription) return null;

  const handleSubmit = async () => {
    if (!reason.trim()) {
      setError('Please provide a reason for cancelling this subscription.');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      await onCancelSuccess(subscription._id, reason);
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to cancel subscription.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AdminModal
      isOpen={isOpen}
      onClose={onClose}
      title="Cancel &amp; Deactivate Subscription"
      description={`Are you sure you want to deactivate pass ${subscription.subscriptionId}?`}
      confirmLabel="Deactivate Subscription"
      confirmVariant="destructive"
      isConfirming={isSubmitting}
      onConfirm={handleSubmit}
      size="sm"
    >
      <div className="space-y-3.5 text-xs select-none font-sans">
        <div className="p-3 bg-red-50 border border-red-100 rounded-xl flex items-start gap-2.5 text-red-800">
          <AlertTriangle className="w-4 h-4 shrink-0 text-red-600 mt-0.5" />
          <p className="leading-relaxed">
            Deactivating will revoke digital formulary monograph access for{' '}
            <strong>{subscription.user?.name}</strong>. An audit log will be appended to the user’s
            timeline.
          </p>
        </div>

        {error && (
          <div className="p-2 bg-red-100/60 border border-red-200 text-red-700 rounded-lg">
            {error}
          </div>
        )}

        <div className="space-y-1">
          <label className="font-bold text-slate-800">
            Mandatory Cancellation Reason <span className="text-red-500">*</span>
          </label>
          <textarea
            rows={3}
            placeholder="e.g. Subscriber requested refund / Institutional contract terminated..."
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs outline-none focus:border-red-500"
          />
        </div>
      </div>
    </AdminModal>
  );
};

export default CancelSubscriptionModal;
