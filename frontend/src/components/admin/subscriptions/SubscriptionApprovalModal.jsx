import React, { useState } from 'react';
import AdminModal from '../common/AdminModal';
import { Badge } from '../../ui/badge';
import { Button } from '../../ui/button';
import {
  CheckCircle2,
  XCircle,
  Clock,
  User,
  ShieldCheck,
  FileText,
  AlertTriangle,
  Receipt,
  Calendar,
} from 'lucide-react';
import SubscriptionStatusBadge from './SubscriptionStatusBadge';

export const SubscriptionApprovalModal = ({
  isOpen,
  onClose,
  subscription,
  onApproveSuccess,
  onRejectSuccess,
}) => {
  const [decision, setDecision] = useState('APPROVE'); // 'APPROVE' | 'REJECT'
  const [comments, setComments] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (!subscription) return null;

  const subscriberName =
    subscription.user?.name ||
    subscription.userName ||
    subscription.shippingAddress?.fullName ||
    'Unknown Subscriber';
  const subscriberEmail =
    subscription.user?.email ||
    subscription.userEmail ||
    subscription.shippingAddress?.email ||
    'N/A';
  const requesterName =
    subscription.requestedBy?.name ||
    subscription.assignedBy?.name ||
    'Administrator';
  const requesterEmail =
    subscription.requestedBy?.email ||
    subscription.assignedBy?.email ||
    '';

  const handleDecisionSubmit = async () => {
    setError('');

    if (decision === 'REJECT' && !rejectionReason.trim()) {
      setError('Please provide a mandatory rejection reason.');
      return;
    }

    setIsSubmitting(true);
    try {
      if (decision === 'APPROVE') {
        await onApproveSuccess(subscription._id, {
          comments: comments.trim() || 'Approved by Approver',
        });
      } else {
        await onRejectSuccess(subscription._id, {
          reason: rejectionReason.trim(),
          comments: comments.trim(),
        });
      }
      onClose();
    } catch (err) {
      setError(err.message || `Failed to ${decision.toLowerCase()} subscription.`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AdminModal
      isOpen={isOpen}
      onClose={onClose}
      title="Subscription Provisioning Review"
      description={`Review and take a formal decision on request ${subscription.subscriptionId}`}
      confirmLabel={
        decision === 'APPROVE'
          ? 'Approve & Activate Access'
          : 'Reject Subscription Request'
      }
      confirmVariant={decision === 'APPROVE' ? 'default' : 'destructive'}
      isConfirming={isSubmitting}
      onConfirm={handleDecisionSubmit}
      size="md"
    >
      <div className="space-y-4 text-xs select-none font-sans">
        {/* Error notification */}
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 text-red-600" />
            <span>{error}</span>
          </div>
        )}

        {/* Request Header Summary */}
        <div className="p-3.5 bg-slate-50/90 dark:bg-slate-900/50 border border-slate-200/80 dark:border-slate-800 rounded-xl space-y-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                Subscription ID
              </span>
              <div className="text-sm font-extrabold text-[#284661] dark:text-blue-400">
                {subscription.subscriptionId}
              </div>
            </div>
            <SubscriptionStatusBadge
              status={subscription.status}
              type={subscription.type}
            />
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-200/60 dark:border-slate-800">
            <div>
              <span className="text-[10px] font-bold text-slate-500 flex items-center gap-1">
                <User className="w-3 h-3 text-slate-400" />
                Subscriber
              </span>
              <div className="font-semibold text-slate-800 dark:text-slate-200 truncate mt-0.5">
                {subscriberName}
              </div>
              <div className="text-[10px] text-slate-500 truncate">{subscriberEmail}</div>
            </div>

            <div>
              <span className="text-[10px] font-bold text-slate-500 flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-slate-400" />
                Requested By
              </span>
              <div className="font-semibold text-slate-800 dark:text-slate-200 truncate mt-0.5">
                {requesterName}
              </div>
              {requesterEmail && (
                <div className="text-[10px] text-slate-500 truncate">{requesterEmail}</div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-200/60 dark:border-slate-800">
            <div>
              <span className="text-[10px] font-bold text-slate-500 flex items-center gap-1">
                <Receipt className="w-3 h-3 text-slate-400" />
                Plan &amp; Tier
              </span>
              <div className="font-semibold text-slate-800 dark:text-slate-200 truncate mt-0.5">
                {subscription.planName}
              </div>
              <div className="text-[10px] text-slate-500 capitalize">
                {subscription.tier || 'Individual'} &bull; {(subscription.type || 'paid').toUpperCase()}
              </div>
            </div>

            <div>
              <span className="text-[10px] font-bold text-slate-500 flex items-center gap-1">
                <Calendar className="w-3 h-3 text-slate-400" />
                Valid Until
              </span>
              <div className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5">
                {subscription.endDate
                  ? new Date(subscription.endDate).toLocaleDateString('en-IN')
                  : '31 Dec 2031'}
              </div>
              <div className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                Amount: ₹{(subscription.finalAmount || 0).toLocaleString('en-IN')}
              </div>
            </div>
          </div>

          {subscription.notes && (
            <div className="pt-2 border-t border-slate-200/60 dark:border-slate-800">
              <span className="text-[10px] font-bold text-slate-500 flex items-center gap-1">
                <FileText className="w-3 h-3 text-slate-400" />
                Requester Notes
              </span>
              <p className="text-[11px] text-slate-600 dark:text-slate-300 italic mt-0.5">
                "{subscription.notes}"
              </p>
            </div>
          )}
        </div>

        {/* Decision Toggle */}
        <div className="space-y-1.5">
          <label className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
            <span>Decision Action <span className="text-red-500">*</span></span>
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setDecision('APPROVE')}
              className={`p-2.5 rounded-xl border flex items-center justify-center gap-2 font-bold transition-all text-xs ${
                decision === 'APPROVE'
                  ? 'bg-emerald-500/15 border-emerald-500 text-emerald-700 dark:text-emerald-300 shadow-sm'
                  : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 hover:bg-slate-50'
              }`}
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Approve &amp; Activate</span>
            </button>

            <button
              type="button"
              onClick={() => setDecision('REJECT')}
              className={`p-2.5 rounded-xl border flex items-center justify-center gap-2 font-bold transition-all text-xs ${
                decision === 'REJECT'
                  ? 'bg-rose-500/15 border-rose-500 text-rose-700 dark:text-rose-300 shadow-sm'
                  : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 hover:bg-slate-50'
              }`}
            >
              <XCircle className="w-4 h-4 text-rose-600" />
              <span>Reject Request</span>
            </button>
          </div>
        </div>

        {/* Rejection Reason (Mandatory when rejecting) */}
        {decision === 'REJECT' && (
          <div className="space-y-1 animate-in fade-in duration-200">
            <label className="font-bold text-rose-700 dark:text-rose-400 flex items-center gap-1.5">
              <span>Mandatory Rejection Reason <span className="text-red-500">*</span></span>
            </label>
            <textarea
              rows={2}
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Provide reason for rejecting this subscription provisioning request..."
              className="w-full px-3 py-2 text-xs border border-rose-200 dark:border-rose-900/60 rounded-xl bg-rose-50/40 dark:bg-rose-950/20 focus:outline-none focus:ring-2 focus:ring-rose-400"
            />
          </div>
        )}

        {/* Approver Remarks / Comments */}
        <div className="space-y-1">
          <label className="font-bold text-slate-800 dark:text-slate-200">
            Approver Remarks / Comments (Optional)
          </label>
          <textarea
            rows={2}
            value={comments}
            onChange={(e) => setComments(e.target.value)}
            placeholder={
              decision === 'APPROVE'
                ? 'e.g. Approved institutional complimentary pass as authorized.'
                : 'Additional editorial comments...'
            }
            className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-[#284661]"
          />
        </div>

        {/* Informational Guidance */}
        <div className="p-2.5 bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200/60 dark:border-blue-900/40 rounded-xl text-[11px] text-blue-900 dark:text-blue-300 flex items-start gap-2">
          <Clock className="w-3.5 h-3.5 text-blue-600 shrink-0 mt-0.5" />
          <span>
            {decision === 'APPROVE'
              ? 'Approving will immediately grant digital formulary access to the subscriber and stamp your digital authorization in the audit trail.'
              : 'Rejecting will mark the request as rejected without granting access to the subscriber. The requesting admin will be able to see the rejection reason.'}
          </span>
        </div>
      </div>
    </AdminModal>
  );
};

export default SubscriptionApprovalModal;
