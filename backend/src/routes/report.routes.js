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

router.get('/overview', requirePermission('SETTINGS', 'SYSTEM', 'VIEW'), getOverview);
router.get('/users', requirePermission('USERS', 'SUBSCRIBERS', 'VIEW'), getUserReports);
router.get('/subscriptions', requirePermission('SUBSCRIPTIONS', 'PLANS', 'VIEW'), getSubscriptionReports);
router.get('/content', requirePermission('CONTENT', 'MONOGRAPHS', 'VIEW'), getContentReports);
router.get('/workflow', requirePermission('SETTINGS', 'SYSTEM', 'VIEW'), getWorkflowReports);
router.get('/commerce', requirePermission('SUBSCRIPTIONS', 'PLANS', 'VIEW'), getCommerceReports);
router.get('/crm', requirePermission('USERS', 'SUBSCRIBERS', 'VIEW'), getCRMReports);
router.get('/export/:domain', requirePermission('SETTINGS', 'SYSTEM', 'VIEW'), exportReport);

export default router;
