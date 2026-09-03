import React, { useState, useEffect, useCallback } from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  Users,
  Search,
  Filter,
  Download,
  RefreshCw,
  Eye,
  FileText,
  Clock,
  Globe,
  AlertTriangle,
  Lock,
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

import auditService from '../../services/audit.service';
import PermissionGuard from '../../components/admin/common/PermissionGuard';

// Components & Modals
import AuditStatusBadge from '../../components/admin/audit/AuditStatusBadge';
import AuditModuleBadge from '../../components/admin/audit/AuditModuleBadge';
import AuditDetailsModal from '../../components/admin/audit/AuditDetailsModal';

const MODULES = [
  { id: 'all', label: 'All Modules' },
  { id: 'AUTH', label: 'Authentication & Security' },
  { id: 'ADMINS', label: 'Staff & Admins' },
  { id: 'ROLES', label: 'Roles & Permissions' },
  { id: 'SUBSCRIBERS', label: 'Subscribers & Users' },
  { id: 'SUBSCRIPTIONS', label: 'Subscriptions' },
  { id: 'PLANS', label: 'Plans & Pricing' },
  { id: 'COUPONS', label: 'Coupons & Discounts' },
  { id: 'ORDERS', label: 'Orders & Payments' },
  { id: 'NOTIFICATIONS', label: 'Notifications' },
  { id: 'FEEDBACK', label: 'Feedback & Comments' },
  { id: 'CONTENT', label: 'Monographs & Content' },
  { id: 'SYSTEM', label: 'System & Config' },
];

export const AuditLogsPage = () => {
  const [stats, setStats] = useState({
    totalLogs: 0,
    successLogs: 0,
    failureLogs: 0,
    activeOperators: 1,
  });

  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState('');

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedModule, setSelectedModule] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  // Modals
  const [selectedLog, setSelectedLog] = useState(null);

  // Fetch KPI Stats
  const fetchStats = async () => {
    try {
      const res = await auditService.getStats({ startDate, endDate });
      if (res && res.stats) setStats(res.stats);
    } catch (err) {
      console.warn('Failed to load audit stats:', err.message);
    }
  };

  // Fetch Audit Logs
  const fetchLogs = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const res = await auditService.getAuditLogs({
        page: currentPage,
        limit: 10,
        search: searchQuery,
        module: selectedModule,
        status: selectedStatus,
        startDate,
        endDate,
      });

      if (res && res.logs) {
        setLogs(res.logs);
        setTotalPages(res.pagination?.totalPages || 1);
        setTotalItems(res.pagination?.total || 0);
      }
    } catch (err) {
      setError(err.message || 'Failed to load audit trail.');
    } finally {
      setLoading(false);
    }
  }, [currentPage, searchQuery, selectedModule, selectedStatus, startDate, endDate]);

  useEffect(() => {
    fetchStats();
  }, []);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  // Export Excel Handler
  const handleExportExcel = async () => {
    setExporting(true);
    try {
      const blob = await auditService.exportExcel({
        search: searchQuery,
        module: selectedModule,
        status: selectedStatus,
        startDate,
        endDate,
      });

      const url = window.URL.createObjectURL(new Blob([blob]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute(
        'download',
        `NFI_Audit_Trail_${new Date().toISOString().split('T')[0]}.xlsx`
      );
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error('Audit export failed:', err);
    } finally {
      setExporting(false);
    }
  };

  return (
    <PageContainer>
      {/* Header */}
      <PageHeader
        title="Centralized Security Audit Trail"
        subtitle="Tamper-evident system activity ledger tracking authentication events, role changes, commercial pricing updates, and administrative interventions."
      >
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            fetchStats();
            fetchLogs();
          }}
          className="rounded-xl text-xs font-semibold cursor-pointer"
          title="Refresh audit trail"
        >
          <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={handleExportExcel}
          loading={exporting}
          className="rounded-xl text-xs font-bold cursor-pointer"
        >
          <Download className="w-3.5 h-3.5 mr-1.5" />
          <span>Export Excel</span>
        </Button>
      </PageHeader>

      {/* 4 KPI Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard
          title="Total Audit Events"
          value={stats.totalLogs}
          subtitle="All recorded actions"
          icon={FileText}
          iconColor="text-[#284661]"
          iconBg="bg-blue-50"
        />

        <StatCard
          title="Successful Operations"
          value={stats.successLogs}
          subtitle="Authorized actions"
          icon={ShieldCheck}
          iconColor="text-emerald-600"
          iconBg="bg-emerald-50"
        />

        <StatCard
          title="Security Alerts / Failures"
          value={stats.failureLogs}
          subtitle="Unauthorized / Errors"
          icon={ShieldAlert}
          iconColor="text-rose-600"
          iconBg="bg-rose-50"
        />

        <StatCard
          title="Active Operators"
          value={stats.activeOperators}
          subtitle="Logged staff members"
          icon={Users}
          iconColor="text-[#E76120]"
          iconBg="bg-[#FFF5EE]"
        />
      </div>

      {/* Audit Logs Table with Full Pagination & Filters */}
      <AdminTableWrapper
        title="System Events & Operations Ledger"
        subtitle={`Showing page ${currentPage} of ${totalPages} (${totalItems} total events)`}
        searchQuery={searchQuery}
        onSearchChange={(val) => {
          setSearchQuery(val);
          setCurrentPage(1);
        }}
        searchPlaceholder="Search action, email, entity ID, IP..."
        filters={
          <div className="flex flex-wrap items-center gap-2">
            {/* Module Filter */}
            <select
              value={selectedModule}
              onChange={(e) => {
                setSelectedModule(e.target.value);
                setCurrentPage(1);
              }}
              className="h-9 px-3 bg-slate-50/80 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 outline-none focus:border-[#E76120] cursor-pointer"
            >
              {MODULES.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.label}
                </option>
              ))}
            </select>

            {/* Status Filter */}
            <select
              value={selectedStatus}
              onChange={(e) => {
                setSelectedStatus(e.target.value);
                setCurrentPage(1);
              }}
              className="h-9 px-3 bg-slate-50/80 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 outline-none focus:border-[#E76120] cursor-pointer"
            >
              <option value="all">All Statuses</option>
              <option value="SUCCESS">Success Only</option>
              <option value="FAILURE">Failures / Errors</option>
              <option value="WARNING">Warnings</option>
            </select>

            {/* Date Range Inputs */}
            <div className="flex items-center gap-1">
              <input
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  setCurrentPage(1);
                }}
                className="h-9 px-2 bg-slate-50/80 border border-slate-200 rounded-xl text-xs outline-none focus:border-[#E76120]"
                title="Start Date"
              />
              <span className="text-slate-400 text-xs">-</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  setCurrentPage(1);
                }}
                className="h-9 px-2 bg-slate-50/80 border border-slate-200 rounded-xl text-xs outline-none focus:border-[#E76120]"
                title="End Date"
              />
            </div>
          </div>
        }
        loading={loading}
        error={error}
        onRetry={fetchLogs}
        isEmpty={logs.length === 0}
        emptyTitle="No audit events found"
        emptyDescription="No system activity matches your current filter parameters."
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={totalItems}
        itemsPerPage={10}
        onPageChange={(p) => setCurrentPage(p)}
      >
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Timestamp</TableHead>
              <TableHead>Action &amp; Module</TableHead>
              <TableHead>Operator Identity</TableHead>
              <TableHead>Target Entity</TableHead>
              <TableHead>Client IP Address</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {logs.map((l) => (
              <TableRow key={l._id}>
                {/* Timestamp */}
                <TableCell>
                  <div className="font-mono text-slate-700">
                    <span className="font-bold block text-slate-900">
                      {new Date(l.createdAt).toLocaleTimeString('en-IN')}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {new Date(l.createdAt).toLocaleDateString('en-IN')}
                    </span>
                  </div>
                </TableCell>

                {/* Action & Module */}
                <TableCell>
                  <div>
                    <span className="font-mono font-bold text-slate-900 text-xs block">
                      {l.action}
                    </span>
                    <div className="mt-0.5">
                      <AuditModuleBadge module={l.module} />
                    </div>
                  </div>
                </TableCell>

                {/* Operator */}
                <TableCell>
                  <div>
                    <span className="font-bold text-slate-900 text-xs block truncate max-w-[160px]" title={l.userName}>
                      {l.userName}
                    </span>
                    <span className="text-[10px] text-slate-400 block truncate max-w-[160px]">
                      {l.userEmail} · <strong className="text-slate-600">{l.userRole}</strong>
                    </span>
                  </div>
                </TableCell>

                {/* Target Entity */}
                <TableCell>
                  <div>
                    <span className="font-bold text-slate-800 text-xs block">
                      {l.entity}
                    </span>
                    <span className="font-mono text-[10px] text-slate-400">
                      {l.entityId || 'N/A'}
                    </span>
                  </div>
                </TableCell>

                {/* IP Address */}
                <TableCell>
                  <span className="font-mono text-slate-700 font-bold text-xs block">
                    {l.ipAddress}
                  </span>
                  <span className="text-[10px] text-slate-400 block truncate max-w-[130px]" title={l.requestUrl}>
                    {l.requestMethod} {l.requestUrl || '/'}
                  </span>
                </TableCell>

                {/* Status */}
                <TableCell>
                  <AuditStatusBadge status={l.status} />
                </TableCell>

                {/* Actions */}
                <TableCell className="text-right">
                  <button
                    type="button"
                    onClick={() => setSelectedLog(l)}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold text-xs border border-slate-200 cursor-pointer shadow-2xs transition-all"
                  >
                    <Eye className="w-3.5 h-3.5 text-[#284661]" />
                    <span>View Details</span>
                  </button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </AdminTableWrapper>

      {/* Audit Details Modal */}
      <AuditDetailsModal
        isOpen={!!selectedLog}
        onClose={() => setSelectedLog(null)}
        log={selectedLog}
      />
    </PageContainer>
  );
};

export default AuditLogsPage;
