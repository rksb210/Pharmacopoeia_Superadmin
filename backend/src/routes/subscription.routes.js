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
router.get('/stats', requirePermission('SUBSCRIPTIONS', 'PLANS', 'VIEW'), getSubscriptionStats);
router.get('/config', requirePermission('SUBSCRIPTIONS', 'PLANS', 'VIEW'), getSystemConfigs);
router.put('/config', requirePermission('SUBSCRIPTIONS', 'PLANS', 'EDIT'), updateSystemConfig);

// Directory & Details
router.get('/', requirePermission('SUBSCRIPTIONS', 'PLANS', 'VIEW'), getSubscriptions);
router.get('/:id', requirePermission('SUBSCRIPTIONS', 'PLANS', 'VIEW'), getSubscriptionById);
router.get('/user/:userId/timeline', requirePermission('SUBSCRIPTIONS', 'PLANS', 'VIEW'), getUserSubscriptionTimeline);

// Actions
router.post('/assign', requirePermission('SUBSCRIPTIONS', 'PLANS', 'ADD'), validateAssignSubscription, assignSubscription);
router.post('/:id/renew', requirePermission('SUBSCRIPTIONS', 'PLANS', 'EDIT'), renewSubscription);
router.post('/:id/cancel', requirePermission('SUBSCRIPTIONS', 'PLANS', 'DELETE'), validateCancelSubscription, cancelSubscription);
router.patch('/:id/status', requirePermission('SUBSCRIPTIONS', 'PLANS', 'EDIT'), validateChangeStatus, changeSubscriptionStatus);

export default router;
