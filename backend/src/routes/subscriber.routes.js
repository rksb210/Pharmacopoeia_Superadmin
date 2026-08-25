import { Router } from 'express';
import {
  getUserTypes,
  getSubscriberStats,
  getSubscribers,
  getSubscriberById,
  createSubscriber,
  updateSubscriber,
  toggleSubscriberStatus,
  resetSubscriberPassword,
  assignTrial,
  assignComplimentary,
  assignDiscount,
} from '../controllers/subscriber.controller.js';
import {
  validateCreateSubscriber,
  validateUpdateSubscriber,
} from '../validators/subscriber.validator.js';
import { authenticate } from '../middlewares/auth.middleware.js';
import { requirePermission } from '../middlewares/rbac.middleware.js';

const router = Router();

// Authentication required for all subscriber management
router.use(authenticate);

// Configurable User Types Master
router.get('/types', requirePermission('USERS', 'USERS', 'VIEW'), getUserTypes);

// KPI Stats
router.get('/stats', requirePermission('USERS', 'USERS', 'VIEW'), getSubscriberStats);

// Directory Listing & Details
router.get('/', requirePermission('USERS', 'USERS', 'VIEW'), getSubscribers);
router.get('/:id', requirePermission('USERS', 'USERS', 'VIEW'), getSubscriberById);

// Create / Edit
router.post('/', requirePermission('USERS', 'USERS', 'ADD'), validateCreateSubscriber, createSubscriber);
router.put('/:id', requirePermission('USERS', 'USERS', 'EDIT'), validateUpdateSubscriber, updateSubscriber);

// Status & Password
router.patch('/:id/status', requirePermission('USERS', 'USERS', 'EDIT'), toggleSubscriberStatus);
router.post('/:id/reset-password', requirePermission('USERS', 'USERS', 'EDIT'), resetSubscriberPassword);

// Subscription Lifecycle Operations
router.post('/:id/trial', requirePermission('USERS', 'USERS', 'EDIT'), assignTrial);
router.post('/:id/complimentary', requirePermission('USERS', 'USERS', 'EDIT'), assignComplimentary);
router.post('/:id/discount', requirePermission('USERS', 'USERS', 'EDIT'), assignDiscount);

export default router;
