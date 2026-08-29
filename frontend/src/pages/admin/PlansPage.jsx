import React, { useState, useEffect, useCallback } from 'react';
import {
  Layers,
  CheckCircle2,
  Users,
  TrendingUp,
  Plus,
  RefreshCw,
  Search,
  Filter,
  Grid,
  List,
  Eye,
  Edit2,
  Calendar,
  Sparkles,
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

import planService from '../../services/plan.service';
import PermissionGuard from '../../components/admin/common/PermissionGuard';

// Components & Modals
import PlanCard from '../../components/admin/plans/PlanCard';
import CreateEditPlanModal from '../../components/admin/plans/CreateEditPlanModal';
import PlanDetailsModal from '../../components/admin/plans/PlanDetailsModal';
import PlanSubscribersModal from '../../components/admin/plans/PlanSubscribersModal';

const TIERS = ['Individual', 'Institutional', 'Student', 'Doctor Professional', 'Corporate', 'General'];

export const PlansPage = () => {
  const [stats, setStats] = useState({
    totalPlans: 0,
    activePlans: 0,
    totalActiveSubscribers: 0,
    totalRevenueINR: 0,
    averagePlanPriceINR: 0,
  });

  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [feedback, setFeedback] = useState({ message: '', type: '' });

  // View & Filter State
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'table'
  const [searchQuery, setSearchQuery] = useState('');
  const [tierFilter, setTierFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  // Modals State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState(null);
  const [viewingPlan, setViewingPlan] = useState(null);
  const [subscribersPlan, setSubscribersPlan] = useState(null);

  // Fetch KPI Stats
  const fetchStats = async () => {
    try {
      const res = await planService.getStats();
      if (res && res.stats) setStats(res.stats);
    } catch (err) {
      console.warn('Failed to load plan stats:', err.message);
    }
  };

  // Fetch Plans List
  const fetchPlans = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const res = await planService.getPlans({
        search: searchQuery,
        tier: tierFilter,
        status: statusFilter,
      });

      if (res && res.plans) {
        setPlans(res.plans);
      }
    } catch (err) {
      setError(err.message || 'Failed to load subscription plans.');
    } finally {
      setLoading(false);
    }
  }, [searchQuery, tierFilter, statusFilter]);

  useEffect(() => {
    fetchStats();
  }, []);

  useEffect(() => {
    fetchPlans();
  }, [fetchPlans]);

  const showFeedback = (message, type = 'success') => {
    setFeedback({ message, type });
    setTimeout(() => setFeedback({ message: '', type: '' }), 4000);
  };

  // Handlers
  const handleSavePlan = async (formData, editId) => {
    if (editId) {
      await planService.updatePlan(editId, formData);
      showFeedback('Plan pricing & configurations updated successfully.');
    } else {
      await planService.createPlan(formData);
      showFeedback('New subscription tier created successfully.');
    }
    fetchPlans();
    fetchStats();
  };

  const handleToggleStatus = async (p) => {
    try {
      const newStatus = !p.isActive;
      await planService.toggleStatus(p._id, newStatus);
      showFeedback(`Plan ${newStatus ? 'activated' : 'deactivated'} successfully.`);
      fetchPlans();
      fetchStats();
    } catch (err) {
      showFeedback(err.message, 'error');
    }
  };

  return (
    <PageContainer>
      {/* Header */}
      <PageHeader
        title="Plans &amp; Pricing Management"
        subtitle="Configure commercial digital formulary tiers, seat quotas, BRD validity policies, and user category eligibility."
      >
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            fetchStats();
            fetchPlans();
          }}
          className="rounded-xl text-xs font-semibold"
          title="Refresh plans"
        >
          <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </Button>

        <PermissionGuard module="SUBSCRIPTIONS" section="PLANS" action="ADD">
          <Button
            variant="nfiYellow"
            size="sm"
            onClick={() => setIsCreateModalOpen(true)}
            className="rounded-xl text-xs font-bold shadow-2xs"
          >
            <Plus className="w-4 h-4 mr-1" />
            <span>Create New Plan</span>
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
          title="Total Formulary Plans"
          value={stats.totalPlans}
          subtitle={`${stats.activePlans} active in public store`}
          icon={Layers}
          iconColor="text-[#284661]"
          iconBg="bg-blue-50"
        />

        <StatCard
          title="Active Subscribed Users"
          value={stats.totalActiveSubscribers}
          subtitle="Enrolled across all tiers"
          icon={Users}
          iconColor="text-sky-600"
          iconBg="bg-sky-50"
        />

        <StatCard
          title="Average Tier Price"
          value={`₹${stats.averagePlanPriceINR.toLocaleString('en-IN')}`}
          subtitle="Annualized catalog value"
          icon={TrendingUp}
          iconColor="text-indigo-600"
          iconBg="bg-indigo-50"
        />

        <StatCard
          title="Total Revenue Realized"
          value={`₹${stats.totalRevenueINR.toLocaleString('en-IN')}`}
          subtitle="Realized commercial collections"
          icon={TrendingUp}
          iconColor="text-emerald-600"
          iconBg="bg-emerald-50"
        />
      </div>

      {/* Search & Filter Toolbar */}
      <div className="p-4 bg-white border border-slate-200/80 rounded-2xl shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2.5 flex-1">
          {/* Search Box */}
          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search plan name, code..."
              className="w-full h-9 pl-8 pr-3 bg-slate-50/80 border border-slate-200 rounded-xl text-xs outline-none focus:border-[#E76120]"
            />
          </div>

          {/* Tier Filter */}
          <select
            value={tierFilter}
            onChange={(e) => setTierFilter(e.target.value)}
            className="h-9 px-3 bg-slate-50/80 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 outline-none focus:border-[#E76120] cursor-pointer"
          >
            <option value="all">All Tiers</option>
            {TIERS.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-9 px-3 bg-slate-50/80 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 outline-none focus:border-[#E76120] cursor-pointer"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active Only</option>
            <option value="inactive">Disabled</option>
          </select>
        </div>

        {/* View Mode Switcher */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl shrink-0 self-end sm:self-auto">
          <button
            type="button"
            onClick={() => setViewMode('grid')}
            className={`p-1.5 rounded-lg transition-all cursor-pointer ${
              viewMode === 'grid'
                ? 'bg-white text-[#284661] shadow-2xs font-bold'
                : 'text-slate-500 hover:text-slate-900'
            }`}
            title="Card Grid View"
          >
            <Grid className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => setViewMode('table')}
            className={`p-1.5 rounded-lg transition-all cursor-pointer ${
              viewMode === 'table'
                ? 'bg-white text-[#284661] shadow-2xs font-bold'
                : 'text-slate-500 hover:text-slate-900'
            }`}
            title="Data Table View"
          >
            <List className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Loading & Error States */}
      {loading ? (
        <AdminLoader text="Loading formulary pricing catalog &amp; usage statistics..." />
      ) : error ? (
        <AdminErrorState
          title="Could not load subscription plans"
          message={error}
          onRetry={fetchPlans}
        />
      ) : plans.length === 0 ? (
        <AdminEmptyState
          title="No plans found"
          description="No subscription pricing plans match your search query."
          actionLabel="Create Plan"
          onAction={() => setIsCreateModalOpen(true)}
        />
      ) : viewMode === 'grid' ? (
        /* Visual Card Grid View */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {plans.map((p) => (
            <PlanCard
              key={p._id}
              plan={p}
              onEdit={(plan) => setEditingPlan(plan)}
              onViewDetails={(plan) => setViewingPlan(plan)}
              onViewSubscribers={(plan) => setSubscribersPlan(plan)}
              onToggleStatus={handleToggleStatus}
            />
          ))}
        </div>
      ) : (
        /* High-Density Data Table View */
        <div className="bg-white border border-slate-200/80 rounded-2xl shadow-2xs overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Plan &amp; Code</TableHead>
                <TableHead>Tier</TableHead>
                <TableHead>Base Price (₹)</TableHead>
                <TableHead>Validity Policy</TableHead>
                <TableHead>Seats</TableHead>
                <TableHead>Subscribers</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {plans.map((p) => (
                <TableRow key={p._id}>
                  <TableCell>
                    <div>
                      <span className="font-bold text-slate-900 text-xs block">{p.name}</span>
                      <span className="font-mono text-slate-400 text-[10px]">{p.code}</span>
                    </div>
                  </TableCell>

                  <TableCell>
                    <Badge variant="outline" className="text-[9px] uppercase font-bold">
                      {p.tier}
                    </Badge>
                  </TableCell>

                  <TableCell>
                    <span className="font-black text-slate-900 text-xs">
                      ₹{p.priceINR?.toLocaleString('en-IN')}
                    </span>
                  </TableCell>

                  <TableCell>
                    <span className="text-xs font-semibold text-slate-700">
                      {p.validityType === 'fixed_date'
                        ? (p.fixedDate
                            ? new Date(p.fixedDate).toLocaleDateString('en-GB', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric',
                              })
                            : '31 Dec 2031')
                        : `${p.durationValue} ${p.validityType?.replace('duration_', '')}`}
                    </span>
                  </TableCell>

                  <TableCell>
                    <span className="text-xs text-slate-600">
                      {p.seatQuota === 1 ? '1 Seat' : p.seatQuota === 0 ? 'Unlimited' : `${p.seatQuota} Seats`}
                    </span>
                  </TableCell>

                  <TableCell>
                    <button
                      type="button"
                      onClick={() => setSubscribersPlan(p)}
                      className="font-bold text-[#284661] text-xs hover:underline cursor-pointer flex items-center gap-1"
                    >
                      <Users className="w-3.5 h-3.5" />
                      <span>{p.activeSubscribersCount || 0}</span>
                    </button>
                  </TableCell>

                  <TableCell>
                    <PermissionGuard module="SUBSCRIPTIONS" section="PLANS" action="EDIT">
                      <button
                        type="button"
                        onClick={() => handleToggleStatus(p)}
                        className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold cursor-pointer ${
                          p.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-200 text-slate-600'
                        }`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${p.isActive ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                        <span>{p.isActive ? 'Active' : 'Disabled'}</span>
                      </button>
                    </PermissionGuard>
                  </TableCell>

                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        type="button"
                        onClick={() => setViewingPlan(p)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
                        title="View Details & Audit Trail"
                      >
                        <Eye className="w-4 h-4" />
                      </button>

                      <PermissionGuard module="SUBSCRIPTIONS" section="PLANS" action="EDIT">
                        <button
                          type="button"
                          onClick={() => setEditingPlan(p)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-[#284661] hover:bg-slate-100 cursor-pointer"
                          title="Edit Plan"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                      </PermissionGuard>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Create / Edit Plan Modal */}
      <CreateEditPlanModal
        isOpen={isCreateModalOpen || !!editingPlan}
        onClose={() => {
          setIsCreateModalOpen(false);
          setEditingPlan(null);
        }}
        plan={editingPlan}
        onSuccess={handleSavePlan}
      />

      {/* Plan Details & Audit Modal */}
      <PlanDetailsModal
        isOpen={!!viewingPlan}
        onClose={() => setViewingPlan(null)}
        plan={viewingPlan}
        onEdit={(p) => setEditingPlan(p)}
      />

      {/* Plan Subscribers Modal */}
      <PlanSubscribersModal
        isOpen={!!subscribersPlan}
        onClose={() => setSubscribersPlan(null)}
        plan={subscribersPlan}
      />
    </PageContainer>
  );
};

export default PlansPage;
