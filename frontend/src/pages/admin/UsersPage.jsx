import React, { useState, useEffect, useCallback } from 'react';
import {
  Users,
  UserCheck,
  Gift,
  Clock,
  Plus,
  Eye,
  Edit2,
  KeyRound,
  CreditCard,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Search,
  Filter,
} from 'lucide-react';
import PageContainer from '../../components/admin/common/PageContainer';
import PageHeader from '../../components/admin/common/PageHeader';
import StatCard from '../../components/admin/common/StatCard';
import AdminTableWrapper from '../../components/admin/common/AdminTableWrapper';
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

import subscriberService from '../../services/subscriber.service';
import PermissionGuard from '../../components/admin/common/PermissionGuard';

// Modals
import CreateEditSubscriberModal from '../../components/admin/subscribers/CreateEditSubscriberModal';
import SubscriberDetailsModal from '../../components/admin/subscribers/SubscriberDetailsModal';
import AssignSubscriptionModal from '../../components/admin/subscribers/AssignSubscriptionModal';
import ResetPasswordDialog from '../../components/admin/admins/ResetPasswordDialog';

export const UsersPage = () => {
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeSubscribers: 0,
    trialUsers: 0,
    complimentaryUsers: 0,
  });

  const [userTypes, setUserTypes] = useState([]);
  const [subscribers, setSubscribers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [feedback, setFeedback] = useState({ message: '', type: '' });

  // Filters State
  const [searchQuery, setSearchQuery] = useState('');
  const [userTypeFilter, setUserTypeFilter] = useState('all');
  const [subscriptionFilter, setSubscriptionFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingSubscriber, setEditingSubscriber] = useState(null);
  const [viewingSubscriber, setViewingSubscriber] = useState(null);
  const [subscriptionSubscriber, setSubscriptionSubscriber] = useState(null);
  const [resetPasswordSubscriber, setResetPasswordSubscriber] = useState(null);

  // Fetch Master Data & Stats
  const fetchMetadata = async () => {
    try {
      const [typesRes, statsRes] = await Promise.all([
        subscriberService.getUserTypes(),
        subscriberService.getStats(),
      ]);

      if (typesRes && typesRes.types) setUserTypes(typesRes.types);
      if (statsRes && statsRes.stats) setStats(statsRes.stats);
    } catch (err) {
      console.warn('Failed to load subscriber metadata:', err.message);
    }
  };

  // Fetch Subscribers List
  const fetchSubscribers = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const res = await subscriberService.getSubscribers({
        page: currentPage,
        limit: 10,
        search: searchQuery,
        userType: userTypeFilter,
        subscriptionStatus: subscriptionFilter,
        status: statusFilter,
        dateFrom,
        dateTo,
      });

      if (res && res.subscribers) {
        setSubscribers(res.subscribers);
        setTotalPages(res.pagination?.totalPages || 1);
        setTotalItems(res.pagination?.total || 0);
      }
    } catch (err) {
      setError(err.message || 'Failed to load subscribers.');
    } finally {
      setLoading(false);
    }
  }, [currentPage, searchQuery, userTypeFilter, subscriptionFilter, statusFilter, dateFrom, dateTo]);

  useEffect(() => {
    fetchMetadata();
  }, []);

  useEffect(() => {
    fetchSubscribers();
  }, [fetchSubscribers]);

  const showFeedback = (message, type = 'success') => {
    setFeedback({ message, type });
    setTimeout(() => setFeedback({ message: '', type: '' }), 4000);
  };

  // Create / Update Handler
  const handleSaveSubscriber = async (formData, editId) => {
    if (editId) {
      await subscriberService.updateSubscriber(editId, formData);
      showFeedback('Subscriber profile updated successfully.');
    } else {
      await subscriberService.createSubscriber(formData);
      showFeedback('New subscriber provisioned successfully.');
    }
    fetchSubscribers();
    fetchMetadata();
  };

  // Status Toggle
  const handleToggleStatus = async (sub) => {
    try {
      const newStatus = !sub.isActive;
      await subscriberService.toggleStatus(sub._id, newStatus);
      showFeedback(`Subscriber account ${newStatus ? 'activated' : 'deactivated'} successfully.`);
      fetchSubscribers();
      fetchMetadata();
    } catch (err) {
      showFeedback(err.message, 'error');
    }
  };

  // Reset Password
  const handleResetPassword = async (subId, newPassword) => {
    await subscriberService.resetPassword(subId, newPassword);
    showFeedback('Subscriber password reset successfully.');
  };

  // Subscription Actions Handlers
  const handleAssignTrial = async (subId, days) => {
    await subscriberService.assignTrial(subId, days);
    showFeedback(`Assigned ${days}-day Free Trial.`);
    fetchSubscribers();
    fetchMetadata();
  };

  const handleAssignComplimentary = async (subId, planName, months) => {
    await subscriberService.assignComplimentary(subId, planName, months);
    showFeedback('Complimentary subscription license granted.');
    fetchSubscribers();
    fetchMetadata();
  };

  const handleAssignDiscount = async (subId, discountPercent, notes) => {
    await subscriberService.assignDiscount(subId, discountPercent, notes);
    showFeedback(`Assigned ${discountPercent}% discount rate.`);
    fetchSubscribers();
    fetchMetadata();
  };

  const getSubscriptionBadge = (subObj) => {
    const status = subObj?.status || 'none';
    switch (status) {
      case 'active':
        return <Badge variant="nfiNavy" className="text-[10px] font-bold">Active</Badge>;
      case 'trial':
        return <Badge variant="nfiYellow" className="text-[10px] font-bold">Trial</Badge>;
      case 'complimentary':
        return <Badge variant="secondary" className="text-[10px] font-bold bg-purple-100 text-purple-800">Complimentary</Badge>;
      case 'expired':
        return <Badge variant="destructive" className="text-[10px] font-bold">Expired</Badge>;
      default:
        return <Badge variant="outline" className="text-[10px] font-bold text-slate-400">Free</Badge>;
    }
  };

  const getDynamicCredentialSummary = (sub) => {
    const dFields = sub.dynamicFields instanceof Map
      ? Object.fromEntries(sub.dynamicFields)
      : sub.dynamicFields || {};

    if (sub.userType === 'STUDENT') return `APAAR: ${dFields.apaarId || 'N/A'}`;
    if (sub.userType === 'DOCTOR' || sub.userType === 'PHARMACIST' || sub.userType === 'NURSE') {
      return `Reg: ${dFields.registrationNo || 'N/A'} (${dFields.stateCouncil || ''})`;
    }
    if (sub.userType === 'INDUSTRY') return `${dFields.companyName || ''} · GST: ${dFields.gstin || 'N/A'}`;
    return dFields.designation || 'General Public';
  };

  return (
    <PageContainer>
      {/* Header */}
      <PageHeader
        title="Public User &amp; Subscriber Management"
        subtitle="Manage registered healthcare professionals, students, researchers, institutional accounts, and subscription licenses."
      >
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            fetchMetadata();
            fetchSubscribers();
          }}
          className="rounded-xl text-xs font-semibold"
          title="Refresh table"
        >
          <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </Button>

        <PermissionGuard module="USERS" section="USERS" action="ADD">
          <Button
            variant="nfiYellow"
            size="sm"
            onClick={() => setIsCreateModalOpen(true)}
            className="rounded-xl text-xs font-bold shadow-2xs"
          >
            <Plus className="w-4 h-4 mr-1" />
            <span>Register Subscriber</span>
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
          {feedback.type === 'error' ? (
            <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
          ) : (
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
          )}
          <span className="font-semibold">{feedback.message}</span>
        </div>
      )}

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title="Total Registered Users"
          value={stats.totalUsers}
          subtitle="Public &amp; institutional accounts"
          icon={Users}
          iconColor="text-sky-600"
          iconBg="bg-sky-50"
        />

        <StatCard
          title="Active Paid Subscribers"
          value={stats.activeSubscribers}
          subtitle="Operating with full formulary access"
          icon={UserCheck}
          iconColor="text-emerald-600"
          iconBg="bg-emerald-50"
        />

        <StatCard
          title="Free Trial Users"
          value={stats.trialUsers}
          subtitle="Evaluation pass accounts"
          icon={Clock}
          iconColor="text-[#E76120]"
          iconBg="bg-[#FFF5EE]"
        />
      </div>

      {/* Advanced Multi-Filters Toolbar */}
      <div className="p-4 bg-white border border-slate-200/80 rounded-2xl shadow-2xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-[#E76120]" />
            <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider">
              Directory Search &amp; Advanced Multi-Filters
            </h4>
          </div>
          <button
            type="button"
            onClick={() => {
              setSearchQuery('');
              setUserTypeFilter('all');
              setSubscriptionFilter('all');
              setStatusFilter('all');
              setDateFrom('');
              setDateTo('');
              setCurrentPage(1);
            }}
            className="text-[11px] font-bold text-[#E76120] hover:underline cursor-pointer"
          >
            Reset All Filters
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Search Box */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search name, email, phone..."
              className="w-full h-9 pl-8 pr-3 bg-slate-50/80 border border-slate-200 rounded-xl text-xs outline-none focus:border-[#E76120]"
            />
          </div>

          {/* User Type Filter */}
          <select
            value={userTypeFilter}
            onChange={(e) => {
              setUserTypeFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="h-9 px-3 bg-slate-50/80 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 outline-none focus:border-[#E76120] cursor-pointer"
          >
            <option value="all">All User Types</option>
            {userTypes.map((t) => (
              <option key={t.code} value={t.code}>
                {t.name}
              </option>
            ))}
          </select>

          {/* Subscription Status Filter */}
          <select
            value={subscriptionFilter}
            onChange={(e) => {
              setSubscriptionFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="h-9 px-3 bg-slate-50/80 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 outline-none focus:border-[#E76120] cursor-pointer"
          >
            <option value="all">All Subscriptions</option>
            <option value="active">Active Paid</option>
            <option value="trial">Free Trial</option>
            <option value="complimentary">Complimentary</option>
            <option value="expired">Expired</option>
            <option value="none">Free Tier</option>
          </select>

          {/* Date From */}
          <div className="flex items-center gap-1.5 bg-slate-50/80 border border-slate-200 rounded-xl px-2.5 h-9">
            <span className="text-[10px] text-slate-400 font-bold uppercase">From</span>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => {
                setDateFrom(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full bg-transparent text-xs outline-none font-semibold text-slate-700"
            />
          </div>

          {/* Date To */}
          <div className="flex items-center gap-1.5 bg-slate-50/80 border border-slate-200 rounded-xl px-2.5 h-9">
            <span className="text-[10px] text-slate-400 font-bold uppercase">To</span>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => {
                setDateTo(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full bg-transparent text-xs outline-none font-semibold text-slate-700"
            />
          </div>
        </div>
      </div>

      {/* Subscribers Table */}
      <AdminTableWrapper
        title="Public Subscribers Directory"
        subtitle={`Displaying ${subscribers.length} of ${totalItems} registered subscribers.`}
        loading={loading}
        error={error}
        onRetry={fetchSubscribers}
        isEmpty={subscribers.length === 0}
        emptyTitle="No subscribers found"
        emptyDescription="No subscriber accounts match your filter criteria."
        emptyActionLabel="Register Subscriber"
        onEmptyAction={() => setIsCreateModalOpen(true)}
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={totalItems}
        itemsPerPage={10}
        onPageChange={(p) => setCurrentPage(p)}
      >
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Subscriber</TableHead>
              <TableHead>User Type</TableHead>
              <TableHead>Dynamic Credentials</TableHead>
              <TableHead>Subscription Tier</TableHead>
              <TableHead>Account Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {subscribers.map((sub) => (
              <TableRow key={sub._id}>
                {/* Identity */}
                <TableCell>
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-[#284661] text-white font-bold flex items-center justify-center text-xs shadow-2xs shrink-0">
                      {sub.name?.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <span className="font-bold text-slate-900 text-xs truncate block max-w-[170px]">
                        {sub.name}
                      </span>
                      <p className="text-[11px] text-slate-400 truncate max-w-[180px]">
                        {sub.email} {sub.phoneNumber ? `· ${sub.phoneNumber}` : ''}
                      </p>
                    </div>
                  </div>
                </TableCell>

                {/* User Type */}
                <TableCell>
                  <Badge variant="outline" className="text-[10px] font-extrabold uppercase">
                    {sub.userType}
                  </Badge>
                </TableCell>

                {/* Dynamic Credential Summary */}
                <TableCell>
                  <span className="text-xs font-semibold text-slate-700 block truncate max-w-[200px]" title={getDynamicCredentialSummary(sub)}>
                    {getDynamicCredentialSummary(sub)}
                  </span>
                </TableCell>

                {/* Subscription Status */}
                <TableCell>
                  <div className="flex items-center gap-1.5">
                    {getSubscriptionBadge(sub.subscription)}
                    {sub.subscription?.discountPercent > 0 && (
                      <span className="text-[9px] font-extrabold text-emerald-600 bg-emerald-50 px-1 py-0.5 rounded">
                        -{sub.subscription.discountPercent}%
                      </span>
                    )}
                  </div>
                </TableCell>

                {/* Account Status Toggle */}
                <TableCell>
                  <button
                    type="button"
                    onClick={() => handleToggleStatus(sub)}
                    className={`
                      inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold transition-all cursor-pointer
                      ${
                        sub.isActive
                          ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                          : 'bg-red-50 text-red-600 hover:bg-red-100'
                      }
                    `}
                    title="Toggle active status"
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        sub.isActive ? 'bg-emerald-500' : 'bg-red-500'
                      }`}
                    />
                    <span>{sub.isActive ? 'Active' : 'Inactive'}</span>
                  </button>
                </TableCell>

                {/* Actions Dropdown */}
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    {/* View Details */}
                    <button
                      type="button"
                      onClick={() => setViewingSubscriber(sub)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                      title="View Subscriber Details"
                    >
                      <Eye className="w-4 h-4" />
                    </button>

                    {/* Edit Profile */}
                    <PermissionGuard module="USERS" section="USERS" action="EDIT">
                      <button
                        type="button"
                        onClick={() => setEditingSubscriber(sub)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-[#284661] hover:bg-slate-100 transition-colors cursor-pointer"
                        title="Edit Profile"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                    </PermissionGuard>

                    {/* Manage Subscriptions */}
                    <PermissionGuard module="USERS" section="USERS" action="EDIT">
                      <button
                        type="button"
                        onClick={() => setSubscriptionSubscriber(sub)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-purple-600 hover:bg-slate-100 transition-colors cursor-pointer"
                        title="Manage Subscription / Trial / Discount"
                      >
                        <CreditCard className="w-4 h-4" />
                      </button>
                    </PermissionGuard>

                    {/* Reset Password */}
                    <PermissionGuard module="USERS" section="USERS" action="EDIT">
                      <button
                        type="button"
                        onClick={() => setResetPasswordSubscriber(sub)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-[#E76120] hover:bg-slate-100 transition-colors cursor-pointer"
                        title="Reset Password"
                      >
                        <KeyRound className="w-4 h-4" />
                      </button>
                    </PermissionGuard>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </AdminTableWrapper>

      {/* Create / Edit Subscriber Modal */}
      <CreateEditSubscriberModal
        isOpen={isCreateModalOpen || !!editingSubscriber}
        onClose={() => {
          setIsCreateModalOpen(false);
          setEditingSubscriber(null);
        }}
        subscriber={editingSubscriber}
        userTypes={userTypes}
        onSuccess={handleSaveSubscriber}
      />

      {/* Subscriber Details Dossier Modal */}
      <SubscriberDetailsModal
        isOpen={!!viewingSubscriber}
        onClose={() => setViewingSubscriber(null)}
        subscriber={viewingSubscriber}
        onEdit={(s) => setEditingSubscriber(s)}
        onManageSubscription={(s) => setSubscriptionSubscriber(s)}
      />

      {/* Assign Subscription / Trial / Discount Modal */}
      <AssignSubscriptionModal
        isOpen={!!subscriptionSubscriber}
        onClose={() => setSubscriptionSubscriber(null)}
        subscriber={subscriptionSubscriber}
        onAssignTrial={handleAssignTrial}
        onAssignComplimentary={handleAssignComplimentary}
        onAssignDiscount={handleAssignDiscount}
      />

      {/* Reset Password Dialog */}
      <ResetPasswordDialog
        isOpen={!!resetPasswordSubscriber}
        onClose={() => setResetPasswordSubscriber(null)}
        admin={resetPasswordSubscriber}
        onResetConfirm={handleResetPassword}
      />
    </PageContainer>
  );
};

export default UsersPage;
