import { Router } from 'express';
import {
  getSubscriptionStats,
  getSystemConfigs,
  updateSystemConfig,
  getSubscriptions,
  getSubscriptionById,
  assignSubscription,
  renewSubscription,
  cancelSubscription,
  changeSubscriptionStatus,
  getUserSubscriptionTimeline,
} from '../controllers/subscription.controller.js';
import {
  validateAssignSubscription,
  validateCancelSubscription,
  validateChangeStatus,
} from '../validators/subscription.validator.js';
import { authenticate } from '../middlewares/auth.middleware.js';
import { requirePermission } from '../middlewares/rbac.middleware.js';

const router = Router();

// Authentication required for all subscription routes
router.use(authenticate);

// Config & Stats
router.get('/stats', requirePermission('COMMERCIAL', 'SUBSCRIPTIONS', 'VIEW'), getSubscriptionStats);
router.get('/config', requirePermission('COMMERCIAL', 'SUBSCRIPTIONS', 'VIEW'), getSystemConfigs);
router.put('/config', requirePermission('COMMERCIAL', 'SUBSCRIPTIONS', 'EDIT'), updateSystemConfig);

// Directory & Details
router.get('/', requirePermission('COMMERCIAL', 'SUBSCRIPTIONS', 'VIEW'), getSubscriptions);
router.get('/:id', requirePermission('COMMERCIAL', 'SUBSCRIPTIONS', 'VIEW'), getSubscriptionById);
router.get('/user/:userId/timeline', requirePermission('COMMERCIAL', 'SUBSCRIPTIONS', 'VIEW'), getUserSubscriptionTimeline);

// Actions
router.post('/assign', requirePermission('COMMERCIAL', 'SUBSCRIPTIONS', 'ADD'), validateAssignSubscription, assignSubscription);
router.post('/:id/renew', requirePermission('COMMERCIAL', 'SUBSCRIPTIONS', 'EDIT'), renewSubscription);
router.post('/:id/cancel', requirePermission('COMMERCIAL', 'SUBSCRIPTIONS', 'DELETE'), validateCancelSubscription, cancelSubscription);
router.patch('/:id/status', requirePermission('COMMERCIAL', 'SUBSCRIPTIONS', 'EDIT'), validateChangeStatus, changeSubscriptionStatus);

export default router;
