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
router.get('/stats', requirePermission('SETTINGS', 'SYSTEM', 'VIEW'), getNotificationStats);
router.get('/', requirePermission('SETTINGS', 'SYSTEM', 'VIEW'), getNotifications);
router.get('/:id', requirePermission('SETTINGS', 'SYSTEM', 'VIEW'), getNotificationById);

// Mutations
router.post(
  '/',
  requirePermission('SETTINGS', 'SYSTEM', 'EDIT'),
  validateCreateNotification,
  createNotification
);
router.put(
  '/:id',
  requirePermission('SETTINGS', 'SYSTEM', 'EDIT'),
  validateUpdateNotification,
  updateNotification
);
router.patch('/:id/status', requirePermission('SETTINGS', 'SYSTEM', 'EDIT'), toggleNotificationStatus);
router.post('/:id/dispatch', requirePermission('SETTINGS', 'SYSTEM', 'EDIT'), dispatchNotification);

export default router;
