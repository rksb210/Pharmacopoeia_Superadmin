import Subscription from '../models/subscription.model.js';
import Subscriber from '../models/subscriber.model.js';
import SystemConfig from '../models/systemConfig.model.js';
import Plan from '../models/plan.model.js';

export const subscriptionService = {
  /**
   * Seed default System Configurations for Subscriptions
   */
  seedSystemConfig: async () => {
    const defaultConfigs = [
      {
        key: 'SUBSCRIPTION_FIXED_EXPIRY_DATE',
        value: '2031-12-31T23:59:59.999Z',
        description: 'BRD Business Rule: Purchased subscriptions remain valid until 31 December 2031.',
        category: 'SUBSCRIPTION',
      },
      {
        key: 'DEFAULT_TRIAL_DAYS',
        value: 14,
        description: 'Default duration for free promotional trial periods in days.',
        category: 'SUBSCRIPTION',
      },
      {
        key: 'DEFAULT_COMPLIMENTARY_MONTHS',
        value: 12,
        description: 'Default validity for complimentary institutional/VIP passes in months.',
        category: 'SUBSCRIPTION',
      },
      {
        key: 'EXPIRING_SOON_DAYS_THRESHOLD',
        value: 30,
        description: 'Threshold in days to flag active subscriptions as expiring soon.',
        category: 'SUBSCRIPTION',
      },
    ];

    for (const conf of defaultConfigs) {
      await SystemConfig.findOneAndUpdate({ key: conf.key }, conf, { upsert: true, new: true });
    }
  },

  /**
   * Get Configured Fixed Expiry Date (Defaults to 2031-12-31 if not set)
   */
  getConfiguredFixedExpiry: async () => {
    const config = await SystemConfig.findOne({ key: 'SUBSCRIPTION_FIXED_EXPIRY_DATE', isActive: true });
    if (config && config.value) {
      return new Date(config.value);
    }
    return new Date('2031-12-31T23:59:59.999Z');
  },

  /**
   * Get All Subscription Business Configurations
   */
  getSystemConfigs: async () => {
    let configs = await SystemConfig.find({ category: 'SUBSCRIPTION' });
    if (configs.length === 0) {
      await subscriptionService.seedSystemConfig();
      configs = await SystemConfig.find({ category: 'SUBSCRIPTION' });
    }
    return configs;
  },

  /**
   * Update a System Configuration (e.g. modify fixed expiry date)
   */
  updateSystemConfig: async (key, value, description) => {
    const updated = await SystemConfig.findOneAndUpdate(
      { key: key.toUpperCase().trim() },
      { value, ...(description ? { description } : {}) },
      { new: true, upsert: true }
    );
    return updated;
  },

  /**
   * Aggregate KPI Statistics
   */
  getSubscriptionStats: async () => {
    const now = new Date();
    const thresholdDays = 30;
    const expiringThreshold = new Date(now.getTime() + thresholdDays * 24 * 60 * 60 * 1000);

    const [
      totalCount,
      activeCount,
      expiredCount,
      trialCount,
      complimentaryCount,
      discountedCount,
      expiringSoonCount,
      revenueResult,
    ] = await Promise.all([
      Subscription.countDocuments(),
      Subscription.countDocuments({ status: 'active' }),
      Subscription.countDocuments({ status: 'expired' }),
      Subscription.countDocuments({ type: 'trial', status: 'active' }),
      Subscription.countDocuments({ type: 'complimentary', status: 'active' }),
      Subscription.countDocuments({
        $or: [{ type: 'discounted' }, { discountApplied: { $gt: 0 } }],
        status: { $ne: 'cancelled' },
      }),
      Subscription.countDocuments({
        status: 'active',
        endDate: { $gte: now, $lte: expiringThreshold },
      }),
      Subscription.aggregate([
        { $match: { paymentStatus: 'success' } },
        { $group: { _id: null, totalRevenue: { $sum: '$finalAmount' } } },
      ]),
    ]);

    const totalRevenue = revenueResult[0]?.totalRevenue || 0;

    return {
      totalSubscriptions: totalCount,
      activeSubscriptions: activeCount,
      expiredSubscriptions: expiredCount,
      trialSubscriptions: trialCount,
      complimentarySubscriptions: complimentaryCount,
      discountedSubscriptions: discountedCount,
      expiringSoonSubscriptions: expiringSoonCount,
      totalRevenueINR: totalRevenue,
    };
  },

  /**
   * List, Search, Filter, and Paginate Subscriptions
   */
  getSubscriptionsList: async ({
    page = 1,
    limit = 10,
    search = '',
    type = 'all',
    status = 'all',
    dateFrom = '',
    dateTo = '',
    sortBy = 'createdAt',
    sortOrder = 'desc',
  }) => {
    const query = {};

    // Type Filter
    if (type && type !== 'all') {
      query.type = type.toLowerCase().trim();
    }

    // Status Filter (including expiring_soon pseudo-status)
    const now = new Date();
    if (status === 'expiring_soon') {
      const expiringThreshold = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
      query.status = 'active';
      query.endDate = { $gte: now, $lte: expiringThreshold };
    } else if (status && status !== 'all') {
      query.status = status.toLowerCase().trim();
    }

    // Date Range Filter (by startDate or createdAt)
    if (dateFrom || dateTo) {
      query.startDate = {};
      if (dateFrom) query.startDate.$gte = new Date(dateFrom);
      if (dateTo) {
        const toDate = new Date(dateTo);
        toDate.setHours(23, 59, 59, 999);
        query.startDate.$lte = toDate;
      }
    }

    // Search query
    if (search && search.trim()) {
      const searchRegex = new RegExp(search.trim(), 'i');

      // First find matching subscriber IDs if search matches name/email
      const matchedSubscribers = await Subscriber.find({
        $or: [{ name: searchRegex }, { email: searchRegex }, { username: searchRegex }],
      }).select('_id');

      const subscriberIds = matchedSubscribers.map((s) => s._id);

      query.$or = [
        { subscriptionId: searchRegex },
        { invoiceNumber: searchRegex },
        { transactionRef: searchRegex },
        { planName: searchRegex },
        { user: { $in: subscriberIds } },
      ];
    }

    const pageNumber = Math.max(1, parseInt(page, 10));
    const pageSize = Math.max(1, Math.min(100, parseInt(limit, 10)));
    const skip = (pageNumber - 1) * pageSize;

    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1;

    const [subscriptions, total] = await Promise.all([
      Subscription.find(query)
        .sort(sortOptions)
        .skip(skip)
        .limit(pageSize)
        .populate('user', 'name email username phoneNumber userType dynamicFields')
        .populate('assignedBy', 'name email role')
        .lean(),
      Subscription.countDocuments(query),
    ]);

    const totalPages = Math.ceil(total / pageSize) || 1;

    return {
      subscriptions,
      pagination: {
        total,
        page: pageNumber,
        limit: pageSize,
        totalPages,
      },
    };
  },

  /**
   * Get Subscription by ID
   */
  getSubscriptionById: async (id) => {
    const subscription = await Subscription.findById(id)
      .populate('user', 'name email username phoneNumber userType dynamicFields orderHistory')
      .populate('assignedBy', 'name email role');

    if (!subscription) {
      throw new Error('Subscription record not found');
    }
    return subscription;
  },

  /**
   * Manually Provision / Assign Subscription (Single or Multiple Subscribers)
   */
  assignSubscriptionManually: async (data, adminUser) => {
    const {
      userId,
      userIds,
      type = 'paid',
      planName = 'NFI 9th Edition Formulary - Universal Access Pass',
      planCode = 'NFI-INDIVIDUAL',
      tier = 'Individual',
      amount = 5000,
      discountPercent = 0,
      paymentMethod = 'UPI / NetBanking',
      transactionRef = '',
      notes = '',
      customDays = null,
      customMonths = null,
    } = data;

    const targetUserIds = Array.isArray(userIds) && userIds.length > 0
      ? userIds
      : userId
      ? [userId]
      : [];

    if (targetUserIds.length === 0) {
      throw new Error('Please select at least one subscriber.');
    }

    const startDate = new Date();
    let endDate;
    let finalAmount = Number(amount);
    let discountAmount = 0;
    let paymentStatus = 'success';

    let planDoc = null;
    if (planCode) {
      planDoc = await Plan.findOne({ code: planCode });
    }

    // Business Rules for Expiry Calculation
    if (type === 'paid') {
      if (planDoc && planDoc.validityType === 'fixed_date' && planDoc.fixedDate) {
        endDate = new Date(planDoc.fixedDate);
      } else if (planDoc && planDoc.validityType === 'duration_years') {
        endDate = new Date(startDate);
        endDate.setFullYear(endDate.getFullYear() + (planDoc.durationValue || 1));
      } else if (planDoc && planDoc.validityType === 'duration_months') {
        endDate = new Date(startDate);
        endDate.setMonth(endDate.getMonth() + (planDoc.durationValue || 12));
      } else {
        endDate = await subscriptionService.getConfiguredFixedExpiry();
      }
    } else if (type === 'trial') {
      const days = parseInt(customDays, 10) || 14;
      endDate = new Date(startDate.getTime() + days * 24 * 60 * 60 * 1000);
      finalAmount = 0;
      paymentStatus = 'waived';
    } else if (type === 'complimentary') {
      const months = parseInt(customMonths, 10) || 12;
      endDate = new Date(startDate);
      endDate.setMonth(endDate.getMonth() + months);
      finalAmount = 0;
      paymentStatus = 'waived';
    } else if (type === 'discounted') {
      if (planDoc && planDoc.validityType === 'fixed_date' && planDoc.fixedDate) {
        endDate = new Date(planDoc.fixedDate);
      } else {
        endDate = await subscriptionService.getConfiguredFixedExpiry();
      }
      const disc = Math.min(100, Math.max(0, parseInt(discountPercent, 10) || 0));
      discountAmount = Math.round((Number(amount) * disc) / 100);
      finalAmount = Math.max(0, Number(amount) - discountAmount);
    }

    let firstSubscription = null;

    for (const singleUserId of targetUserIds) {
      const subscriber = await Subscriber.findById(singleUserId);
      if (!subscriber) continue;

      const counter = await Subscription.countDocuments();
      const subscriptionId = `SUB-${new Date().getFullYear()}-${String(counter + 1).padStart(5, '0')}`;
      const invoiceNumber = `INV-${new Date().getFullYear()}-${String(counter + 1).padStart(5, '0')}`;

      const newSubscription = await Subscription.create({
        subscriptionId,
        user: subscriber._id,
        planName,
        planCode,
        tier,
        type,
        status: 'active',
        startDate,
        endDate,
        amount: Number(amount),
        discountPercent: type === 'discounted' ? Number(discountPercent) : 0,
        discountAmount,
        finalAmount,
        paymentMethod: type === 'trial' || type === 'complimentary' ? 'Admin Grant' : paymentMethod,
        paymentStatus,
        transactionRef: transactionRef || `TXN-${Date.now().toString().slice(-8)}`,
        invoiceNumber,
        assignedBy: adminUser?._id || null,
        notes: notes.trim(),
        timeline: [
          {
            action: 'ASSIGNED',
            statusFrom: 'NONE',
            statusTo: 'ACTIVE',
            performedBy: adminUser?.name || 'Super Admin',
            reason: `Manual administrative provisioning (${type.toUpperCase()} - Valid until ${endDate.toISOString().split('T')[0]})`,
            timestamp: new Date(),
          },
        ],
      });

      // Update Subscriber's top-level subscription and order history
      subscriber.subscription = {
        status: type === 'trial' ? 'trial' : type === 'complimentary' ? 'complimentary' : 'active',
        planName,
        startDate,
        endDate,
        isTrial: type === 'trial',
        isComplimentary: type === 'complimentary',
        discountPercent: Number(discountPercent),
        discountNotes: notes,
      };

      subscriber.orderHistory.push({
        orderId: subscriptionId,
        planName,
        amount: finalAmount,
        date: new Date(),
        paymentStatus: 'Success',
      });

      await subscriber.save();

      if (!firstSubscription) {
        firstSubscription = newSubscription;
      }
    }

    return firstSubscription;
  },

  /**
   * Renew / Extend Subscription
   */
  renewSubscription: async (id, data, adminUser) => {
    const subscription = await Subscription.findById(id);
    if (!subscription) {
      throw new Error('Subscription not found');
    }

    const { notes = '', renewMonths = 12 } = data;
    const oldStatus = subscription.status;

    // If paid/discounted, re-confirm dynamic fixed expiry date from Plan or SystemConfig
    let newEndDate;
    if (subscription.type === 'paid' || subscription.type === 'discounted') {
      const planDoc = await Plan.findOne({ code: subscription.planCode });
      if (planDoc && planDoc.validityType === 'fixed_date' && planDoc.fixedDate) {
        newEndDate = new Date(planDoc.fixedDate);
      } else {
        newEndDate = await subscriptionService.getConfiguredFixedExpiry();
      }
    } else {
      const currentEnd = new Date(subscription.endDate) > new Date() ? new Date(subscription.endDate) : new Date();
      newEndDate = new Date(currentEnd);
      newEndDate.setMonth(newEndDate.getMonth() + parseInt(renewMonths, 10));
    }

    subscription.status = 'active';
    subscription.endDate = newEndDate;
    if (notes) subscription.notes = notes;

    subscription.timeline.push({
      action: 'RENEWED',
      statusFrom: oldStatus.toUpperCase(),
      statusTo: 'ACTIVE',
      performedBy: adminUser?.name || 'Administrator',
      reason: `Subscription renewed/extended until ${newEndDate.toISOString().split('T')[0]}. ${notes}`,
      timestamp: new Date(),
    });

    await subscription.save();

    // Sync Subscriber
    await Subscriber.findByIdAndUpdate(subscription.user, {
      'subscription.status': 'active',
      'subscription.endDate': newEndDate,
    });

    return subscription;
  },

  /**
   * Cancel / Deactivate Subscription
   */
  cancelSubscription: async (id, reason, adminUser) => {
    const subscription = await Subscription.findById(id);
    if (!subscription) {
      throw new Error('Subscription not found');
    }

    const oldStatus = subscription.status;
    subscription.status = 'cancelled';

    subscription.timeline.push({
      action: 'CANCELLED',
      statusFrom: oldStatus.toUpperCase(),
      statusTo: 'CANCELLED',
      performedBy: adminUser?.name || 'Administrator',
      reason: reason || 'Administrative cancellation',
      timestamp: new Date(),
    });

    await subscription.save();

    // Sync Subscriber
    await Subscriber.findByIdAndUpdate(subscription.user, {
      'subscription.status': 'expired',
    });

    return subscription;
  },

  /**
   * Change Subscription Status
   */
  changeStatus: async (id, newStatus, reason, adminUser) => {
    const subscription = await Subscription.findById(id);
    if (!subscription) {
      throw new Error('Subscription not found');
    }

    const oldStatus = subscription.status;
    subscription.status = newStatus.toLowerCase().trim();

    subscription.timeline.push({
      action: 'STATUS_CHANGED',
      statusFrom: oldStatus.toUpperCase(),
      statusTo: newStatus.toUpperCase(),
      performedBy: adminUser?.name || 'Administrator',
      reason: reason || `Status changed to ${newStatus}`,
      timestamp: new Date(),
    });

    await subscription.save();

    // Sync Subscriber
    const subStatusMap = {
      active: 'active',
      suspended: 'expired',
      cancelled: 'expired',
      expired: 'expired',
      pending: 'none',
    };

    await Subscriber.findByIdAndUpdate(subscription.user, {
      'subscription.status': subStatusMap[subscription.status] || 'none',
    });

    return subscription;
  },

  /**
   * Get User Subscription Timeline
   */
  getUserSubscriptionTimeline: async (userId) => {
    const subscriptions = await Subscription.find({ user: userId })
      .sort({ createdAt: -1 })
      .select('subscriptionId planName type status startDate endDate amount finalAmount timeline invoiceNumber');

    return subscriptions;
  },
};

export default subscriptionService;
