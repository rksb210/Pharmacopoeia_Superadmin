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
router.get('/stats', requirePermission('COMMERCIAL', 'PLANS', 'VIEW'), getPlansStats);
router.get('/', requirePermission('COMMERCIAL', 'PLANS', 'VIEW'), getPlans);
router.get('/:id', requirePermission('COMMERCIAL', 'PLANS', 'VIEW'), getPlanById);
router.get('/:id/subscribers', requirePermission('COMMERCIAL', 'PLANS', 'VIEW'), getPlanSubscribers);

// Mutations
router.post('/', requirePermission('COMMERCIAL', 'PLANS', 'ADD'), validateCreatePlan, createPlan);
router.put('/:id', requirePermission('COMMERCIAL', 'PLANS', 'EDIT'), validateUpdatePlan, updatePlan);
router.patch('/:id/status', requirePermission('COMMERCIAL', 'PLANS', 'EDIT'), togglePlanStatus);

export default router;
