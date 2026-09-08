import { Router } from 'express';
import {
  getCRMStats,
  getCustomers,
  getCustomerProfile360,
  addCustomerNote,
} from '../controllers/crm.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';
import { requirePermission, requireAnyPermission } from '../middlewares/rbac.middleware.js';

const router = Router();

router.use(authenticate);

router.get('/stats', requirePermission('ENGAGEMENT', 'CRM', 'VIEW'), getCRMStats);
router.get('/customers', requirePermission('ENGAGEMENT', 'CRM', 'VIEW'), getCustomers);
router.get('/customers/:id/360', requirePermission('ENGAGEMENT', 'CRM', 'VIEW'), getCustomerProfile360);
router.post(
  '/customers/:id/notes',
  requireAnyPermission([
    { module: 'ENGAGEMENT', section: 'CRM', action: 'ADD' },
    { module: 'ENGAGEMENT', section: 'CRM', action: 'EDIT' },
  ]),
  addCustomerNote
);

export default router;
