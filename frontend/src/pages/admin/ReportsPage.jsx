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
  { id: 'users', label: '1. User Reports', icon: Users },
  { id: 'subscriptions', label: '2. Subscription Reports', icon: CreditCard },
  { id: 'content', label: '3. Content Reports', icon: BookOpen },
  { id: 'workflow', label: '4. Workflow SLA Reports', icon: GitPullRequest },
  { id: 'commerce', label: '5. Commerce Reports', icon: TrendingUp },
  { id: 'crm', label: '6. CRM & Feedback Reports', icon: MessageSquare },
];

export const ReportsPage = () => {
  const [activeDomain, setActiveDomain] = useState('users');
  const [activePreset, setActivePreset] = useState('30d');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

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

      // Concurrently fetch Executive Overview + Selected Domain Data
      let domainPromise;
      if (activeDomain === 'users') domainPromise = reportService.getUserReports(params);
      else if (activeDomain === 'subscriptions') domainPromise = reportService.getSubscriptionReports(params);
      else if (activeDomain === 'content') domainPromise = reportService.getContentReports(params);
      else if (activeDomain === 'workflow') domainPromise = reportService.getWorkflowReports(params);
      else if (activeDomain === 'commerce') domainPromise = reportService.getCommerceReports(params);
      else if (activeDomain === 'crm') domainPromise = reportService.getCRMReports(params);

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
        subtitle="Comprehensive cross-domain intelligence across Subscriber cohorts, Formulary Monographs, Editorial Workflows, Revenue, and CRM Health."
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

        <Button
          variant="outline"
          size="sm"
          onClick={() => window.print()}
          className="rounded-xl text-xs font-bold cursor-pointer"
        >
          <Printer className="w-3.5 h-3.5 mr-1.5" />
          <span>Print Sheet</span>
        </Button>
      </PageHeader>

      {/* Date Presets & Custom Filter */}
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

      {/* 6-Domain Navigation Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-slate-200">
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

      {loading ? (
        <AdminLoader text="Computing server-side aggregation pipelines &amp; timeseries charts..." />
      ) : error ? (
        <AdminErrorState
          title="Could not load report analytics"
          message={error}
          onRetry={fetchReportsData}
        />
      ) : (
        <div className="space-y-4">
          {/* ========================================================= */}
          {/* DOMAIN 1: USER REPORTS */}
          {/* ========================================================= */}
          {activeDomain === 'users' && domainData && (
            <div className="space-y-4 animate-in fade-in-0 duration-150">
              {/* 3 KPI Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                <StatCard
                  title="Total Registered Subscribers"
                  value={domainData.totalUsers || 0}
                  subtitle="Cumulative healthcare accounts"
                  icon={Users}
                  iconColor="text-[#284661]"
                  iconBg="bg-blue-50"
                />

                <StatCard
                  title="Active Verified Users"
                  value={domainData.activeUsers || 0}
                  subtitle="Platform active status"
                  icon={CheckCircle2}
                  iconColor="text-emerald-600"
                  iconBg="bg-emerald-50"
                />

                <StatCard
                  title="Inactive / Pending Verification"
                  value={domainData.inactiveUsers || 0}
                  subtitle="Requires follow-up"
                  icon={Clock}
                  iconColor="text-amber-600"
                  iconBg="bg-amber-50"
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
                    <Badge variant="outline" className="text-[9px] uppercase font-bold">
                      7-Day Trend
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
                      { label: 'Pharmacists', count: domainData.typeDistribution?.PHARMACIST || 0, color: 'bg-blue-600' },
                      { label: 'Students (Academic)', count: domainData.typeDistribution?.STUDENT || 0, color: 'bg-indigo-600' },
                      { label: 'Nurses', count: domainData.typeDistribution?.NURSE || 0, color: 'bg-teal-600' },
                      { label: 'Industry & Corporate', count: domainData.typeDistribution?.INDUSTRY || 0, color: 'bg-amber-600' },
                      { label: 'Others', count: domainData.typeDistribution?.OTHERS || 0, color: 'bg-slate-600' },
                    ]}
                    unit="users"
                  />
                </div>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* DOMAIN 2: SUBSCRIPTION REPORTS */}
          {/* ========================================================= */}
          {activeDomain === 'subscriptions' && domainData && (
            <div className="space-y-4 animate-in fade-in-0 duration-150">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                <StatCard
                  title="Total Pass Provisions"
                  value={domainData.totalSubscriptions || 0}
                  subtitle="Cumulative passes issued"
                  icon={CreditCard}
                  iconColor="text-[#284661]"
                  iconBg="bg-blue-50"
                />

                <StatCard
                  title="Active Valid Passes"
                  value={domainData.activeSubscriptions || 0}
                  subtitle="Valid through 31 Dec 2031"
                  icon={CheckCircle2}
                  iconColor="text-emerald-600"
                  iconBg="bg-emerald-50"
                />

                <StatCard
                  title="Trial Passes Active"
                  value={domainData.trialSubscriptions || 0}
                  subtitle="Evaluation licenses"
                  icon={Sparkles}
                  iconColor="text-sky-600"
                  iconBg="bg-sky-50"
                />

                <StatCard
                  title="Expired / Lapsed"
                  value={domainData.expiredSubscriptions || 0}
                  subtitle="Needs renewal"
                  icon={Clock}
                  iconColor="text-rose-600"
                  iconBg="bg-rose-50"
                />
              </div>

              {/* Tier Distribution Donut */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="p-4 bg-white border border-slate-200/80 rounded-2xl shadow-2xs space-y-3">
                  <span className="font-bold text-slate-900 text-xs block">
                    Formulary Tier Distribution
                  </span>
                  <DonutDistributionChart
                    items={[
                      { label: 'Individual', count: domainData.tierDistribution?.INDIVIDUAL || 0, color: '#284661' },
                      { label: 'Institutional', count: domainData.tierDistribution?.INSTITUTIONAL || 0, color: '#E76120' },
                      { label: 'Student Special', count: domainData.tierDistribution?.STUDENT || 0, color: '#10b981' },
                      { label: 'Commercial', count: domainData.tierDistribution?.COMMERCIAL || 0, color: '#8b5cf6' },
                    ]}
                    centerLabel="Total Passes"
                  />
                </div>

                <div className="p-4 bg-white border border-slate-200/80 rounded-2xl shadow-2xs space-y-3">
                  <span className="font-bold text-slate-900 text-xs block">
                    Compliance &amp; Validity Telemetry
                  </span>
                  <div className="p-3 bg-slate-50 rounded-xl space-y-2 text-xs text-slate-600">
                    <p>
                      ● <strong>BRD Fixed Validity Standard:</strong> All commercial passes remain active until 31 December 2031.
                    </p>
                    <p>
                      ● <strong>Auto Renewal Tracking:</strong> Server cron evaluates renewal eligibility 90 days before horizon.
                    </p>
                    <p>
                      ● <strong>Institutional Seat Quotas:</strong> Campus licenses support multi-seat authorization with transaction safety.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* DOMAIN 3: CONTENT REPORTS */}
          {/* ========================================================= */}
          {activeDomain === 'content' && domainData && (
            <div className="space-y-4 animate-in fade-in-0 duration-150">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                <StatCard
                  title="Total Monographs"
                  value={domainData.totalMonographs || 0}
                  subtitle="Formulary entries"
                  icon={BookOpen}
                  iconColor="text-[#284661]"
                  iconBg="bg-blue-50"
                />

                <StatCard
                  title="Published Editions"
                  value={domainData.publishedMonographs || 0}
                  subtitle="Live to public subscribers"
                  icon={CheckCircle2}
                  iconColor="text-emerald-600"
                  iconBg="bg-emerald-50"
                />

                <StatCard
                  title="Active Drafts"
                  value={domainData.draftMonographs || 0}
                  subtitle="In preparation"
                  icon={Clock}
                  iconColor="text-amber-600"
                  iconBg="bg-amber-50"
                />

                <StatCard
                  title="In Committee Review"
                  value={domainData.inReviewMonographs || 0}
                  subtitle="Expert scrutiny"
                  icon={GitPullRequest}
                  iconColor="text-purple-600"
                  iconBg="bg-purple-50"
                />
              </div>

              {/* Most Viewed Monographs Table */}
              <div className="bg-white border border-slate-200/80 rounded-2xl shadow-2xs overflow-hidden text-xs">
                <div className="p-4 border-b border-slate-100">
                  <span className="font-bold text-slate-900 block">
                    Most Consulted Formulary Monographs &amp; Clinical Guides
                  </span>
                </div>

                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Monograph Title</TableHead>
                      <TableHead>Therapeutic Section</TableHead>
                      <TableHead className="text-right">Consultations (Views)</TableHead>
                      <TableHead className="text-right">Bookmarks</TableHead>
                      <TableHead className="text-right">Downloads / Prints</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(domainData.topViewed || []).map((item, idx) => (
                      <TableRow key={idx}>
                        <TableCell className="font-bold text-slate-900">
                          {item.title}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-[9px] uppercase font-semibold">
                            {item.section}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right font-mono font-bold text-[#284661]">
                          {item.views.toLocaleString('en-IN')}
                        </TableCell>
                        <TableCell className="text-right font-mono text-emerald-700">
                          {item.bookmarks.toLocaleString('en-IN')}
                        </TableCell>
                        <TableCell className="text-right font-mono text-slate-600">
                          {item.downloads.toLocaleString('en-IN')}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* DOMAIN 4: WORKFLOW SLA REPORTS */}
          {/* ========================================================= */}
          {activeDomain === 'workflow' && domainData && (
            <div className="space-y-4 animate-in fade-in-0 duration-150">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                <StatCard
                  title="SLA Compliance"
                  value={`${domainData.slaComplianceRatePercent}%`}
                  subtitle="Turnaround on target"
                  icon={Award}
                  iconColor="text-emerald-600"
                  iconBg="bg-emerald-50"
                />

                <StatCard
                  title="Pending Reviews"
                  value={domainData.pendingReviews || 0}
                  subtitle="Scientific desk"
                  icon={Clock}
                  iconColor="text-amber-600"
                  iconBg="bg-amber-50"
                />

                <StatCard
                  title="Pending Approvals"
                  value={domainData.pendingApprovals || 0}
                  subtitle="Committee signing"
                  icon={GitPullRequest}
                  iconColor="text-[#284661]"
                  iconBg="bg-blue-50"
                />

                <StatCard
                  title="Avg Review Time"
                  value={`${domainData.averageReviewHours}h`}
                  subtitle="Turnaround hours"
                  icon={Clock}
                  iconColor="text-purple-600"
                  iconBg="bg-purple-50"
                />
              </div>

              {/* Reviewer SLA Table */}
              <div className="bg-white border border-slate-200/80 rounded-2xl shadow-2xs overflow-hidden text-xs">
                <div className="p-4 border-b border-slate-100">
                  <span className="font-bold text-slate-900 block">
                    Reviewer Workload &amp; Editorial Turnaround Metrics
                  </span>
                </div>

                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Reviewer Officer</TableHead>
                      <TableHead className="text-center">Currently Assigned</TableHead>
                      <TableHead className="text-center">Completed Workflows</TableHead>
                      <TableHead className="text-right">Avg Turnaround SLA</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(domainData.reviewerWorkload || []).map((rev, idx) => (
                      <TableRow key={idx}>
                        <TableCell className="font-bold text-slate-900">{rev.reviewerName}</TableCell>
                        <TableCell className="text-center font-mono font-bold text-amber-700">
                          {rev.assigned}
                        </TableCell>
                        <TableCell className="text-center font-mono font-bold text-emerald-700">
                          {rev.completed}
                        </TableCell>
                        <TableCell className="text-right font-mono font-bold text-slate-800">
                          {rev.avgTurnaroundHours} Hours
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* DOMAIN 5: COMMERCE REPORTS */}
          {/* ========================================================= */}
          {activeDomain === 'commerce' && domainData && (
            <div className="space-y-4 animate-in fade-in-0 duration-150">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                <StatCard
                  title="Gross Revenue Realized"
                  value={`₹${(domainData.totalRevenueINR || 0).toLocaleString('en-IN')}`}
                  subtitle="Total captured amount"
                  icon={TrendingUp}
                  iconColor="text-emerald-600"
                  iconBg="bg-emerald-50"
                />

                <StatCard
                  title="Completed Orders"
                  value={domainData.completedOrders || 0}
                  subtitle="Paid orders"
                  icon={CheckCircle2}
                  iconColor="text-[#284661]"
                  iconBg="bg-blue-50"
                />

                <StatCard
                  title="Average Order Value"
                  value={`₹${(domainData.averageOrderValueINR || 0).toLocaleString('en-IN')}`}
                  subtitle="AOV metric"
                  icon={CreditCard}
                  iconColor="text-[#E76120]"
                  iconBg="bg-[#FFF5EE]"
                />

                <StatCard
                  title="Total Refunds"
                  value={`₹${(domainData.totalRefundsINR || 0).toLocaleString('en-IN')}`}
                  subtitle={`${domainData.refundedOrders || 0} refunds`}
                  icon={Clock}
                  iconColor="text-rose-600"
                  iconBg="bg-rose-50"
                />
              </div>

              {/* Plan-wise Revenue Table */}
              <div className="bg-white border border-slate-200/80 rounded-2xl shadow-2xs overflow-hidden text-xs">
                <div className="p-4 border-b border-slate-100">
                  <span className="font-bold text-slate-900 block">
                    Plan-wise Commercial Revenue Distribution
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
                    {(domainData.planBreakdown || []).map((p, idx) => (
                      <TableRow key={idx}>
                        <TableCell className="font-bold text-slate-900">{p._id || 'General Plan'}</TableCell>
                        <TableCell className="text-center font-mono font-bold">{p.count}</TableCell>
                        <TableCell className="text-right font-mono font-black text-emerald-700">
                          ₹{(p.revenue || 0).toLocaleString('en-IN')}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* DOMAIN 6: CRM & FEEDBACK REPORTS */}
          {/* ========================================================= */}
          {activeDomain === 'crm' && domainData && (
            <div className="space-y-4 animate-in fade-in-0 duration-150">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                <StatCard
                  title="Total Feedback Inquiries"
                  value={domainData.totalTickets || 0}
                  subtitle="Comments filed"
                  icon={MessageSquare}
                  iconColor="text-[#284661]"
                  iconBg="bg-blue-50"
                />

                <StatCard
                  title="Resolution Rate"
                  value={`${domainData.resolutionRatePercent}%`}
                  subtitle="Triage success"
                  icon={Award}
                  iconColor="text-emerald-600"
                  iconBg="bg-emerald-50"
                />

                <StatCard
                  title="Pending Triage"
                  value={domainData.pendingTickets || 0}
                  subtitle="New inquiries"
                  icon={Clock}
                  iconColor="text-amber-600"
                  iconBg="bg-amber-50"
                />

                <StatCard
                  title="Completed &amp; Dispatched"
                  value={domainData.completedTickets || 0}
                  subtitle="Official answers sent"
                  icon={CheckCircle2}
                  iconColor="text-emerald-600"
                  iconBg="bg-emerald-50"
                />
              </div>

              {/* Feedback Categories */}
              <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-2xs space-y-3">
                <span className="font-bold text-slate-900 text-xs block">
                  Feedback Inquiries by Category
                </span>
                <BarDistributionChart
                  items={(domainData.categoryBreakdown || []).map((cat) => ({
                    label: cat._id?.replace(/_/g, ' ') || 'General',
                    count: cat.count,
                    color: 'bg-[#284661]',
                  }))}
                  unit="tickets"
                />
              </div>
            </div>
          )}
        </div>
      )}
    </PageContainer>
  );
};

export default ReportsPage;
