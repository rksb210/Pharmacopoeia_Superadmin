import User from '../models/user.model.js';
import Role from '../models/role.model.js';

/**
 * @desc    Get aggregated, role-aware dashboard overview metrics
 * @route   GET /api/dashboard/overview
 * @access  Private (OVERVIEW:DASHBOARD:VIEW)
 */
export const getDashboardOverview = async (req, res, next) => {
  try {
    const userRole = req.user.role || 'viewer';

    // 1. Core user metrics
    const totalUsers = await User.countDocuments();
    const activeAdmins = await User.countDocuments({
      role: { $in: ['superadmin', 'admin', 'subadmin', 'maker', 'reviewer', 'approver'] },
      isActive: true,
    });
    const activeSubscribers = Math.max(12, totalUsers * 8 + 42); // Seeded representation for formulary subscribers

    // 2. Base content statistics (simulated/seeded lifecycle for Indian Pharmacopoeia drug monographs)
    const contentStats = {
      totalMonographs: 1845,
      draftContent: 24,
      underReview: 14,
      pendingApprovals: 8,
      scheduledContent: 5,
      publishedContent: 1794,
      changesRequested: 6,
      rejectedContent: 2,
    };

    // 3. Commercial & Orders metrics
    const commercialStats = {
      totalRevenue: 2458900, // INR
      monthlyRevenue: 342500,
      totalOrders: 156,
      pendingOrders: 7,
      expiringSubscriptions: 18,
    };

    // 4. Role-specific payload generation
    let roleMetrics = {};

    if (userRole === 'maker') {
      roleMetrics = {
        roleType: 'maker',
        kpis: [
          { title: 'My Active Drafts', value: 8, subtitle: 'In-progress monographs', trend: '+2 this week' },
          { title: 'Submitted Content', value: 14, subtitle: 'Sent for editorial review', trend: '4 in queue' },
          { title: 'Changes Requested', value: 3, subtitle: 'Awaiting amendment edits', trend: 'Requires action' },
          { title: 'Approved & Published', value: 42, subtitle: 'Official monographs authored', trend: 'Lifetime' },
        ],
        draftsQueue: [
          { id: 'MON-982', title: 'Paracetamol & Tramadol Fixed-Dose Tablet', category: 'Analgesics', status: 'Draft', updatedAt: '2 hours ago' },
          { id: 'MON-981', title: 'Remdesivir Injectable Solution (100mg)', category: 'Antivirals', status: 'Changes Requested', updatedAt: 'Yesterday' },
          { id: 'MON-979', title: 'Cefixime Oral Suspension IP 2026', category: 'Antibiotics', status: 'Under Review', updatedAt: '3 days ago' },
        ],
      };
    } else if (userRole === 'reviewer') {
      roleMetrics = {
        roleType: 'reviewer',
        kpis: [
          { title: 'Pending Reviews', value: 14, subtitle: 'Awaiting scientific verification', trend: '5 high priority' },
          { title: 'Reviewed Today', value: 6, subtitle: 'Monographs evaluated', trend: 'On schedule' },
          { title: 'Changes Requested', value: 3, subtitle: 'Returned to author', trend: 'Feedback sent' },
          { title: 'Rejected Submissions', value: 1, subtitle: 'Non-compliant drafts', trend: 'Past 30 days' },
        ],
        reviewQueue: [
          { id: 'MON-980', title: 'Azithromycin Dry Syrup Formulations', author: 'Dr. Vikram Malhotra', submittedAt: 'Today, 10:30 AM', priority: 'High' },
          { id: 'MON-978', title: 'Metformin Hydrochloride Extended-Release (1000mg)', author: 'Dr. Kavita Nair', submittedAt: 'Yesterday', priority: 'Normal' },
          { id: 'MON-977', title: 'Amoxicillin + Clavulanic Acid 625mg Tablet', author: 'Dr. Suresh Raina', submittedAt: '2 days ago', priority: 'Normal' },
        ],
      };
    } else if (userRole === 'approver') {
      roleMetrics = {
        roleType: 'approver',
        kpis: [
          { title: 'Pending Final Approvals', value: 8, subtitle: 'Ready for scientific signing', trend: 'Requires signature' },
          { title: 'Approved Today', value: 4, subtitle: 'Authorizations signed', trend: 'IPC Certified' },
          { title: 'Scheduled Publications', value: 5, subtitle: 'Queued for public release', trend: 'Next batch: Friday' },
          { title: 'Published Monographs', value: 1794, subtitle: 'Official NFI monographs', trend: '9th Edition' },
        ],
        approvalQueue: [
          { id: 'MON-976', title: 'Insulin Glargine Recombinant Solution', verifiedBy: 'Dr. Rajesh Verma (Reviewer)', signatureNeeded: 'Final Approval', date: 'Ready for Release' },
          { id: 'MON-974', title: 'Atorvastatin + Fenofibrate Dual Capsule IP', verifiedBy: 'Dr. Sunita Patel (Reviewer)', signatureNeeded: 'Final Approval', date: 'Ready for Release' },
        ],
      };
    } else {
      // Superadmin, Admin, Subadmin default executive overview
      roleMetrics = {
        roleType: userRole,
        kpis: [
          { title: 'Total Users & Staff', value: totalUsers, subtitle: `${activeAdmins} active administrators`, trend: '+12% this month' },
          { title: 'Active Subscribers', value: activeSubscribers, subtitle: 'Institutional & individual', trend: '+18% growth' },
          { title: 'Total Monographs', value: contentStats.totalMonographs, subtitle: `${contentStats.publishedContent} published`, trend: '9th Edition' },
          { title: 'Pending Approvals', value: contentStats.pendingApprovals, subtitle: 'Requires committee sign-off', trend: 'Action needed' },
          { title: 'Content Under Review', value: contentStats.underReview, subtitle: 'Editorial review desk', trend: 'In progress' },
          { title: 'Draft Content', value: contentStats.draftContent, subtitle: 'Author work in progress', trend: 'Active' },
          { title: 'Commercial Revenue', value: `₹${(commercialStats.totalRevenue / 100000).toFixed(2)}L`, subtitle: `₹${(commercialStats.monthlyRevenue / 1000).toFixed(1)}k this month`, trend: '+8.4%' },
          { title: 'Expiring Subscriptions', value: commercialStats.expiringSubscriptions, subtitle: 'Next 30 days renewal', trend: 'Actionable' },
        ],
      };
    }

    // 5. Recent System Activities Feed
    const recentActivities = [
      {
        id: 'act-1',
        user: 'Dr. Suresh Raina',
        role: 'Approver',
        action: 'Approved & Signed',
        target: 'Monograph: Paracetamol Oral Suspension IP',
        timestamp: '10 minutes ago',
        type: 'content',
      },
      {
        id: 'act-2',
        user: 'Super Admin',
        role: 'Superadmin',
        action: 'Assigned Role',
        target: 'Ananya Sharma promoted to Sub Admin',
        timestamp: '45 minutes ago',
        type: 'security',
      },
      {
        id: 'act-3',
        user: 'AIIMS New Delhi',
        role: 'Subscriber',
        action: 'Renewed License',
        target: 'Enterprise Institutional Subscription (500 Seats)',
        timestamp: '2 hours ago',
        type: 'commercial',
      },
      {
        id: 'act-4',
        user: 'Dr. Vikram Malhotra',
        role: 'Reviewer',
        action: 'Requested Changes',
        target: 'Remdesivir Injectable Solution (100mg)',
        timestamp: '4 hours ago',
        type: 'content',
      },
      {
        id: 'act-5',
        user: 'National Health Mission',
        role: 'Subscriber',
        action: 'New Subscription Order',
        target: 'Annual Hospital Formulary Package',
        timestamp: 'Yesterday',
        type: 'commercial',
      },
    ];

    // 6. Recent Orders / Subscriptions
    const recentOrders = [
      {
        id: 'ORD-9842',
        customer: 'AIIMS Pharmacy Directorate',
        type: 'Institutional Enterprise',
        amount: 85000,
        status: 'Active',
        date: 'Today',
      },
      {
        id: 'ORD-9841',
        customer: 'Apollo Hospitals Educational Trust',
        type: 'Multi-Seat Hospital',
        amount: 45000,
        status: 'Active',
        date: 'Yesterday',
      },
      {
        id: 'ORD-9840',
        customer: 'Dr. Amitav Ghosh',
        type: 'Individual Clinician License',
        amount: 3500,
        status: 'Active',
        date: '24 Aug 2026',
      },
      {
        id: 'ORD-9839',
        customer: 'Fortis Healthcare Research',
        type: 'Institutional Enterprise',
        amount: 60000,
        status: 'Pending',
        date: '23 Aug 2026',
      },
    ];

    // 7. System Safety Notifications / Advisories
    const notifications = [
      {
        id: 'notif-1',
        title: 'Safety Advisory Broadcast',
        message: 'Advisory issued for Fixed-Dose Combination antibiotics revision.',
        severity: 'warning',
        timestamp: '1 hour ago',
      },
      {
        id: 'notif-2',
        title: 'Formulary 9th Edition Release',
        message: 'Scheduled release of Q3 monograph batch on Friday, 18:00 IST.',
        severity: 'info',
        timestamp: 'Today',
      },
      {
        id: 'notif-3',
        title: 'Security Policy Compliance',
        message: 'All 6 administrative system roles are active and verified.',
        severity: 'success',
        timestamp: 'Today',
      },
    ];

    // 8. 7-Day Trend Chart Data
    const trendData = {
      labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
      monographViews: [1240, 1580, 1890, 2100, 2450, 1720, 1450],
      revenueINR: [25000, 42000, 38000, 65000, 89000, 31000, 28000],
      contentEdits: [12, 18, 15, 24, 30, 8, 5],
    };

    return res.status(200).json({
      success: true,
      userRole,
      userName: req.user.name,
      contentStats,
      commercialStats,
      roleMetrics,
      recentActivities,
      recentOrders,
      notifications,
      trendData,
    });
  } catch (error) {
    next(error);
  }
};
