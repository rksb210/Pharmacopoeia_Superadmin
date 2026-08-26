import React, { useState, useEffect } from 'react';
import AdminModal from '../common/AdminModal';
import InputField from '../../common/InputField';
import { RotateCcw, AlertTriangle, AlertCircle } from 'lucide-react';

export const RefundOrderModal = ({
  isOpen,
  onClose,
  order,
  onRefund,
}) => {
  const [refundAmount, setRefundAmount] = useState('');
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (order && isOpen) {
      setRefundAmount(String(order.pricing?.totalAmount || ''));
      setReason('');
      setError('');
    }
  }, [order, isOpen]);

  const handleSubmit = async (e) => {
    e?.preventDefault();
    const amt = Number(refundAmount);
    const max = order.pricing?.totalAmount || 0;

    if (isNaN(amt) || amt <= 0 || amt > max) {
      setError(`Refund amount must be between ₹1 and ₹${max.toLocaleString('en-IN')}`);
      return;
    }

    if (!reason.trim()) {
      setError('Please provide a mandatory reason for refund authorization');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      await onRefund(order._id, { refundAmount: amt, reason });
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to process refund.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!order) return null;

  return (
    <AdminModal
      isOpen={isOpen}
      onClose={onClose}
      title="Authorize Order Refund"
      description={`Process commercial refund for Order ${order.orderNumber} (${order.userName}).`}
      confirmLabel="Authorize Refund"
      isConfirming={submitting}
      onConfirm={handleSubmit}
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-xs select-none font-sans">
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
            <span>{error}</span>
          </div>
        )}

        <div className="p-3.5 bg-amber-50 border border-amber-200 text-amber-900 rounded-2xl flex items-start gap-2.5">
          <AlertTriangle className="w-4 h-4 text-[#E76120] shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <span className="font-bold block">Important Commercial Policy Warning</span>
            <p className="text-[11px] text-amber-800 leading-relaxed">
              Processing this refund will automatically deactivate and cancel the subscriber&apos;s active digital formulary pass and log an immutable audit event.
            </p>
          </div>
        </div>

        <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-2xl space-y-1">
          <div className="flex justify-between">
            <span className="text-slate-500">Original Gross Paid:</span>
            <strong className="text-slate-900 font-mono">
              ₹{order.pricing?.totalAmount?.toLocaleString('en-IN')}
            </strong>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Payment Gateway:</span>
            <span className="text-slate-700 font-semibold">{order.payment?.gateway} ({order.payment?.paymentMethod})</span>
          </div>
        </div>

        <InputField
          id="refundAmount"
          label="Refund Amount (INR)"
          type="number"
          value={refundAmount}
          onChange={(e) => setRefundAmount(e.target.value)}
          required
        />

        <div className="space-y-1.5">
          <label className="font-semibold text-slate-700 block">
            Refund Reason / Authorization Note <span className="text-red-500">*</span>
          </label>
          <textarea
            rows={3}
            placeholder="e.g. Duplicate institutional transaction / Subscriber requested cancellation within refund window..."
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="w-full p-3 bg-white border border-slate-200 rounded-xl text-xs outline-none focus:border-[#E76120]"
          />
        </div>
      </form>
    </AdminModal>
  );
};

export default RefundOrderModal;
