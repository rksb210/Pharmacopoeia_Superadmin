import { Router } from 'express';
import {
  getStats,
  getCourses,
  getCourseById,
  createCourse,
  updateCourse,
  deleteCourse,
  toggleStatus,
  getEnrollments,
} from '../controllers/diksha.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';
import { requirePermission } from '../middlewares/rbac.middleware.js';

const router = Router();

// Protect all DIKSHA endpoints
router.use(authenticate);

// Aggregated Stats & Enrollments
router.get('/stats', requirePermission('INTEGRATED', 'DIKSHA', 'VIEW'), getStats);
router.get('/enrollments', requirePermission('INTEGRATED', 'DIKSHA', 'VIEW'), getEnrollments);

// Course List & Detail
router.get('/courses', requirePermission('INTEGRATED', 'DIKSHA', 'VIEW'), getCourses);
router.get('/courses/:id', requirePermission('INTEGRATED', 'DIKSHA', 'VIEW'), getCourseById);

// Course Mutations
router.post('/courses', requirePermission('INTEGRATED', 'DIKSHA', 'CREATE'), createCourse);
router.put('/courses/:id', requirePermission('INTEGRATED', 'DIKSHA', 'EDIT'), updateCourse);
router.patch('/courses/:id/status', requirePermission('INTEGRATED', 'DIKSHA', 'EDIT'), toggleStatus);
router.delete('/courses/:id', requirePermission('INTEGRATED', 'DIKSHA', 'DELETE'), deleteCourse);

export default router;
