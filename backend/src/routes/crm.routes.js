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

router.get('/stats', requirePermission('ENGAGEMENT', 'CRM', 'VIEW'), getCRMStats);
router.get('/customers', requirePermission('ENGAGEMENT', 'CRM', 'VIEW'), getCustomers);
router.get('/customers/:id/360', requirePermission('ENGAGEMENT', 'CRM', 'VIEW'), getCustomerProfile360);
router.post('/customers/:id/notes', requirePermission('ENGAGEMENT', 'CRM', 'EDIT'), addCustomerNote);

export default router;
