import React, { useState, useEffect } from 'react';
import AdminModal from '../common/AdminModal';
import { Badge } from '../../ui/badge';
import { Button } from '../../ui/button';
import {
  RotateCcw,
  AlertTriangle,
  Receipt,
  Building2,
  FileSpreadsheet,
  CheckCircle2,
  XCircle,
} from 'lucide-react';

export const BulkResubmitModal = ({
  isOpen,
  onClose,
  job,
  onResubmitSuccess,
}) => {
  const [paymentReference, setPaymentReference] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [remarks, setRemarks] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!job || !isOpen) return;
    const inv = job.consolidatedInvoice || {};
    setPaymentReference(inv.paymentReference || inv.transactionId || job.paymentReference || '');
    setPaymentMethod(inv.paymentMethod || job.paymentMethod || 'Institutional Invoice / NEFT');
    setRemarks('');
    setError('');
  }, [job, isOpen]);

  if (!job) return null;

  const validCount = job.validCount || job.totalRows || 0;
  const institutionName = job.institutionName || 'Institutional Partner';
  const planName = job.planName || job.planCode || 'NFI Formulary Access Pass';
  const invoice = job.consolidatedInvoice || {};
  const netAmount = invoice.finalAmountINR ?? 0;
  const rejectionReason = job.rejectionReason || 'No reason specified by Approver.';

  const handleResubmit = async () => {
    setError('');

    const cleanRef = paymentReference.trim();
    if (!cleanRef) {
      setError('Please provide an updated Transaction / UTR reference number.');
      return;
    }

    setIsSubmitting(true);
    try {
      await onResubmitSuccess(job._id || job.jobId, {
        paymentReference: cleanRef,
        paymentMethod,
        remarks: remarks.trim() || 'Updated transaction reference and resubmitted for approval.',
      });
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to resubmit bulk batch.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AdminModal
      isOpen={isOpen}
      onClose={onClose}
      title={`Edit & Resubmit Batch: #${job.jobId}`}
      description="Update payment reference or notes and resubmit for Approver review."
      confirmLabel={isSubmitting ? 'Resubmitting...' : 'Resubmit Batch for Approval'}
      isConfirming={isSubmitting}
      onConfirm={handleResubmit}
      confirmVariant="nfiYellow"
      size="md"
    >
      <div className="space-y-4 text-xs select-none font-sans">
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl flex items-center gap-2">
            <XCircle className="w-4 h-4 shrink-0 text-red-600" />
            <span>{error}</span>
          </div>
        )}

        {/* Previous Rejection Alert Box */}
        <div className="p-3.5 bg-red-50/80 border border-red-200 rounded-xl space-y-1.5">
          <div className="flex items-center gap-1.5 text-red-800 font-bold text-xs">
            <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
            <span>Previous Rejection Feedback by Approver</span>
          </div>
          <p className="text-red-700 leading-relaxed font-medium pl-5 text-[11px]">
            "{rejectionReason}"
          </p>
          {job.rejectedByName && (
            <p className="text-[10px] text-red-500 pl-5 font-mono">
              Rejected by {job.rejectedByName} on{' '}
              {job.rejectedAt ? new Date(job.rejectedAt).toLocaleDateString('en-IN') : 'N/A'}
            </p>
          )}
        </div>

        {/* Batch Summary Strip */}
        <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl flex items-center justify-between">
          <div>
            <span className="font-bold text-slate-900 block">{institutionName}</span>
            <span className="text-[10px] text-slate-500 font-mono">
              {planName} • {validCount} Seats
            </span>
          </div>
          <div className="text-right">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Net Amount</span>
            <span className="font-mono font-black text-slate-900 text-sm">
              ₹{netAmount.toLocaleString('en-IN')}
            </span>
          </div>
        </div>

        {/* Editable Fields */}
        <div className="space-y-3">
          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-slate-700">
              Payment Method <span className="text-red-500">*</span>
            </label>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="w-full h-9 px-3 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 outline-none focus:border-[#284661]"
            >
              <option value="Institutional Invoice / NEFT">Institutional Invoice / NEFT</option>
              <option value="Razorpay Online Gateway">Razorpay Online Gateway</option>
              <option value="Demand Draft / Cheque">Demand Draft / Cheque</option>
              <option value="Complimentary / Waived">Complimentary / Waived (Institutional Grant)</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-slate-700">
              Updated Transaction / UTR Reference ID <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={paymentReference}
              onChange={(e) => setPaymentReference(e.target.value)}
              placeholder="e.g. UTR-2026-HDFC-998811"
              className="w-full h-9 px-3 bg-white border border-slate-200 rounded-lg text-xs font-mono font-bold text-slate-800 outline-none focus:border-[#284661]"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-slate-700">
              Correction Notes / Remarks for Approver
            </label>
            <textarea
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="e.g. Verified with bank statement and entered corrected NEFT reference ID."
              rows={2}
              className="w-full p-2.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 outline-none focus:border-[#284661]"
            />
          </div>
        </div>
      </div>
    </AdminModal>
  );
};

export default BulkResubmitModal;
