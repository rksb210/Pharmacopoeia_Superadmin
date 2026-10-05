import React, { useState } from 'react';
import AdminModal from '../common/AdminModal';
import { Badge } from '../../ui/badge';
import { CheckCircle2, XCircle, AlertTriangle, Clock, User, Calendar } from 'lucide-react';
import contentService from '../../../services/content.service';

export const ReviewContentModal = ({
  isOpen,
  onClose,
  item = null,
  itemType = 'chapter', // 'chapter' | 'subchapter' | 'medicine'
  onSuccess,
}) => {
  const [decision, setDecision] = useState('APPROVE'); // 'APPROVE' | 'REJECT'
  const [comments, setComments] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [apiError, setApiError] = useState('');

  if (!item) return null;

  const itemTitle =
    item.title ||
    item.name ||
    (itemType === 'chapter' ? 'Chapter' : itemType === 'subchapter' ? 'Sub-Chapter' : 'Monograph');

  const typeLabel =
    itemType === 'chapter'
      ? 'Chapter'
      : itemType === 'subchapter'
      ? 'Sub-Chapter'
      : 'Drug Monograph';

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setApiError('');
    try {
      const payload = {
        decision,
        comments: comments.trim(),
      };

      if (itemType === 'chapter') {
        await contentService.reviewChapter(item._id, payload);
      } else if (itemType === 'subchapter') {
        await contentService.reviewSubChapter(item._id, payload);
      } else {
        await contentService.reviewMedicine(item._id, payload);
      }

      if (onSuccess) {
        onSuccess(
          decision === 'APPROVE'
            ? `${typeLabel} approved and published live.`
            : `Revision requested for ${typeLabel.toLowerCase()}.`
        );
      }
      onClose();
    } catch (err) {
      setApiError(err.message || 'Review submission failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AdminModal
      isOpen={isOpen}
      onClose={onClose}
      title={`Review & Approval: ${typeLabel}`}
      description="Evaluate submitted changes before publishing live to the National Formulary."
      confirmLabel={decision === 'APPROVE' ? 'Approve & Publish' : 'Request Revision'}
      confirmVariant={decision === 'APPROVE' ? 'default' : 'destructive'}
      isConfirming={isSubmitting}
      onConfirm={handleSubmit}
      size="md"
    >
      <div className="space-y-4">
        {apiError && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 text-red-600" />
            <span>{apiError}</span>
          </div>
        )}

        {/* Content Item Summary */}
        <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              {typeLabel} Details
            </span>
            <Badge
              variant="outline"
              className="text-[10px] uppercase font-bold border-amber-300 bg-amber-50 text-amber-800"
            >
              <Clock className="w-3 h-3 mr-1 text-amber-600" />
              In Committee Review
            </Badge>
          </div>

          <div className="font-bold text-slate-900 text-sm">{itemTitle}</div>

          {item.code && (
            <div className="text-xs text-slate-500">
              <span className="font-semibold text-slate-600">Code:</span>{' '}
              <span className="font-mono bg-slate-200/60 px-1.5 py-0.5 rounded text-[11px]">
                {item.code}
              </span>
            </div>
          )}

          {item.therapeuticClass && (
            <div className="text-xs text-slate-500">
              <span className="font-semibold text-slate-600">Therapeutic Class:</span>{' '}
              {item.therapeuticClass}
            </div>
          )}

          <div className="pt-1.5 border-t border-slate-200/70 grid grid-cols-2 gap-2 text-[11px] text-slate-600">
            <div className="flex items-center gap-1.5 truncate">
              <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span className="truncate">
                By: {item.submittedBy?.name || item.createdBy?.name || 'Administrator'}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span>
                {item.submittedAt
                  ? new Date(item.submittedAt).toLocaleDateString()
                  : new Date(item.updatedAt || Date.now()).toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>

        {/* Previous Review Notes if present */}
        {item.reviewNotes && (
          <div className="p-2.5 bg-amber-50/70 border border-amber-200 rounded-xl text-xs text-amber-900">
            <span className="font-bold block text-[11px] mb-0.5 text-amber-800">
              Previous Review Notes:
            </span>
            <p className="italic text-slate-700">{item.reviewNotes}</p>
          </div>
        )}

        {/* Decision Toggle */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-700">Review Decision *</label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setDecision('APPROVE')}
              className={`flex items-center gap-2 p-3 rounded-xl border text-left transition-all ${
                decision === 'APPROVE'
                  ? 'border-emerald-500 bg-emerald-50/60 text-emerald-950 font-bold ring-2 ring-emerald-400/40 shadow-xs'
                  : 'border-slate-200 hover:bg-slate-50 text-slate-700'
              }`}
            >
              <CheckCircle2
                className={`w-4 h-4 shrink-0 ${
                  decision === 'APPROVE' ? 'text-emerald-600' : 'text-slate-400'
                }`}
              />
              <div className="text-xs leading-snug">
                <div>Approve & Publish</div>
                <div className="text-[10px] font-normal text-slate-500">
                  Publish live to Formulary
                </div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setDecision('REJECT')}
              className={`flex items-center gap-2 p-3 rounded-xl border text-left transition-all ${
                decision === 'REJECT'
                  ? 'border-rose-500 bg-rose-50/60 text-rose-950 font-bold ring-2 ring-rose-400/40 shadow-xs'
                  : 'border-slate-200 hover:bg-slate-50 text-slate-700'
              }`}
            >
              <XCircle
                className={`w-4 h-4 shrink-0 ${
                  decision === 'REJECT' ? 'text-rose-600' : 'text-slate-400'
                }`}
              />
              <div className="text-xs leading-snug">
                <div>Request Revision</div>
                <div className="text-[10px] font-normal text-slate-500">
                  Return to author draft
                </div>
              </div>
            </button>
          </div>
        </div>

        {/* Review Comments / Feedback Notes */}
        <div className="space-y-1">
          <label className="text-xs font-semibold text-slate-700">
            {decision === 'APPROVE' ? 'Approval Comments (Optional)' : 'Revision Notes / Feedback *'}
          </label>
          <textarea
            value={comments}
            onChange={(e) => setComments(e.target.value)}
            rows={3}
            placeholder={
              decision === 'APPROVE'
                ? 'e.g. Clinical references and pharmacopoeial specs verified.'
                : 'e.g. Please verify renal dose adjustments and specify ATC 5th level code...'
            }
            className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-[#FFD243] bg-white resize-y"
          />
        </div>
      </div>
    </AdminModal>
  );
};

export default ReviewContentModal;
