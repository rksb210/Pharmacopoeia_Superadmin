import { Router } from 'express';
import {
  getAdminStats,
  getAdmins,
  getAdminById,
  createAdmin,
  updateAdmin,
  toggleAdminStatus,
  resetAdminPassword,
  updateAdminPermissions,
} from '../controllers/admin.controller.js';
import {
  validateCreateAdmin,
  validateUpdateAdmin,
  validateAdminStatus,
  validateResetAdminPassword,
  validateUpdatePermissions,
} from '../validators/admin.validator.js';
import { authenticate } from '../middlewares/auth.middleware.js';
import { requirePermission } from '../middlewares/rbac.middleware.js';

const router = Router();

// All Admin Management routes require valid session authentication
router.use(authenticate);

// Get KPI Stats
router.get('/stats', requirePermission('USERS', 'ADMINS', 'VIEW'), getAdminStats);

// List Admins with Search / Filters / Pagination
router.get('/', requirePermission('USERS', 'ADMINS', 'VIEW'), getAdmins);

// Get Single Admin Details
router.get('/:id', requirePermission('USERS', 'ADMINS', 'VIEW'), getAdminById);

// Create New Admin
router.post('/', requirePermission('USERS', 'ADMINS', 'ADD'), validateCreateAdmin, createAdmin);

// Edit Admin
router.put('/:id', requirePermission('USERS', 'ADMINS', 'EDIT'), validateUpdateAdmin, updateAdmin);

// Toggle Admin Status (Activate / Deactivate)
router.patch('/:id/status', requirePermission('USERS', 'ADMINS', 'EDIT'), validateAdminStatus, toggleAdminStatus);

// Reset Admin Password
router.post('/:id/reset-password', requirePermission('USERS', 'ADMINS', 'EDIT'), validateResetAdminPassword, resetAdminPassword);

// Custom Permissions Override
router.put('/:id/permissions', requirePermission('USERS', 'ROLES', 'EDIT'), validateUpdatePermissions, updateAdminPermissions);

export default router;
