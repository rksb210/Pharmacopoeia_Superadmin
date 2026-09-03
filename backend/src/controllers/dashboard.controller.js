import User from '../models/user.model.js';
import Subscriber from '../models/subscriber.model.js';
import Subscription from '../models/subscription.model.js';
import Order from '../models/order.model.js';
import Coupon from '../models/coupon.model.js';
import Feedback from '../models/feedback.model.js';
import BulkImport from '../models/bulkImport.model.js';
import AuditLog from '../models/auditLog.model.js';
import Notification from '../models/notification.model.js';

const timeAgo = (date) => {
  if (!date) return 'Recently';
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (seconds < 60) return 'Just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days}d ago`;
  return new Date(date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
};

/**
 * @desc    Get aggregated, 100% dynamic dashboard overview metrics from database
 * @route   GET /api/dashboard/overview
 * @access  Private (OVERVIEW:DASHBOARD:VIEW)
 */
export const getDashboardOverview = async (req, res, next) => {
  try {
    const userRole = req.user?.role || 'superadmin';

    // 2. Build 12-Month Financial Year (April to March) Schedule
    const now = new Date();
    const currentMonth = now.getMonth(); // 0 = Jan, 3 = Apr
    const currentYear = now.getFullYear();
    const fyStartYear = currentMonth >= 3 ? currentYear : currentYear - 1;
    const fyStartDate = new Date(fyStartYear, 3, 1, 0, 0, 0, 0); // 1st April
    const fyEndDate = new Date(fyStartYear + 1, 2, 31, 23, 59, 59, 999); // 31st March next year

    const fyMonths = [
      { label: 'Apr', monthKey: `${fyStartYear}-04` },
      { label: 'May', monthKey: `${fyStartYear}-05` },
      { label: 'Jun', monthKey: `${fyStartYear}-06` },
      { label: 'Jul', monthKey: `${fyStartYear}-07` },
      { label: 'Aug', monthKey: `${fyStartYear}-08` },
      { label: 'Sep', monthKey: `${fyStartYear}-09` },
      { label: 'Oct', monthKey: `${fyStartYear}-10` },
      { label: 'Nov', monthKey: `${fyStartYear}-11` },
      { label: 'Dec', monthKey: `${fyStartYear}-12` },
      { label: 'Jan', monthKey: `${fyStartYear + 1}-01` },
      { label: 'Feb', monthKey: `${fyStartYear + 1}-02` },
      { label: 'Mar', monthKey: `${fyStartYear + 1}-03` },
    ];

    // 1. Parallel Database Aggregations
    const [
      totalStaffUsers,
      activeAdmins,
      totalSubscribers,
      activeSubscriptions,
      trialSubscriptions,
      totalBulkJobs,
      totalOrders,
      completedOrders,
      failedOrders,
      revenueAgg,
      totalCoupons,
      activeCoupons,
      totalTickets,
      completedTickets,
      recentAuditLogs,
      recentOrdersRaw,
      recentNotificationsRaw,
      fyRevenueAgg,
      fyRegistrationAgg,
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({
        role: { $in: ['superadmin', 'admin', 'subadmin'] },
        isActive: true,
      }),
      Subscriber.countDocuments(),
      Subscription.countDocuments({ status: 'active' }),
      Subscription.countDocuments({ type: 'trial' }),
      BulkImport.countDocuments(),
      Order.countDocuments(),
      Order.countDocuments({ orderStatus: 'completed' }),
      Order.countDocuments({ orderStatus: 'failed' }),
      Order.aggregate([
        { $match: { orderStatus: 'completed' } },
        { $group: { _id: null, total: { $sum: '$pricing.totalAmount' } } },
      ]),
      Coupon.countDocuments(),
      Coupon.countDocuments({ isActive: true }),
      Feedback.countDocuments(),
      Feedback.countDocuments({ status: 'completed' }),
      AuditLog.find({})
        .sort({ timestamp: -1, createdAt: -1 })
        .limit(6)
        .lean(),
      Order.find({})
        .sort({ createdAt: -1 })
        .limit(5)
        .lean(),
      Notification.find({})
        .sort({ createdAt: -1 })
        .limit(4)
        .lean(),
      // 12-month Financial Year Revenue Aggregation (Apr - Mar)
      Order.aggregate([
        {
          $match: {
            orderStatus: 'completed',
            createdAt: { $gte: fyStartDate, $lte: fyEndDate },
          },
        },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } },
            revenue: { $sum: '$pricing.totalAmount' },
          },
        },
      ]),
      // 12-month Financial Year Subscriber Registration Aggregation (Apr - Mar)
      Subscriber.aggregate([
        {
          $match: {
            createdAt: { $gte: fyStartDate, $lte: fyEndDate },
          },
        },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } },
            count: { $sum: 1 },
          },
        },
      ]),
    ]);

    const totalRevenueINR = revenueAgg[0]?.total || 0;
    const resolutionRatePercent =
      totalTickets > 0 ? Math.round((completedTickets / totalTickets) * 100) : 100;

    // 3. Build 12-Month Financial Year Trend Maps
    const revenueMap = new Map();
    fyRevenueAgg.forEach((item) => {
      if (item._id) revenueMap.set(item._id, item.revenue);
    });

    const regMap = new Map();
    fyRegistrationAgg.forEach((item) => {
      if (item._id) regMap.set(item._id, item.count);
    });

    const labels = [];
    const revenueINR = [];
    const subscriberRegistrations = [];

    fyMonths.forEach((m) => {
      labels.push(m.label);
      revenueINR.push(revenueMap.get(m.monthKey) || 0);
      subscriberRegistrations.push(regMap.get(m.monthKey) || 0);
    });

    const trendData = {
      labels,
      revenueINR,
      monographViews: subscriberRegistrations,
      fiscalYearLabel: `FY ${fyStartYear}-${String(fyStartYear + 1).slice(-2)} (April – March)`,
    };

    // 3. Transform Recent Activities from AuditLog
    const recentActivities = recentAuditLogs.map((log) => ({
      id: log._id?.toString() || log.id,
      user: log.performedByName || log.performedBy || 'Staff Administrator',
      role: log.performedByRole || 'Admin',
      action: log.action || 'Updated',
      target: log.details || log.targetEntity || `${log.module || 'System'} modified`,
      timestamp: timeAgo(log.timestamp || log.createdAt),
      type: (log.module || '').toLowerCase().includes('coupon')
        ? 'commercial'
        : (log.module || '').toLowerCase().includes('user') || (log.module || '').toLowerCase().includes('role')
        ? 'security'
        : 'content',
    }));

    // 4. Transform Recent Orders from Order
    const recentOrders = recentOrdersRaw.map((ord) => ({
      id: ord.orderNumber || `ORD-${ord._id?.toString().slice(-4)}`,
      customer: ord.userName || 'Subscriber',
      type: ord.planName || 'Universal Access Pass',
      amount: ord.pricing?.totalAmount || 0,
      status: (ord.paymentStatus || ord.orderStatus || 'completed').toUpperCase(),
      date: timeAgo(ord.createdAt),
    }));

    // 5. Transform Notifications
    const notifications = recentNotificationsRaw.length > 0
      ? recentNotificationsRaw.map((n) => ({
          id: n._id?.toString(),
          title: n.title || 'System Broadcast',
          message: n.message || n.description || '',
          severity: n.type === 'alert' || n.priority === 'high' ? 'warning' : 'info',
          timestamp: timeAgo(n.createdAt),
        }))
      : [
          {
            id: 'notif-1',
            title: 'System Security Active',
            message: 'All administrative modules, active sessions, and audit logging operate normally.',
            severity: 'success',
            timestamp: 'Today',
          },
        ];

    return res.status(200).json({
      success: true,
      userRole,
      userName: req.user?.name || 'Administrator',
      stats: {
        totalSubscribers,
        activeSubscriptions,
        trialSubscriptions,
        totalBulkJobs,
        totalOrders,
        completedOrders,
        failedOrders,
        totalRevenueINR,
        totalCoupons,
        activeCoupons,
        totalTickets,
        completedTickets,
        resolutionRatePercent,
        totalStaffUsers,
        activeAdmins,
      },
      recentActivities,
      recentOrders,
      notifications,
      trendData,
    });
  } catch (error) {
    next(error);
  }
};

export default getDashboardOverview;
