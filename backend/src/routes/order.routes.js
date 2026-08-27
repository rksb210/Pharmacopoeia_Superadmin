import { Router } from 'express';
import {
  getOrderStats,
  getOrdersList,
  getOrderById,
  processRefund,
  exportOrders,
} from '../controllers/order.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';
import { requirePermission } from '../middlewares/rbac.middleware.js';

const router = Router();

router.use(authenticate);

router.get('/stats', requirePermission('COMMERCIAL', 'SUBSCRIPTIONS', 'VIEW'), getOrderStats);
router.get('/export', requirePermission('COMMERCIAL', 'SUBSCRIPTIONS', 'VIEW'), exportOrders);
router.get('/', requirePermission('COMMERCIAL', 'SUBSCRIPTIONS', 'VIEW'), getOrdersList);
router.get('/:id', requirePermission('COMMERCIAL', 'SUBSCRIPTIONS', 'VIEW'), getOrderById);

// Refund processing
router.post('/:id/refund', requirePermission('COMMERCIAL', 'SUBSCRIPTIONS', 'EDIT'), processRefund);

export default router;
