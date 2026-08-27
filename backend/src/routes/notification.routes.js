import { Router } from 'express';
import {
  getNotificationStats,
  getNotifications,
  getNotificationById,
  createNotification,
  updateNotification,
  toggleNotificationStatus,
  dispatchNotification,
  getMyFeed,
  markAsRead,
} from '../controllers/notification.controller.js';
import {
  validateCreateNotification,
  validateUpdateNotification,
} from '../validators/notification.validator.js';
import { authenticate } from '../middlewares/auth.middleware.js';
import { requirePermission } from '../middlewares/rbac.middleware.js';

const router = Router();

// Authentication required for notification endpoints
router.use(authenticate);

// User Feed & Mark As Read
router.get('/inbox/my-feed', getMyFeed);
router.post('/:id/read', markAsRead);

// Administrative Campaign Management
router.get('/stats', requirePermission('ENGAGEMENT', 'NOTIFICATIONS', 'VIEW'), getNotificationStats);
router.get('/', requirePermission('ENGAGEMENT', 'NOTIFICATIONS', 'VIEW'), getNotifications);
router.get('/:id', requirePermission('ENGAGEMENT', 'NOTIFICATIONS', 'VIEW'), getNotificationById);

// Mutations
router.post(
  '/',
  requirePermission('ENGAGEMENT', 'NOTIFICATIONS', 'ADD'),
  validateCreateNotification,
  createNotification
);
router.put(
  '/:id',
  requirePermission('ENGAGEMENT', 'NOTIFICATIONS', 'EDIT'),
  validateUpdateNotification,
  updateNotification
);
router.patch('/:id/status', requirePermission('ENGAGEMENT', 'NOTIFICATIONS', 'EDIT'), toggleNotificationStatus);
router.post('/:id/dispatch', requirePermission('ENGAGEMENT', 'NOTIFICATIONS', 'PUBLISH'), dispatchNotification);

export default router;
