import MarqueeAlert from '../models/marqueeAlert.model.js';
import { escapeRegex } from '../middlewares/security.middleware.js';

export const marqueeAlertService = {
  /**
   * List all Marquee Alerts with filtering & pagination (Admin Master)
   */
  getAlertsList: async ({
    search = '',
    userType = 'all',
    alertType = 'all',
    status = 'all',
    page = 1,
    limit = 20,
    sortBy = 'createdAt',
    sortOrder = 'desc',
  }) => {
    const query = {};

    if (search && search.trim()) {
      const safeSearch = escapeRegex(search.trim());
      const regex = new RegExp(safeSearch, 'i');
      query.$or = [{ title: regex }, { message: regex }, { linkLabel: regex }];
    }

    if (userType && userType !== 'all') {
      query.targetUserTypes = { $in: [userType.toUpperCase(), 'ALL'] };
    }

    if (alertType && alertType !== 'all') {
      query.alertType = alertType;
    }

    if (status && status !== 'all') {
      query.isActive = status === 'active';
    }

    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.max(1, Math.min(100, parseInt(limit, 10)));
    const skip = (pageNum - 1) * limitNum;

    const sort = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

    const [alerts, total] = await Promise.all([
      MarqueeAlert.find(query).sort(sort).skip(skip).limit(limitNum).lean(),
      MarqueeAlert.countDocuments(query),
    ]);

    const totalActive = await MarqueeAlert.countDocuments({ isActive: true });

    return {
      alerts,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum) || 1,
      },
      stats: {
        totalAlerts: total,
        activeAlerts: totalActive,
      },
    };
  },

  /**
   * Get Active Marquee Alerts for a specific Logged-in User
   * (Matches user's userType or 'ALL', is active, and within validity date)
   */
  getActiveAlertsForUser: async (userType = 'ALL') => {
    const now = new Date();
    const cleanUserType = (userType || 'ALL').toUpperCase().trim();

    const query = {
      isActive: true,
      $or: [
        { targetUserTypes: 'ALL' },
        { targetUserTypes: cleanUserType },
      ],
      $and: [
        {
          $or: [{ startDate: { $lte: now } }, { startDate: null }, { startDate: { $exists: false } }],
        },
        {
          $or: [{ endDate: { $gte: now } }, { endDate: null }, { endDate: { $exists: false } }],
        },
      ],
    };

    const alerts = await MarqueeAlert.find(query).sort({ priority: -1, createdAt: -1 }).lean();
    return alerts;
  },

  /**
   * Create New Marquee Alert
   */
  createAlert: async (data, adminUser) => {
    const {
      title,
      message,
      targetUserTypes = ['ALL'],
      alertType = 'info',
      priority = 'medium',
      speed = 'normal',
      linkUrl = '',
      linkLabel = '',
      isActive = true,
      startDate,
      endDate,
    } = data;

    if (!title || !title.trim()) throw new Error('Alert title or tag is required.');
    if (!message || !message.trim()) throw new Error('Marquee alert message text is required.');

    const cleanUserTypes = Array.isArray(targetUserTypes) && targetUserTypes.length > 0
      ? targetUserTypes.map((t) => t.toUpperCase().trim())
      : ['ALL'];

    const newAlert = await MarqueeAlert.create({
      title: title.trim(),
      message: message.trim(),
      targetUserTypes: cleanUserTypes,
      alertType,
      priority,
      speed,
      linkUrl: linkUrl ? linkUrl.trim() : '',
      linkLabel: linkLabel ? linkLabel.trim() : '',
      isActive: !!isActive,
      startDate: startDate ? new Date(startDate) : new Date(),
      endDate: endDate ? new Date(endDate) : null,
      createdBy: adminUser?._id || null,
      authorName: adminUser?.name || 'Superadmin',
    });

    return newAlert;
  },

  /**
   * Update Marquee Alert
   */
  updateAlert: async (id, data, adminUser) => {
    const alert = await MarqueeAlert.findById(id);
    if (!alert) throw new Error('Marquee alert not found.');

    const {
      title,
      message,
      targetUserTypes,
      alertType,
      priority,
      speed,
      linkUrl,
      linkLabel,
      isActive,
      startDate,
      endDate,
    } = data;

    if (title !== undefined) alert.title = title.trim();
    if (message !== undefined) alert.message = message.trim();
    if (targetUserTypes !== undefined) {
      alert.targetUserTypes = Array.isArray(targetUserTypes) && targetUserTypes.length > 0
        ? targetUserTypes.map((t) => t.toUpperCase().trim())
        : ['ALL'];
    }
    if (alertType !== undefined) alert.alertType = alertType;
    if (priority !== undefined) alert.priority = priority;
    if (speed !== undefined) alert.speed = speed;
    if (linkUrl !== undefined) alert.linkUrl = linkUrl ? linkUrl.trim() : '';
    if (linkLabel !== undefined) alert.linkLabel = linkLabel ? linkLabel.trim() : '';
    if (isActive !== undefined) alert.isActive = !!isActive;
    if (startDate !== undefined) alert.startDate = startDate ? new Date(startDate) : new Date();
    if (endDate !== undefined) alert.endDate = endDate ? new Date(endDate) : null;

    if (adminUser?.name) alert.authorName = adminUser.name;

    await alert.save();
    return alert;
  },

  /**
   * Toggle Active / Inactive Status
   */
  toggleAlertStatus: async (id, isActive) => {
    const alert = await MarqueeAlert.findById(id);
    if (!alert) throw new Error('Marquee alert not found.');

    alert.isActive = !!isActive;
    await alert.save();
    return alert;
  },

  /**
   * Delete Marquee Alert
   */
  deleteAlert: async (id) => {
    const alert = await MarqueeAlert.findByIdAndDelete(id);
    if (!alert) throw new Error('Marquee alert not found.');
    return { success: true, message: 'Marquee alert removed successfully.' };
  },
};

export default marqueeAlertService;
