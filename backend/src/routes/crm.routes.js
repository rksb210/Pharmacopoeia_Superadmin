import { Router } from 'express';
import {
  getCRMStats,
  getCustomers,
  getCustomerProfile360,
  addCustomerNote,
} from '../controllers/crm.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';
import { requirePermission } from '../middlewares/rbac.middleware.js';

const router = Router();

router.use(authenticate);

router.get('/stats', requirePermission('USERS', 'SUBSCRIBERS', 'VIEW'), getCRMStats);
router.get('/customers', requirePermission('USERS', 'SUBSCRIBERS', 'VIEW'), getCustomers);
router.get('/customers/:id/360', requirePermission('USERS', 'SUBSCRIBERS', 'VIEW'), getCustomerProfile360);
router.post('/customers/:id/notes', requirePermission('USERS', 'SUBSCRIBERS', 'EDIT'), addCustomerNote);

export default router;
