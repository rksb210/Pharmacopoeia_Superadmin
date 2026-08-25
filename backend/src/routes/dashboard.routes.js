import { Router } from 'express';
import { getDashboardOverview } from '../controllers/dashboard.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';
import { requirePermission } from '../middlewares/rbac.middleware.js';

const router = Router();

// Dashboard overview requires authenticated administrative session
router.get(
  '/overview',
  authenticate,
  requirePermission('OVERVIEW', 'DASHBOARD', 'VIEW'),
  getDashboardOverview
);

export default router;
