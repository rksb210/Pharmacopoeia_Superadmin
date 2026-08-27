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

router.get('/stats', requirePermission('SYSTEM', 'AUDIT_LOGS', 'VIEW'), getAuditStats);
router.get('/export', requirePermission('SYSTEM', 'AUDIT_LOGS', 'EXPORT'), exportAuditLogs);
router.get('/', requirePermission('SYSTEM', 'AUDIT_LOGS', 'VIEW'), getAuditLogsList);
router.get('/:id', requirePermission('SYSTEM', 'AUDIT_LOGS', 'VIEW'), getAuditLogById);

export default router;
