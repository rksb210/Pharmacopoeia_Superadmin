import mongoose from 'mongoose';
import Subscriber from '../models/subscriber.model.js';
import Subscription from '../models/subscription.model.js';
import Notification from '../models/notification.model.js';
import Feedback from '../models/feedback.model.js';
import Coupon from '../models/coupon.model.js';
import { escapeRegex } from '../middlewares/security.middleware.js';

export const crmService = {
  /**
   * Aggregate high-level CRM Metrics & Customer KPIs
   */
  getCRMStats: async () => {
    const [
      totalCustomers,
      activePaidSubscribers,
      trialSubscribers,
      revenueAgg,
    ] = await Promise.all([
      Subscriber.countDocuments(),
      Subscription.countDocuments({ status: 'active', type: 'paid' }),
      Subscription.countDocuments({ status: 'active', type: 'trial' }),
      Subscription.aggregate([
        { $match: { status: { $in: ['active', 'expired'] } } },
        { $group: { _id: null, totalLTV: { $sum: '$finalAmount' } } },
      ]),
    ]);

    const thirtyDaysFromNow = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    const expiringSoonCount = await Subscription.countDocuments({
      status: 'active',
      endDate: { $gt: new Date(), $lte: thirtyDaysFromNow },
    });

    const totalLTVINR = revenueAgg[0]?.totalLTV || 0;

    return {
      totalCustomers,
      activePaidSubscribers,
      trialSubscribers,
      expiringSoonCount,
      totalLTVINR,
    };
  },

  /**
   * Helper: Determine Dynamic Customer Segment
   */
  determineSegment: (subscriber, latestSub) => {
    if (!latestSub) return 'LEAD_PROSPECT';

    if (latestSub.status === 'active') {
      const isExpiring =
        new Date(latestSub.endDate) > new Date() &&
        new Date(latestSub.endDate) <= new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
      if (isExpiring) return 'EXPIRING_SOON';

      if (latestSub.type === 'trial') return 'PROMOTIONAL_TRIAL';
      if (latestSub.tier === 'INSTITUTIONAL' || subscriber.userType === 'INDUSTRY') {
        return 'INSTITUTIONAL_VIP';
      }
      if (subscriber.userType === 'STUDENT') return 'SCHOLAR';
      if (['DOCTOR', 'PHARMACIST', 'NURSE'].includes(subscriber.userType)) {
        return 'ACTIVE_PRACTITIONER';
      }
      return 'ACTIVE_PRACTITIONER';
    }

    if (latestSub.status === 'expired' || latestSub.status === 'cancelled') {
      return 'INACTIVE_CHURNED';
    }

    return 'LEAD_PROSPECT';
  },

  /**
   * List, Search, and Segment Customers
   */
  getCustomersList: async ({
    search = '',
    userType = 'all',
    segment = 'all',
    status = 'all',
    page = 1,
    limit = 10,
    sortBy = 'createdAt',
    sortOrder = 'desc',
  }) => {
    const query = {};

    if (search && search.trim()) {
      const safeSearch = escapeRegex(search.trim());
      const searchRegex = new RegExp(safeSearch, 'i');
      query.$or = [
        { name: searchRegex },
        { email: searchRegex },
        { phone: searchRegex },
        { apaarId: searchRegex },
        { registrationNo: searchRegex },
        { gstin: searchRegex },
        { pan: searchRegex },
      ];
    }

    if (userType && userType !== 'all') {
      query.userType = userType;
    }

    if (status && status !== 'all') {
      if (status === 'active') query.status = 'active';
      else if (status === 'inactive') query.status = 'inactive';
    }

    const pageNumber = Math.max(1, parseInt(page, 10));
    const pageSize = Math.max(1, Math.min(100, parseInt(limit, 10)));
    const skip = (pageNumber - 1) * pageSize;

    const [subscribers, total] = await Promise.all([
      Subscriber.find(query)
        .sort({ [sortBy]: sortOrder === 'asc' ? 1 : -1 })
        .skip(skip)
        .limit(pageSize)
        .lean(),
      Subscriber.countDocuments(query),
    ]);

    // Concurrently fetch active subscriptions and lifetime order totals for each subscriber
    const customerRecords = await Promise.all(
      subscribers.map(async (sub) => {
        const [subscriptions, latestSub] = await Promise.all([
          Subscription.find({ user: sub._id }).sort({ createdAt: -1 }).lean(),
          Subscription.findOne({ user: sub._id }).sort({ createdAt: -1 }).lean(),
        ]);

        const totalOrders = subscriptions.length;
        const totalLTVSpendINR = subscriptions.reduce(
          (sum, s) => sum + (s.finalAmount || 0),
          0
        );

        const computedSegment = crmService.determineSegment(sub, latestSub);

        return {
          ...sub,
          latestSubscription: latestSub || null,
          totalOrders,
          totalLTVSpendINR,
          segment: computedSegment,
        };
      })
    );

    // Filter by segment if specified
    let filteredRecords = customerRecords;
    if (segment && segment !== 'all') {
      filteredRecords = customerRecords.filter((c) => c.segment === segment);
    }

    return {
      customers: filteredRecords,
      pagination: {
        total,
        page: pageNumber,
        limit: pageSize,
        totalPages: Math.ceil(total / pageSize) || 1,
      },
    };
  },

  /**
   * 360-Degree Holistic Customer Dossier
   */
  getCustomerProfile360: async (customerId) => {
    const subscriber = await Subscriber.findById(customerId).lean();
    if (!subscriber) throw new Error('Customer / Subscriber record not found');

    const [
      subscriptions,
      feedbackTickets,
      couponsRedeemed,
      notificationsReceived,
    ] = await Promise.all([
      // 1. Subscriptions & Orders
      Subscription.find({ user: subscriber._id })
        .sort({ createdAt: -1 })
        .lean(),

      // 2. Feedback & Content Inquiries
      Feedback.find({
        $or: [{ user: subscriber._id }, { userEmail: subscriber.email?.toLowerCase() }],
      })
        .sort({ createdAt: -1 })
        .lean(),

      // 3. Coupon Redemptions
      Coupon.find({ 'redemptionHistory.user': subscriber._id }).lean(),

      // 4. Notifications & Communication Dispatches
      Notification.find({
        isActive: true,
        $or: [
          { 'targetAudience.type': 'ALL' },
          { 'targetAudience.type': 'USER_TYPES', 'targetAudience.userTypes': subscriber.userType },
          { 'targetAudience.type': 'SPECIFIC_EMAILS', 'targetAudience.specificEmails': subscriber.email?.toLowerCase() },
        ],
      })
        .sort({ sentAt: -1, createdAt: -1 })
        .limit(20)
        .lean(),
    ]);

    const latestSubscription = subscriptions[0] || null;
    const totalLTVSpendINR = subscriptions.reduce((sum, s) => sum + (s.finalAmount || 0), 0);
    const totalConcessionsSavedINR = subscriptions.reduce(
      (sum, s) => sum + (s.discountAmount || 0),
      0
    );

    const segment = crmService.determineSegment(subscriber, latestSubscription);

    // Build Unified Chronological Multi-System Timeline
    const timelineEvents = [];

    // Account Creation Event
    timelineEvents.push({
      system: 'IDENTITY',
      action: 'Account Registered & Verified',
      timestamp: subscriber.createdAt,
      details: `Registered as ${subscriber.userType} verified profile.`,
      icon: 'user-check',
      badge: subscriber.userType,
    });

    // Subscription & Order Events
    subscriptions.forEach((sub) => {
      timelineEvents.push({
        system: 'COMMERCIAL',
        action: `Subscribed: ${sub.planName}`,
        timestamp: sub.createdAt,
        details: `Issued ${sub.tier} Pass (Invoice: ${sub.invoiceNumber || 'N/A'}) - Paid ₹${sub.finalAmount?.toLocaleString('en-IN')}`,
        icon: 'credit-card',
        badge: sub.status.toUpperCase(),
      });

      if (sub.timeline && Array.isArray(sub.timeline)) {
        sub.timeline.forEach((evt) => {
          timelineEvents.push({
            system: 'LIFECYCLE',
            action: `Pass Lifecycle: ${evt.action}`,
            timestamp: evt.timestamp,
            details: evt.note || evt.reason || `Status updated to ${evt.statusTo || 'updated'}`,
            icon: 'rotate-cw',
            badge: evt.statusTo || 'AUDIT',
          });
        });
      }
    });

    // Feedback Tickets
    feedbackTickets.forEach((ticket) => {
      timelineEvents.push({
        system: 'FEEDBACK',
        action: `Content Comment: ${ticket.subject}`,
        timestamp: ticket.createdAt,
        details: `Ticket ${ticket.ticketId} filed under ${ticket.category} for ${ticket.content?.monographTitle || 'Monograph'}.`,
        icon: 'message-square',
        badge: ticket.status.toUpperCase(),
      });
    });

    // Notifications Dispatched
    notificationsReceived.forEach((notif) => {
      timelineEvents.push({
        system: 'COMMUNICATION',
        action: `Broadcast Received: ${notif.title}`,
        timestamp: notif.sentAt || notif.createdAt,
        details: `Dispatched via [${notif.channels?.join(', ')}] with priority ${notif.priority.toUpperCase()}.`,
        icon: 'bell',
        badge: notif.category,
      });
    });

    // Sort Unified Timeline Chronologically (Descending)
    timelineEvents.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    return {
      customer: {
        ...subscriber,
        segment,
        totalOrders: subscriptions.length,
        totalLTVSpendINR,
        totalConcessionsSavedINR,
        latestSubscription,
      },
      subscriptions,
      feedbackTickets,
      notificationsReceived,
      couponsRedeemed,
      unifiedTimeline: timelineEvents,
    };
  },

  /**
   * Append Staff CRM Contact Note
   */
  addCustomerNote: async (customerId, { note, priority = 'medium' }, adminUser) => {
    const subscriber = await Subscriber.findById(customerId);
    if (!subscriber) throw new Error('Customer record not found');

    if (!subscriber.crmNotes) {
      subscriber.crmNotes = [];
    }

    const newNote = {
      note: note.trim(),
      priority,
      authorName: adminUser?.name || 'Administrator',
      authorRole: adminUser?.role || 'Staff',
      createdAt: new Date(),
    };

    subscriber.crmNotes.unshift(newNote);
    await subscriber.save();

    return newNote;
  },
};

export default crmService;
