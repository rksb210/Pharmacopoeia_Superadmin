import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import {
  getStats,
  getCourses,
  getCourseById,
  createCourse,
  updateCourse,
  deleteCourse,
  toggleStatus,
  submitForReview,
  reviewCourse,
  approveCourse,
  getEnrollments,
  uploadMaterialFile,
} from '../controllers/diksha.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';
import { requirePermission } from '../middlewares/rbac.middleware.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadDir = path.join(__dirname, '../../uploads/diksha');

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const cleanBase = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9_-]/g, '_');
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e6)}`;
    cb(null, `${cleanBase}-${uniqueSuffix}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
  fileFilter: (req, file, cb) => {
    const allowed = ['.pdf', '.doc', '.docx', '.ppt', '.pptx', '.xls', '.xlsx', '.txt'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error(`File type ${ext} is not allowed. Supported formats: PDF, Word, PPT, Excel, TXT.`));
    }
  },
});

const router = Router();

// Protect all DIKSHA endpoints
router.use(authenticate);

// Aggregated Stats & Enrollments
router.get('/stats', requirePermission('INTEGRATED', 'DIKSHA', 'VIEW'), getStats);
router.get('/enrollments', requirePermission('INTEGRATED', 'DIKSHA', 'VIEW'), getEnrollments);

// Course List & Detail
router.get('/courses', requirePermission('INTEGRATED', 'DIKSHA', 'VIEW'), getCourses);
router.get('/courses/:id', requirePermission('INTEGRATED', 'DIKSHA', 'VIEW'), getCourseById);

// Study Material File Upload (from Admin PC)
router.post('/upload-material', upload.single('file'), uploadMaterialFile);

// Course Mutations
router.post('/courses', requirePermission('INTEGRATED', 'DIKSHA', 'ADD'), createCourse);
router.put('/courses/:id', requirePermission('INTEGRATED', 'DIKSHA', 'EDIT'), updateCourse);
router.patch('/courses/:id/status', requirePermission('INTEGRATED', 'DIKSHA', 'EDIT'), toggleStatus);
router.delete('/courses/:id', requirePermission('INTEGRATED', 'DIKSHA', 'DELETE'), deleteCourse);

// Multi-Tier Workflow Endpoints (Maker ➔ Reviewer ➔ Approver)
router.post('/courses/:id/submit-review', requirePermission('INTEGRATED', 'DIKSHA', 'EDIT'), submitForReview);
router.post('/courses/:id/review', requirePermission('INTEGRATED', 'DIKSHA', 'EDIT'), reviewCourse);
router.post('/courses/:id/approve', requirePermission('INTEGRATED', 'DIKSHA', 'APPROVE'), approveCourse);

export default router;

