import { Router } from 'express';
import {
  getDepartments,
  getActiveDepartments,
  getDepartmentById,
  getDepartmentStats,
  createDepartment,
  updateDepartment,
  toggleDepartmentStatus,
  deleteDepartment,
  seedDepartments,
} from '../controllers/department.controller.js';
import {
  validateCreateDepartment,
  validateUpdateDepartment,
  validateStatusToggle,
} from '../validators/department.validator.js';
import { authenticate } from '../middlewares/auth.middleware.js';
import { requirePermission } from '../middlewares/rbac.middleware.js';

const router = Router();

router.post('/seed', authenticate, seedDepartments);

router.use(authenticate);

router.get('/stats', requirePermission('SYSTEM', 'DEPARTMENTS', 'VIEW'), getDepartmentStats);
router.get('/active', getActiveDepartments);
router.get('/', requirePermission('SYSTEM', 'DEPARTMENTS', 'VIEW'), getDepartments);
router.get('/:id', requirePermission('SYSTEM', 'DEPARTMENTS', 'VIEW'), getDepartmentById);

router.post('/', requirePermission('SYSTEM', 'DEPARTMENTS', 'ADD'), validateCreateDepartment, createDepartment);
router.put('/:id', requirePermission('SYSTEM', 'DEPARTMENTS', 'EDIT'), validateUpdateDepartment, updateDepartment);
router.patch('/:id/status', requirePermission('SYSTEM', 'DEPARTMENTS', 'EDIT'), validateStatusToggle, toggleDepartmentStatus);
router.delete('/:id', requirePermission('SYSTEM', 'DEPARTMENTS', 'DELETE'), deleteDepartment);

export default router;
