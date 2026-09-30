import React, { useState, useEffect, useCallback } from 'react';
import {
  BarChart3,
  Users,
  CreditCard,
  BookOpen,
  GitPullRequest,
  TrendingUp,
  MessageSquare,
  Download,
  Printer,
  RefreshCw,
  Clock,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Award,
  UserCheck,
  Building2,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import PageContainer from '../../components/admin/common/PageContainer';
import PageHeader from '../../components/admin/common/PageHeader';
import StatCard from '../../components/admin/common/StatCard';
import AdminLoader from '../../components/admin/common/AdminLoader';
import AdminErrorState from '../../components/admin/common/AdminErrorState';
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

import reportService from '../../services/report.service';
import PermissionGuard from '../../components/admin/common/PermissionGuard';

// Components & Visualizations
import ReportDateRangePicker from '../../components/admin/reports/ReportDateRangePicker';
import TrendAreaChart from '../../components/admin/reports/TrendAreaChart';
import BarDistributionChart from '../../components/admin/reports/BarDistributionChart';
import DonutDistributionChart from '../../components/admin/reports/DonutDistributionChart';

const DOMAIN_TABS = [
  { id: 'users', label: '1. User & Stakeholder Reports', icon: Users },
  { id: 'commerce', label: '2. Commercial & Revenue', icon: TrendingUp },
  { id: 'subscriptions', label: '3. Subscription & Pass Reports', icon: CreditCard },
  { id: 'workflow', label: '4. Bulk Institutional Reports', icon: Building2 },
];

export const ReportsPage = () => {
  const [activeDomain, setActiveDomain] = useState('users');
  const [activePreset, setActivePreset] = useState('all_time');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Bulk Institutional table pagination
  const [bulkPage, setBulkPage] = useState(1);
  const BULK_PAGE_SIZE = 10;

  // Data states
  const [executiveOverview, setExecutiveOverview] = useState(null);
  const [domainData, setDomainData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState('');

  // Calculate Dates for Preset
  const handlePresetSelect = (presetId) => {
    setActivePreset(presetId);
    const now = new Date();
    let start = new Date();

    if (presetId === '7d') {
      start.setDate(now.getDate() - 7);
    } else if (presetId === '30d') {
      start.setDate(now.getDate() - 30);
    } else if (presetId === '90d') {
      start.setDate(now.getDate() - 90);
    } else if (presetId === 'this_year') {
      start = new Date(now.getFullYear(), 0, 1);
    } else if (presetId === 'all_time') {
      setStartDate('');
      setEndDate('');
      return;
    }

    setStartDate(start.toISOString().split('T')[0]);
    setEndDate(now.toISOString().split('T')[0]);
  };

  const fetchReportsData = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const params = { startDate, endDate };

      // Reset pagination when reports refresh
      setBulkPage(1);

      // Concurrently fetch Executive Overview + Selected Domain Data
      let domainPromise;
      if (activeDomain === 'users') domainPromise = reportService.getUserReports(params);
      else if (activeDomain === 'commerce') domainPromise = reportService.getCommerceReports(params);
      else if (activeDomain === 'subscriptions') domainPromise = reportService.getSubscriptionReports(params);
      else if (activeDomain === 'workflow') domainPromise = reportService.getWorkflowReports(params);
      else domainPromise = reportService.getUserReports(params);

      const [overviewRes, domainRes] = await Promise.all([
        reportService.getOverview(params),
        domainPromise,
      ]);

      if (overviewRes && overviewRes.overview) {
        setExecutiveOverview(overviewRes.overview);
      }
      if (domainRes && domainRes.data) {
        setDomainData(domainRes.data);
      }
    } catch (err) {
      setError(err.message || 'Failed to load report analytics.');
    } finally {
      setLoading(false);
    }
  }, [activeDomain, startDate, endDate]);

  useEffect(() => {
    fetchReportsData();
  }, [fetchReportsData]);

  // Export Excel Handler
  const handleExportExcel = async () => {
    setExporting(true);
    try {
      const blob = await reportService.exportExcel(activeDomain, { startDate, endDate });
      const url = window.URL.createObjectURL(new Blob([blob]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute(
        'download',
        `NFI_${activeDomain.toUpperCase()}_Report_${new Date().toISOString().split('T')[0]}.xlsx`
      );
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error('Export error:', err);
    } finally {
      setExporting(false);
    }
  };

  return (
    <PageContainer>
      {/* Header */}
      <PageHeader
        title="Reports &amp; Analytics Engine"
        subtitle="Comprehensive cross-domain intelligence across Commercial Revenue, Formulary Subscriptions, Registered Users &amp; Healthcare Categories, and Institutional Bulk Rosters."
      >
        <Button
          variant="outline"
          size="sm"
          onClick={fetchReportsData}
          className="rounded-xl text-xs font-semibold cursor-pointer"
          title="Refresh analytics"
        >
          <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </Button>

        <PermissionGuard module="SYSTEM" section="REPORTS" action="EXPORT">
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
        </PermissionGuard>

        <PermissionGuard module="SYSTEM" section="REPORTS" action="PRINT">
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.print()}
            className="rounded-xl text-xs font-bold cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5 mr-1.5" />
            <span>Print Sheet</span>
          </Button>
        </PermissionGuard>
      </PageHeader>

      {/* Date Presets & Custom Filter */}
      <div className="print:hidden">
        <ReportDateRangePicker
          activePreset={activePreset}
          onSelectPreset={handlePresetSelect}
          startDate={startDate}
          endDate={endDate}
          onStartDateChange={(val) => {
            setActivePreset('custom');
            setStartDate(val);
          }}
          onEndDateChange={(val) => {
            setActivePreset('custom');
            setEndDate(val);
          }}
        />
      </div>

      {/* 4-Domain Navigation Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-slate-200 print:hidden">
        {DOMAIN_TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeDomain === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveDomain(tab.id)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-2 ${
                isActive
                  ? 'bg-[#284661] text-white shadow-2xs'
                  : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200/80'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Print-only Official Header */}
      <div className="hidden print:block p-4 mb-3 border-b-2 border-slate-900 bg-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#284661] text-white flex items-center justify-center font-bold text-sm">
              NFI
            </div>
            <div>
              <h2 className="text-base font-black text-slate-900 leading-tight">Indian Pharmacopoeia Commission</h2>
              <p className="text-[11px] text-slate-500">Ministry of Health &amp; Family Welfare, Govt. of India</p>
            </div>
          </div>
          <div className="text-right text-[11px] text-slate-600">
            <p className="font-bold text-slate-900">Official Reports &amp; Analytics Ledger</p>
            <p>Domain: <span className="font-semibold uppercase">{DOMAIN_TABS.find((t) => t.id === activeDomain)?.label || activeDomain}</span></p>
            <p className="text-[10px] text-slate-400">Printed: {new Date().toLocaleString('en-IN')}</p>
          </div>
        </div>
      </div>

      {loading ? (
        <AdminLoader text="Computing server-side aggregation pipelines &amp; timeseries charts..." />
      ) : error ? (
        <AdminErrorState
          title="Could not load report analytics"
          message={error}
          onRetry={fetchReportsData}
        />
      ) : (
        <div className="printable-report space-y-4">
          {/* ========================================================= */}
          {/* ========================================================= */}
          {/* DOMAIN: USER & STAKEHOLDER REPORTS */}
          {/* ========================================================= */}
          {activeDomain === 'users' && domainData && (
            <div className="space-y-4 animate-in fade-in-0 duration-150">
              {/* 4 KPI Cards Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                <StatCard
                  title="Total Registered Subscribers"
                  value={domainData.totalUsers || 0}
                  subtitle="Public & institutional accounts"
                  icon={Users}
                  iconColor="text-sky-600"
                  iconBg="bg-sky-50"
                />

                <StatCard
                  title="Active Paid Subscribers"
                  value={domainData.activePaidSubscribers || 0}
                  subtitle="Valid formulary access (till 2031)"
                  icon={CheckCircle2}
                  iconColor="text-emerald-600"
                  iconBg="bg-emerald-50"
                />

                <StatCard
                  title="Unsubscribed (Prospects)"
                  value={domainData.unsubscribedUsers || 0}
                  subtitle="Registered without active pass"
                  icon={Users}
                  iconColor="text-slate-600"
                  iconBg="bg-slate-100"
                />

                <StatCard
                  title="Account Status Active"
                  value={domainData.activeAccounts || 0}
                  subtitle={`${domainData.inactiveAccounts || 0} deactivated accounts`}
                  icon={UserCheck}
                  iconColor="text-[#284661]"
                  iconBg="bg-blue-50"
                />
              </div>

              {/* Chart Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Registration Timeseries */}
                <div className="p-4 bg-white border border-slate-200/80 rounded-2xl shadow-2xs space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 text-xs">
                      Subscriber Registration Velocity
                    </span>
                    <Badge variant="outline" className="text-[9px] uppercase font-bold text-[#E76120] border-[#E76120]/30 bg-[#FFF5EE]">
                      Real-time Velocity
                    </Badge>
                  </div>
                  <TrendAreaChart
                    data={domainData.trends || []}
                    strokeColor="#E76120"
                    unit="subscribers"
                  />
                </div>

                {/* Healthcare Category Distribution */}
                <div className="p-4 bg-white border border-slate-200/80 rounded-2xl shadow-2xs space-y-3">
                  <span className="font-bold text-slate-900 text-xs block">
                    Healthcare Category Cohort Breakdown
                  </span>
                  <BarDistributionChart
                    items={[
                      { label: 'Doctors', count: domainData.typeDistribution?.DOCTOR || 0, color: 'bg-emerald-600' },
                      { label: 'Students (Academic)', count: domainData.typeDistribution?.STUDENT || 0, color: 'bg-indigo-600' },
                      { label: 'Nurses', count: domainData.typeDistribution?.NURSE || 0, color: 'bg-teal-600' },
                      { label: 'Pharmacists', count: domainData.typeDistribution?.PHARMACIST || 0, color: 'bg-blue-600' },
                      { label: 'Other Health Care Professional', count: domainData.typeDistribution?.OTHERS || 0, color: 'bg-slate-600' },
                      { label: 'Industry & Corporate', count: domainData.typeDistribution?.INDUSTRY || 0, color: 'bg-amber-600' },
                      { label: 'Hospitals', count: domainData.typeDistribution?.HOSPITALS || 0, color: 'bg-rose-600' },
                      { label: 'Universities / Colleges', count: domainData.typeDistribution?.UNIVERSITIES_COLLEGES || 0, color: 'bg-purple-600' },
                      { label: 'Retail Pharmacists', count: domainData.typeDistribution?.RETAIL_PHARMACIST || 0, color: 'bg-cyan-600' },
                    ]}
                    unit="users"
                  />
                </div>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* DOMAIN: SUBSCRIPTION & PASS REPORTS */}
          {/* ========================================================= */}
          {activeDomain === 'subscriptions' && domainData && (
            <div className="space-y-4 animate-in fade-in-0 duration-150">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                <StatCard
                  title="Total Active Passes"
                  value={domainData.activeSubscriptions || 0}
                  subtitle="Valid access through 2031"
                  icon={CheckCircle2}
                  iconColor="text-emerald-600"
                  iconBg="bg-emerald-50"
                />

                <StatCard
                  title="Digital / Online Passes"
                  value={domainData.onlineSubscriptions || 0}
                  subtitle="Full formulary database access"
                  icon={CreditCard}
                  iconColor="text-sky-600"
                  iconBg="bg-sky-50"
                />

                <StatCard
                  title="Physical Copy Orders"
                  value={domainData.physicalSubscriptions || 0}
                  subtitle="Printed pharmacopoeia books"
                  icon={BookOpen}
                  iconColor="text-[#E76120]"
                  iconBg="bg-[#FFF5EE]"
                />

                <StatCard
                  title="Institutional / Bulk Passes"
                  value={domainData.institutionalSubscriptions || 0}
                  subtitle="College & hospital rosters"
                  icon={Building2}
                  iconColor="text-[#284661]"
                  iconBg="bg-blue-50"
                />
              </div>

              {/* Charts Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* 1. Pass Format Distribution Donut */}
                <div className="p-4 bg-white border border-slate-200/80 rounded-2xl shadow-2xs space-y-3">
                  <span className="font-bold text-slate-900 text-xs block">
                    Pass Format Distribution
                  </span>
                  <DonutDistributionChart
                    items={[
                      { label: 'Digital Online Access', count: domainData.formatDistribution?.digitalOnline || 0, color: '#284661' },
                      { label: 'Printed Physical Book', count: domainData.formatDistribution?.physicalBook || 0, color: '#E76120' },
                      { label: 'Institutional / Bulk Roster', count: domainData.formatDistribution?.institutionalRoster || 0, color: '#10b981' },
                    ]}
                    centerLabel="Pass Formats"
                  />
                </div>

                {/* 2. Plan-wise Allocation Bar Chart */}
                <div className="p-4 bg-white border border-slate-200/80 rounded-2xl shadow-2xs space-y-3">
                  <span className="font-bold text-slate-900 text-xs block">
                    Plan-wise Subscription Allocation
                  </span>
                  {domainData.planBreakdown && domainData.planBreakdown.length > 0 ? (
                    <BarDistributionChart
                      items={(domainData.planBreakdown || []).map((p, idx) => ({
                        label: p.label,
                        count: p.count,
                        color: idx % 2 === 0 ? 'bg-[#284661]' : 'bg-[#E76120]',
                      }))}
                      unit="passes"
                    />
                  ) : (
                    <div className="p-3 bg-slate-50 rounded-xl space-y-2 text-xs text-slate-600">
                      <p>
                        ● <strong>BRD Fixed Validity Standard:</strong> All commercial passes remain active through the fixed edition horizon (2031).
                      </p>
                      <p>
                        ● <strong>Dynamic Concessions:</strong> Direct 0-100% custom concessions with audit tracking.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}



          {/* ========================================================= */}
          {/* DOMAIN 4: BULK SUBSCRIPTION REPORTS */}
          {/* ========================================================= */}
          {activeDomain === 'workflow' && domainData && (
            <div className="space-y-4 animate-in fade-in-0 duration-150">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                <StatCard
                  title="Total Bulk Jobs"
                  value={domainData.totalJobs || 0}
                  subtitle="All batch roster imports"
                  icon={Building2}
                  iconColor="text-sky-600"
                  iconBg="bg-sky-50"
                />

                <StatCard
                  title="Total Records Processed"
                  value={domainData.totalProcessedRows || 0}
                  subtitle="Uploaded subscriber rows"
                  icon={CheckCircle2}
                  iconColor="text-emerald-600"
                  iconBg="bg-emerald-50"
                />

                <StatCard
                  title="Successful Enrollments"
                  value={domainData.successfulEnrollments || 0}
                  subtitle={`${domainData.successRatePercent || 100}% batch success rate`}
                  icon={Users}
                  iconColor="text-[#284661]"
                  iconBg="bg-blue-50"
                />

                <StatCard
                  title="Failed / Skipped Records"
                  value={domainData.failedRows || 0}
                  subtitle="Format or validation errors"
                  icon={AlertTriangle}
                  iconColor="text-rose-600"
                  iconBg="bg-rose-50"
                />
              </div>

              {/* Recent Batch Imports Table with 10-row pagination */}
              {(() => {
                const bulkJobsList = domainData.recentJobs || [];
                const totalBulkItems = bulkJobsList.length;
                const totalBulkPages = Math.ceil(totalBulkItems / BULK_PAGE_SIZE) || 1;
                const paginatedBulkJobs = bulkJobsList.slice(
                  (bulkPage - 1) * BULK_PAGE_SIZE,
                  bulkPage * BULK_PAGE_SIZE
                );
                const startBulkIndex = totalBulkItems === 0 ? 0 : (bulkPage - 1) * BULK_PAGE_SIZE + 1;
                const endBulkIndex = Math.min(bulkPage * BULK_PAGE_SIZE, totalBulkItems);

                return (
                  <div className="bg-white border border-slate-200/80 rounded-2xl shadow-2xs overflow-hidden text-xs">
                    <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                      <div>
                        <span className="font-bold text-slate-900 block">
                          Recent Bulk Batch Import Jobs &amp; Roster Allocations
                        </span>
                        <span className="text-[11px] text-slate-400">
                          Audit trail of university cohorts, hospital teams, and corporate batch imports
                        </span>
                      </div>
                      <Badge variant="outline" className="text-[10px] font-bold">
                        {totalBulkItems} Total Batches
                      </Badge>
                    </div>

                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Job ID</TableHead>
                          <TableHead>Institution / Batch Name</TableHead>
                          <TableHead>Plan Assigned</TableHead>
                          <TableHead className="text-center">Total Rows</TableHead>
                          <TableHead className="text-center">Enrolled (Valid)</TableHead>
                          <TableHead className="text-center">Skipped (Invalid)</TableHead>
                          <TableHead className="text-center">Status</TableHead>
                          <TableHead className="text-right">Date</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {totalBulkItems === 0 ? (
                          <TableRow>
                            <TableCell colSpan={8} className="text-center py-8 text-slate-400">
                              No bulk import batches processed in this date range.
                            </TableCell>
                          </TableRow>
                        ) : (
                          paginatedBulkJobs.map((job) => (
                            <TableRow key={job._id || job.jobId}>
                              <TableCell className="font-mono font-bold text-[#284661]">
                                {job.jobId}
                              </TableCell>
                              <TableCell className="font-bold text-slate-900">
                                {job.institutionName || 'Institutional Consortium'}
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline" className="text-[9px] uppercase font-semibold">
                                  {job.planName || 'Universal Access Pass'}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-center font-mono font-bold text-slate-700">
                                {job.totalRows || 0}
                              </TableCell>
                              <TableCell className="text-center font-mono font-bold text-emerald-700">
                                {job.validCount || 0}
                              </TableCell>
                              <TableCell className="text-center font-mono font-bold text-rose-600">
                                {job.invalidCount || 0}
                              </TableCell>
                              <TableCell className="text-center">
                                <Badge
                                  variant={
                                    job.status === 'completed'
                                      ? 'nfiNavy'
                                      : job.status === 'processing'
                                      ? 'nfiYellow'
                                      : 'secondary'
                                  }
                                  className="text-[9px] uppercase font-bold"
                                >
                                  {job.status}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-right font-mono text-slate-500">
                                {new Date(job.createdAt).toLocaleDateString('en-IN', {
                                  day: '2-digit',
                                  month: 'short',
                                  year: 'numeric',
                                })}
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>

                    {/* Pagination Footer */}
                    {totalBulkItems > 0 && (
                      <div className="px-4 py-3 border-t border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-500">
                        <div>
                          Showing <span className="font-semibold text-slate-700">{startBulkIndex}</span> to{' '}
                          <span className="font-semibold text-slate-700">{endBulkIndex}</span> of{' '}
                          <span className="font-semibold text-slate-700">{totalBulkItems}</span> batches
                        </div>

                        {totalBulkPages > 1 && (
                          <div className="flex items-center gap-1.5 self-end sm:self-auto">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setBulkPage((prev) => Math.max(1, prev - 1))}
                              disabled={bulkPage <= 1}
                              className="h-8 px-2.5 rounded-lg text-xs"
                              title="Previous page"
                            >
                              <ChevronLeft className="w-3.5 h-3.5 mr-1" />
                              <span>Previous</span>
                            </Button>

                            <span className="px-3 py-1 bg-white border border-slate-200 rounded-lg font-bold text-slate-800 text-xs shadow-2xs">
                              {bulkPage} / {totalBulkPages}
                            </span>

                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setBulkPage((prev) => Math.min(totalBulkPages, prev + 1))}
                              disabled={bulkPage >= totalBulkPages}
                              className="h-8 px-2.5 rounded-lg text-xs"
                              title="Next page"
                            >
                              <span>Next</span>
                              <ChevronRight className="w-3.5 h-3.5 ml-1" />
                            </Button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
          )}

          {/* ========================================================= */}
          {/* DOMAIN 5: COMMERCE REPORTS */}
          {/* ========================================================= */}
          {activeDomain === 'commerce' && domainData && (
            <div className="space-y-4 animate-in fade-in-0 duration-150">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                <StatCard
                  title="Gross Revenue Realized"
                  value={`₹${(domainData.totalRevenueINR || 0).toLocaleString('en-IN')}`}
                  subtitle="Total successful payments"
                  icon={TrendingUp}
                  iconColor="text-emerald-600"
                  iconBg="bg-emerald-50"
                />

                <StatCard
                  title="Completed Orders"
                  value={domainData.completedOrders || 0}
                  subtitle="Settled transactions"
                  icon={CheckCircle2}
                  iconColor="text-[#284661]"
                  iconBg="bg-blue-50"
                />

                {/* <StatCard
                  title="Average Order Value"
                  value={`₹${(domainData.averageOrderValueINR || 0).toLocaleString('en-IN')}`}
                  subtitle="Per successful order"
                  icon={CreditCard}
                  iconColor="text-[#E76120]"
                  iconBg="bg-[#FFF5EE]"
                /> */}

                <StatCard
                  title="Failed Orders"
                  value={domainData.failedOrders || 0}
                  subtitle="Unsuccessful transactions"
                  icon={AlertTriangle}
                  iconColor="text-rose-600"
                  iconBg="bg-rose-50"
                />
              </div>

              {/* Plan-wise Revenue Table */}
              <div className="bg-white border border-slate-200/80 rounded-2xl shadow-2xs overflow-hidden text-xs">
                <div className="p-4 border-b border-slate-100">
                  <span className="font-bold text-slate-900 block">
                    Plan-wise Total Sales Distribution
                  </span>
                </div>

                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Plan Package Name</TableHead>
                      <TableHead className="text-center">Orders Count</TableHead>
                      <TableHead className="text-right">Realized Gross Revenue (INR)</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(!domainData.planBreakdown || domainData.planBreakdown.length === 0) ? (
                      <TableRow>
                        <TableCell colSpan={3} className="text-center py-6 text-slate-400">
                          No commercial orders recorded in this date range.
                        </TableCell>
                      </TableRow>
                    ) : (
                      domainData.planBreakdown.map((p, idx) => (
                        <TableRow key={idx}>
                          <TableCell className="font-bold text-slate-900">{p._id || 'Universal Access Pass'}</TableCell>
                          <TableCell className="text-center font-mono font-bold">{p.count}</TableCell>
                          <TableCell className="text-right font-mono font-black text-emerald-700">
                            ₹{(p.revenue || 0).toLocaleString('en-IN')}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>

              {/* Recent Orders Table */}
              {domainData.recentOrders && domainData.recentOrders.length > 0 && (
                <div className="bg-white border border-slate-200/80 rounded-2xl shadow-2xs overflow-hidden text-xs">
                  <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                    <span className="font-bold text-slate-900 block">
                      Recent Commercial Orders &amp; Invoices
                    </span>
                    <Badge variant="outline" className="text-[10px] font-bold">
                      {domainData.recentOrders.length} Recent Transactions
                    </Badge>
                  </div>

                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Order #</TableHead>
                        <TableHead>Invoice #</TableHead>
                        <TableHead>Subscriber</TableHead>
                        <TableHead>Plan</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                        <TableHead className="text-center">Payment Status</TableHead>
                        <TableHead className="text-right">Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {domainData.recentOrders.map((order) => (
                        <TableRow key={order._id || order.orderNumber}>
                          <TableCell className="font-mono font-bold text-[#284661]">
                            {order.orderNumber}
                          </TableCell>
                          <TableCell className="font-mono text-slate-600">
                            {order.invoiceNumber || '—'}
                          </TableCell>
                          <TableCell className="font-bold text-slate-900">
                            {order.userName}
                          </TableCell>
                          <TableCell className="text-slate-600">
                            {order.planName || 'Universal Access Pass'}
                          </TableCell>
                          <TableCell className="text-right font-mono font-bold text-emerald-700">
                            ₹{(order.pricing?.totalAmount || 0).toLocaleString('en-IN')}
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge
                              variant={
                                order.paymentStatus === 'success' || order.orderStatus === 'completed'
                                  ? 'nfiNavy'
                                  : order.paymentStatus === 'failed'
                                  ? 'destructive'
                                  : 'secondary'
                              }
                              className="text-[9px] uppercase font-bold"
                            >
                              {order.paymentStatus || order.orderStatus}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right font-mono text-slate-500">
                            {new Date(order.createdAt).toLocaleDateString('en-IN', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric',
                            })}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>
          )}

        </div>
      )}
    </PageContainer>
  );
};

export default ReportsPage;
