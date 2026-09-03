import React, { useState, useEffect, useCallback } from 'react';
import {
  Users,
  UserCheck,
  FileText,
  Clock,
  CheckCircle2,
  AlertTriangle,
  TrendingUp,
  CreditCard,
  Layers,
  Calendar,
  RefreshCw,
  Plus,
  ArrowRight,
  Shield,
  FileEdit,
  GitPullRequest,
  CheckCircle,
  Building2,
  Ticket,
  MessageSquare,
} from 'lucide-react';
import PageContainer from '../../components/admin/common/PageContainer';
import PageHeader from '../../components/admin/common/PageHeader';
import StatCard from '../../components/admin/common/StatCard';
import AdminLoader from '../../components/admin/common/AdminLoader';
import AdminErrorState from '../../components/admin/common/AdminErrorState';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { NavLink } from 'react-router-dom';

import dashboardService from '../../services/dashboard.service';
import { useAuth } from '../../context/AuthContext';

// Dashboard Widgets
import ChartCard from '../../components/admin/dashboard/ChartCard';
import ActivityList from '../../components/admin/dashboard/ActivityList';
import ApprovalList from '../../components/admin/dashboard/ApprovalList';
import RecentOrders from '../../components/admin/dashboard/RecentOrders';
import NotificationWidget from '../../components/admin/dashboard/NotificationWidget';

export const AdminDashboardPage = () => {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchDashboard = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await dashboardService.getOverview();
      if (res && res.success) {
        setData(res);
      }
    } catch (err) {
      setError(err.message || 'Failed to load dashboard overview.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  if (loading) {
    return (
      <PageContainer>
        <AdminLoader text="Aggregating real-time operational statistics &amp; workflow data..." />
      </PageContainer>
    );
  }

  if (error) {
    return (
      <PageContainer>
        <AdminErrorState
          title="Could not load dashboard overview"
          description={error}
          onRetry={fetchDashboard}
        />
      </PageContainer>
    );
  }

  const roleType = data?.userRole || user?.role || 'admin';
  const roleMetrics = data?.roleMetrics || {};
  const rawName = user?.name || data?.userName || 'Administrator';
  const displayName = rawName
    .replace(/super\s*administrator/gi, 'Administrator')
    .replace(/superadmin/gi, 'Admin');

  return (
    <PageContainer>
      {/* Header with Role Banner */}
      <PageHeader
        title={`Welcome back, ${displayName}`}
        subtitle="Official Indian Pharmacopoeia Commission Portal · ADMIN OPERATIONAL DESK"
      >
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchDashboard}
            className="rounded-xl text-xs font-semibold cursor-pointer"
            title="Refresh dashboard"
          >
            <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
            <span>Refresh</span>
          </Button>

          {roleType === 'maker' && (
            <NavLink to="/admin/content">
              <Button
                variant="nfiYellow"
                size="sm"
                className="rounded-xl text-xs font-bold shadow-2xs cursor-pointer"
              >
                <Plus className="w-4 h-4 mr-1" />
                <span>New Monograph Draft</span>
              </Button>
            </NavLink>
          )}
        </div>
      </PageHeader>

      {/* Role-Specific KPI Grid */}
      {roleType === 'maker' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <StatCard
            title="My Active Drafts"
            value="8"
            subtitle="In-progress monographs"
            icon={FileEdit}
            iconColor="text-sky-600"
            iconBg="bg-sky-50"
          />
          <StatCard
            title="Submitted Content"
            value="14"
            subtitle="Sent for editorial review"
            icon={GitPullRequest}
            iconColor="text-indigo-600"
            iconBg="bg-indigo-50"
          />
          <StatCard
            title="Changes Requested"
            value="3"
            subtitle="Awaiting author amendments"
            icon={AlertTriangle}
            iconColor="text-[#E76120]"
            iconBg="bg-[#FFF5EE]"
          />
          <StatCard
            title="Published Monographs"
            value="42"
            subtitle="Official monographs authored"
            icon={CheckCircle2}
            iconColor="text-emerald-600"
            iconBg="bg-emerald-50"
          />
        </div>
      )}

      {roleType === 'reviewer' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <StatCard
            title="Pending Reviews"
            value="14"
            subtitle="5 high priority in queue"
            icon={Clock}
            iconColor="text-[#E76120]"
            iconBg="bg-[#FFF5EE]"
          />
          <StatCard
            title="Reviewed Today"
            value="6"
            subtitle="Scientific checks complete"
            icon={CheckCircle2}
            iconColor="text-emerald-600"
            iconBg="bg-emerald-50"
          />
          <StatCard
            title="Changes Requested"
            value="3"
            subtitle="Feedback returned to authors"
            icon={FileEdit}
            iconColor="text-sky-600"
            iconBg="bg-sky-50"
          />
          <StatCard
            title="Rejected Content"
            value="1"
            subtitle="Non-compliant submissions"
            icon={AlertTriangle}
            iconColor="text-red-500"
            iconBg="bg-red-50"
          />
        </div>
      )}

      {roleType === 'approver' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <StatCard
            title="Pending Final Approvals"
            value="8"
            subtitle="Ready for scientific signing"
            icon={Clock}
            iconColor="text-[#E76120]"
            iconBg="bg-[#FFF5EE]"
          />
          <StatCard
            title="Approved Today"
            value="4"
            subtitle="Authorizations signed"
            icon={CheckCircle}
            iconColor="text-emerald-600"
            iconBg="bg-emerald-50"
          />
          <StatCard
            title="Scheduled Releases"
            value="5"
            subtitle="Queued for public release"
            icon={Calendar}
            iconColor="text-indigo-600"
            iconBg="bg-indigo-50"
          />
          <StatCard
            title="Published Monographs"
            value="1,794"
            subtitle="Active 9th Edition Formulary"
            icon={FileText}
            iconColor="text-sky-600"
            iconBg="bg-sky-50"
          />
        </div>
      )}

      {(roleType === 'superadmin' || roleType === 'admin' || roleType === 'subadmin') && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
          <StatCard
            title="Total Registered Subscribers"
            value={data?.stats?.totalSubscribers || 0}
            subtitle="Public & institutional accounts"
            icon={Users}
            iconColor="text-sky-600"
            iconBg="bg-sky-50"
          />
          <StatCard
            title="Active Subscriptions"
            value={data?.stats?.activeSubscriptions || 0}
            subtitle={`${data?.stats?.trialSubscriptions || 0} evaluation passes`}
            icon={UserCheck}
            iconColor="text-emerald-600"
            iconBg="bg-emerald-50"
          />
          <StatCard
            title="Bulk Batch Imports"
            value={data?.stats?.totalBulkJobs || 0}
            subtitle="Institutional roster uploads"
            icon={Building2}
            iconColor="text-[#284661]"
            iconBg="bg-blue-50"
          />
          <StatCard
            title="Commercial Revenue"
            value={`₹${(data?.stats?.totalRevenueINR || 0).toLocaleString('en-IN')}`}
            subtitle="Gross realized earnings"
            icon={TrendingUp}
            iconColor="text-emerald-600"
            iconBg="bg-emerald-50"
          />
          <StatCard
            title="Completed Orders"
            value={data?.stats?.completedOrders || 0}
            subtitle={`${data?.stats?.failedOrders || 0} failed attempts`}
            icon={CreditCard}
            iconColor="text-indigo-600"
            iconBg="bg-indigo-50"
          />
          <StatCard
            title="Active Coupons & Promos"
            value={data?.stats?.activeCoupons || 0}
            subtitle={`${data?.stats?.totalCoupons || 0} total campaigns`}
            icon={Ticket}
            iconColor="text-[#E76120]"
            iconBg="bg-[#FFF5EE]"
          />
          <StatCard
            title="Support & CRM Inquiries"
            value={data?.stats?.totalTickets || 0}
            subtitle={`${data?.stats?.resolutionRatePercent || 100}% resolution rate`}
            icon={MessageSquare}
            iconColor="text-purple-600"
            iconBg="bg-purple-50"
          />
          <StatCard
            title="Staff & Admin Accounts"
            value={data?.stats?.totalStaffUsers || 0}
            subtitle={`${data?.stats?.activeAdmins || 0} active managers`}
            icon={Shield}
            iconColor="text-slate-700"
            iconBg="bg-slate-100"
          />
        </div>
      )}

      {/* Main Responsive Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-5 min-w-0">
        {/* Left 2 Columns: Chart & Workflow Queues */}
        <div className="lg:col-span-2 space-y-4 sm:space-y-5 min-w-0">
          <ChartCard
            title="Subscriber Registrations & Revenue Velocity"
            subtitle={data?.trendData?.fiscalYearLabel || 'Financial Year Performance (April – March)'}
            trendData={data?.trendData}
          />

          <ApprovalList
            title={
              roleType === 'approver'
                ? 'Scientific Committee Signature Queue'
                : roleType === 'reviewer'
                ? 'Editorial Review Queue'
                : roleType === 'maker'
                ? 'My Draft Monographs &amp; Submissions'
                : 'Pending Workflow Approvals'
            }
            subtitle={
              roleType === 'approver'
                ? 'Monographs verified by reviewers and awaiting final authority signature'
                : roleType === 'reviewer'
                ? 'Incoming monograph submissions awaiting accuracy review'
                : 'Active items in the multi-tier formulary pipeline'
            }
            items={
              roleType === 'maker'
                ? roleMetrics.draftsQueue || []
                : roleType === 'reviewer'
                ? roleMetrics.reviewQueue || []
                : roleType === 'approver'
                ? roleMetrics.approvalQueue || []
                : [
                    {
                      id: 'MON-982',
                      title: 'Paracetamol & Tramadol Fixed-Dose Tablet IP',
                      author: 'Dr. Vikram Malhotra',
                      submittedAt: 'Today, 10:30 AM',
                      priority: 'High',
                    },
                    {
                      id: 'MON-981',
                      title: 'Remdesivir Injectable Solution (100mg)',
                      author: 'Dr. Kavita Nair',
                      submittedAt: 'Yesterday',
                      priority: 'Normal',
                    },
                    {
                      id: 'MON-976',
                      title: 'Insulin Glargine Recombinant Solution',
                      verifiedBy: 'Dr. Rajesh Verma (Reviewer)',
                      submittedAt: '2 days ago',
                      priority: 'Normal',
                    },
                  ]
            }
            roleType={roleType}
          />

          {(roleType === 'superadmin' || roleType === 'admin') && (
            <RecentOrders orders={data?.recentOrders || []} />
          )}
        </div>

        {/* Right 1 Column: Notifications & Audit Timeline */}
        <div className="space-y-4 sm:space-y-5 min-w-0">
          <NotificationWidget notifications={data?.notifications || []} />

          <ActivityList activities={data?.recentActivities || []} />
        </div>
      </div>
    </PageContainer>
  );
};

export default AdminDashboardPage;
