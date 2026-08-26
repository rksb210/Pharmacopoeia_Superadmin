import notificationService from '../services/notification.service.js';

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
