import React, { useState, useEffect } from 'react';
import AdminModal from '../common/AdminModal';
import FeedbackStatusBadge from './FeedbackStatusBadge';
import FeedbackCategoryBadge from './FeedbackCategoryBadge';
import FeedbackPriorityBadge from './FeedbackPriorityBadge';
import { Badge } from '../../ui/badge';
import { Button } from '../../ui/button';
import {
  User,
  BookOpen,
  Calendar,
  Clock,
  Shield,
  MessageSquare,
  Send,
  UserCheck,
  CheckCircle2,
  RotateCcw,
  Eye,
  Lock,
  Globe,
  ExternalLink,
  Laptop,
} from 'lucide-react';
import feedbackService from '../../../services/feedback.service';

export const FeedbackDetailsModal = ({
  isOpen,
  onClose,
  feedback,
  onAssign,
  onReply,
  onStatusChange,
}) => {
  const [activeTab, setActiveTab] = useState('dossier'); // 'dossier' | 'thread' | 'timeline'
  const [detailedTicket, setDetailedTicket] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!feedback || !isOpen) return;

    const fetchTicket = async () => {
      setLoading(true);
      try {
        const res = await feedbackService.getFeedbackById(feedback._id);
        if (res && res.ticket) {
          setDetailedTicket(res.ticket);
        }
      } catch (err) {
        console.warn('Failed to load feedback details:', err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchTicket();
    setActiveTab('dossier');
  }, [feedback, isOpen]);

  if (!feedback) return null;
  const t = detailedTicket || feedback;

  return (
    <AdminModal
      isOpen={isOpen}
      onClose={onClose}
      title={`Ticket Dossier: ${t.ticketId}`}
      description={`Subscriber content comment and lifecycle review for ${t.userName}.`}
      confirmLabel="Close"
      onConfirm={onClose}
      size="lg"
    >
      <div className="space-y-4 text-xs select-none font-sans overflow-hidden">
        {/* Top Header Card */}
        <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono font-black text-slate-900 text-sm tracking-wider">
                {t.ticketId}
              </span>
              <FeedbackStatusBadge status={t.status} />
              <FeedbackCategoryBadge category={t.category} />
              <FeedbackPriorityBadge priority={t.priority} />
            </div>
            <h3 className="font-bold text-slate-900 text-base mt-1 break-words">{t.subject}</h3>
            <p className="text-slate-400 text-xs">
              Submitted by <strong className="text-slate-700">{t.userName}</strong> ({t.userEmail})
              · {new Date(t.createdAt).toLocaleString('en-IN')}
            </p>
          </div>

          {/* Quick Actions */}
          <div className="flex flex-wrap items-center gap-1.5 shrink-0 self-start sm:self-auto">
            {t.status === 'pending' && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  onClose();
                  if (onStatusChange) onStatusChange(t, 'in_review', 'Marked in active review');
                }}
                className="h-8 rounded-xl font-bold text-xs cursor-pointer"
              >
                <Eye className="w-3.5 h-3.5 mr-1" />
                <span>Mark In Review</span>
              </Button>
            )}

            {t.status !== 'completed' ? (
              <Button
                variant="nfiYellow"
                size="sm"
                onClick={() => {
                  onClose();
                  if (onStatusChange) onStatusChange(t, 'completed', 'Resolved and closed');
                }}
                className="h-8 rounded-xl font-bold text-xs shadow-2xs cursor-pointer"
              >
                <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                <span>Resolve Ticket</span>
              </Button>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  onClose();
                  if (onStatusChange) onStatusChange(t, 'reopened', 'Reopened for additional review');
                }}
                className="h-8 rounded-xl font-bold text-xs cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5 mr-1" />
                <span>Reopen</span>
              </Button>
            )}

            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                onClose();
                if (onAssign) onAssign(t);
              }}
              className="h-8 rounded-xl font-bold text-xs cursor-pointer"
            >
              <UserCheck className="w-3.5 h-3.5 mr-1" />
              <span>Assign</span>
            </Button>

            <Button
              variant="nfiNavy"
              size="sm"
              onClick={() => {
                onClose();
                if (onReply) onReply(t);
              }}
              className="h-8 rounded-xl font-bold text-xs cursor-pointer"
            >
              <Send className="w-3.5 h-3.5 mr-1" />
              <span>Reply / Note</span>
            </Button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1.5 border-b border-slate-100 pb-2 overflow-x-auto">
          {[
            { id: 'dossier', label: '1. Content Reference & Message' },
            { id: 'thread', label: `2. Response Thread (${t.replies?.length || 0})` },
            { id: 'timeline', label: `3. Audit Timeline (${t.timeline?.length || 0})` },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all whitespace-nowrap cursor-pointer ${
                activeTab === tab.id
                  ? 'bg-[#284661] text-white shadow-2xs'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab 1: Content & Message */}
        {activeTab === 'dossier' && (
          <div className="space-y-3.5 animate-in fade-in-0 duration-150">
            {/* Content Reference Strip */}
            <div className="p-3.5 bg-white border border-slate-200/80 rounded-2xl space-y-2">
              <div className="flex items-center gap-2 font-bold text-slate-800">
                <BookOpen className="w-4 h-4 text-[#284661]" />
                <span>Referenced Pharmacopoeia Content</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-[11px] pt-1">
                <div className="min-w-0">
                  <span className="text-slate-400 block">Section</span>
                  <span className="font-bold text-slate-900 block truncate">
                    {t.content?.section || 'Monographs'}
                  </span>
                </div>

                <div className="min-w-0">
                  <span className="text-slate-400 block">Monograph / Item</span>
                  <span className="font-bold text-slate-900 block truncate">
                    {t.content?.monographTitle || 'General'}
                  </span>
                </div>

                <div className="min-w-0">
                  <span className="text-slate-400 block">Edition / Page</span>
                  <span className="font-bold text-[#284661] block truncate">
                    {t.content?.edition} {t.content?.pageNumber ? `(${t.content.pageNumber})` : ''}
                  </span>
                </div>
              </div>
            </div>

            {/* Original Message */}
            <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-2xl space-y-1.5">
              <span className="font-bold text-slate-800 block">Subscriber Comment / Inquiry</span>
              <p className="text-slate-700 text-xs leading-relaxed break-words bg-white p-3 rounded-xl border border-slate-100">
                {t.message}
              </p>
            </div>

            {/* Subscriber & Telemetry Metadata */}
            <div className="p-3.5 bg-white border border-slate-200/80 rounded-2xl space-y-2">
              <div className="flex items-center gap-2 font-bold text-slate-800">
                <Laptop className="w-4 h-4 text-[#E76120]" />
                <span>Subscriber &amp; Telemetry Metadata</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
                <div className="bg-slate-50 p-2.5 rounded-xl min-w-0">
                  <span className="text-slate-400 block text-[10px]">User Category</span>
                  <span className="font-bold text-slate-900 block truncate">{t.userType}</span>
                </div>

                <div className="bg-slate-50 p-2.5 rounded-xl min-w-0">
                  <span className="text-slate-400 block text-[10px]">Staff Assignee</span>
                  <span className="font-bold text-slate-900 block truncate">
                    {t.assignedTo?.name || 'Unassigned'}
                  </span>
                </div>

                <div className="bg-slate-50 p-2.5 rounded-xl min-w-0">
                  <span className="text-slate-400 block text-[10px]">Client IP Address</span>
                  <span className="font-mono font-bold text-slate-900 block truncate">
                    {t.ipAddress || '127.0.0.1'}
                  </span>
                </div>

                <div className="bg-slate-50 p-2.5 rounded-xl min-w-0">
                  <span className="text-slate-400 block text-[10px]">Resolution Date</span>
                  <span className="font-bold text-emerald-700 block truncate">
                    {t.resolvedAt ? new Date(t.resolvedAt).toLocaleDateString('en-IN') : 'Pending'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Response Thread */}
        {activeTab === 'thread' && (
          <div className="space-y-3 max-h-[45vh] overflow-y-auto pr-1 animate-in fade-in-0 duration-150">
            {(!t.replies || t.replies.length === 0) ? (
              <div className="text-center py-8 text-slate-400">
                <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-40" />
                <p>No replies or staff notes recorded yet.</p>
              </div>
            ) : (
              t.replies.map((rep, idx) => (
                <div
                  key={idx}
                  className={`p-3.5 rounded-2xl border ${
                    rep.isInternalNote
                      ? 'bg-amber-50/60 border-amber-200'
                      : 'bg-blue-50/60 border-blue-200'
                  } space-y-1.5`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      {rep.isInternalNote ? (
                        <Badge variant="outline" className="bg-amber-100 text-amber-900 border-amber-300 text-[9px] font-bold">
                          <Lock className="w-2.5 h-2.5 mr-1" /> Internal Staff Note
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="bg-blue-100 text-[#284661] border-blue-300 text-[9px] font-bold">
                          <Globe className="w-2.5 h-2.5 mr-1" /> Official Response
                        </Badge>
                      )}
                      <span className="font-bold text-slate-900">{rep.senderName}</span>
                    </div>

                    <span className="text-[10px] text-slate-400 font-mono">
                      {new Date(rep.sentAt).toLocaleString('en-IN')}
                    </span>
                  </div>

                  <p className="text-slate-700 text-xs leading-relaxed whitespace-pre-wrap">
                    {rep.message}
                  </p>
                </div>
              ))
            )}
          </div>
        )}

        {/* Tab 3: Chronological Audit Timeline */}
        {activeTab === 'timeline' && (
          <div className="space-y-3 max-h-[45vh] overflow-y-auto pr-1 animate-in fade-in-0 duration-150">
            {(!t.timeline || t.timeline.length === 0) ? (
              <p className="text-center text-slate-400 py-6">No timeline events recorded.</p>
            ) : (
              t.timeline.map((evt, idx) => (
                <div
                  key={idx}
                  className="p-3 bg-white border border-slate-200/80 rounded-xl flex items-start gap-3 shadow-2xs"
                >
                  <div className="w-8 h-8 rounded-lg bg-blue-50 text-[#284661] flex items-center justify-center shrink-0 border border-blue-100 mt-0.5">
                    <Clock className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className="font-bold text-slate-900 truncate">{evt.action}</span>
                        {evt.newStatus && (
                          <Badge variant="outline" className="text-[9px] uppercase font-semibold shrink-0">
                            ➔ {evt.newStatus}
                          </Badge>
                        )}
                      </div>
                      <span className="text-[10px] text-slate-400 shrink-0">
                        {new Date(evt.timestamp).toLocaleString('en-IN')}
                      </span>
                    </div>

                    {evt.note && <p className="text-[11px] text-slate-600 mt-1 break-words">{evt.note}</p>}
                    <span className="text-[10px] text-slate-400 block mt-0.5 truncate">
                      Performed by: <strong>{evt.performedBy}</strong>
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </AdminModal>
  );
};

export default FeedbackDetailsModal;
