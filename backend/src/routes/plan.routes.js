import { Router } from 'express';
import {
  getPlansStats,
  getPlans,
  getPlanById,
  getPlanSubscribers,
  createPlan,
  updatePlan,
  togglePlanStatus,
} from '../controllers/plan.controller.js';
import {
  validateCreatePlan,
  validateUpdatePlan,
} from '../validators/plan.validator.js';
import { authenticate } from '../middlewares/auth.middleware.js';
import { requirePermission } from '../middlewares/rbac.middleware.js';

const router = Router();

// Authentication required for all plan management
router.use(authenticate);

// Stats & Listing
router.get('/stats', requirePermission('SUBSCRIPTIONS', 'PLANS', 'VIEW'), getPlansStats);
router.get('/', requirePermission('SUBSCRIPTIONS', 'PLANS', 'VIEW'), getPlans);
router.get('/:id', requirePermission('SUBSCRIPTIONS', 'PLANS', 'VIEW'), getPlanById);
router.get('/:id/subscribers', requirePermission('SUBSCRIPTIONS', 'PLANS', 'VIEW'), getPlanSubscribers);

// Mutations
router.post('/', requirePermission('SUBSCRIPTIONS', 'PLANS', 'ADD'), validateCreatePlan, createPlan);
router.put('/:id', requirePermission('SUBSCRIPTIONS', 'PLANS', 'EDIT'), validateUpdatePlan, updatePlan);
router.patch('/:id/status', requirePermission('SUBSCRIPTIONS', 'PLANS', 'EDIT'), togglePlanStatus);

export default router;
