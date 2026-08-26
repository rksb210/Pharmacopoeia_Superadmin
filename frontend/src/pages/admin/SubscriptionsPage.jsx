import React, { useState, useEffect, useCallback } from 'react';
import {
  CreditCard,
  CheckCircle2,
  Clock,
  Gift,
  Percent,
  AlertTriangle,
  Plus,
  Eye,
  RotateCw,
  XCircle,
  RefreshCw,
  Search,
  Filter,
  FileText,
  TrendingUp,
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

import subscriptionService from '../../services/subscription.service';
import PermissionGuard from '../../components/admin/common/PermissionGuard';

// Components & Modals
import SubscriptionStatusBadge from '../../components/admin/subscriptions/SubscriptionStatusBadge';
import AssignSubscriptionModal from '../../components/admin/subscriptions/AssignSubscriptionModal';
import SubscriptionDetailsModal from '../../components/admin/subscriptions/SubscriptionDetailsModal';
import RenewSubscriptionModal from '../../components/admin/subscriptions/RenewSubscriptionModal';
import CancelSubscriptionModal from '../../components/admin/subscriptions/CancelSubscriptionModal';

export const SubscriptionsPage = () => {
  const [stats, setStats] = useState({
    totalSubscriptions: 0,
    activeSubscriptions: 0,
    expiredSubscriptions: 0,
    trialSubscriptions: 0,
    complimentarySubscriptions: 0,
    discountedSubscriptions: 0,
    expiringSoonSubscriptions: 0,
    totalRevenueINR: 0,
  });

  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [feedback, setFeedback] = useState({ message: '', type: '' });

  // Filters State
  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'active' | 'expiring_soon' | 'trial' | 'complimentary' | 'discounted' | 'expired'
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  // Modals
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [viewingSubscription, setViewingSubscription] = useState(null);
  const [renewingSubscription, setRenewingSubscription] = useState(null);
  const [cancellingSubscription, setCancellingSubscription] = useState(null);

  // Fetch KPI Stats
  const fetchStats = async () => {
    try {
      const res = await subscriptionService.getStats();
      if (res && res.stats) setStats(res.stats);
    } catch (err) {
      console.warn('Failed to load subscription stats:', err.message);
    }
  };

  // Fetch Subscriptions Directory
  const fetchSubscriptions = useCallback(async () => {
    setLoading(true);
    setError('');

    // Determine status & type from tab vs dropdown
    let computedStatus = 'all';
    let computedType = typeFilter;

    if (activeTab === 'active') computedStatus = 'active';
    else if (activeTab === 'expired') computedStatus = 'expired';
    else if (activeTab === 'expiring_soon') computedStatus = 'expiring_soon';
    else if (activeTab === 'trial') computedType = 'trial';
    else if (activeTab === 'complimentary') computedType = 'complimentary';
    else if (activeTab === 'discounted') computedType = 'discounted';

    try {
      const res = await subscriptionService.getSubscriptions({
        page: currentPage,
        limit: 10,
        search: searchQuery,
        type: computedType,
        status: computedStatus,
        dateFrom,
        dateTo,
      });

      if (res && res.subscriptions) {
        setSubscriptions(res.subscriptions);
        setTotalPages(res.pagination?.totalPages || 1);
        setTotalItems(res.pagination?.total || 0);
      }
    } catch (err) {
      setError(err.message || 'Failed to load subscriptions.');
    } finally {
      setLoading(false);
    }
  }, [currentPage, activeTab, searchQuery, typeFilter, dateFrom, dateTo]);

  useEffect(() => {
    fetchStats();
  }, []);

  useEffect(() => {
    fetchSubscriptions();
  }, [fetchSubscriptions]);

  const showFeedback = (message, type = 'success') => {
    setFeedback({ message, type });
    setTimeout(() => setFeedback({ message: '', type: '' }), 4000);
  };

  // Handlers
  const handleAssign = async (payload) => {
    await subscriptionService.assignSubscription(payload);
    showFeedback('Subscription provisioned and activated successfully.');
    fetchSubscriptions();
    fetchStats();
  };

  const handleRenew = async (id, payload) => {
    await subscriptionService.renewSubscription(id, payload);
    showFeedback('Subscription pass renewed successfully.');
    fetchSubscriptions();
    fetchStats();
  };

  const handleCancel = async (id, reason) => {
    await subscriptionService.cancelSubscription(id, reason);
    showFeedback('Subscription deactivated and audit logged.');
    fetchSubscriptions();
    fetchStats();
  };

  const formatCurrency = (val) => {
    return `₹${(val || 0).toLocaleString('en-IN')}`;
  };

  return (
    <PageContainer>
      {/* Header */}
      <PageHeader
        title="Subscription &amp; License Management"
        subtitle="Manage commercial subscriber passes, promotional trials, VIP complimentary grants, and BRD fixed validity tracking."
      >
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            fetchStats();
            fetchSubscriptions();
          }}
          className="rounded-xl text-xs font-semibold"
          title="Refresh subscriptions"
        >
          <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </Button>

        <PermissionGuard module="SUBSCRIPTIONS" section="PLANS" action="ADD">
          <Button
            variant="nfiYellow"
            size="sm"
            onClick={() => setIsAssignModalOpen(true)}
            className="rounded-xl text-xs font-bold shadow-2xs"
          >
            <Plus className="w-4 h-4 mr-1" />
            <span>Assign Subscription</span>
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

      {/* 6 KPI Stat Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3 sm:gap-3.5">
        <StatCard
          title="Total Passes"
          value={stats.totalSubscriptions}
          subtitle="All issued licenses"
          icon={CreditCard}
          iconColor="text-sky-600"
          iconBg="bg-sky-50"
        />

        <StatCard
          title="Active Paid"
          value={stats.activeSubscriptions}
          subtitle="Valid formulary access"
          icon={CheckCircle2}
          iconColor="text-emerald-600"
          iconBg="bg-emerald-50"
        />

        <StatCard
          title="Expiring Soon"
          value={stats.expiringSoonSubscriptions}
          subtitle="< 30 days remaining"
          icon={Clock}
          iconColor="text-[#E76120]"
          iconBg="bg-[#FFF5EE]"
        />

        <StatCard
          title="Free Trials"
          value={stats.trialSubscriptions}
          subtitle="Evaluation users"
          icon={Clock}
          iconColor="text-amber-600"
          iconBg="bg-amber-50"
        />

        <StatCard
          title="Complimentary"
          value={stats.complimentarySubscriptions}
          subtitle="Institutional grants"
          icon={Gift}
          iconColor="text-purple-600"
          iconBg="bg-purple-50"
        />

        <StatCard
          title="Total Revenue"
          value={formatCurrency(stats.totalRevenueINR)}
          subtitle="Commercial collections"
          icon={TrendingUp}
          iconColor="text-emerald-600"
          iconBg="bg-emerald-50"
        />
      </div>

      {/* Filter Tabs & Advanced Search Toolbar */}
      <div className="p-4 bg-white border border-slate-200/80 rounded-2xl shadow-2xs space-y-3.5">
        {/* Quick Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none border-b border-slate-100">
          {[
            { id: 'all', label: 'All Subscriptions', count: stats.totalSubscriptions },
            { id: 'active', label: 'Active', count: stats.activeSubscriptions },
            { id: 'expiring_soon', label: 'Expiring Soon', count: stats.expiringSoonSubscriptions },
            { id: 'trial', label: 'Free Trial', count: stats.trialSubscriptions },
            { id: 'complimentary', label: 'Complimentary VIP', count: stats.complimentarySubscriptions },
            { id: 'discounted', label: 'Discounted', count: stats.discountedSubscriptions },
            { id: 'expired', label: 'Expired / Cancelled', count: stats.expiredSubscriptions },
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
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                  activeTab === tab.id ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
                }`}
              >
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Search & Date Range Toolbar */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Search Box */}
          <div className="relative lg:col-span-2">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search by Subscriber Name, Email, ID (SUB-...), or Invoice..."
              className="w-full h-9 pl-8 pr-3 bg-slate-50/80 border border-slate-200 rounded-xl text-xs outline-none focus:border-[#E76120]"
            />
          </div>

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

      {/* Subscriptions Table */}
      <AdminTableWrapper
        title="Official Subscription Passes"
        subtitle={`Displaying ${subscriptions.length} of ${totalItems} recorded subscriptions.`}
        loading={loading}
        error={error}
        onRetry={fetchSubscriptions}
        isEmpty={subscriptions.length === 0}
        emptyTitle="No subscriptions found"
        emptyDescription="No subscription records match your current filter parameters."
        emptyActionLabel="Assign Subscription"
        onEmptyAction={() => setIsAssignModalOpen(true)}
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={totalItems}
        itemsPerPage={10}
        onPageChange={(p) => setCurrentPage(p)}
      >
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Subscription &amp; Invoice</TableHead>
              <TableHead>Subscriber</TableHead>
              <TableHead>Formulary Plan &amp; Tier</TableHead>
              <TableHead>Validity (BRD 2031 Rule)</TableHead>
              <TableHead>Price &amp; Concession</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {subscriptions.map((sub) => {
              const isExpiringSoon =
                sub.status === 'active' &&
                new Date(sub.endDate) > new Date() &&
                new Date(sub.endDate) <= new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

              const is2031 =
                new Date(sub.endDate).getFullYear() >= 2031;

              return (
                <TableRow key={sub._id}>
                  {/* Subscription ID & Invoice */}
                  <TableCell>
                    <div>
                      <span className="font-mono font-bold text-slate-900 text-xs block">
                        {sub.subscriptionId}
                      </span>
                      <span className="text-[11px] text-slate-400 font-mono">
                        {sub.invoiceNumber || 'No Invoice'}
                      </span>
                    </div>
                  </TableCell>

                  {/* Subscriber Info */}
                  <TableCell>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-slate-900 text-xs truncate max-w-[160px]">
                          {sub.user?.name || 'N/A'}
                        </span>
                        <Badge variant="outline" className="text-[8px] uppercase font-bold px-1 py-0">
                          {sub.user?.userType || 'User'}
                        </Badge>
                      </div>
                      <span className="text-[11px] text-slate-400 truncate block max-w-[170px]">
                        {sub.user?.email}
                      </span>
                    </div>
                  </TableCell>

                  {/* Plan & Tier */}
                  <TableCell>
                    <div>
                      <span className="font-bold text-slate-800 text-xs truncate block max-w-[180px]">
                        {sub.planName}
                      </span>
                      <span className="text-[10px] text-slate-400 font-semibold">{sub.tier}</span>
                    </div>
                  </TableCell>

                  {/* Validity & Expiry */}
                  <TableCell>
                    <div>
                      <span className="font-bold text-slate-800 text-xs block">
                        {new Date(sub.endDate).toLocaleDateString('en-IN', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </span>
                      {is2031 ? (
                        <span className="text-[10px] font-bold text-[#284661] bg-blue-50 px-1 py-0.2 rounded inline-block mt-0.5">
                          ● Valid until 31 Dec 2031
                        </span>
                      ) : (
                        <span className="text-[10px] text-slate-400">
                          Started: {new Date(sub.startDate).toLocaleDateString('en-IN')}
                        </span>
                      )}
                    </div>
                  </TableCell>

                  {/* Price & Concession */}
                  <TableCell>
                    <div>
                      <span className="font-black text-slate-900 text-xs block">
                        ₹{sub.finalAmount?.toLocaleString('en-IN')}
                      </span>
                      {sub.discountPercent > 0 && (
                        <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1 py-0.2 rounded">
                          -{sub.discountPercent}% Concession
                        </span>
                      )}
                    </div>
                  </TableCell>

                  {/* Status Badge */}
                  <TableCell>
                    <SubscriptionStatusBadge
                      status={sub.status}
                      type={sub.type}
                      isExpiringSoon={isExpiringSoon}
                    />
                  </TableCell>

                  {/* Actions */}
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      {/* View Dossier & Timeline */}
                      <button
                        type="button"
                        onClick={() => setViewingSubscription(sub)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                        title="View Subscription Dossier & Timeline"
                      >
                        <Eye className="w-4 h-4" />
                      </button>

                      {/* Renew / Extend */}
                      {sub.status !== 'cancelled' && (
                        <PermissionGuard module="SUBSCRIPTIONS" section="PLANS" action="EDIT">
                          <button
                            type="button"
                            onClick={() => setRenewingSubscription(sub)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-[#284661] hover:bg-slate-100 transition-colors cursor-pointer"
                            title="Renew / Extend Validity"
                          >
                            <RotateCw className="w-4 h-4" />
                          </button>
                        </PermissionGuard>
                      )}

                      {/* Cancel / Deactivate */}
                      {sub.status === 'active' && (
                        <PermissionGuard module="SUBSCRIPTIONS" section="PLANS" action="DELETE">
                          <button
                            type="button"
                            onClick={() => setCancellingSubscription(sub)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-slate-100 transition-colors cursor-pointer"
                            title="Cancel / Deactivate Subscription"
                          >
                            <XCircle className="w-4 h-4" />
                          </button>
                        </PermissionGuard>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </AdminTableWrapper>

      {/* Assign Modal */}
      <AssignSubscriptionModal
        isOpen={isAssignModalOpen}
        onClose={() => setIsAssignModalOpen(false)}
        onAssignSuccess={handleAssign}
      />

      {/* Details & Timeline Modal */}
      <SubscriptionDetailsModal
        isOpen={!!viewingSubscription}
        onClose={() => setViewingSubscription(null)}
        subscription={viewingSubscription}
        onRenew={(s) => setRenewingSubscription(s)}
        onCancel={(s) => setCancellingSubscription(s)}
      />

      {/* Renew Modal */}
      <RenewSubscriptionModal
        isOpen={!!renewingSubscription}
        onClose={() => setRenewingSubscription(null)}
        subscription={renewingSubscription}
        onRenewSuccess={handleRenew}
      />

      {/* Cancel Modal */}
      <CancelSubscriptionModal
        isOpen={!!cancellingSubscription}
        onClose={() => setCancellingSubscription(null)}
        subscription={cancellingSubscription}
        onCancelSuccess={handleCancel}
      />
    </PageContainer>
  );
};

export default SubscriptionsPage;
