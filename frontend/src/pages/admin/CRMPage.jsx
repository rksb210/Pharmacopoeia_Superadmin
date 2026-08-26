import React, { useState, useEffect, useCallback } from 'react';
import {
  Users,
  CreditCard,
  Crown,
  Sparkles,
  AlertTriangle,
  RefreshCw,
  Search,
  Filter,
  Eye,
  TrendingUp,
  FileText,
  Building,
  GraduationCap,
  Stethoscope,
  Clock,
  RotateCw,
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

import crmService from '../../services/crm.service';
import PermissionGuard from '../../components/admin/common/PermissionGuard';

// Components & Modals
import CRMSegmentBadge from '../../components/admin/crm/CRMSegmentBadge';
import Customer360Modal from '../../components/admin/crm/Customer360Modal';

const USER_TYPES = [
  { id: 'all', label: 'All Healthcare Categories' },
  { id: 'DOCTOR', label: 'Doctor' },
  { id: 'PHARMACIST', label: 'Pharmacist' },
  { id: 'STUDENT', label: 'Student' },
  { id: 'NURSE', label: 'Nurse' },
  { id: 'INDUSTRY', label: 'Industry & Corporate' },
  { id: 'OTHERS', label: 'Others' },
];

const SEGMENTS = [
  { id: 'all', label: 'All Customer Segments' },
  { id: 'INSTITUTIONAL_VIP', label: 'Institutional VIP' },
  { id: 'ACTIVE_PRACTITIONER', label: 'Active Practitioners' },
  { id: 'SCHOLAR', label: 'Academic Scholars' },
  { id: 'PROMOTIONAL_TRIAL', label: 'Trialists' },
  { id: 'EXPIRING_SOON', label: 'Expiring Soon' },
  { id: 'INACTIVE_CHURNED', label: 'Inactive / Churned' },
  { id: 'LEAD_PROSPECT', label: 'Leads & Prospects' },
];

export const CRMPage = () => {
  const [stats, setStats] = useState({
    totalCustomers: 0,
    activePaidSubscribers: 0,
    trialSubscribers: 0,
    expiringSoonCount: 0,
    totalLTVINR: 0,
  });

  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filters
  const [activeSegmentTab, setActiveSegmentTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [userTypeFilter, setUserTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  // Modals
  const [selectedCustomer, setSelectedCustomer] = useState(null);

  // Fetch KPI Stats
  const fetchStats = async () => {
    try {
      const res = await crmService.getStats();
      if (res && res.stats) setStats(res.stats);
    } catch (err) {
      console.warn('Failed to load CRM stats:', err.message);
    }
  };

  // Fetch Customer Records
  const fetchCustomers = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const res = await crmService.getCustomers({
        page: currentPage,
        limit: 10,
        search: searchQuery,
        segment: activeSegmentTab,
        userType: userTypeFilter,
        status: statusFilter,
      });

      if (res && res.customers) {
        setCustomers(res.customers);
        setTotalPages(res.pagination?.totalPages || 1);
        setTotalItems(res.pagination?.total || 0);
      }
    } catch (err) {
      setError(err.message || 'Failed to load customer list.');
    } finally {
      setLoading(false);
    }
  }, [currentPage, activeSegmentTab, searchQuery, userTypeFilter, statusFilter]);

  useEffect(() => {
    fetchStats();
  }, []);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  return (
    <PageContainer>
      {/* Header */}
      <PageHeader
        title="Customer Relationship Management (CRM)"
        subtitle="Holistic 360-degree customer-centric view aggregating subscription history, lifetime spend (LTV), communication feeds, and verified credentials."
      >
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            fetchStats();
            fetchCustomers();
          }}
          className="rounded-xl text-xs font-semibold cursor-pointer"
          title="Refresh CRM"
        >
          <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </Button>
      </PageHeader>

      {/* 4 KPI Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard
          title="Total Customers"
          value={stats.totalCustomers}
          subtitle="All registered healthcare cohorts"
          icon={Users}
          iconColor="text-[#284661]"
          iconBg="bg-blue-50"
        />

        <StatCard
          title="Active Paid Passes"
          value={stats.activePaidSubscribers}
          subtitle="Valid commercial access"
          icon={CreditCard}
          iconColor="text-emerald-600"
          iconBg="bg-emerald-50"
        />

        <StatCard
          title="Trial Accounts"
          value={stats.trialSubscribers}
          subtitle="Evaluation licenses"
          icon={Sparkles}
          iconColor="text-sky-600"
          iconBg="bg-sky-50"
        />

        <StatCard
          title="Realized Lifetime Value"
          value={`₹${(stats.totalLTVINR || 0).toLocaleString('en-IN')}`}
          subtitle="Total platform gross LTV"
          icon={TrendingUp}
          iconColor="text-[#E76120]"
          iconBg="bg-[#FFF5EE]"
        />
      </div>

      {/* Filter Tabs & Toolbar */}
      <div className="p-4 bg-white border border-slate-200/80 rounded-2xl shadow-2xs space-y-3.5">
        {/* Quick Segment Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-slate-100">
          {SEGMENTS.map((seg) => (
            <button
              key={seg.id}
              type="button"
              onClick={() => {
                setActiveSegmentTab(seg.id);
                setCurrentPage(1);
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                activeSegmentTab === seg.id
                  ? 'bg-[#284661] text-white shadow-2xs'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <span>{seg.label}</span>
            </button>
          ))}
        </div>

        {/* Search & Filter Dropdowns */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search name, email, credentials..."
              className="w-full h-9 pl-8 pr-3 bg-slate-50/80 border border-slate-200 rounded-xl text-xs outline-none focus:border-[#E76120]"
            />
          </div>

          <select
            value={userTypeFilter}
            onChange={(e) => {
              setUserTypeFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="h-9 px-3 bg-slate-50/80 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 outline-none focus:border-[#E76120] cursor-pointer"
          >
            {USER_TYPES.map((u) => (
              <option key={u.id} value={u.id}>
                {u.label}
              </option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="h-9 px-3 bg-slate-50/80 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 outline-none focus:border-[#E76120] cursor-pointer"
          >
            <option value="all">All Account Statuses</option>
            <option value="active">Active Accounts</option>
            <option value="inactive">Inactive Accounts</option>
          </select>
        </div>
      </div>

      {/* Customer Data Table */}
      <div className="bg-white border border-slate-200/80 rounded-2xl shadow-2xs overflow-hidden font-sans select-none text-xs">
        {loading ? (
          <AdminLoader text="Aggregating 360-degree customer records &amp; commercial ledgers..." />
        ) : error ? (
          <AdminErrorState
            title="Could not load CRM customers"
            message={error}
            onRetry={fetchCustomers}
          />
        ) : customers.length === 0 ? (
          <AdminEmptyState
            title="No customers found"
            description="No customer records match your current filter parameters."
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Customer Profile</TableHead>
                <TableHead>Cohort Segment</TableHead>
                <TableHead>Active Formulary Pass</TableHead>
                <TableHead>Validity</TableHead>
                <TableHead>Lifetime Spend (LTV)</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {customers.map((c) => (
                <TableRow key={c._id}>
                  {/* Name & Contact */}
                  <TableCell>
                    <div>
                      <span className="font-bold text-slate-900 text-xs block truncate" title={c.name}>
                        {c.name}
                      </span>
                      <span className="text-[10px] text-slate-400 block truncate">
                        {c.email} · <strong className="text-slate-600">{c.userType}</strong>
                      </span>
                    </div>
                  </TableCell>

                  {/* Cohort Segment */}
                  <TableCell>
                    <CRMSegmentBadge segment={c.segment} />
                  </TableCell>

                  {/* Active Plan */}
                  <TableCell>
                    <div>
                      <span className="font-bold text-slate-800 text-xs block truncate max-w-[170px]" title={c.latestSubscription?.planName}>
                        {c.latestSubscription?.planName || 'None (Prospect)'}
                      </span>
                      {c.latestSubscription && (
                        <Badge variant="outline" className="text-[8px] uppercase font-semibold">
                          {c.latestSubscription.tier} Pass
                        </Badge>
                      )}
                    </div>
                  </TableCell>

                  {/* Validity */}
                  <TableCell>
                    <span className="font-bold text-[#284661] text-xs block">
                      {c.latestSubscription?.endDate
                        ? new Date(c.latestSubscription.endDate).toLocaleDateString('en-IN')
                        : 'N/A'}
                    </span>
                    {c.latestSubscription?.status === 'active' && (
                      <span className="text-[10px] text-emerald-700 font-semibold block">
                        ● Active Pass
                      </span>
                    )}
                  </TableCell>

                  {/* LTV */}
                  <TableCell>
                    <div>
                      <span className="font-black text-slate-900 text-xs block">
                        ₹{(c.totalLTVSpendINR || 0).toLocaleString('en-IN')}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {c.totalOrders || 0} Orders
                      </span>
                    </div>
                  </TableCell>

                  {/* Status */}
                  <TableCell>
                    <Badge
                      variant={c.status === 'active' ? 'nfiNavy' : 'secondary'}
                      className="text-[9px] uppercase font-bold"
                    >
                      {c.status}
                    </Badge>
                  </TableCell>

                  {/* Actions */}
                  <TableCell className="text-right">
                    <button
                      type="button"
                      onClick={() => setSelectedCustomer(c)}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold text-xs border border-slate-200 cursor-pointer shadow-2xs transition-all"
                    >
                      <Eye className="w-3.5 h-3.5 text-[#284661]" />
                      <span>360 Dossier</span>
                    </button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      {/* 360 Holistic Customer Modal */}
      <Customer360Modal
        isOpen={!!selectedCustomer}
        onClose={() => setSelectedCustomer(null)}
        customer={selectedCustomer}
      />
    </PageContainer>
  );
};

export default CRMPage;
