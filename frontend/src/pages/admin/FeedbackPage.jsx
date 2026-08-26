import React, { useState, useEffect, useCallback } from 'react';
import {
  MessageSquare,
  CheckCircle2,
  Clock,
  Eye,
  RotateCcw,
  UserCheck,
  Send,
  RefreshCw,
  Search,
  Filter,
  FileText,
  TrendingUp,
  AlertCircle,
  BookOpen,
} from 'lucide-react';
import PageContainer from '../../components/admin/common/PageContainer';
import PageHeader from '../../components/admin/common/PageHeader';
import StatCard from '../../components/admin/common/StatCard';
import AdminLoader from '../../components/admin/common/AdminLoader';
import AdminErrorState from '../../components/admin/common/AdminErrorState';
import AdminEmptyState from '../../components/admin/common/AdminEmptyState';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '../../components/ui/table';

import feedbackService from '../../services/feedback.service';
import PermissionGuard from '../../components/admin/common/PermissionGuard';

// Components & Modals
import FeedbackStatusBadge from '../../components/admin/feedback/FeedbackStatusBadge';
import FeedbackCategoryBadge from '../../components/admin/feedback/FeedbackCategoryBadge';
import FeedbackPriorityBadge from '../../components/admin/feedback/FeedbackPriorityBadge';
import AssignTicketModal from '../../components/admin/feedback/AssignTicketModal';
import ReplyFeedbackModal from '../../components/admin/feedback/ReplyFeedbackModal';
import FeedbackDetailsModal from '../../components/admin/feedback/FeedbackDetailsModal';

const CATEGORIES = [
  { id: 'all', label: 'All Categories' },
  { id: 'MONOGRAPH_AMENDMENT', label: 'Monograph Amendment' },
  { id: 'DOSAGE_CORRECTION', label: 'Dosage Correction' },
  { id: 'SAFETY_QUERY', label: 'Safety Query' },
  { id: 'CLINICAL_SUGGESTION', label: 'Clinical Suggestion' },
  { id: 'BUG_REPORT', label: 'Portal Bug Report' },
  { id: 'GENERAL_FEEDBACK', label: 'General Feedback' },
];

const SECTIONS = [
  { id: 'all', label: 'All Sections' },
  { id: 'Monographs', label: 'Monographs' },
  { id: 'Dosage Guidelines', label: 'Dosage Guidelines' },
  { id: 'Appendices', label: 'Appendices' },
  { id: 'General Notices', label: 'General Notices' },
  { id: 'Portal UI', label: 'Portal UI' },
];

export const FeedbackPage = () => {
  const [stats, setStats] = useState({
    totalTickets: 0,
    pendingCount: 0,
    inReviewCount: 0,
    completedCount: 0,
    resolutionRatePercent: 0,
  });

  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [feedback, setFeedback] = useState({ message: '', type: '' });

  // Filters
  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'pending' | 'in_review' | 'completed'
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [sectionFilter, setSectionFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  // Modals
  const [assigningTicket, setAssigningTicket] = useState(null);
  const [replyingTicket, setReplyingTicket] = useState(null);
  const [viewingTicket, setViewingTicket] = useState(null);

  // Fetch KPI Stats
  const fetchStats = async () => {
    try {
      const res = await feedbackService.getStats();
      if (res && res.stats) setStats(res.stats);
    } catch (err) {
      console.warn('Failed to load feedback stats:', err.message);
    }
  };

  // Fetch Tickets List
  const fetchTickets = useCallback(async () => {
    setLoading(true);
    setError('');

    let computedStatus = 'all';
    if (activeTab === 'pending') computedStatus = 'pending';
    else if (activeTab === 'in_review') computedStatus = 'in_review';
    else if (activeTab === 'completed') computedStatus = 'completed';

    try {
      const res = await feedbackService.getFeedbackList({
        page: currentPage,
        limit: 10,
        search: searchQuery,
        status: computedStatus,
        category: categoryFilter,
        section: sectionFilter,
        priority: priorityFilter,
      });

      if (res && res.tickets) {
        setTickets(res.tickets);
        setTotalPages(res.pagination?.totalPages || 1);
        setTotalItems(res.pagination?.total || 0);
      }
    } catch (err) {
      setError(err.message || 'Failed to load feedback tickets.');
    } finally {
      setLoading(false);
    }
  }, [currentPage, activeTab, searchQuery, categoryFilter, sectionFilter, priorityFilter]);

  useEffect(() => {
    fetchStats();
  }, []);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  const showFeedback = (message, type = 'success') => {
    setFeedback({ message, type });
    setTimeout(() => setFeedback({ message: '', type: '' }), 4000);
  };

  // Status Change Handler
  const handleStatusChange = async (ticket, newStatus, note = '') => {
    try {
      await feedbackService.updateStatus(ticket._id, newStatus, note);
      showFeedback(`Ticket ${ticket.ticketId} marked as ${newStatus.toUpperCase()}`);
      fetchTickets();
      fetchStats();
    } catch (err) {
      showFeedback(err.message, 'error');
    }
  };

  // Assign Handler
  const handleAssign = async (ticketId, adminId, note) => {
    await feedbackService.assignFeedback(ticketId, adminId, note);
    showFeedback('Ticket assigned to administrative reviewer.');
    fetchTickets();
    fetchStats();
  };

  // Reply Handler
  const handleReply = async (ticketId, message, isInternalNote) => {
    await feedbackService.addReply(ticketId, message, isInternalNote);
    showFeedback(isInternalNote ? 'Internal note added to ticket.' : 'Response sent to subscriber email.');
    fetchTickets();
    fetchStats();
  };

  return (
    <PageContainer>
      {/* Header */}
      <PageHeader
        title="Feedback &amp; Content Comments Management"
        subtitle="Review, triage, and resolve clinical corrections, monograph amendment suggestions, and feedback from healthcare professionals."
      >
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            fetchStats();
            fetchTickets();
          }}
          className="rounded-xl text-xs font-semibold cursor-pointer"
          title="Refresh tickets"
        >
          <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </Button>
      </PageHeader>

      {/* Global Feedback Banner */}
      {feedback.message && (
        <div
          className={`p-3.5 rounded-2xl border text-xs flex items-center gap-2 select-none shadow-xs animate-in fade-in-0 duration-150 ${
            feedback.type === 'error'
              ? 'bg-red-50 border-red-200 text-red-700'
              : 'bg-emerald-50 border-emerald-200 text-emerald-800'
          }`}
        >
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
          <span className="font-semibold">{feedback.message}</span>
        </div>
      )}

      {/* 4 KPI Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard
          title="Total Feedback"
          value={stats.totalTickets}
          subtitle="All content inquiries"
          icon={MessageSquare}
          iconColor="text-[#284661]"
          iconBg="bg-blue-50"
        />

        <StatCard
          title="Pending Triage"
          value={stats.pendingCount}
          subtitle="Awaiting initial review"
          icon={Clock}
          iconColor="text-[#E76120]"
          iconBg="bg-[#FFF5EE]"
        />

        <StatCard
          title="In Active Review"
          value={stats.inReviewCount}
          subtitle="Assigned to editors"
          icon={Eye}
          iconColor="text-indigo-600"
          iconBg="bg-indigo-50"
        />

        <StatCard
          title="Completed / Resolved"
          value={stats.completedCount}
          subtitle={`${stats.resolutionRatePercent}% resolution rate`}
          icon={CheckCircle2}
          iconColor="text-emerald-600"
          iconBg="bg-emerald-50"
        />
      </div>

      {/* Filter Tabs & Toolbar */}
      <div className="p-4 bg-white border border-slate-200/80 rounded-2xl shadow-2xs space-y-3.5">
        {/* Quick Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-slate-100">
          {[
            { id: 'all', label: 'All Tickets', count: stats.totalTickets },
            { id: 'pending', label: 'Pending Triage', count: stats.pendingCount },
            { id: 'in_review', label: 'In Review', count: stats.inReviewCount },
            { id: 'completed', label: 'Completed', count: stats.completedCount },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => {
                setActiveTab(tab.id);
                setCurrentPage(1);
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                activeTab === tab.id
                  ? 'bg-[#284661] text-white shadow-2xs'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <span>{tab.label}</span>
              {tab.count !== undefined && (
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                    activeTab === tab.id ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Search & Filter Dropdowns */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="relative lg:col-span-1">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search Ticket ID, subject, subscriber..."
              className="w-full h-9 pl-8 pr-3 bg-slate-50/80 border border-slate-200 rounded-xl text-xs outline-none focus:border-[#E76120]"
            />
          </div>

          <select
            value={categoryFilter}
            onChange={(e) => {
              setCategoryFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="h-9 px-3 bg-slate-50/80 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 outline-none focus:border-[#E76120] cursor-pointer"
          >
            {CATEGORIES.map((c) => (
              <option key={c.id} value={c.id}>
                {c.label}
              </option>
            ))}
          </select>

          <select
            value={sectionFilter}
            onChange={(e) => {
              setSectionFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="h-9 px-3 bg-slate-50/80 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 outline-none focus:border-[#E76120] cursor-pointer"
          >
            {SECTIONS.map((s) => (
              <option key={s.id} value={s.id}>
                {s.label}
              </option>
            ))}
          </select>

          <select
            value={priorityFilter}
            onChange={(e) => {
              setPriorityFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="h-9 px-3 bg-slate-50/80 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 outline-none focus:border-[#E76120] cursor-pointer"
          >
            <option value="all">All Priorities</option>
            <option value="urgent">Urgent</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>
      </div>

      {/* Tickets Table */}
      <div className="bg-white border border-slate-200/80 rounded-2xl shadow-2xs overflow-hidden font-sans select-none text-xs">
        {loading ? (
          <AdminLoader text="Loading feedback tickets &amp; subscriber comments..." />
        ) : error ? (
          <AdminErrorState
            title="Could not load feedback"
            message={error}
            onRetry={fetchTickets}
          />
        ) : tickets.length === 0 ? (
          <AdminEmptyState
            title="No feedback tickets found"
            description="No subscriber feedback matches your current search criteria."
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Ticket &amp; Category</TableHead>
                <TableHead>Referenced Content</TableHead>
                <TableHead>Subscriber Details</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Assignee</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tickets.map((t) => (
                <TableRow key={t._id}>
                  {/* Ticket ID & Subject */}
                  <TableCell className="max-w-xs">
                    <div>
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <span className="font-mono font-bold text-slate-900 text-xs">
                          {t.ticketId}
                        </span>
                        <FeedbackCategoryBadge category={t.category} />
                      </div>
                      <span className="font-bold text-slate-900 text-xs block truncate" title={t.subject}>
                        {t.subject}
                      </span>
                      <span className="text-[11px] text-slate-400 truncate block max-w-[240px]">
                        {t.message}
                      </span>
                    </div>
                  </TableCell>

                  {/* Referenced Content */}
                  <TableCell>
                    <div>
                      <Badge variant="outline" className="text-[9px] uppercase font-semibold">
                        {t.content?.section || 'Monographs'}
                      </Badge>
                      <span className="font-bold text-slate-800 text-xs block truncate max-w-[160px] mt-0.5" title={t.content?.monographTitle}>
                        {t.content?.monographTitle || 'General Feedback'}
                      </span>
                    </div>
                  </TableCell>

                  {/* Subscriber */}
                  <TableCell>
                    <div>
                      <span className="font-bold text-slate-900 text-xs block truncate">
                        {t.userName}
                      </span>
                      <span className="text-[10px] text-slate-400 block truncate">
                        {t.userEmail} · <strong className="text-slate-600">{t.userType}</strong>
                      </span>
                    </div>
                  </TableCell>

                  {/* Priority */}
                  <TableCell>
                    <FeedbackPriorityBadge priority={t.priority} />
                  </TableCell>

                  {/* Assignee */}
                  <TableCell>
                    <span className="font-semibold text-slate-700 text-xs block truncate">
                      {t.assignedTo?.name || 'Unassigned'}
                    </span>
                  </TableCell>

                  {/* Status */}
                  <TableCell>
                    <FeedbackStatusBadge status={t.status} />
                  </TableCell>

                  {/* Actions */}
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      {/* Mark In Review */}
                      {t.status === 'pending' && (
                        <PermissionGuard module="USERS" section="SUBSCRIBERS" action="EDIT">
                          <button
                            type="button"
                            onClick={() => handleStatusChange(t, 'in_review', 'Marked in review')}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-[#284661] hover:bg-slate-100 cursor-pointer"
                            title="Mark In Review"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        </PermissionGuard>
                      )}

                      {/* Resolve */}
                      {t.status !== 'completed' ? (
                        <PermissionGuard module="USERS" section="SUBSCRIBERS" action="EDIT">
                          <button
                            type="button"
                            onClick={() => handleStatusChange(t, 'completed', 'Resolved ticket')}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-slate-100 cursor-pointer"
                            title="Mark as Completed / Resolved"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                          </button>
                        </PermissionGuard>
                      ) : (
                        <PermissionGuard module="USERS" section="SUBSCRIBERS" action="EDIT">
                          <button
                            type="button"
                            onClick={() => handleStatusChange(t, 'reopened', 'Reopened for investigation')}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-slate-100 cursor-pointer"
                            title="Reopen Ticket"
                          >
                            <RotateCcw className="w-4 h-4" />
                          </button>
                        </PermissionGuard>
                      )}

                      {/* Assign */}
                      <PermissionGuard module="USERS" section="SUBSCRIBERS" action="EDIT">
                        <button
                          type="button"
                          onClick={() => setAssigningTicket(t)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-[#E76120] hover:bg-slate-100 cursor-pointer"
                          title="Assign to Staff Reviewer"
                        >
                          <UserCheck className="w-4 h-4" />
                        </button>
                      </PermissionGuard>

                      {/* Reply / Note */}
                      <PermissionGuard module="USERS" section="SUBSCRIBERS" action="EDIT">
                        <button
                          type="button"
                          onClick={() => setReplyingTicket(t)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-[#284661] hover:bg-slate-100 cursor-pointer"
                          title="Reply to Subscriber or Add Internal Note"
                        >
                          <Send className="w-4 h-4" />
                        </button>
                      </PermissionGuard>

                      {/* Details Dossier */}
                      <button
                        type="button"
                        onClick={() => setViewingTicket(t)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
                        title="View Full Ticket Dossier"
                      >
                        <FileText className="w-4 h-4" />
                      </button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      {/* Assign Modal */}
      <AssignTicketModal
        isOpen={!!assigningTicket}
        onClose={() => setAssigningTicket(null)}
        ticket={assigningTicket}
        onAssign={handleAssign}
      />

      {/* Reply Modal */}
      <ReplyFeedbackModal
        isOpen={!!replyingTicket}
        onClose={() => setReplyingTicket(null)}
        ticket={replyingTicket}
        onReply={handleReply}
      />

      {/* Details Modal */}
      <FeedbackDetailsModal
        isOpen={!!viewingTicket}
        onClose={() => setViewingTicket(null)}
        feedback={viewingTicket}
        onAssign={(t) => setAssigningTicket(t)}
        onReply={(t) => setReplyingTicket(t)}
        onStatusChange={handleStatusChange}
      />
    </PageContainer>
  );
};

export default FeedbackPage;
