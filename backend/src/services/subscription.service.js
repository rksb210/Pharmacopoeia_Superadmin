import Subscription from '../models/subscription.model.js';
import Subscriber from '../models/subscriber.model.js';
import SystemConfig from '../models/systemConfig.model.js';
import Plan from '../models/plan.model.js';
import planService from './plan.service.js';

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
      cancelledCount,
      trialCount,
      complimentaryCount,
      discountedCount,
      expiringSoonCount,
      physicalCount,
      onlineCount,
      hybridCount,
      inReviewCount,
      rejectedCount,
      revenueResult,
    ] = await Promise.all([
      Subscription.countDocuments(),
      Subscription.countDocuments({ status: 'active' }),
      Subscription.countDocuments({ status: 'expired' }),
      Subscription.countDocuments({ status: { $in: ['cancelled', 'expired'] } }),
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
      Subscription.countDocuments({
        $or: [
          { deliveryType: 'PHYSICAL' },
          {
            planName: { $regex: /physical/i },
            deliveryType: { $ne: 'ONLINE_PHYSICAL' },
            $nor: [{ planName: { $regex: /physical\s*\+\s*online|online\s*\+\s*physical|hybrid/i } }],
          },
        ],
      }),
      Subscription.countDocuments({
        $or: [
          { deliveryType: 'ONLINE' },
          {
            deliveryType: { $nin: ['PHYSICAL', 'ONLINE_PHYSICAL'] },
            $nor: [{ planName: { $regex: /physical/i } }],
          },
        ],
      }),
      Subscription.countDocuments({
        $or: [
          { deliveryType: 'ONLINE_PHYSICAL' },
          { planName: { $regex: /physical\s*\+\s*online|online\s*\+\s*physical|hybrid/i } },
        ],
      }),
      Subscription.countDocuments({ status: { $in: ['in_review', 'pending_approval'] } }),
      Subscription.countDocuments({ status: 'rejected' }),
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
      cancelledSubscriptions: cancelledCount,
      trialSubscriptions: trialCount,
      complimentarySubscriptions: complimentaryCount,
      discountedSubscriptions: discountedCount,
      expiringSoonSubscriptions: expiringSoonCount,
      physicalSubscriptions: physicalCount,
      onlineSubscriptions: onlineCount,
      hybridSubscriptions: hybridCount,
      inReviewSubscriptions: inReviewCount,
      rejectedSubscriptions: rejectedCount,
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
    deliveryType = 'all',
    userType = 'all',
    dateFrom = '',
    dateTo = '',
    sortBy = 'createdAt',
    sortOrder = 'desc',
  }) => {
    const query = {};

    // Delivery Type Filter
    if (deliveryType && deliveryType !== 'all') {
      const dtNorm = deliveryType.toUpperCase().trim();
      query.$and = query.$and || [];
      if (dtNorm === 'PHYSICAL') {
        query.$and.push({
          $or: [
            { deliveryType: 'PHYSICAL' },
            {
              planName: { $regex: /physical/i },
              deliveryType: { $ne: 'ONLINE_PHYSICAL' },
              $nor: [{ planName: { $regex: /physical\s*\+\s*online|online\s*\+\s*physical|hybrid/i } }],
            },
          ],
        });
      } else if (dtNorm === 'ONLINE_PHYSICAL' || dtNorm === 'HYBRID') {
        query.$and.push({
          $or: [
            { deliveryType: 'ONLINE_PHYSICAL' },
            { planName: { $regex: /physical\s*\+\s*online|online\s*\+\s*physical|hybrid/i } },
          ],
        });
      } else if (dtNorm === 'ONLINE') {
        query.$and.push({
          $or: [
            { deliveryType: 'ONLINE' },
            {
              deliveryType: { $nin: ['PHYSICAL', 'ONLINE_PHYSICAL'] },
              $nor: [{ planName: { $regex: /physical/i } }],
            },
          ],
        });
      }
    }

    // User Type Filter
    let userTypeSubscriberIds = null;
    if (userType && userType !== 'all') {
      const uTypeNorm = userType.toUpperCase().trim();
      const userTypeQuery = (uTypeNorm === 'UNIVERSITIES_COLLEGES' || uTypeNorm === 'UNIVERSITIES / COLLEGES')
        ? { userType: { $in: ['UNIVERSITIES_COLLEGES', 'UNIVERSITIES / COLLEGES'] } }
        : { userType: uTypeNorm };
      const matchedSubs = await Subscriber.find(userTypeQuery).select('_id');
      userTypeSubscriberIds = matchedSubs.map((s) => s._id.toString());
      query.user = { $in: matchedSubs.map((s) => s._id) };
    }

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
    } else if (status === 'cancelled') {
      query.status = { $in: ['cancelled', 'expired'] };
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

      // First find matching subscriber IDs if search matches name/email/entity
      const matchedSubscribers = await Subscriber.find({
        $or: [
          { name: searchRegex },
          { email: searchRegex },
          { username: searchRegex },
          { 'dynamicFields.companyName': searchRegex },
          { 'dynamicFields.universityCollegeName': searchRegex },
        ],
      }).select('_id');

      let subscriberIds = matchedSubscribers.map((s) => s._id);

      if (userTypeSubscriberIds !== null) {
        subscriberIds = subscriberIds.filter((id) => userTypeSubscriberIds.includes(id.toString()));
      }

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
        .populate('requestedBy', 'name email role')
        .populate('approvedBy', 'name email role')
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
      .populate('assignedBy', 'name email role')
      .populate('requestedBy', 'name email role')
      .populate('approvedBy', 'name email role');

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
      planName = 'NFI 7th Edition Formulary - Universal Access Pass',
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
      if (planDoc && planDoc.validityType === 'fixed_date' && planDoc.fixedDate) {
        endDate = new Date(planDoc.fixedDate);
      } else {
        endDate = await subscriptionService.getConfiguredFixedExpiry();
      }
      paymentStatus = 'waived';
    } else if (type === 'discounted') {
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
    }
    let pricingBreakdown = null;
    let unitBaseAmount = Number(amount);
    let userDiscountAmount = 0;
    let userTaxableAmount = Number(amount);
    let userGstRate = 18;
    let userGstAmount = 0;
    let userFinalAmount = Number(amount);
    let effectiveDiscountPercent = 0;

    if (type === 'paid' || type === 'discounted') {
      const planForPricing = planDoc || {
        priceINR: Number(amount),
        isGstApplicable: true,
        gstRatePercent: 18,
        bulkDiscountEnabled: false,
        bulkSlabs: [],
      };
      pricingBreakdown = planService.calculatePlanPricing(planForPricing, {
        quantity: targetUserIds.length,
        concessionPercent: type === 'discounted' ? discountPercent : 0,
      });

      unitBaseAmount = pricingBreakdown.unitBasePrice;
      effectiveDiscountPercent = pricingBreakdown.effectiveDiscountPercent;
      userDiscountAmount = Math.round(pricingBreakdown.discountAmount / targetUserIds.length);
      userTaxableAmount = Math.round(pricingBreakdown.taxableBase / targetUserIds.length);
      userGstRate = pricingBreakdown.gstRatePercent;
      userGstAmount = Math.round(pricingBreakdown.taxAmount / targetUserIds.length);
      userFinalAmount = Math.round(pricingBreakdown.totalAmount / targetUserIds.length);
    } else {
      unitBaseAmount = Number(amount) || 0;
      userDiscountAmount = 0;
      userTaxableAmount = 0;
      userGstRate = 0;
      userGstAmount = 0;
      userFinalAmount = 0;
      paymentStatus = 'waived';
    }

    let firstSubscription = null;

    const userRoleCode = (
      typeof adminUser?.role === 'string'
        ? adminUser.role
        : adminUser?.role?.code || ''
    ).toLowerCase();
    const isSuperAdmin = userRoleCode === 'superadmin';
    const targetStatus = isSuperAdmin ? 'active' : 'in_review';
    const approvalStatus = isSuperAdmin ? 'APPROVED' : 'PENDING';

    for (const singleUserId of targetUserIds) {
      const subscriber = await Subscriber.findById(singleUserId);
      if (!subscriber) continue;

      const counter = await Subscription.countDocuments();
      const subscriptionId = `SUB-${new Date().getFullYear()}-${String(counter + 1).padStart(5, '0')}`;
      const invoiceNumber = `INV-${new Date().getFullYear()}-${String(counter + 1).padStart(5, '0')}`;

      // Resolve delivery type: PHYSICAL, ONLINE_PHYSICAL (Hybrid), or ONLINE
      let resolvedDeliveryType = planDoc?.deliveryType || data.deliveryType || 'ONLINE';
      if (!resolvedDeliveryType || resolvedDeliveryType === 'ONLINE') {
        const pNameLower = String(planDoc?.name || planName || '').toLowerCase();
        const pCodeLower = String(planDoc?.code || planCode || '').toLowerCase();
        if (
          pNameLower.includes('physical + online') ||
          pNameLower.includes('online + physical') ||
          pNameLower.includes('hybrid') ||
          pCodeLower.includes('hybrid')
        ) {
          resolvedDeliveryType = 'ONLINE_PHYSICAL';
        } else if (pNameLower.includes('physical') || pCodeLower.includes('physical')) {
          resolvedDeliveryType = 'PHYSICAL';
        } else {
          resolvedDeliveryType = 'ONLINE';
        }
      }
      const isPhysicalOnly = resolvedDeliveryType === 'PHYSICAL';

      const newSubscription = await Subscription.create({
        subscriptionId,
        user: subscriber._id,
        planName,
        planCode,
        tier,
        type,
        deliveryType: resolvedDeliveryType,
        status: targetStatus,
        approvalStatus,
        startDate,
        endDate,
        amount: unitBaseAmount,
        discountPercent: effectiveDiscountPercent,
        discountAmount: userDiscountAmount,
        taxableAmount: userTaxableAmount,
        gstRatePercent: userGstRate,
        gstAmount: userGstAmount,
        finalAmount: userFinalAmount,
        paymentMethod: type === 'trial' || type === 'complimentary' ? 'Admin Grant' : paymentMethod,
        paymentStatus: isSuperAdmin ? paymentStatus : 'pending',
        transactionRef: transactionRef || `TXN-${Date.now().toString().slice(-8)}`,
        invoiceNumber,
        assignedBy: adminUser?._id || null,
        requestedBy: adminUser?._id || null,
        approvedBy: isSuperAdmin ? adminUser?._id : null,
        approvedAt: isSuperAdmin ? new Date() : null,
        notes: notes.trim(),
        timeline: [
          isSuperAdmin
            ? {
                action: 'ASSIGNED',
                statusFrom: 'NONE',
                statusTo: 'ACTIVE',
                performedBy: adminUser?.name || 'Super Admin',
                reason: `Direct Super Admin Provisioning (${type.toUpperCase()} - Valid until ${endDate.toISOString().split('T')[0]})`,
                timestamp: new Date(),
              }
            : {
                action: 'SUBMITTED_FOR_APPROVAL',
                statusFrom: 'NONE',
                statusTo: 'IN_REVIEW',
                performedBy: adminUser?.name || 'Admin',
                reason: `Manual administrative provisioning submitted for Approver review (${type.toUpperCase()} - Valid until ${endDate.toISOString().split('T')[0]})`,
                timestamp: new Date(),
              },
        ],
      });

      // If SuperAdmin, activate access immediately. If regular Admin, keep access inactive pending approval.
      if (isSuperAdmin) {
        // Automatically close/supersede any existing active digital subscriptions for this subscriber
        await subscriptionService.supersedePreviousActiveSubscriptions(
          subscriber._id,
          newSubscription,
          adminUser
        );

        // Check if user currently has another active digital subscription
        const existingActiveDigitalSub = await Subscription.findOne({
          user: subscriber._id,
          _id: { $ne: newSubscription._id },
          status: 'active',
          deliveryType: { $ne: 'PHYSICAL' },
        });

        const isTrial = type === 'trial';
        const isComplimentary = type === 'complimentary';
        let subscriberStatus = 'active';
        if (isPhysicalOnly) {
          subscriberStatus = 'inactive'; // Physical only book order does NOT grant digital access
        } else if (isTrial) {
          subscriberStatus = 'trial';
        } else if (isComplimentary) {
          subscriberStatus = 'complimentary';
        }

        const updateData = {
          $push: {
            orderHistory: {
              orderId: subscriptionId,
              planName,
              amount: finalAmount,
              date: new Date(),
              paymentStatus: 'Success',
            },
          },
        };

        if (!isPhysicalOnly || !existingActiveDigitalSub) {
          updateData.$set = {
            subscription: {
              status: subscriberStatus,
              deliveryType: resolvedDeliveryType,
              hasDigitalAccess: !isPhysicalOnly,
              planName,
              planCode,
              tier,
              startDate,
              endDate: isPhysicalOnly ? null : endDate,
              isTrial: !isPhysicalOnly && isTrial,
              isComplimentary: !isPhysicalOnly && isComplimentary,
              discountPercent: Number(discountPercent) || 0,
              discountNotes: notes,
            },
          };
        }

        if (!subscriber.username) {
          updateData.$set.username = (subscriber.email?.split('@')[0] || `user_${subscriber._id.toString().slice(-6)}`)
            .toLowerCase()
            .replace(/[^a-z0-9_]/g, '_');
        }

        await Subscriber.findByIdAndUpdate(subscriber._id, updateData);
      } else {
        // Ensure username is generated if missing, but do not set active subscription access
        if (!subscriber.username) {
          const generatedUsername = (subscriber.email?.split('@')[0] || `user_${subscriber._id.toString().slice(-6)}`)
            .toLowerCase()
            .replace(/[^a-z0-9_]/g, '_');
          await Subscriber.findByIdAndUpdate(subscriber._id, { $set: { username: generatedUsername } });
        }
      }

      if (!firstSubscription) {
        firstSubscription = newSubscription;
      }
    }

    return firstSubscription;
  },

  /**
   * Close/supersede any previously active subscriptions for a subscriber
   * when a new subscription is activated (Upgrade, Downgrade, or Switch).
   */
  supersedePreviousActiveSubscriptions: async (userId, newSubscription, actorUser) => {
    // If the new subscription is physical only, it should NOT cancel active digital subscriptions!
    const newDeliveryType = String(newSubscription.deliveryType || '').toUpperCase();
    if (newDeliveryType === 'PHYSICAL') {
      return;
    }

    // Only supersede other digital passes (ONLINE or ONLINE_PHYSICAL)
    const previousActiveSubs = await Subscription.find({
      user: userId,
      _id: { $ne: newSubscription._id },
      status: 'active',
      deliveryType: { $ne: 'PHYSICAL' },
    });

    for (const oldSub of previousActiveSubs) {
      const oldType = (oldSub.type || 'subscription').toUpperCase();
      const newType = (newSubscription.type || 'subscription').toUpperCase();

      oldSub.status = 'cancelled';
      oldSub.timeline.push({
        action: 'SUPERSEDED',
        statusFrom: 'ACTIVE',
        statusTo: 'CANCELLED',
        performedBy: actorUser?.name || 'Administrator',
        reason: `Pass converted from ${oldType} to ${newType} (${newSubscription.subscriptionId} - ${newSubscription.planName || ''}). Previous pass closed.`,
        timestamp: new Date(),
      });
      await oldSub.save();
    }
  },

  /**
   * Approve a Pending Subscription (Approver / Super Admin Action)
   */
  approveSubscription: async (id, data = {}, approverUser) => {
    const subscription = await Subscription.findById(id);
    if (!subscription) {
      throw new Error('Subscription record not found');
    }
    if (subscription.status !== 'in_review' && subscription.status !== 'pending_approval') {
      throw new Error(`Only subscriptions in 'in_review' status can be approved. Current status: ${subscription.status}`);
    }

    const comments = data.comments || data.reason || 'Approved by Approver';
    const oldStatus = subscription.status;

    subscription.status = 'active';
    subscription.approvalStatus = 'APPROVED';
    subscription.paymentStatus = 'success';
    subscription.approvedBy = approverUser?._id || null;
    subscription.approvedAt = new Date();
    subscription.approvalComments = comments;

    subscription.timeline.push({
      action: 'APPROVED',
      statusFrom: oldStatus.toUpperCase(),
      statusTo: 'ACTIVE',
      performedBy: approverUser?.name || 'Approver',
      reason: comments,
      timestamp: new Date(),
    });

    await subscription.save();

    // Automatically close/supersede any existing active subscriptions for this subscriber
    await subscriptionService.supersedePreviousActiveSubscriptions(
      subscription.user,
      subscription,
      approverUser
    );

    // Determine delivery format
    let resolvedDeliveryType = subscription.deliveryType;
    if (!resolvedDeliveryType || resolvedDeliveryType === 'ONLINE') {
      const pNameLower = String(subscription.planName || '').toLowerCase();
      const pCodeLower = String(subscription.planCode || '').toLowerCase();
      if (
        pNameLower.includes('physical + online') ||
        pNameLower.includes('online + physical') ||
        pNameLower.includes('hybrid') ||
        pCodeLower.includes('hybrid')
      ) {
        resolvedDeliveryType = 'ONLINE_PHYSICAL';
      } else if (pNameLower.includes('physical') || pCodeLower.includes('physical')) {
        resolvedDeliveryType = 'PHYSICAL';
      } else {
        resolvedDeliveryType = 'ONLINE';
      }
    }
    const isPhysicalOnly = resolvedDeliveryType === 'PHYSICAL';

    // Now grant active access to the Subscriber
    const subscriber = await Subscriber.findById(subscription.user);
    if (subscriber) {
      // Check if user currently has another active digital subscription
      const existingActiveDigitalSub = await Subscription.findOne({
        user: subscription.user,
        _id: { $ne: subscription._id },
        status: 'active',
        deliveryType: { $ne: 'PHYSICAL' },
      });

      const isTrial = subscription.type === 'trial';
      const isComplimentary = subscription.type === 'complimentary';
      let subscriberStatus = 'active';
      if (isPhysicalOnly) {
        subscriberStatus = 'inactive'; // Physical only book order does NOT grant digital access
      } else if (isTrial) {
        subscriberStatus = 'trial';
      } else if (isComplimentary) {
        subscriberStatus = 'complimentary';
      }

      const updateData = {
        $push: {
          orderHistory: {
            orderId: subscription.subscriptionId,
            planName: subscription.planName,
            amount: subscription.finalAmount,
            date: new Date(),
            paymentStatus: 'Success',
          },
        },
      };

      if (!isPhysicalOnly || !existingActiveDigitalSub) {
        updateData.$set = {
          subscription: {
            status: subscriberStatus,
            deliveryType: resolvedDeliveryType,
            hasDigitalAccess: !isPhysicalOnly,
            planName: subscription.planName,
            planCode: subscription.planCode,
            tier: subscription.tier,
            startDate: subscription.startDate,
            endDate: isPhysicalOnly ? null : subscription.endDate,
            isTrial: !isPhysicalOnly && isTrial,
            isComplimentary: !isPhysicalOnly && isComplimentary,
            discountPercent: Number(subscription.discountPercent) || 0,
            discountNotes: subscription.notes || '',
          },
        };
      }

      if (!subscriber.username) {
        updateData.$set.username = (subscriber.email?.split('@')[0] || `user_${subscriber._id.toString().slice(-6)}`)
          .toLowerCase()
          .replace(/[^a-z0-9_]/g, '_');
      }

      await Subscriber.findByIdAndUpdate(subscriber._id, updateData);
    }

    return subscription;
  },

  /**
   * Reject a Pending Subscription (Approver / Super Admin Action)
   */
  rejectSubscription: async (id, data = {}, approverUser) => {
    const subscription = await Subscription.findById(id);
    if (!subscription) {
      throw new Error('Subscription record not found');
    }
    if (subscription.status !== 'in_review' && subscription.status !== 'pending_approval') {
      throw new Error(`Only subscriptions in 'in_review' status can be rejected. Current status: ${subscription.status}`);
    }

    const reason = data.reason || data.comments || 'Rejected by Approver';
    const oldStatus = subscription.status;

    subscription.status = 'rejected';
    subscription.approvalStatus = 'REJECTED';
    subscription.approvedBy = approverUser?._id || null;
    subscription.approvedAt = new Date();
    subscription.rejectionReason = reason;
    subscription.approvalComments = data.comments || reason;

    subscription.timeline.push({
      action: 'REJECTED',
      statusFrom: oldStatus.toUpperCase(),
      statusTo: 'REJECTED',
      performedBy: approverUser?.name || 'Approver',
      reason: reason,
      timestamp: new Date(),
    });

    await subscription.save();
    return subscription;
  },

  /**
   * Resubmit a Rejected Subscription for Review
   */
  resubmitSubscription: async (id, data, adminUser) => {
    const subscription = await Subscription.findById(id);
    if (!subscription) {
      throw new Error('Subscription not found');
    }

    if (subscription.status !== 'rejected') {
      throw new Error('Only rejected subscriptions can be edited and resubmitted.');
    }

    const {
      type = subscription.type,
      planName,
      planCode = subscription.planCode,
      tier,
      amount,
      discountPercent = 0,
      customDays,
      notes = '',
      deliveryType,
    } = data;

    let planDoc = null;
    if (planCode) {
      planDoc = await Plan.findOne({ code: planCode });
    }

    const startDate = new Date();
    let endDate;
    let paymentStatus = 'success';

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
      paymentStatus = 'waived';
    } else if (type === 'complimentary') {
      if (planDoc && planDoc.validityType === 'fixed_date' && planDoc.fixedDate) {
        endDate = new Date(planDoc.fixedDate);
      } else {
        endDate = await subscriptionService.getConfiguredFixedExpiry();
      }
      paymentStatus = 'waived';
    } else if (type === 'discounted') {
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
    }

    let unitBaseAmount = Number(amount) || (planDoc ? planDoc.priceINR : subscription.amount);
    let userDiscountAmount = 0;
    let userTaxableAmount = unitBaseAmount;
    let userGstRate = 18;
    let userGstAmount = 0;
    let userFinalAmount = unitBaseAmount;
    let effectiveDiscountPercent = 0;

    if (type === 'paid' || type === 'discounted') {
      const planForPricing = planDoc || {
        priceINR: Number(amount) || subscription.amount,
        isGstApplicable: true,
        gstRatePercent: 18,
        bulkDiscountEnabled: false,
        bulkSlabs: [],
      };
      const pricingBreakdown = planService.calculatePlanPricing(planForPricing, {
        quantity: 1,
        concessionPercent: type === 'discounted' ? Number(discountPercent) : 0,
      });

      unitBaseAmount = pricingBreakdown.unitBasePrice;
      effectiveDiscountPercent = pricingBreakdown.effectiveDiscountPercent;
      userDiscountAmount = pricingBreakdown.discountAmount;
      userTaxableAmount = pricingBreakdown.taxableBase;
      userGstRate = pricingBreakdown.gstRatePercent;
      userGstAmount = pricingBreakdown.taxAmount;
      userFinalAmount = pricingBreakdown.totalAmount;
    } else {
      unitBaseAmount = 0;
      userDiscountAmount = 0;
      userTaxableAmount = 0;
      userGstRate = 0;
      userGstAmount = 0;
      userFinalAmount = 0;
      paymentStatus = 'waived';
    }

    const userRoleCode = (
      typeof adminUser?.role === 'string'
        ? adminUser.role
        : adminUser?.role?.code || ''
    ).toLowerCase();
    const isSuperAdmin = userRoleCode === 'superadmin';

    // Update Subscription properties
    subscription.type = type;
    if (planDoc) {
      subscription.planName = planDoc.name;
      subscription.planCode = planDoc.code;
      subscription.tier = planDoc.tier;
      subscription.deliveryType = deliveryType || planDoc.deliveryType || subscription.deliveryType;
    } else if (planName) {
      subscription.planName = planName;
    }
    if (tier) subscription.tier = tier;
    subscription.amount = unitBaseAmount;
    subscription.discountPercent = effectiveDiscountPercent;
    subscription.discountAmount = userDiscountAmount;
    subscription.taxableAmount = userTaxableAmount;
    subscription.gstRatePercent = userGstRate;
    subscription.gstAmount = userGstAmount;
    subscription.finalAmount = userFinalAmount;
    subscription.paymentStatus = paymentStatus;
    subscription.startDate = startDate;
    subscription.endDate = endDate;
    if (notes) subscription.notes = notes;

    const previousRejectionReason = subscription.rejectionReason;
    subscription.rejectionReason = ''; // Clear previous rejection reason
    subscription.approvalComments = '';

    if (isSuperAdmin) {
      subscription.status = 'active';
      subscription.approvalStatus = 'APPROVED';
      subscription.approvedBy = adminUser._id;
      subscription.approvedAt = new Date();
    } else {
      subscription.status = 'in_review';
      subscription.approvalStatus = 'PENDING';
      subscription.requestedBy = adminUser._id;
      subscription.approvedBy = null;
      subscription.approvedAt = null;
    }

    subscription.timeline.push({
      action: 'RESUBMITTED',
      statusFrom: 'REJECTED',
      statusTo: isSuperAdmin ? 'ACTIVE' : 'IN_REVIEW',
      performedBy: adminUser?.name || 'Administrator',
      reason: notes
        ? `Resubmitted for review: ${notes}. (Previous rejection: "${previousRejectionReason || 'N/A'}")`
        : `Resubmitted for review following rejection.`,
      timestamp: new Date(),
    });

    await subscription.save();

    if (isSuperAdmin) {
      await subscriptionService.supersedePreviousActiveSubscriptions(
        subscription.user,
        subscription,
        adminUser
      );

      const isTrial = subscription.type === 'trial';
      const isComplimentary = subscription.type === 'complimentary';
      let subscriberStatus = 'active';
      if (isTrial) subscriberStatus = 'trial';
      else if (isComplimentary) subscriberStatus = 'complimentary';

      await Subscriber.findByIdAndUpdate(subscription.user, {
        'subscription.status': subscriberStatus,
        'subscription.planName': subscription.planName,
        'subscription.tier': subscription.tier,
        'subscription.startDate': startDate,
        'subscription.endDate': endDate,
        'subscription.isTrial': isTrial,
        'subscription.isComplimentary': isComplimentary,
      });
    }

    return subscription;
  },

  /**
   * Renew / Extend Subscription
   */
  renewSubscription: async (id, data, adminUser) => {
    const subscription = await Subscription.findById(id);
    if (!subscription) {
      throw new Error('Subscription not found');
    }

    const { notes = '', renewDays, renewMonths } = data;
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
      if (renewDays) {
        newEndDate = new Date(currentEnd.getTime() + parseInt(renewDays, 10) * 24 * 60 * 60 * 1000);
      } else if (renewMonths) {
        newEndDate = new Date(currentEnd);
        newEndDate.setMonth(newEndDate.getMonth() + parseInt(renewMonths, 10));
      } else {
        newEndDate = new Date(currentEnd.getTime() + 14 * 24 * 60 * 60 * 1000);
      }
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
