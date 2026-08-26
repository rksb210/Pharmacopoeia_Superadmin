import React, { useState, useEffect, useCallback } from 'react';
import {
  Ticket,
  CheckCircle2,
  Clock,
  Percent,
  Plus,
  RefreshCw,
  Search,
  Filter,
  Grid,
  List,
  Eye,
  Edit2,
  TrendingUp,
  UserPlus,
  Calendar,
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

import couponService from '../../services/coupon.service';
import PermissionGuard from '../../components/admin/common/PermissionGuard';

// Components & Modals
import CouponStatusBadge from '../../components/admin/coupons/CouponStatusBadge';
import CouponCard from '../../components/admin/coupons/CouponCard';
import CreateEditCouponModal from '../../components/admin/coupons/CreateEditCouponModal';
import CouponDetailsModal from '../../components/admin/coupons/CouponDetailsModal';
import AssignDirectDiscountModal from '../../components/admin/coupons/AssignDirectDiscountModal';

const USER_TYPES = ['STUDENT', 'DOCTOR', 'PHARMACIST', 'NURSE', 'INDUSTRY', 'OTHERS'];

export const DiscountsPage = () => {
  const [stats, setStats] = useState({
    totalCoupons: 0,
    activeCoupons: 0,
    expiredOrInactive: 0,
    totalRedemptions: 0,
    totalDiscountSavedINR: 0,
  });

  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [feedback, setFeedback] = useState({ message: '', type: '' });

  // View & Filters State
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'table'
  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'active' | 'expiring_soon' | 'depleted' | 'inactive'
  const [searchQuery, setSearchQuery] = useState('');
  const [discountTypeFilter, setDiscountTypeFilter] = useState('all');
  const [userTypeFilter, setUserTypeFilter] = useState('all');

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  // Modals State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isDirectAssignOpen, setIsDirectAssignOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState(null);
  const [viewingCoupon, setViewingCoupon] = useState(null);

  // Fetch KPI Stats
  const fetchStats = async () => {
    try {
      const res = await couponService.getStats();
      if (res && res.stats) setStats(res.stats);
    } catch (err) {
      console.warn('Failed to load discount stats:', err.message);
    }
  };

  // Fetch Coupons List
  const fetchCoupons = useCallback(async () => {
    setLoading(true);
    setError('');

    let computedStatus = 'all';
    if (activeTab === 'active') computedStatus = 'active';
    else if (activeTab === 'expiring_soon') computedStatus = 'expiring_soon';
    else if (activeTab === 'inactive') computedStatus = 'inactive';

    try {
      const res = await couponService.getCoupons({
        page: currentPage,
        limit: 12,
        search: searchQuery,
        discountType: discountTypeFilter,
        status: computedStatus,
        userType: userTypeFilter,
      });

      if (res && res.coupons) {
        setCoupons(res.coupons);
        setTotalPages(res.pagination?.totalPages || 1);
        setTotalItems(res.pagination?.total || 0);
      }
    } catch (err) {
      setError(err.message || 'Failed to load discount vouchers.');
    } finally {
      setLoading(false);
    }
  }, [currentPage, activeTab, searchQuery, discountTypeFilter, userTypeFilter]);

  useEffect(() => {
    fetchStats();
  }, []);

  useEffect(() => {
    fetchCoupons();
  }, [fetchCoupons]);

  const showFeedback = (message, type = 'success') => {
    setFeedback({ message, type });
    setTimeout(() => setFeedback({ message: '', type: '' }), 4000);
  };

  // Handlers
  const handleSaveCoupon = async (formData, editId) => {
    if (editId) {
      await couponService.updateCoupon(editId, formData);
      showFeedback('Voucher configurations updated successfully.');
    } else {
      await couponService.createCoupon(formData);
      showFeedback('New promo coupon voucher generated successfully.');
    }
    fetchCoupons();
    fetchStats();
  };

  const handleDirectAssign = async (payload) => {
    await couponService.assignDirectDiscount(payload);
    showFeedback('Personalized discount concession assigned to subscriber.');
    fetchCoupons();
    fetchStats();
  };

  const handleToggleStatus = async (c) => {
    try {
      const newStatus = !c.isActive;
      await couponService.toggleStatus(c._id, newStatus);
      showFeedback(`Coupon voucher ${newStatus ? 'activated' : 'disabled'} successfully.`);
      fetchCoupons();
      fetchStats();
    } catch (err) {
      showFeedback(err.message, 'error');
    }
  };

  return (
    <PageContainer>
      {/* Header */}
      <PageHeader
        title="Discounts &amp; Coupon Management"
        subtitle="Manage promotional discount codes, direct subscriber concessions, percentage/fixed savings, and redemption limits."
      >
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            fetchStats();
            fetchCoupons();
          }}
          className="rounded-xl text-xs font-semibold"
          title="Refresh discounts"
        >
          <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </Button>

        <PermissionGuard module="SUBSCRIPTIONS" section="DISCOUNTS" action="ADD">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsDirectAssignOpen(true)}
            className="rounded-xl text-xs font-bold"
          >
            <UserPlus className="w-4 h-4 mr-1" />
            <span>Direct User Concession</span>
          </Button>
        </PermissionGuard>

        <PermissionGuard module="SUBSCRIPTIONS" section="DISCOUNTS" action="ADD">
          <Button
            variant="nfiYellow"
            size="sm"
            onClick={() => setIsCreateModalOpen(true)}
            className="rounded-xl text-xs font-bold shadow-2xs"
          >
            <Plus className="w-4 h-4 mr-1" />
            <span>Create Promo Coupon</span>
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
          title="Total Vouchers"
          value={stats.totalCoupons}
          subtitle={`${stats.activeCoupons} active campaigns`}
          icon={Ticket}
          iconColor="text-[#284661]"
          iconBg="bg-blue-50"
        />

        <StatCard
          title="Active Coupons"
          value={stats.activeCoupons}
          subtitle="Currently redeemable"
          icon={CheckCircle2}
          iconColor="text-emerald-600"
          iconBg="bg-emerald-50"
        />

        <StatCard
          title="Total Redemptions"
          value={stats.totalRedemptions}
          subtitle="Successful checkout uses"
          icon={Percent}
          iconColor="text-[#E76120]"
          iconBg="bg-[#FFF5EE]"
        />

        <StatCard
          title="Discount Value Realized"
          value={`₹${stats.totalDiscountSavedINR?.toLocaleString('en-IN')}`}
          subtitle="Commercial savings provided"
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
            { id: 'all', label: 'All Vouchers', count: stats.totalCoupons },
            { id: 'active', label: 'Active Codes', count: stats.activeCoupons },
            { id: 'expiring_soon', label: 'Expiring Soon' },
            { id: 'inactive', label: 'Inactive / Expired', count: stats.expiredOrInactive },
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

        {/* Search & Mode Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2.5 flex-1">
            <div className="relative w-full sm:w-64">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder="Search code, campaign name..."
                className="w-full h-9 pl-8 pr-3 bg-slate-50/80 border border-slate-200 rounded-xl text-xs outline-none focus:border-[#E76120]"
              />
            </div>

            <select
              value={discountTypeFilter}
              onChange={(e) => {
                setDiscountTypeFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="h-9 px-3 bg-slate-50/80 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 outline-none focus:border-[#E76120] cursor-pointer"
            >
              <option value="all">All Calculation Modes</option>
              <option value="percentage">Percentage (%)</option>
              <option value="fixed_amount">Fixed Amount (₹)</option>
            </select>

            <select
              value={userTypeFilter}
              onChange={(e) => {
                setUserTypeFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="h-9 px-3 bg-slate-50/80 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 outline-none focus:border-[#E76120] cursor-pointer"
            >
              <option value="all">All Target Users</option>
              {USER_TYPES.map((ut) => (
                <option key={ut} value={ut}>
                  {ut}
                </option>
              ))}
            </select>
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl shrink-0 self-end sm:self-auto">
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                viewMode === 'grid'
                  ? 'bg-white text-[#284661] shadow-2xs font-bold'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
              title="Voucher Card Grid View"
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
      </div>

      {/* Loading, Error & Content */}
      {loading ? (
        <AdminLoader text="Loading promotional voucher campaigns &amp; redemption history..." />
      ) : error ? (
        <AdminErrorState
          title="Could not load discount vouchers"
          message={error}
          onRetry={fetchCoupons}
        />
      ) : coupons.length === 0 ? (
        <AdminEmptyState
          title="No vouchers found"
          description="No promotional coupons or discount concessions match your filter criteria."
          actionLabel="Create Coupon"
          onAction={() => setIsCreateModalOpen(true)}
        />
      ) : viewMode === 'grid' ? (
        /* Visual Ticket Card Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {coupons.map((c) => (
            <CouponCard
              key={c._id}
              coupon={c}
              onEdit={(coup) => setEditingCoupon(coup)}
              onViewDetails={(coup) => setViewingCoupon(coup)}
              onToggleStatus={handleToggleStatus}
            />
          ))}
        </div>
      ) : (
        /* Data Table View */
        <div className="bg-white border border-slate-200/80 rounded-2xl shadow-2xs overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code &amp; Campaign</TableHead>
                <TableHead>Discount Value</TableHead>
                <TableHead>Target Users</TableHead>
                <TableHead>Usage Progress</TableHead>
                <TableHead>Expiration Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {coupons.map((c) => (
                <TableRow key={c._id}>
                  <TableCell>
                    <div>
                      <span className="font-mono font-black text-slate-900 text-xs block">
                        {c.code}
                      </span>
                      <span className="text-[11px] text-slate-400 truncate max-w-[180px] block">
                        {c.title}
                      </span>
                    </div>
                  </TableCell>

                  <TableCell>
                    <span className="font-black text-[#E76120] text-xs">
                      {c.discountType === 'percentage'
                        ? `${c.discountValue}% OFF`
                        : `₹${c.discountValue?.toLocaleString('en-IN')} OFF`}
                    </span>
                  </TableCell>

                  <TableCell>
                    <span className="text-xs font-semibold text-slate-700">
                      {c.applicableUserTypes?.includes('ALL')
                        ? 'Universal'
                        : c.applicableUserTypes?.join(', ')}
                    </span>
                  </TableCell>

                  <TableCell>
                    <span className="text-xs text-slate-700 font-semibold">
                      {c.usageCount} / {c.usageLimit > 0 ? c.usageLimit : '∞'}
                    </span>
                  </TableCell>

                  <TableCell>
                    <span className="text-xs text-slate-600">
                      {new Date(c.endDate).toLocaleDateString('en-IN')}
                    </span>
                  </TableCell>

                  <TableCell>
                    <CouponStatusBadge coupon={c} />
                  </TableCell>

                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        type="button"
                        onClick={() => setViewingCoupon(c)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
                        title="View Dossier & Redemptions"
                      >
                        <Eye className="w-4 h-4" />
                      </button>

                      <PermissionGuard module="SUBSCRIPTIONS" section="DISCOUNTS" action="EDIT">
                        <button
                          type="button"
                          onClick={() => setEditingCoupon(c)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-[#284661] hover:bg-slate-100 cursor-pointer"
                          title="Edit Coupon"
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

      {/* Create / Edit Coupon Modal */}
      <CreateEditCouponModal
        isOpen={isCreateModalOpen || !!editingCoupon}
        onClose={() => {
          setIsCreateModalOpen(false);
          setEditingCoupon(null);
        }}
        coupon={editingCoupon}
        onSuccess={handleSaveCoupon}
      />

      {/* Direct User Concession Modal */}
      <AssignDirectDiscountModal
        isOpen={isDirectAssignOpen}
        onClose={() => setIsDirectAssignOpen(false)}
        onAssignSuccess={handleDirectAssign}
      />

      {/* Details & Redemptions Modal */}
      <CouponDetailsModal
        isOpen={!!viewingCoupon}
        onClose={() => setViewingCoupon(null)}
        coupon={viewingCoupon}
        onEdit={(coup) => setEditingCoupon(coup)}
      />
    </PageContainer>
  );
};

export default DiscountsPage;
