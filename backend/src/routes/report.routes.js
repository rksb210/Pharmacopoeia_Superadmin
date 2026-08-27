import { Router } from 'express';
import {
  getOverview,
  getUserReports,
  getSubscriptionReports,
  getContentReports,
  getWorkflowReports,
  getCommerceReports,
  getCRMReports,
  exportReport,
} from '../controllers/report.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';
import { requirePermission } from '../middlewares/rbac.middleware.js';

const router = Router();

router.use(authenticate);

router.get('/overview', requirePermission('SYSTEM', 'REPORTS', 'VIEW'), getOverview);
router.get('/users', requirePermission('SYSTEM', 'REPORTS', 'VIEW'), getUserReports);
router.get('/subscriptions', requirePermission('SYSTEM', 'REPORTS', 'VIEW'), getSubscriptionReports);
router.get('/content', requirePermission('SYSTEM', 'REPORTS', 'VIEW'), getContentReports);
router.get('/workflow', requirePermission('SYSTEM', 'REPORTS', 'VIEW'), getWorkflowReports);
router.get('/commerce', requirePermission('SYSTEM', 'REPORTS', 'VIEW'), getCommerceReports);
router.get('/crm', requirePermission('SYSTEM', 'REPORTS', 'VIEW'), getCRMReports);
router.get('/export/:domain', requirePermission('SYSTEM', 'REPORTS', 'EXPORT'), exportReport);

export default router;
