import { Router } from 'express';
import multer from 'multer';
import {
  downloadTemplate,
  uploadAndValidate,
  confirmImport,
  getHistory,
  getJobById,
  downloadErrorReport,
} from '../controllers/bulkImport.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';
import { requirePermission } from '../middlewares/rbac.middleware.js';

const router = Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 15 * 1024 * 1024 }, // 15MB limit
});

// Authentication required for administrative bulk operations
router.use(authenticate);

// Official Template Download
router.get('/template', downloadTemplate);

// Upload & Pre-flight Validation
router.post(
  '/upload',
  requirePermission('SUBSCRIPTIONS', 'PLANS', 'ADD'),
  upload.single('file'),
  uploadAndValidate
);

// Confirm & Execute Batch
router.post(
  '/confirm',
  requirePermission('SUBSCRIPTIONS', 'PLANS', 'ADD'),
  confirmImport
);

// History & Details
router.get('/history', requirePermission('SUBSCRIPTIONS', 'PLANS', 'VIEW'), getHistory);
router.get('/:id', requirePermission('SUBSCRIPTIONS', 'PLANS', 'VIEW'), getJobById);
router.get('/:id/error-report', requirePermission('SUBSCRIPTIONS', 'PLANS', 'VIEW'), downloadErrorReport);

export default router;
