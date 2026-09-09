import notificationService from '../services/notification.service.js';
import { auditService } from '../services/audit.service.js';

export const getNotificationStats = async (req, res, next) => {
  try {
    const stats = await notificationService.getNotificationStats();
    return res.status(200).json({
      success: true,
      stats,
    });
  } catch (error) {
    next(error);
  }
};

export const getNotifications = async (req, res, next) => {
  try {
    const { search, category, channel, priority, status, page, limit, sortBy, sortOrder } =
      req.query;
    const result = await notificationService.getNotificationsList({
      search,
      category,
      channel,
      priority,
      status,
      page,
      limit,
      sortBy,
      sortOrder,
    });
    return res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error) {
    next(error);
  }
};

export const getNotificationById = async (req, res, next) => {
  try {
    const notification = await notificationService.getNotificationById(req.params.id);
    return res.status(200).json({
      success: true,
      notification,
    });
  } catch (error) {
    next(error);
  }
};

export const createNotification = async (req, res) => {
  try {
    const newNotif = await notificationService.createNotification(req.body, req.user);

    await auditService.log(req, {
      action: 'NOTIFICATION_CREATED',
      module: 'NOTIFICATIONS',
      entity: 'Notification',
      entityId: newNotif._id,
      status: 'SUCCESS',
      details: `Created notification campaign "${newNotif.title}" (Channels: ${(newNotif.channel || []).join(', ')}).`,
      newValues: {
        title: newNotif.title,
        category: newNotif.category,
        priority: newNotif.priority,
        targetUserTypes: newNotif.targetUserTypes,
      },
    });

    return res.status(201).json({
      success: true,
      message: 'Notification campaign created successfully.',
      notification: newNotif,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

export const updateNotification = async (req, res) => {
  try {
    const updated = await notificationService.updateNotification(req.params.id, req.body);

    await auditService.log(req, {
      action: 'NOTIFICATION_UPDATED',
      module: 'NOTIFICATIONS',
      entity: 'Notification',
      entityId: updated._id,
      status: 'SUCCESS',
      details: `Updated notification campaign "${updated.title}".`,
      newValues: {
        title: updated.title,
        category: updated.category,
        priority: updated.priority,
      },
    });

    return res.status(200).json({
      success: true,
      message: 'Notification campaign updated successfully.',
      notification: updated,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

export const toggleNotificationStatus = async (req, res) => {
  try {
    const { isActive } = req.body;
    const updated = await notificationService.toggleNotificationStatus(req.params.id, isActive);

    await auditService.log(req, {
      action: 'NOTIFICATION_STATUS_CHANGED',
      module: 'NOTIFICATIONS',
      entity: 'Notification',
      entityId: updated._id,
      status: 'SUCCESS',
      details: `Notification campaign "${updated.title}" ${isActive ? 'activated' : 'deactivated'}.`,
      newValues: { isActive },
    });

    return res.status(200).json({
      success: true,
      message: `Notification ${isActive ? 'activated' : 'deactivated'} successfully.`,
      notification: updated,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

export const dispatchNotification = async (req, res) => {
  try {
    const dispatched = await notificationService.dispatchNotification(req.params.id);

    await auditService.log(req, {
      action: 'NOTIFICATION_DISPATCHED',
      module: 'NOTIFICATIONS',
      entity: 'Notification',
      entityId: dispatched._id,
      status: 'SUCCESS',
      details: `Broadcast notification campaign "${dispatched.title}" dispatched. Total dispatched: ${dispatched.analytics?.sentCount || 0}.`,
    });

    return res.status(200).json({
      success: true,
      message: 'Notification campaign dispatched across selected channels.',
      notification: dispatched,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

export const getMyFeed = async (req, res, next) => {
  try {
    const feed = await notificationService.getUserNotifications(req.user);
    return res.status(200).json({
      success: true,
      notifications: feed,
    });
  } catch (error) {
    next(error);
  }
};

export const markAsRead = async (req, res) => {
  try {
    await notificationService.markAsRead(req.params.id, req.user._id);
    return res.status(200).json({
      success: true,
      message: 'Marked as read',
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};
