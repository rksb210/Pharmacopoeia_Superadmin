import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '../../ui/dialog';
import { Button } from '../../ui/button';
import { Badge } from '../../ui/badge';
import {
  Send,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Clock,
  History,
  ShieldCheck,
  FileCheck,
  User,
  MessageSquare,
} from 'lucide-react';
import dikshaService from '../../../services/diksha.service';

const getStatusBadge = (status) => {
  switch (status) {
    case 'PUBLISHED':
      return <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30">Published (Live)</Badge>;
    case 'UNDER_REVIEW':
      return <Badge className="bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30">Under Review</Badge>;
    case 'NEEDS_REVISION':
      return <Badge className="bg-purple-500/15 text-purple-700 dark:text-purple-300 border-purple-500/30">Needs Revision</Badge>;
    case 'REVIEWED':
      return <Badge className="bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-500/30">Reviewed (Pending Approval)</Badge>;
    case 'REJECTED':
      return <Badge className="bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/30">Rejected</Badge>;
    case 'ARCHIVED':
      return <Badge className="bg-slate-500/15 text-slate-700 dark:text-slate-300 border-slate-500/30">Archived</Badge>;
    case 'DRAFT':
    default:
      return <Badge className="bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">Draft</Badge>;
  }
};

export const CourseWorkflowModal = ({
  isOpen,
  onClose,
  course,
  onSuccess,
}) => {
  const [comments, setComments] = useState('');
  const [decision, setDecision] = useState('APPROVE');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  if (!course) return null;

  const isDraftOrNeedsRev = ['DRAFT', 'NEEDS_REVISION', 'REJECTED'].includes(course.status);
  const isUnderReview = course.status === 'UNDER_REVIEW';
  const isReviewed = course.status === 'REVIEWED';

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);
      setError(null);

      if (isDraftOrNeedsRev) {
        // Maker action: Submit for review
        await dikshaService.submitForReview(course._id, comments);
      } else if (isUnderReview) {
        // Reviewer action: Review course
        await dikshaService.reviewCourse(course._id, {
          decision,
          comments,
        });
      } else if (isReviewed || course.status === 'PUBLISHED') {
        // Approver action: Approve and publish / reject
        await dikshaService.approveCourse(course._id, {
          decision: decision === 'APPROVE' ? 'APPROVE_PUBLISH' : decision,
          comments,
        });
      }

      onSuccess();
      onClose();
    } catch (err) {
      setError(err?.message || 'Failed to update course workflow state.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col p-0 overflow-hidden bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl rounded-2xl">
        <DialogHeader className="p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="font-mono text-xs font-bold text-sky-600 dark:text-sky-400 uppercase tracking-wider">
                  {course.code}
                </span>
                {getStatusBadge(course.status)}
              </div>
              <DialogTitle className="text-xl font-bold text-slate-900 dark:text-white line-clamp-1">
                {course.title}
              </DialogTitle>
            </div>
          </div>
          <DialogDescription className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Manage 3-tier review and approval lifecycle: Maker ➔ Reviewer ➔ Approver ➔ Live Publish
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {error && (
            <div className="p-3.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 rounded-xl text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
              <span>{error}</span>
            </div>
          )}

          {/* Workflow Stage Guidance Box */}
          <div className="p-4 rounded-xl border border-sky-100 dark:border-sky-950/60 bg-sky-50/40 dark:bg-sky-950/20">
            <h4 className="text-xs font-semibold text-sky-900 dark:text-sky-300 uppercase tracking-wider mb-1 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-sky-600 dark:text-sky-400" />
              Current Stage Action
            </h4>

            {isDraftOrNeedsRev && (
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                As a <strong>Maker / Content Creator</strong>, submit this course to the Reviewer queue for quality inspection and content verification.
              </p>
            )}

            {isUnderReview && (
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                As a <strong>Reviewer</strong>, verify the curriculum videos, materials, and MCQ passing rules. You can approve it to forward to the final Approver or request revisions from the maker.
              </p>
            )}

            {isReviewed && (
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                As an <strong>Approver / Superadmin</strong>, grant final approval to publish this course <strong>Live</strong> so subscribers can access and enroll in it immediately.
              </p>
            )}
          </div>

          {/* Decision Selection for Reviewer & Approver */}
          {(isUnderReview || isReviewed) && (
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Select Workflow Decision:
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={() => setDecision('APPROVE')}
                  className={`p-3.5 rounded-xl border text-left transition-all flex flex-col gap-1.5 ${
                    decision === 'APPROVE'
                      ? 'border-emerald-500 bg-emerald-500/10 text-emerald-900 dark:text-emerald-100 ring-2 ring-emerald-500/20'
                      : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-2 font-semibold text-xs text-emerald-700 dark:text-emerald-400">
                    <CheckCircle2 className="w-4 h-4" />
                    {isUnderReview ? 'Verify & Pass' : 'Approve & Publish'}
                  </div>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">
                    {isUnderReview ? 'Forward to Approver' : 'Make course live to subscribers'}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setDecision('REQUEST_REVISION')}
                  className={`p-3.5 rounded-xl border text-left transition-all flex flex-col gap-1.5 ${
                    decision === 'REQUEST_REVISION'
                      ? 'border-purple-500 bg-purple-500/10 text-purple-900 dark:text-purple-100 ring-2 ring-purple-500/20'
                      : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-2 font-semibold text-xs text-purple-700 dark:text-purple-400">
                    <FileCheck className="w-4 h-4" />
                    Request Changes
                  </div>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">
                    Send back to creator with revision notes
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setDecision('REJECT')}
                  className={`p-3.5 rounded-xl border text-left transition-all flex flex-col gap-1.5 ${
                    decision === 'REJECT'
                      ? 'border-rose-500 bg-rose-500/10 text-rose-900 dark:text-rose-100 ring-2 ring-rose-500/20'
                      : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-2 font-semibold text-xs text-rose-700 dark:text-rose-400">
                    <XCircle className="w-4 h-4" />
                    Reject Course
                  </div>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">
                    Reject course with specified rationale
                  </span>
                </button>
              </div>
            </div>
          )}

          {/* Comments / Remarks Box */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center justify-between">
              <span>{isDraftOrNeedsRev ? 'Submission Remarks (Optional):' : 'Reviewer / Approver Remarks:'}</span>
              <span className="text-[11px] text-slate-400 font-normal">Recorded in audit timeline</span>
            </label>
            <textarea
              rows={3}
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              placeholder={
                isDraftOrNeedsRev
                  ? 'e.g. Completed videos and added 10 MCQ assessment questions according to NFI guidelines...'
                  : decision === 'REQUEST_REVISION'
                  ? 'e.g. Please update MCQ Question #3 and check the YouTube embed URL on Module 2...'
                  : 'Add notes for the audit trail...'
              }
              className="w-full text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 p-3 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 transition-all"
            />
          </div>

          {/* Previous Workflow History */}
          {course.workflowHistory && course.workflowHistory.length > 0 && (
            <div className="space-y-3 pt-3 border-t border-slate-100 dark:border-slate-800">
              <h5 className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <History className="w-3.5 h-3.5 text-slate-400" />
                Workflow History & Audit Trail ({course.workflowHistory.length})
              </h5>
              <div className="space-y-2.5 max-h-48 overflow-y-auto pr-1">
                {course.workflowHistory.slice().reverse().map((entry, idx) => (
                  <div
                    key={idx}
                    className="p-3 bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 rounded-xl space-y-1 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-800 dark:text-slate-200">
                          {entry.action.replace(/_/g, ' ')}
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-200/60 dark:bg-slate-700/60 text-slate-600 dark:text-slate-300 font-medium">
                          {entry.roleName}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-400 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(entry.timestamp).toLocaleString()}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400">
                      <User className="w-3 h-3" />
                      <span>{entry.performerName || 'Admin'}</span>
                    </div>

                    {entry.comments && (
                      <p className="text-[11px] text-slate-600 dark:text-slate-300 italic bg-white dark:bg-slate-900/60 p-2 rounded-lg border border-slate-100 dark:border-slate-800 flex items-start gap-1.5 mt-1">
                        <MessageSquare className="w-3 h-3 text-slate-400 shrink-0 mt-0.5" />
                        <span>"{entry.comments}"</span>
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="p-4 bg-slate-50/50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between sm:justify-between">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isSubmitting}
            className="text-xs rounded-xl"
          >
            Cancel
          </Button>

          <Button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className={`text-xs font-semibold rounded-xl text-white flex items-center gap-1.5 ${
              isDraftOrNeedsRev
                ? 'bg-sky-600 hover:bg-sky-700'
                : decision === 'APPROVE'
                ? 'bg-emerald-600 hover:bg-emerald-700'
                : decision === 'REQUEST_REVISION'
                ? 'bg-purple-600 hover:bg-purple-700'
                : 'bg-rose-600 hover:bg-rose-700'
            }`}
          >
            {isSubmitting ? (
              <span className="flex items-center gap-1.5">Processing...</span>
            ) : isDraftOrNeedsRev ? (
              <>
                <Send className="w-3.5 h-3.5" />
                Submit for Review
              </>
            ) : decision === 'APPROVE' ? (
              <>
                <CheckCircle2 className="w-3.5 h-3.5" />
                {isUnderReview ? 'Verify & Pass' : 'Approve & Publish Live'}
              </>
            ) : decision === 'REQUEST_REVISION' ? (
              <>
                <FileCheck className="w-3.5 h-3.5" />
                Send for Revision
              </>
            ) : (
              <>
                <XCircle className="w-3.5 h-3.5" />
                Reject Course
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CourseWorkflowModal;
