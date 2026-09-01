import { Router } from 'express';
import {
  getDesignations,
  getDesignationsByDepartment,
  getActiveDesignations,
  getDesignationById,
  getDesignationStats,
  createDesignation,
  updateDesignation,
  toggleDesignationStatus,
  deleteDesignation,
  seedDesignations,
} from '../controllers/designation.controller.js';
import {
  validateCreateDesignation,
  validateUpdateDesignation,
  validateStatusToggle,
} from '../validators/department.validator.js';
import { authenticate } from '../middlewares/auth.middleware.js';
import { requirePermission } from '../middlewares/rbac.middleware.js';

const router = Router();

router.post('/seed', authenticate, seedDesignations);

router.use(authenticate);

router.get('/stats', requirePermission('SYSTEM', 'DESIGNATIONS', 'VIEW'), getDesignationStats);
router.get('/active', getActiveDesignations);
router.get('/by-department/:departmentId', getDesignationsByDepartment);
router.get('/', requirePermission('SYSTEM', 'DESIGNATIONS', 'VIEW'), getDesignations);
router.get('/:id', requirePermission('SYSTEM', 'DESIGNATIONS', 'VIEW'), getDesignationById);

router.post('/', requirePermission('SYSTEM', 'DESIGNATIONS', 'ADD'), validateCreateDesignation, createDesignation);
router.put('/:id', requirePermission('SYSTEM', 'DESIGNATIONS', 'EDIT'), validateUpdateDesignation, updateDesignation);
router.patch('/:id/status', requirePermission('SYSTEM', 'DESIGNATIONS', 'EDIT'), validateStatusToggle, toggleDesignationStatus);
router.delete('/:id', requirePermission('SYSTEM', 'DESIGNATIONS', 'DELETE'), deleteDesignation);

export default router;
