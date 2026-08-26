import { Router } from 'express';
import {
  getAuditStats,
  getAuditLogsList,
  getAuditLogById,
  exportAuditLogs,
} from '../controllers/audit.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';
import { requirePermission } from '../middlewares/rbac.middleware.js';

const router = Router();

router.use(authenticate);

router.get('/stats', requirePermission('SETTINGS', 'SYSTEM', 'VIEW'), getAuditStats);
router.get('/export', requirePermission('SETTINGS', 'SYSTEM', 'VIEW'), exportAuditLogs);
router.get('/', requirePermission('SETTINGS', 'SYSTEM', 'VIEW'), getAuditLogsList);
router.get('/:id', requirePermission('SETTINGS', 'SYSTEM', 'VIEW'), getAuditLogById);

export default router;
