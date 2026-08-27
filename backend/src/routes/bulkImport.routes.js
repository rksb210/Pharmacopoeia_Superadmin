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

const allowedMimes = [
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-excel',
  'text/csv',
  'application/csv',
];

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    const isMimeValid = allowedMimes.includes(file.mimetype);
    const isExtValid = /\.(xlsx|xls|csv)$/i.test(file.originalname);

    if (isMimeValid || isExtValid) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only Excel spreadsheets (.xlsx, .xls) and CSV files are permitted.'));
    }
  },
});

// Authentication required for administrative bulk operations
router.use(authenticate);

// Official Template Download
router.get('/template', downloadTemplate);

// Upload & Pre-flight Validation
router.post(
  '/upload',
  requirePermission('COMMERCIAL', 'BULK_SUBSCRIPTION', 'ADD'),
  upload.single('file'),
  uploadAndValidate
);

// Confirm & Execute Batch
router.post(
  '/confirm',
  requirePermission('COMMERCIAL', 'BULK_SUBSCRIPTION', 'ADD'),
  confirmImport
);

// History & Details
router.get('/history', requirePermission('COMMERCIAL', 'BULK_SUBSCRIPTION', 'VIEW'), getHistory);
router.get('/:id', requirePermission('COMMERCIAL', 'BULK_SUBSCRIPTION', 'VIEW'), getJobById);
router.get('/:id/error-report', requirePermission('COMMERCIAL', 'BULK_SUBSCRIPTION', 'VIEW'), downloadErrorReport);

export default router;
