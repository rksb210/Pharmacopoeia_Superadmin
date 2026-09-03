import React, { useState, useEffect, useCallback } from 'react';
import {
  Bell,
  CheckCircle2,
  Clock,
  Send,
  Plus,
  RefreshCw,
  Search,
  Filter,
  Eye,
  Edit2,
  TrendingUp,
  Megaphone,
  Mail,
  MessageSquare,
  AlertTriangle,
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

import notificationService from '../../services/notification.service';
import PermissionGuard from '../../components/admin/common/PermissionGuard';

// Components & Modals
import NotificationCategoryBadge from '../../components/admin/notifications/NotificationCategoryBadge';
import NotificationPriorityBadge from '../../components/admin/notifications/NotificationPriorityBadge';
import NotificationPreviewModal from '../../components/admin/notifications/NotificationPreviewModal';
import CreateEditNotificationModal from '../../components/admin/notifications/CreateEditNotificationModal';
import NotificationDetailsModal from '../../components/admin/notifications/NotificationDetailsModal';

const CATEGORIES = [
  { id: 'all', label: 'All Use Cases' },
  { id: 'NEW_CONTENT', label: 'New Content Release' },
  { id: 'SUBSCRIPTION_EXPIRY', label: 'Subscription Expiry' },
  { id: 'EVENTS', label: 'Events & Conferences' },
  { id: 'WEBINARS', label: 'Webinars' },
  { id: 'TRAINING', label: 'CME Training' },
  { id: 'ANNOUNCEMENT', label: 'Official Announcement' },
  { id: 'WORKFLOW', label: 'Editorial Workflow' },
];

export const NotificationsPage = () => {
  const [stats, setStats] = useState({
    totalCampaigns: 0,
    activeBroadcasts: 0,
    scheduledCount: 0,
    sentCount: 0,
    totalDelivered: 0,
    readRatePercent: 0,
  });

  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [feedback, setFeedback] = useState({ message: '', type: '' });

  // Filter States
  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'sent' | 'scheduled' | 'draft'
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [channelFilter, setChannelFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  // Modals State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingNotification, setEditingNotification] = useState(null);
  const [viewingNotification, setViewingNotification] = useState(null);
  const [previewingNotification, setPreviewingNotification] = useState(null);

  // Fetch KPI Stats
  const fetchStats = async () => {
    try {
      const res = await notificationService.getStats();
      if (res && res.stats) setStats(res.stats);
    } catch (err) {
      console.warn('Failed to load notification stats:', err.message);
    }
  };

  // Fetch Notifications List
  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    setError('');

    let computedStatus = 'all';
    if (activeTab === 'sent') computedStatus = 'sent';
    else if (activeTab === 'scheduled') computedStatus = 'scheduled';
    else if (activeTab === 'draft') computedStatus = 'draft';

    try {
      const res = await notificationService.getNotifications({
        page: currentPage,
        limit: 10,
        search: searchQuery,
        category: categoryFilter,
        channel: channelFilter,
        priority: priorityFilter,
        status: computedStatus,
      });

      if (res && res.notifications) {
        setNotifications(res.notifications);
        setTotalPages(res.pagination?.totalPages || 1);
        setTotalItems(res.pagination?.total || 0);
      }
    } catch (err) {
      setError(err.message || 'Failed to load notifications.');
    } finally {
      setLoading(false);
    }
  }, [currentPage, activeTab, searchQuery, categoryFilter, channelFilter, priorityFilter]);

  useEffect(() => {
    fetchStats();
  }, []);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const showFeedback = (message, type = 'success') => {
    setFeedback({ message, type });
    setTimeout(() => setFeedback({ message: '', type: '' }), 4000);
  };

  // Handlers
  const handleSaveNotification = async (payload, editId) => {
    if (editId) {
      await notificationService.updateNotification(editId, payload);
      showFeedback('Notification campaign updated successfully.');
    } else {
      await notificationService.createNotification(payload);
      showFeedback(
        payload.sendNow
          ? 'Notification dispatched across selected channels!'
          : 'Notification campaign scheduled successfully.'
      );
    }
    fetchNotifications();
    fetchStats();
  };

  const handleDispatchNow = async (notif) => {
    try {
      await notificationService.dispatchNotification(notif._id);
      showFeedback(`"${notif.title}" dispatched across all channels!`);
      fetchNotifications();
      fetchStats();
    } catch (err) {
      showFeedback(err.message, 'error');
    }
  };

  return (
    <PageContainer>
      {/* Header */}
      <PageHeader
        title="Notification &amp; Broadcast Center"
        subtitle="Orchestrate multi-channel communications across In-App drawers, HTML email, SMS, and platform-wide top alert banners."
      >
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            fetchStats();
            fetchNotifications();
          }}
          className="rounded-xl text-xs font-semibold cursor-pointer"
          title="Refresh notifications"
        >
          <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </Button>

        <PermissionGuard module="SETTINGS" section="SYSTEM" action="EDIT">
          <Button
            variant="nfiYellow"
            size="sm"
            onClick={() => setIsCreateModalOpen(true)}
            className="rounded-xl text-xs font-bold shadow-2xs cursor-pointer"
          >
            <Plus className="w-4 h-4 mr-1" />
            <span>Create Campaign</span>
          </Button>
        </PermissionGuard>
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
          title="Total Campaigns"
          value={stats.totalCampaigns}
          subtitle={`${stats.sentCount} dispatched`}
          icon={Bell}
          iconColor="text-[#284661]"
          iconBg="bg-blue-50"
        />

        <StatCard
          title="Active Broadcasts"
          value={stats.activeBroadcasts}
          subtitle="Top sticky alert banners"
          icon={Megaphone}
          iconColor="text-[#E76120]"
          iconBg="bg-[#FFF5EE]"
        />

        <StatCard
          title="Total Delivered"
          value={stats.totalDelivered?.toLocaleString('en-IN')}
          subtitle="Multi-channel reach"
          icon={CheckCircle2}
          iconColor="text-emerald-600"
          iconBg="bg-emerald-50"
        />

        <StatCard
          title="Overall Read Rate"
          value={`${stats.readRatePercent}%`}
          subtitle="User engagement"
          icon={TrendingUp}
          iconColor="text-purple-600"
          iconBg="bg-purple-50"
        />
      </div>

      {/* Filter Tabs & Toolbar */}
      <div className="p-4 bg-white border border-slate-200/80 rounded-2xl shadow-2xs space-y-3.5">
        {/* Quick Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-slate-100">
          {[
            { id: 'all', label: 'All Campaigns', count: stats.totalCampaigns },
            { id: 'sent', label: 'Dispatched / Sent', count: stats.sentCount },
            { id: 'scheduled', label: 'Scheduled', count: stats.scheduledCount },
            { id: 'draft', label: 'Drafts' },
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
              placeholder="Search headline, message body..."
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
            value={channelFilter}
            onChange={(e) => {
              setChannelFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="h-9 px-3 bg-slate-50/80 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 outline-none focus:border-[#E76120] cursor-pointer"
          >
            <option value="all">All Channels</option>
            <option value="in_app">In-App Center</option>
            <option value="email">HTML Email</option>
            <option value="sms">SMS Text</option>
            <option value="broadcast_banner">Top Banner</option>
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

      {/* Notifications Table */}
      <div className="bg-white border border-slate-200/80 rounded-2xl shadow-2xs overflow-hidden font-sans select-none text-xs">
        {loading ? (
          <AdminLoader text="Loading notification campaigns &amp; telemetry logs..." />
        ) : error ? (
          <AdminErrorState
            title="Could not load notifications"
            message={error}
            onRetry={fetchNotifications}
          />
        ) : notifications.length === 0 ? (
          <AdminEmptyState
            title="No notifications found"
            description="No broadcast campaigns match your current filters."
            actionLabel="Create Campaign"
            onAction={() => setIsCreateModalOpen(true)}
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Headline &amp; Use Case</TableHead>
                <TableHead>Channels</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Target Audience</TableHead>
                <TableHead>Delivery / Opens</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {notifications.map((n) => (
                <TableRow key={n._id}>
                  {/* Title & Category */}
                  <TableCell className="max-w-xs">
                    <div>
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <NotificationCategoryBadge category={n.category} />
                      </div>
                      <span className="font-bold text-slate-900 text-xs block truncate" title={n.title}>
                        {n.title}
                      </span>
                      <span className="text-[11px] text-slate-400 truncate block max-w-[240px]">
                        {n.message}
                      </span>
                    </div>
                  </TableCell>

                  {/* Channels */}
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {n.channels?.map((ch) => (
                        <Badge
                          key={ch}
                          variant="outline"
                          className="text-[8px] uppercase font-bold px-1.5 py-0"
                        >
                          {ch.replace('_', ' ')}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>

                  {/* Priority */}
                  <TableCell>
                    <NotificationPriorityBadge priority={n.priority} />
                  </TableCell>

                  {/* Target Audience */}
                  <TableCell>
                    <span className="font-bold text-slate-700 text-xs block">
                      {n.targetAudience?.type === 'ALL'
                        ? 'Universal'
                        : n.targetAudience?.type === 'ROLES'
                        ? n.targetAudience.roles?.join(', ')
                        : n.targetAudience?.type === 'USER_TYPES'
                        ? n.targetAudience.userTypes?.join(', ')
                        : 'Custom Target'}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      Est. {n.deliveryStats?.targetCount || 0} users
                    </span>
                  </TableCell>

                  {/* Delivery & Opens */}
                  <TableCell>
                    <div>
                      <span className="font-black text-slate-900 text-xs block">
                        {n.deliveryStats?.deliveredCount || 0} Delivered
                      </span>
                      <span className="text-[10px] text-emerald-700 font-semibold">
                        {n.deliveryStats?.readCount || 0} Read / Opened
                      </span>
                    </div>
                  </TableCell>

                  {/* Status */}
                  <TableCell>
                    <Badge
                      variant={n.status === 'sent' ? 'nfiNavy' : 'secondary'}
                      className="text-[9px] uppercase font-bold"
                    >
                      {n.status}
                    </Badge>
                  </TableCell>

                  {/* Actions */}
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      {/* Live Multi-Channel Preview */}
                      <button
                        type="button"
                        onClick={() => setPreviewingNotification(n)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
                        title="Live Multi-Channel Preview"
                      >
                        <Eye className="w-4 h-4" />
                      </button>

                      {/* Dispatch Now (if not sent) */}
                      {n.status !== 'sent' && (
                        <PermissionGuard module="SETTINGS" section="SYSTEM" action="EDIT">
                          <button
                            type="button"
                            onClick={() => handleDispatchNow(n)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-[#E76120] hover:bg-slate-100 cursor-pointer"
                            title="Dispatch Immediately"
                          >
                            <Send className="w-4 h-4" />
                          </button>
                        </PermissionGuard>
                      )}

                      {/* Edit */}
                      <PermissionGuard module="SETTINGS" section="SYSTEM" action="EDIT">
                        <button
                          type="button"
                          onClick={() => setEditingNotification(n)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-[#284661] hover:bg-slate-100 cursor-pointer"
                          title="Edit Campaign"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                      </PermissionGuard>

                      {/* Telemetry Details */}
                      <button
                        type="button"
                        onClick={() => setViewingNotification(n)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
                        title="View Notification Details"
                      >
                        <TrendingUp className="w-4 h-4" />
                      </button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      {/* Create / Edit Campaign Modal */}
      <CreateEditNotificationModal
        isOpen={isCreateModalOpen || !!editingNotification}
        onClose={() => {
          setIsCreateModalOpen(false);
          setEditingNotification(null);
        }}
        notification={editingNotification}
        onSuccess={handleSaveNotification}
      />

      {/* Multi-Channel Live Preview Modal */}
      <NotificationPreviewModal
        isOpen={!!previewingNotification}
        onClose={() => setPreviewingNotification(null)}
        notification={previewingNotification}
      />

      {/* Campaign Details & Telemetry Modal */}
      <NotificationDetailsModal
        isOpen={!!viewingNotification}
        onClose={() => setViewingNotification(null)}
        notification={viewingNotification}
        onEdit={(n) => setEditingNotification(n)}
        onPreview={(n) => setPreviewingNotification(n)}
        onDispatch={(n) => handleDispatchNow(n)}
      />
    </PageContainer>
  );
};

export default NotificationsPage;
