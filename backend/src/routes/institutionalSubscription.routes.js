import { Router } from 'express';
import {
  getInstitutionalStats,
  getBatchesLedger,
  getBatchRoster,
  exportBatchRosterCSV,
  getGlobalEnrolledMembers,
  toggleMemberSeatStatus,
  getInstitutionMaster,
} from '../controllers/institutionalSubscription.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';
import { requirePermission } from '../middlewares/rbac.middleware.js';

const router = Router();

// Authentication required for all administrative institutional monitoring
router.use(authenticate);

// Top KPI Metric Summary
router.get(
  '/stats',
  requirePermission('USERS', 'INSTITUTIONAL_SUBSCRIPTIONS', 'VIEW'),
  getInstitutionalStats
);

// Segmented Batch Ledger (All / Universities / Industry)
router.get(
  '/batches',
  requirePermission('USERS', 'INSTITUTIONAL_SUBSCRIPTIONS', 'VIEW'),
  getBatchesLedger
);

// Specific Batch Roster Modal Details
router.get(
  '/batches/:id/roster',
  requirePermission('USERS', 'INSTITUTIONAL_SUBSCRIPTIONS', 'VIEW'),
  getBatchRoster
);

// Export Batch Roster CSV
router.get(
  '/batches/:id/export-roster',
  requirePermission('USERS', 'INSTITUTIONAL_SUBSCRIPTIONS', 'EXPORT'),
  exportBatchRosterCSV
);

// Global Enrolled Members Directory
router.get(
  '/members',
  requirePermission('USERS', 'INSTITUTIONAL_SUBSCRIPTIONS', 'VIEW'),
  getGlobalEnrolledMembers
);

// Toggle Member Seat Status
router.patch(
  '/members/:id/status',
  requirePermission('USERS', 'INSTITUTIONAL_SUBSCRIPTIONS', 'EDIT'),
  toggleMemberSeatStatus
);

// Institution Master Overview
router.get(
  '/institutions',
  requirePermission('USERS', 'INSTITUTIONAL_SUBSCRIPTIONS', 'VIEW'),
  getInstitutionMaster
);

export default router;
