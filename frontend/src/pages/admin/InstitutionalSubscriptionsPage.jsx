import React, { useState, useEffect, useCallback } from 'react';
import {
  Building2,
  Users,
  GraduationCap,
  Briefcase,
  FileSpreadsheet,
  Receipt,
  Search,
  Filter,
  Eye,
  Download,
  CheckCircle2,
  XCircle,
  AlertCircle,
  RefreshCw,
  TrendingUp,
  FileText,
  Mail,
  Phone,
  Calendar,
  Layers,
  Sparkles,
} from 'lucide-react';
import PageContainer from '../../components/admin/common/PageContainer';
import PageHeader from '../../components/admin/common/PageHeader';
import StatCard from '../../components/admin/common/StatCard';
import AdminLoader from '../../components/admin/common/AdminLoader';
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

import institutionalSubscriptionService from '../../services/institutionalSubscription.service';
import bulkImportService from '../../services/bulkImport.service';
import PermissionGuard from '../../components/admin/common/PermissionGuard';
import { usePermission } from '../../context/PermissionContext';
import ExportDropdown from '../../components/admin/common/ExportDropdown';

// Modals
import BatchRosterModal from '../../components/admin/institutional/BatchRosterModal';
import BatchTaxInvoiceModal from '../../components/admin/institutional/BatchTaxInvoiceModal';

export const InstitutionalSubscriptionsPage = () => {
  const { can, isSuperAdmin } = usePermission();
  const canEdit = isSuperAdmin || can('EDIT', 'USERS', 'INSTITUTIONAL_SUBSCRIPTIONS');
  const canExport = isSuperAdmin || can('EXPORT', 'USERS', 'INSTITUTIONAL_SUBSCRIPTIONS');

  // Main Tab: 'batches' | 'members' | 'institutions'
  const [activeTab, setActiveTab] = useState('batches');

  // KPI Stats
  const [stats, setStats] = useState({
    totalEnrolledSeats: 0,
    universityBatches: 0,
    universitySeats: 0,
    industryBatches: 0,
    industrySeats: 0,
    totalInvoicedVolume: 0,
  });
  const [statsLoading, setStatsLoading] = useState(false);

  // Tab 1: Batches Ledger States
  const [batches, setBatches] = useState([]);
  const [batchLoading, setBatchLoading] = useState(false);
  const [batchTotal, setBatchTotal] = useState(0);
  const [stakeholderFilter, setStakeholderFilter] = useState('ALL'); // 'ALL' | 'UNIVERSITIES_COLLEGES' | 'INDUSTRY'
  const [batchSearch, setBatchSearch] = useState('');
  const [batchStatus, setBatchStatus] = useState('ALL');
  const [batchPage, setBatchPage] = useState(1);

  // Tab 2: Global Members States
  const [members, setMembers] = useState([]);
  const [memberLoading, setMemberLoading] = useState(false);
  const [memberTotal, setMemberTotal] = useState(0);
  const [memberSearch, setMemberSearch] = useState('');
  const [memberStakeholder, setMemberStakeholder] = useState('ALL');
  const [memberStatus, setMemberStatus] = useState('ALL');
  const [memberPage, setMemberPage] = useState(1);

  // Tab 3: Institution Master States
  const [institutions, setInstitutions] = useState([]);
  const [instLoading, setInstLoading] = useState(false);
  const [instSearch, setInstSearch] = useState('');
  const [instStakeholder, setInstStakeholder] = useState('ALL');

  // Modals
  const [activeRosterBatchId, setActiveRosterBatchId] = useState(null);
  const [activeInvoiceData, setActiveInvoiceData] = useState(null);

  // Feedback Notification
  const [feedback, setFeedback] = useState({ message: '', type: '' });

  const showFeedback = (message, type = 'success') => {
    setFeedback({ message, type });
    setTimeout(() => setFeedback({ message: '', type: '' }), 4000);
  };

  // Fetch KPI Stats
  const fetchStats = useCallback(async () => {
    setStatsLoading(true);
    try {
      const data = await institutionalSubscriptionService.getStats();
      setStats(data);
    } catch (err) {
      console.warn('Failed to load stats:', err.message);
    } finally {
      setStatsLoading(false);
    }
  }, []);

  // Fetch Batches
  const fetchBatches = useCallback(async () => {
    setBatchLoading(true);
    try {
      const res = await institutionalSubscriptionService.getBatches({
        page: batchPage,
        limit: 15,
        search: batchSearch,
        stakeholderType: stakeholderFilter,
        status: batchStatus,
      });
      if (res && res.batches) {
        setBatches(res.batches);
        setBatchTotal(res.pagination?.total || 0);
      }
    } catch (err) {
      console.warn('Failed to load batches:', err.message);
    } finally {
      setBatchLoading(false);
    }
  }, [batchPage, batchSearch, stakeholderFilter, batchStatus]);

  // Fetch Members
  const fetchMembers = useCallback(async () => {
    setMemberLoading(true);
    try {
      const res = await institutionalSubscriptionService.getMembers({
        page: memberPage,
        limit: 20,
        search: memberSearch,
        stakeholderType: memberStakeholder,
        status: memberStatus,
      });
      if (res && res.members) {
        setMembers(res.members);
        setMemberTotal(res.pagination?.total || 0);
      }
    } catch (err) {
      console.warn('Failed to load members:', err.message);
    } finally {
      setMemberLoading(false);
    }
  }, [memberPage, memberSearch, memberStakeholder, memberStatus]);

  // Fetch Institutions
  const fetchInstitutions = useCallback(async () => {
    setInstLoading(true);
    try {
      const data = await institutionalSubscriptionService.getInstitutions({
        search: instSearch,
        stakeholderType: instStakeholder,
      });
      setInstitutions(data);
    } catch (err) {
      console.warn('Failed to load institutions:', err.message);
    } finally {
      setInstLoading(false);
    }
  }, [instSearch, instStakeholder]);

  // Initial and reactive loads
  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  useEffect(() => {
    if (activeTab === 'batches') fetchBatches();
    else if (activeTab === 'members') fetchMembers();
    else if (activeTab === 'institutions') fetchInstitutions();
  }, [activeTab, fetchBatches, fetchMembers, fetchInstitutions]);

  // Toggle seat status
  const handleToggleSeat = async (memberId) => {
    if (!canEdit) return;
    try {
      const res = await institutionalSubscriptionService.toggleMemberStatus(memberId);
      showFeedback(res.message || 'Seat status toggled successfully.');
      fetchMembers();
      fetchStats();
    } catch (err) {
      showFeedback(err.message || 'Failed to toggle status.', 'error');
    }
  };

  // Download Error Report for a batch if failed rows > 0
  const handleDownloadErrorReport = async (jobId) => {
    try {
      const response = await bulkImportService.downloadErrorReport(jobId);
      const blob = new Blob([response], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Batch_Error_Report_${jobId}.xlsx`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      showFeedback(err.message || 'No error report available for this batch.', 'error');
    }
  };

  // Export Columns for Master Batches
  const batchExportColumns = [
    { header: 'Batch Ref ID', key: 'batchRef' },
    { header: 'Institution Name', key: 'institutionName' },
    { header: 'Stakeholder Type', key: 'stakeholderLabel' },
    { header: 'Coordinator Name', key: 'coordinator', format: (val) => val?.name || '—' },
    { header: 'Coordinator Email', key: 'coordinator', format: (val) => val?.email || '—' },
    { header: 'Enrolled Seats', key: 'validSeats' },
    { header: 'Failed Rows', key: 'failedRows' },
    { header: 'Invoice Number', key: 'invoice', format: (val) => val?.invoiceNumber || '—' },
    { header: 'Total Invoiced (INR)', key: 'invoice', format: (val) => `₹${val?.totalAmount?.toLocaleString('en-IN') || 0}` },
    { header: 'Execution Date', key: 'createdAt', format: (val) => val ? new Date(val).toLocaleDateString('en-IN') : '—' },
    { header: 'Status', key: 'status' },
  ];

  return (
    <PageContainer>
      {/* Header */}
      <PageHeader
        title="Institutional &amp; Bulk Subscriptions"
        subtitle="Monitor, audit, and manage cohort bulk enrollment jobs, subscriber rosters, and consolidated tax invoices provisioned by Universities, Colleges, and Industry partners."
      >
        <div className="flex items-center gap-2">
          {canExport && activeTab === 'batches' && (
            <ExportDropdown
              filename="institutional_batches_ledger_export"
              title="Institutional Cohort Batches"
              metadata={[
                { label: 'Export Date', value: new Date().toLocaleString() },
                { label: 'Total Batches', value: batchTotal },
              ]}
              columns={batchExportColumns}
              data={batches}
              onFetchData={async () => {
                const res = await institutionalSubscriptionService.getBatches({ limit: 2000 });
                return res?.batches || batches;
              }}
              onFeedback={showFeedback}
              permission={{ module: 'USERS', section: 'INSTITUTIONAL_SUBSCRIPTIONS', action: 'EXPORT' }}
            />
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              fetchStats();
              if (activeTab === 'batches') fetchBatches();
              else if (activeTab === 'members') fetchMembers();
              else if (activeTab === 'institutions') fetchInstitutions();
            }}
            className="rounded-xl text-xs font-bold cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5 mr-1" />
            <span>Refresh</span>
          </Button>
        </div>
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

      {/* TOP METRIC COUNTERS (4 KPI CARDS) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 select-none font-sans">
        <StatCard
          title="Total Enrolled Seats"
          value={stats.totalEnrolledSeats?.toLocaleString('en-IN') || '0'}
          icon={Users}
          description="Provisioned student & employee licenses"
          trend="Active Roster"
          variant="default"
        />

        <StatCard
          title="University Batches"
          value={`${stats.universityBatches || 0} Batches`}
          icon={GraduationCap}
          description={`${stats.universitySeats || 0} Academic Student Seats`}
          trend="Universities & Colleges"
          variant="primary"
        />

        <StatCard
          title="Industry Batches"
          value={`${stats.industryBatches || 0} Batches`}
          icon={Briefcase}
          description={`${stats.industrySeats || 0} Enterprise Employee Seats`}
          trend="Industry / Corporate"
          variant="warning"
        />

        <StatCard
          title="Total Invoiced Volume"
          value={`₹${stats.totalInvoicedVolume?.toLocaleString('en-IN') || '0'}`}
          icon={Receipt}
          description="Aggregate institutional billing value"
          trend="18% GST Compliant"
          variant="success"
        />
      </div>

      {/* NAVIGATION TABS STRIP */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 select-none font-sans">
        {[
          { id: 'batches', label: 'All Batches & Invoices', icon: FileSpreadsheet, count: batchTotal },
          { id: 'members', label: 'Enrolled Members Directory', icon: Users, count: memberTotal },
          { id: 'institutions', label: 'Institution Master', icon: Building2, count: institutions.length },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                isActive
                  ? 'bg-[#284661] text-white shadow-2xs'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
              {tab.count > 0 && (
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                    isActive ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
                  }`}
                >
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: ALL BATCHES & INVOICES (SEGMENTED LEDGER) */}
      {/* ========================================================================= */}
      {activeTab === 'batches' && (
        <div className="space-y-4 font-sans select-none text-xs">
          {/* Segment Filter Strip & Search */}
          <div className="p-4 bg-white border border-slate-200/80 rounded-2xl shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-3">
            {/* Segment Tabs */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
              {[
                { id: 'ALL', label: 'All Stakeholders' },
                { id: 'UNIVERSITIES_COLLEGES', label: 'Universities & Colleges', icon: GraduationCap },
                { id: 'INDUSTRY', label: 'Industry / Enterprise', icon: Briefcase },
              ].map((seg) => (
                <button
                  key={seg.id}
                  type="button"
                  onClick={() => {
                    setStakeholderFilter(seg.id);
                    setBatchPage(1);
                  }}
                  className={`px-3 py-1.5 rounded-xl font-bold transition-all whitespace-nowrap cursor-pointer ${
                    stakeholderFilter === seg.id
                      ? 'bg-[#E76120] text-white shadow-xs font-black'
                      : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200/60'
                  }`}
                >
                  {seg.label}
                </button>
              ))}
            </div>

            {/* Search Input */}
            <div className="relative w-full md:w-80">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search institution, coordinator, batch ref..."
                value={batchSearch}
                onChange={(e) => {
                  setBatchSearch(e.target.value);
                  setBatchPage(1);
                }}
                className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-[#284661]"
              />
            </div>
          </div>

          {/* Master Batches Table */}
          <div className="bg-white border border-slate-200/80 rounded-2xl shadow-2xs overflow-hidden">
            {batchLoading ? (
              <AdminLoader text="Loading institutional batch records..." />
            ) : batches.length === 0 ? (
              <AdminEmptyState
                title="No institutional batches found"
                description="No bulk cohort enrollments match the selected criteria."
              />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Batch Ref &amp; Date</TableHead>
                    <TableHead>Institution Name</TableHead>
                    <TableHead>Stakeholder Type</TableHead>
                    <TableHead>Coordinator Info</TableHead>
                    <TableHead>Seats Enrolled</TableHead>
                    <TableHead>Invoice # &amp; Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {batches.map((b) => (
                    <TableRow key={b._id}>
                      {/* Batch Ref & Date */}
                      <TableCell>
                        <span className="font-mono font-black text-slate-900 block text-xs">
                          {b.batchRef}
                        </span>
                        <span className="text-[10px] text-slate-400 block font-mono">
                          {new Date(b.createdAt).toLocaleDateString('en-IN')} · {new Date(b.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </TableCell>

                      {/* Institution Name */}
                      <TableCell>
                        <span className="font-bold text-slate-900 block text-xs">
                          {b.institutionName}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          Plan: {b.plan.code}
                        </span>
                      </TableCell>

                      {/* Stakeholder Type Badge */}
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={`text-[9px] font-bold uppercase ${
                            b.userType === 'UNIVERSITIES_COLLEGES'
                              ? 'border-blue-200 text-blue-800 bg-blue-50/50'
                              : 'border-amber-200 text-amber-800 bg-amber-50/50'
                          }`}
                        >
                          {b.userType === 'UNIVERSITIES_COLLEGES' ? (
                            <GraduationCap className="w-2.5 h-2.5 mr-1" />
                          ) : (
                            <Briefcase className="w-2.5 h-2.5 mr-1" />
                          )}
                          <span>{b.stakeholderLabel}</span>
                        </Badge>
                      </TableCell>

                      {/* Coordinator Contact */}
                      <TableCell>
                        <span className="font-semibold text-slate-800 block">
                          {b.coordinator.name}
                        </span>
                        <div className="text-[10px] text-slate-500 font-mono">
                          <span>{b.coordinator.email}</span>
                          {b.coordinator.phone && <span> · {b.coordinator.phone}</span>}
                        </div>
                      </TableCell>

                      {/* Seats Count */}
                      <TableCell>
                        <div className="flex items-center gap-1.5">
                          <span className="font-black text-emerald-700 text-sm">
                            {b.validSeats}
                          </span>
                          <span className="text-slate-400 text-[10px]">/ {b.totalRows} Seats</span>
                        </div>
                        {b.failedRows > 0 && (
                          <button
                            type="button"
                            onClick={() => handleDownloadErrorReport(b.jobId || b._id)}
                            className="text-[10px] text-red-600 font-bold hover:underline flex items-center gap-0.5 cursor-pointer"
                          >
                            <AlertCircle className="w-2.5 h-2.5" />
                            <span>{b.failedRows} Errors (Log)</span>
                          </button>
                        )}
                      </TableCell>

                      {/* Invoice # & Amount */}
                      <TableCell>
                        <span className="font-mono font-bold text-slate-900 block">
                          ₹{b.invoice.totalAmount?.toLocaleString('en-IN')}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {b.invoice.invoiceNumber}
                        </span>
                      </TableCell>

                      {/* Status */}
                      <TableCell>
                        <Badge
                          variant={b.status === 'COMPLETED' ? 'nfiNavy' : 'secondary'}
                          className="text-[9px] uppercase font-bold"
                        >
                          {b.status}
                        </Badge>
                      </TableCell>

                      {/* Actions */}
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setActiveRosterBatchId(b._id)}
                            title="View Enrolled Subscriber Roster"
                            className="rounded-lg text-xs font-semibold h-7.5 px-2.5 cursor-pointer"
                          >
                            <Users className="w-3.5 h-3.5 mr-1 text-[#284661]" />
                            <span>View Roster</span>
                          </Button>

                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setActiveInvoiceData(b)}
                            title="View Consolidated Tax Invoice"
                            className="rounded-lg text-xs font-semibold h-7.5 px-2 cursor-pointer"
                          >
                            <Receipt className="w-3.5 h-3.5 text-[#E76120]" />
                          </Button>

                          {canExport && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => institutionalSubscriptionService.exportBatchRosterCSV(b._id)}
                              title="Export Batch Roster (.CSV)"
                              className="rounded-lg text-xs font-semibold h-7.5 px-2 cursor-pointer"
                            >
                              <Download className="w-3.5 h-3.5 text-slate-600" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: ENROLLED MEMBERS DIRECTORY */}
      {/* ========================================================================= */}
      {activeTab === 'members' && (
        <div className="space-y-4 font-sans select-none text-xs">
          {/* Filter Bar */}
          <div className="p-4 bg-white border border-slate-200/80 rounded-2xl shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <div className="relative w-full md:w-80">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search by student/employee name, email, roll no..."
                  value={memberSearch}
                  onChange={(e) => {
                    setMemberSearch(e.target.value);
                    setMemberPage(1);
                  }}
                  className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-[#284661]"
                />
              </div>

              {/* Stakeholder filter */}
              <div className="flex items-center gap-1">
                {['ALL', 'UNIVERSITIES_COLLEGES', 'INDUSTRY'].map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => {
                      setMemberStakeholder(t);
                      setMemberPage(1);
                    }}
                    className={`px-2.5 py-1 rounded-xl text-[11px] font-bold transition-all cursor-pointer ${
                      memberStakeholder === t
                        ? 'bg-[#284661] text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {t === 'ALL' ? 'All' : t === 'UNIVERSITIES_COLLEGES' ? 'Colleges' : 'Industry'}
                  </button>
                ))}
              </div>
            </div>

            <div className="text-slate-400 text-xs font-mono">
              Total Enrolled Members: <span className="font-bold text-slate-800">{memberTotal}</span>
            </div>
          </div>

          {/* Members Table */}
          <div className="bg-white border border-slate-200/80 rounded-2xl shadow-2xs overflow-hidden">
            {memberLoading ? (
              <AdminLoader text="Loading enrolled subscribers..." />
            ) : members.length === 0 ? (
              <AdminEmptyState
                title="No enrolled members found"
                description="No subscriber seats match your search query."
              />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Member Name &amp; Contact</TableHead>
                    <TableHead>Parent Institution</TableHead>
                    <TableHead>Stakeholder</TableHead>
                    <TableHead>Roll No / Emp ID</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead>Subscription Pass</TableHead>
                    <TableHead className="text-right">Seat Access Toggle</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {members.map((m) => (
                    <TableRow key={m._id}>
                      <TableCell>
                        <span className="font-bold text-slate-900 block">{m.name}</span>
                        <div className="text-[10px] text-slate-400 font-mono">
                          <span>{m.email}</span>
                          {m.phoneNumber && m.phoneNumber !== '—' && (
                            <span> · {m.phoneNumber}</span>
                          )}
                        </div>
                      </TableCell>

                      <TableCell>
                        <span className="font-semibold text-slate-800 block text-xs">
                          {m.institutionName}
                        </span>
                        <span className="text-[9px] text-slate-400 font-mono">
                          Batch: {m.batchReference}
                        </span>
                      </TableCell>

                      <TableCell>
                        <Badge
                          variant="outline"
                          className={`text-[9px] font-bold uppercase ${
                            m.stakeholderType === 'UNIVERSITIES_COLLEGES'
                              ? 'border-blue-200 text-blue-800 bg-blue-50/50'
                              : 'border-amber-200 text-amber-800 bg-amber-50/50'
                          }`}
                        >
                          {m.stakeholderLabel}
                        </Badge>
                      </TableCell>

                      <TableCell className="font-mono font-bold text-slate-700">
                        {m.rollOrEmployeeId}
                      </TableCell>

                      <TableCell className="text-slate-600">
                        {m.department}
                      </TableCell>

                      <TableCell>
                        <Badge
                          variant={m.subscriptionStatus === 'active' ? 'nfiNavy' : 'secondary'}
                          className="text-[9px] uppercase font-bold"
                        >
                          {m.subscriptionStatus}
                        </Badge>
                      </TableCell>

                      <TableCell className="text-right">
                        {canEdit ? (
                          <button
                            type="button"
                            onClick={() => handleToggleSeat(m._id)}
                            className={`px-2.5 py-1 rounded-xl text-[10px] font-bold transition-all cursor-pointer ${
                              m.isActive
                                ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                                : 'bg-red-100 text-red-800 hover:bg-red-200'
                            }`}
                          >
                            {m.isActive ? 'Active (Click to Revoke)' : 'Revoked (Click to Enable)'}
                          </button>
                        ) : (
                          <Badge
                            variant={m.isActive ? 'nfiNavy' : 'destructive'}
                            className="text-[9px] uppercase font-bold"
                          >
                            {m.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: INSTITUTION MASTER OVERVIEW */}
      {/* ========================================================================= */}
      {activeTab === 'institutions' && (
        <div className="space-y-4 font-sans select-none text-xs">
          {/* Search bar */}
          <div className="p-4 bg-white border border-slate-200/80 rounded-2xl shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="relative w-full md:w-80">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search university or corporate name..."
                value={instSearch}
                onChange={(e) => setInstSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-[#284661]"
              />
            </div>

            <div className="flex items-center gap-1.5">
              {['ALL', 'UNIVERSITIES_COLLEGES', 'INDUSTRY'].map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setInstStakeholder(t)}
                  className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    instStakeholder === t
                      ? 'bg-[#284661] text-white shadow-2xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {t === 'ALL' ? 'All Registered' : t === 'UNIVERSITIES_COLLEGES' ? 'Colleges' : 'Industry'}
                </button>
              ))}
            </div>
          </div>

          {/* Institutions Table */}
          <div className="bg-white border border-slate-200/80 rounded-2xl shadow-2xs overflow-hidden">
            {instLoading ? (
              <AdminLoader text="Loading institution master records..." />
            ) : institutions.length === 0 ? (
              <AdminEmptyState
                title="No registered institutions"
                description="No universities or enterprise partners match the query."
              />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Institution Name &amp; State</TableHead>
                    <TableHead>Stakeholder Type</TableHead>
                    <TableHead>Coordinator Details</TableHead>
                    <TableHead>Batches Executed</TableHead>
                    <TableHead>Total Active Seats</TableHead>
                    <TableHead>Total Invoiced Volume</TableHead>
                    <TableHead className="text-right">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {institutions.map((inst) => (
                    <TableRow key={inst._id}>
                      <TableCell>
                        <span className="font-bold text-slate-900 block text-xs">
                          {inst.name}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {inst.state} · Tax ID: {inst.gstinOrPan}
                        </span>
                      </TableCell>

                      <TableCell>
                        <Badge
                          variant="outline"
                          className={`text-[9px] font-bold uppercase ${
                            inst.userType === 'UNIVERSITIES_COLLEGES'
                              ? 'border-blue-200 text-blue-800 bg-blue-50/50'
                              : 'border-amber-200 text-amber-800 bg-amber-50/50'
                          }`}
                        >
                          {inst.stakeholderLabel}
                        </Badge>
                      </TableCell>

                      <TableCell>
                        <span className="font-semibold text-slate-800 block">
                          {inst.coordinator.name}
                        </span>
                        <div className="text-[10px] text-slate-500 font-mono">
                          <span>{inst.coordinator.email}</span>
                          {inst.coordinator.phone && <span> · {inst.coordinator.phone}</span>}
                        </div>
                      </TableCell>

                      <TableCell className="font-mono font-bold text-slate-800 text-sm">
                        {inst.batchesCount} Batches
                      </TableCell>

                      <TableCell>
                        <div className="flex items-center gap-1.5">
                          <span className="font-black text-emerald-700 text-sm">
                            {inst.activeSeats}
                          </span>
                          <span className="text-slate-400 text-[10px]">Active Seats</span>
                        </div>
                      </TableCell>

                      <TableCell className="font-mono font-bold text-slate-900">
                        ₹{inst.totalInvoicedVolume?.toLocaleString('en-IN') || 0}
                      </TableCell>

                      <TableCell className="text-right">
                        <Badge
                          variant={inst.status === 'ACTIVE' ? 'nfiNavy' : 'secondary'}
                          className="text-[9px] uppercase font-bold"
                        >
                          {inst.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </div>
      )}

      {/* Roster Drill-Down Modal */}
      <BatchRosterModal
        isOpen={Boolean(activeRosterBatchId)}
        onClose={() => setActiveRosterBatchId(null)}
        batchId={activeRosterBatchId}
      />

      {/* Tax Invoice Modal */}
      <BatchTaxInvoiceModal
        isOpen={Boolean(activeInvoiceData)}
        onClose={() => setActiveInvoiceData(null)}
        invoice={activeInvoiceData?.invoice}
        batch={activeInvoiceData}
      />
    </PageContainer>
  );
};

export default InstitutionalSubscriptionsPage;
