import React, { useState } from 'react';
import AdminModal from '../common/AdminModal';
import { Badge } from '../../ui/badge';
import { Button } from '../../ui/button';
import {
  CheckCircle2,
  XCircle,
  Clock,
  ShieldCheck,
  AlertTriangle,
  Receipt,
  Building2,
  FileSpreadsheet,
  Users,
} from 'lucide-react';

export const BulkApprovalModal = ({
  isOpen,
  onClose,
  job,
  onApproveSuccess,
  onRejectSuccess,
}) => {
  const [decision, setDecision] = useState('APPROVE'); // 'APPROVE' | 'REJECT'
  const [comments, setComments] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (!job) return null;

  const validCount = job.validCount || job.totalRows || 0;
  const institutionName = job.institutionName || 'Institutional Partner';
  const planName = job.planName || job.planCode || 'NFI Formulary Access Pass';
  const invoice = job.consolidatedInvoice || {};
  const netAmount = invoice.finalAmountINR ?? 0;
  const paymentRef = invoice.paymentReference || invoice.transactionId || job.paymentReference || 'N/A';
  const paymentMethod = invoice.paymentMethod || job.paymentMethod || 'Institutional Invoice / NEFT';
  const submitterName = job.submittedByName || job.importedBy?.name || 'Administrator';
  const submittedDate = job.submittedAt || job.createdAt;

  const handleDecisionSubmit = async () => {
    setError('');

    if (decision === 'REJECT' && !rejectionReason.trim()) {
      setError('Please provide a mandatory rejection reason for this bulk batch.');
      return;
    }

    setIsSubmitting(true);
    try {
      if (decision === 'APPROVE') {
        await onApproveSuccess(job._id || job.jobId, {
          comments: comments.trim() || 'Approved by Approver',
        });
      } else {
        await onRejectSuccess(job._id || job.jobId, {
          reason: rejectionReason.trim(),
          comments: comments.trim(),
        });
      }
      onClose();
    } catch (err) {
      setError(err.message || `Failed to ${decision.toLowerCase()} bulk batch.`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AdminModal
      isOpen={isOpen}
      onClose={onClose}
      title={`Review Bulk Batch: #${job.jobId}`}
      description="Authorize or reject institutional batch subscription provisioning."
      confirmLabel={
        decision === 'APPROVE'
          ? isSubmitting
            ? 'Provisioning...'
            : `Approve & Provision ${validCount} Subscribers`
          : isSubmitting
          ? 'Rejecting...'
          : 'Confirm Rejection'
      }
      isConfirming={isSubmitting}
      onConfirm={handleDecisionSubmit}
      confirmVariant={decision === 'APPROVE' ? 'nfiYellow' : 'destructive'}
      size="lg"
    >
      <div className="space-y-4 text-xs select-none font-sans">
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl flex items-center gap-2">
            <XCircle className="w-4 h-4 shrink-0 text-red-600" />
            <span>{error}</span>
          </div>
        )}

        {/* Batch Overview Header */}
        <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#284661] text-[#FFD243] flex items-center justify-center font-bold text-sm shrink-0">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="font-bold text-slate-900 text-sm">{institutionName}</h4>
                <Badge variant="outline" className="text-[9px] uppercase font-bold text-slate-600">
                  {job.userType || 'INSTITUTION'}
                </Badge>
              </div>
              <div className="text-[11px] text-slate-500 flex items-center gap-1.5 mt-0.5">
                <FileSpreadsheet className="w-3.5 h-3.5 text-slate-400" />
                <span>{job.fileName || 'Direct_Manual_Roster.xlsx'}</span>
                <span>•</span>
                <span className="font-mono">{validCount} valid seats</span>
              </div>
            </div>
          </div>

          <div className="text-right sm:self-auto self-start">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Net Payable</span>
            <span className="text-base font-black text-slate-900 font-mono">
              ₹{netAmount.toLocaleString('en-IN')}
            </span>
          </div>
        </div>

        {/* Verification Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Submitter & Plan Details */}
          <div className="p-3.5 bg-white border border-slate-200/80 rounded-xl space-y-2">
            <span className="text-[10px] font-bold uppercase text-slate-400 block tracking-wider">
              Submission &amp; Plan Details
            </span>
            <div className="space-y-1 text-slate-700">
              <div className="flex justify-between">
                <span className="text-slate-500">Plan:</span>
                <span className="font-bold text-slate-900">{planName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Submitted By:</span>
                <span className="font-semibold text-slate-900">{submitterName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Submitted Date:</span>
                <span className="font-mono text-slate-700">
                  {submittedDate ? new Date(submittedDate).toLocaleDateString('en-IN') : 'N/A'}
                </span>
              </div>
              {job.submissionRemarks && (
                <div className="pt-1 text-[11px] text-slate-600 italic border-t border-slate-100">
                  "{job.submissionRemarks}"
                </div>
              )}
            </div>
          </div>

          {/* Billing & Payment Audit */}
          <div className="p-3.5 bg-white border border-slate-200/80 rounded-xl space-y-2">
            <span className="text-[10px] font-bold uppercase text-slate-400 block tracking-wider">
              Payment &amp; Billing Verification
            </span>
            <div className="space-y-1 text-slate-700">
              <div className="flex justify-between">
                <span className="text-slate-500">Payment Mode:</span>
                <span className="font-semibold text-slate-900">{paymentMethod}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Transaction Ref / UTR:</span>
                <span className="font-mono font-bold text-slate-900">{paymentRef}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Invoice Number:</span>
                <span className="font-mono text-slate-700">{invoice.invoiceNumber || '—'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Slab Discount:</span>
                <span className="font-semibold text-emerald-700 font-mono">
                  {invoice.slabDiscountPercent ? `${invoice.slabDiscountPercent}% Off` : 'None'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Approver Decision Selector */}
        <div className="space-y-2">
          <label className="text-[11px] font-bold text-slate-700 block">
            Approver Authorization Action <span className="text-red-500">*</span>
          </label>
          <div className="grid grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={() => {
                setDecision('APPROVE');
                setError('');
              }}
              className={`p-3 rounded-xl border flex items-center justify-center gap-2 cursor-pointer transition-all ${
                decision === 'APPROVE'
                  ? 'bg-emerald-50 border-emerald-500 text-emerald-800 shadow-2xs font-bold'
                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              <CheckCircle2
                className={`w-4 h-4 ${decision === 'APPROVE' ? 'text-emerald-600' : 'text-slate-400'}`}
              />
              <span>Approve &amp; Provision Batch</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setDecision('REJECT');
                setError('');
              }}
              className={`p-3 rounded-xl border flex items-center justify-center gap-2 cursor-pointer transition-all ${
                decision === 'REJECT'
                  ? 'bg-red-50 border-red-500 text-red-800 shadow-2xs font-bold'
                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              <XCircle
                className={`w-4 h-4 ${decision === 'REJECT' ? 'text-red-600' : 'text-slate-400'}`}
              />
              <span>Reject Batch</span>
            </button>
          </div>
        </div>

        {/* Rejection Reason Form */}
        {decision === 'REJECT' ? (
          <div className="space-y-2 p-3 bg-red-50/60 border border-red-200 rounded-xl">
            <div className="flex items-center gap-1.5 text-red-800 font-bold text-xs">
              <AlertTriangle className="w-4 h-4 text-red-600" />
              <span>Mandatory Rejection Reason</span>
            </div>
            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="e.g. Transaction UTR could not be verified on the institutional bank statement. Please verify payment reference."
              rows={3}
              className="w-full p-2.5 bg-white border border-red-300 rounded-lg text-xs text-slate-800 placeholder:text-slate-400 outline-none focus:border-red-500"
            />
            <p className="text-[11px] text-red-600">
              This feedback will be visible to the submitting Administrator so they can correct and resubmit.
            </p>
          </div>
        ) : (
          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold text-slate-600">
              Approval Remarks / Audit Notes (Optional)
            </label>
            <input
              type="text"
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              placeholder="e.g. NEFT transfer verified via treasury portal. Approved for enrollment."
              className="w-full h-9 px-3 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 outline-none focus:border-[#284661]"
            />
          </div>
        )}
      </div>
    </AdminModal>
  );
};

export default BulkApprovalModal;
