import mongoose from 'mongoose';
import Notification from '../models/notification.model.js';
import User from '../models/user.model.js';
import Subscriber from '../models/subscriber.model.js';

export const notificationService = {
  /**
   * Seed default notification campaigns across all 7 core use cases
   */
  seedDefaultNotifications: async () => {
    const defaultCampaigns = [
      {
        title: 'Release of NFI 9th Edition Monograph Addendum 2026',
        message: 'The Indian Pharmacopoeia Commission has published the official 2026 Monograph Addendum including 45 updated therapeutic monographs and pediatric dosage schedules.',
        category: 'NEW_CONTENT',
        channels: ['in_app', 'email', 'broadcast_banner'],
        priority: 'high',
        targetAudience: { type: 'ALL' },
        actionUrl: '/admin/content',
        actionLabel: 'Read Official Addendum',
        status: 'sent',
        sentAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        isActive: true,
        deliveryStats: {
          targetCount: 1250,
          deliveredCount: 1240,
          readCount: 890,
          failedCount: 10,
          channelsSummary: {
            in_app: { sent: 1240, read: 890 },
            email: { sent: 1240, opened: 720 },
            sms: { sent: 0, delivered: 0 },
            broadcast_banner: { views: 3400 },
          },
        },
      },
      {
        title: 'Formulary License Expiry & Renewal Advisory',
        message: 'Your institutional evaluation license is expiring in 15 days. Please coordinate with IPC commercial secretariat to renew your campus access.',
        category: 'SUBSCRIPTION_EXPIRY',
        channels: ['in_app', 'email', 'sms'],
        priority: 'urgent',
        targetAudience: { type: 'USER_TYPES', userTypes: ['INDUSTRY', 'OTHERS'] },
        actionUrl: '/admin/subscriptions',
        actionLabel: 'Renew Pass Now',
        status: 'sent',
        sentAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        isActive: true,
        deliveryStats: {
          targetCount: 340,
          deliveredCount: 338,
          readCount: 295,
          failedCount: 2,
          channelsSummary: {
            in_app: { sent: 338, read: 295 },
            email: { sent: 338, opened: 260 },
            sms: { sent: 338, delivered: 330 },
            broadcast_banner: { views: 0 },
          },
        },
      },
      {
        title: 'National Pharmacovigilance & Drug Safety Symposium 2026',
        message: 'Join clinical specialists and Ministry delegates at Vigyan Bhawan, New Delhi for the 14th National Drug Safety Symposium on 15th October 2026.',
        category: 'EVENTS',
        channels: ['in_app', 'email'],
        priority: 'medium',
        targetAudience: { type: 'USER_TYPES', userTypes: ['DOCTOR', 'PHARMACIST'] },
        actionUrl: 'https://ipc.gov.in/events',
        actionLabel: 'Register Attendance',
        status: 'sent',
        sentAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        isActive: true,
        deliveryStats: {
          targetCount: 850,
          deliveredCount: 845,
          readCount: 610,
          failedCount: 5,
          channelsSummary: {
            in_app: { sent: 845, read: 610 },
            email: { sent: 845, opened: 480 },
            sms: { sent: 0, delivered: 0 },
            broadcast_banner: { views: 0 },
          },
        },
      },
      {
        title: 'Live Webinar: Pediatric & Geriatric Dosage Calculator Walkthrough',
        message: 'Interactive digital masterclass demonstrating real-time renal adjustment and black-box safety checks in the 9th Edition formulary.',
        category: 'WEBINARS',
        channels: ['in_app', 'email'],
        priority: 'medium',
        targetAudience: { type: 'ALL' },
        actionUrl: 'https://webinar.ipc.gov.in/dosage-calculator',
        actionLabel: 'Join Webinar Link',
        status: 'scheduled',
        scheduledAt: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000),
        isActive: true,
        deliveryStats: { targetCount: 1500, deliveredCount: 0, readCount: 0, failedCount: 0 },
      },
      {
        title: 'Continuing Medical Education (CME) Pharmacology Modules Live',
        message: 'Accredited 5-credit CME modules for registered doctors and post-graduate scholars are now available for digital study.',
        category: 'TRAINING',
        channels: ['in_app', 'email'],
        priority: 'low',
        targetAudience: { type: 'USER_TYPES', userTypes: ['DOCTOR', 'STUDENT'] },
        actionUrl: '/admin/content',
        actionLabel: 'Start CME Module',
        status: 'draft',
        isActive: true,
        deliveryStats: { targetCount: 900, deliveredCount: 0, readCount: 0, failedCount: 0 },
      },
      {
        title: 'Critical Safety Broadcast: Central Drug Standard Control Alert',
        message: 'Urgent regulatory safety advisory regarding revised contraindications for third-generation cephalosporin combinations in pediatric cohorts.',
        category: 'ANNOUNCEMENT',
        channels: ['in_app', 'email', 'sms', 'broadcast_banner'],
        priority: 'urgent',
        targetAudience: { type: 'ALL' },
        actionUrl: '/admin/dashboard',
        actionLabel: 'Review Safety Bulletin',
        status: 'sent',
        sentAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        isActive: true,
        deliveryStats: {
          targetCount: 2200,
          deliveredCount: 2190,
          readCount: 1850,
          failedCount: 10,
          channelsSummary: {
            in_app: { sent: 2190, read: 1850 },
            email: { sent: 2190, opened: 1620 },
            sms: { sent: 2190, delivered: 2150 },
            broadcast_banner: { views: 6800 },
          },
        },
      },
      {
        title: 'Editorial Review Requested: Cardiovascular Monographs Section 4',
        message: '4 new monograph drafts have been submitted by the Maker team and are pending review by the Cardiology Scientific Advisory Committee.',
        category: 'WORKFLOW',
        channels: ['in_app', 'email'],
        priority: 'high',
        targetAudience: { type: 'ROLES', roles: ['reviewer', 'approver', 'admin', 'superadmin'] },
        actionUrl: '/admin/workflow',
        actionLabel: 'Open Editorial Desk',
        status: 'sent',
        sentAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        isActive: true,
        deliveryStats: {
          targetCount: 15,
          deliveredCount: 15,
          readCount: 14,
          failedCount: 0,
          channelsSummary: {
            in_app: { sent: 15, read: 14 },
            email: { sent: 15, opened: 13 },
            sms: { sent: 0, delivered: 0 },
            broadcast_banner: { views: 0 },
          },
        },
      },
    ];

    for (const notif of defaultCampaigns) {
      await Notification.findOneAndUpdate({ title: notif.title }, notif, {
        upsert: true,
        new: true,
      });
    }
  },

  /**
   * Aggregate KPI Statistics for Notifications
   */
  getNotificationStats: async () => {
    const [totalCampaigns, activeBroadcasts, scheduledCount, sentCount, statsAgg] =
      await Promise.all([
        Notification.countDocuments(),
        Notification.countDocuments({
          isActive: true,
          channels: 'broadcast_banner',
          status: 'sent',
        }),
        Notification.countDocuments({ status: 'scheduled' }),
        Notification.countDocuments({ status: 'sent' }),
        Notification.aggregate([
          {
            $group: {
              _id: null,
              totalDelivered: { $sum: '$deliveryStats.deliveredCount' },
              totalRead: { $sum: '$deliveryStats.readCount' },
            },
          },
        ]),
      ]);

    const totalDelivered = statsAgg[0]?.totalDelivered || 0;
    const totalRead = statsAgg[0]?.totalRead || 0;
    const readRatePercent =
      totalDelivered > 0 ? Math.round((totalRead / totalDelivered) * 100) : 0;

    return {
      totalCampaigns,
      activeBroadcasts,
      scheduledCount,
      sentCount,
      totalDelivered,
      readRatePercent,
    };
  },

  /**
   * List, Search, and Filter Notification Campaigns
   */
  getNotificationsList: async ({
    search = '',
    category = 'all',
    channel = 'all',
    priority = 'all',
    status = 'all',
    page = 1,
    limit = 10,
    sortBy = 'createdAt',
    sortOrder = 'desc',
  }) => {
    const query = {};

    if (search && search.trim()) {
      const searchRegex = new RegExp(search.trim(), 'i');
      query.$or = [{ title: searchRegex }, { message: searchRegex }];
    }

    if (category && category !== 'all') {
      query.category = category;
    }

    if (channel && channel !== 'all') {
      query.channels = channel;
    }

    if (priority && priority !== 'all') {
      query.priority = priority;
    }

    if (status && status !== 'all') {
      query.status = status;
    }

    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1;

    const pageNumber = Math.max(1, parseInt(page, 10));
    const pageSize = Math.max(1, Math.min(100, parseInt(limit, 10)));
    const skip = (pageNumber - 1) * pageSize;

    let [notifications, total] = await Promise.all([
      Notification.find(query)
        .sort(sortOptions)
        .skip(skip)
        .limit(pageSize)
        .populate('createdBy', 'name email role')
        .lean(),
      Notification.countDocuments(query),
    ]);

    if (notifications.length === 0 && !search && category === 'all' && status === 'all') {
      await notificationService.seedDefaultNotifications();
      [notifications, total] = await Promise.all([
        Notification.find(query)
          .sort(sortOptions)
          .skip(skip)
          .limit(pageSize)
          .populate('createdBy', 'name email role')
          .lean(),
        Notification.countDocuments(query),
      ]);
    }

    const totalPages = Math.ceil(total / pageSize) || 1;

    return {
      notifications,
      pagination: {
        total,
        page: pageNumber,
        limit: pageSize,
        totalPages,
      },
    };
  },

  /**
   * Get Single Notification Campaign by ID
   */
  getNotificationById: async (id) => {
    const notif = await Notification.findById(id)
      .populate('createdBy', 'name email role')
      .populate('targetAudience.specificUsers', 'name email username');

    if (!notif) throw new Error('Notification campaign not found');
    return notif;
  },

  /**
   * Create New Notification Campaign
   */
  createNotification: async (data, adminUser) => {
    const {
      title,
      message,
      category = 'ANNOUNCEMENT',
      channels = ['in_app'],
      priority = 'medium',
      targetAudience = { type: 'ALL' },
      actionUrl = '',
      actionLabel = 'View Details',
      scheduledAt = null,
      startDate = new Date(),
      endDate = null,
      sendNow = false,
    } = data;

    let status = 'draft';
    let sentAt = null;

    if (sendNow) {
      status = 'sent';
      sentAt = new Date();
    } else if (scheduledAt && new Date(scheduledAt) > new Date()) {
      status = 'scheduled';
    }

    // Estimate target audience count
    let estimatedTarget = 0;
    if (targetAudience.type === 'ALL') {
      const [adminCount, subCount] = await Promise.all([
        User.countDocuments({ status: 'active' }),
        Subscriber.countDocuments({ status: 'active' }),
      ]);
      estimatedTarget = adminCount + subCount;
    } else if (targetAudience.type === 'ROLES') {
      estimatedTarget = await User.countDocuments({
        role: { $in: targetAudience.roles || [] },
        status: 'active',
      });
    } else if (targetAudience.type === 'USER_TYPES') {
      estimatedTarget = await Subscriber.countDocuments({
        userType: { $in: targetAudience.userTypes || [] },
        status: 'active',
      });
    } else if (targetAudience.type === 'SPECIFIC_EMAILS') {
      estimatedTarget = targetAudience.specificEmails?.length || 0;
    }

    const newNotif = await Notification.create({
      title: title.trim(),
      message: message.trim(),
      category,
      channels,
      priority,
      targetAudience,
      actionUrl: actionUrl.trim(),
      actionLabel: actionLabel.trim(),
      status,
      scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
      sentAt,
      startDate: new Date(startDate),
      endDate: endDate ? new Date(endDate) : null,
      isActive: true,
      deliveryStats: {
        targetCount: estimatedTarget,
        deliveredCount: sendNow ? Math.max(1, estimatedTarget - 2) : 0,
        readCount: 0,
        failedCount: 0,
        channelsSummary: {
          in_app: { sent: sendNow && channels.includes('in_app') ? estimatedTarget : 0, read: 0 },
          email: { sent: sendNow && channels.includes('email') ? estimatedTarget : 0, opened: 0 },
          sms: { sent: sendNow && channels.includes('sms') ? estimatedTarget : 0, delivered: 0 },
          broadcast_banner: { views: 0 },
        },
      },
      createdBy: adminUser?._id || null,
    });

    return newNotif;
  },

  /**
   * Update Notification Campaign
   */
  updateNotification: async (id, data) => {
    const notif = await Notification.findById(id);
    if (!notif) throw new Error('Notification not found');

    const {
      title,
      message,
      category,
      channels,
      priority,
      targetAudience,
      actionUrl,
      actionLabel,
      scheduledAt,
      startDate,
      endDate,
    } = data;

    if (title) notif.title = title.trim();
    if (message) notif.message = message.trim();
    if (category) notif.category = category;
    if (channels) notif.channels = channels;
    if (priority) notif.priority = priority;
    if (targetAudience) notif.targetAudience = targetAudience;
    if (actionUrl !== undefined) notif.actionUrl = actionUrl.trim();
    if (actionLabel !== undefined) notif.actionLabel = actionLabel.trim();
    if (scheduledAt !== undefined) {
      notif.scheduledAt = scheduledAt ? new Date(scheduledAt) : null;
      notif.status = scheduledAt ? 'scheduled' : 'draft';
    }
    if (startDate) notif.startDate = new Date(startDate);
    if (endDate !== undefined) notif.endDate = endDate ? new Date(endDate) : null;

    await notif.save();
    return notif;
  },

  /**
   * Toggle Notification Active Status
   */
  toggleNotificationStatus: async (id, isActive) => {
    const notif = await Notification.findById(id);
    if (!notif) throw new Error('Notification not found');

    notif.isActive = !!isActive;
    if (!isActive && notif.status === 'scheduled') {
      notif.status = 'cancelled';
    }
    await notif.save();
    return notif;
  },

  /**
   * Trigger Immediate Dispatch
   */
  dispatchNotification: async (id) => {
    const notif = await Notification.findById(id);
    if (!notif) throw new Error('Notification not found');

    notif.status = 'sent';
    notif.sentAt = new Date();
    notif.isActive = true;

    // Simulate multi-channel delivery counts
    const target = notif.deliveryStats.targetCount || 100;
    const delivered = Math.max(1, target - Math.floor(Math.random() * 5));

    notif.deliveryStats.deliveredCount = delivered;
    if (notif.channels.includes('in_app')) notif.deliveryStats.channelsSummary.in_app.sent = delivered;
    if (notif.channels.includes('email')) notif.deliveryStats.channelsSummary.email.sent = delivered;
    if (notif.channels.includes('sms')) notif.deliveryStats.channelsSummary.sms.sent = delivered;

    await notif.save();
    return notif;
  },

  /**
   * Standalone Reusable Service: Programmatically trigger notifications from other modules
   */
  sendSystemNotification: async ({
    useCase = 'GENERAL',
    title,
    message,
    priority = 'medium',
    channels = ['in_app'],
    targetAudience = { type: 'ALL' },
    actionUrl = '',
    actionLabel = 'View',
  }) => {
    return notificationService.createNotification(
      {
        title,
        message,
        category: useCase,
        channels,
        priority,
        targetAudience,
        actionUrl,
        actionLabel,
        sendNow: true,
      },
      null
    );
  },

  /**
   * Get User Feed (In-App Notification Drawer)
   */
  getUserNotifications: async (user) => {
    if (!user) return [];

    const userRole = (user.role || '').toLowerCase();
    const now = new Date();

    const query = {
      isActive: true,
      status: 'sent',
      channels: 'in_app',
      $or: [
        { 'targetAudience.type': 'ALL' },
        { 'targetAudience.type': 'ROLES', 'targetAudience.roles': userRole },
        { 'targetAudience.type': 'SPECIFIC_EMAILS', 'targetAudience.specificEmails': user.email?.toLowerCase() },
      ],
    };

    const notifications = await Notification.find(query)
      .sort({ sentAt: -1 })
      .limit(20)
      .lean();

    // Mark whether read by this user
    return notifications.map((n) => {
      const isRead = n.readBy?.some((r) => r.user?.toString() === user._id?.toString());
      return {
        ...n,
        isRead: !!isRead,
      };
    });
  },

  /**
   * Mark Notification as Read
   */
  markAsRead: async (notificationId, userId) => {
    const notif = await Notification.findById(notificationId);
    if (!notif) throw new Error('Notification not found');

    const alreadyRead = notif.readBy.some((r) => r.user?.toString() === userId.toString());
    if (!alreadyRead) {
      notif.readBy.push({ user: userId, readAt: new Date() });
      notif.deliveryStats.readCount = (notif.deliveryStats.readCount || 0) + 1;
      if (notif.deliveryStats.channelsSummary?.in_app) {
        notif.deliveryStats.channelsSummary.in_app.read += 1;
      }
      await notif.save();
    }
    return { success: true };
  },
};

export default notificationService;
