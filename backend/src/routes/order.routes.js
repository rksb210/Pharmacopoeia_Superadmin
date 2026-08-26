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

router.get('/stats', requirePermission('SUBSCRIPTIONS', 'PLANS', 'VIEW'), getOrderStats);
router.get('/export', requirePermission('SUBSCRIPTIONS', 'PLANS', 'VIEW'), exportOrders);
router.get('/', requirePermission('SUBSCRIPTIONS', 'PLANS', 'VIEW'), getOrdersList);
router.get('/:id', requirePermission('SUBSCRIPTIONS', 'PLANS', 'VIEW'), getOrderById);

// Refund processing
router.post('/:id/refund', requirePermission('SUBSCRIPTIONS', 'PLANS', 'EDIT'), processRefund);

export default router;
