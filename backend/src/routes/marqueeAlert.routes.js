import { Router } from 'express';
import {
  getAlertsList,
  getActiveAlertsForUser,
  createAlert,
  updateAlert,
  toggleAlertStatus,
  deleteAlert,
} from '../controllers/marqueeAlert.controller.js';
import { authenticate, optionalAuth } from '../middlewares/auth.middleware.js';
import { requirePermission } from '../middlewares/rbac.middleware.js';

const router = Router();

// Public / Authenticated route to get active alerts for Dashboard
router.get('/active', optionalAuth, getActiveAlertsForUser);

// Admin Master Management (Protected)
router.use(authenticate);

router.get('/', requirePermission('ENGAGEMENT', 'CRM', 'VIEW'), getAlertsList);
router.post('/', requirePermission('ENGAGEMENT', 'CRM', 'ADD'), createAlert);
router.put('/:id', requirePermission('ENGAGEMENT', 'CRM', 'EDIT'), updateAlert);
router.patch('/:id/status', requirePermission('ENGAGEMENT', 'CRM', 'EDIT'), toggleAlertStatus);
router.delete('/:id', requirePermission('ENGAGEMENT', 'CRM', 'DELETE'), deleteAlert);

export default router;
