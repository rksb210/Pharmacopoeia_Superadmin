import { Router } from 'express';
import {
  getRoles,
  getRoleById,
  getPermissions,
  getMyPermissions,
  createRole,
  updateRole,
  deleteRole,
  toggleRoleStatus,
  assignRoleUsers,
  seedRBAC,
} from '../controllers/rbac.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';
import { requirePermission } from '../middlewares/rbac.middleware.js';

const router = Router();

// Public / Dev Seeding
router.post('/seed', seedRBAC);

// Authenticated User Permissions
router.get('/my-permissions', authenticate, getMyPermissions);

// Permissions Catalog
router.get('/permissions', authenticate, requirePermission('USERS', 'ROLES', 'VIEW'), getPermissions);

// Role Listing & Details
router.get('/roles', authenticate, requirePermission('USERS', 'ROLES', 'VIEW'), getRoles);
router.get('/roles/:id', authenticate, requirePermission('USERS', 'ROLES', 'VIEW'), getRoleById);

// Role Modifications
router.post('/roles', authenticate, requirePermission('USERS', 'ROLES', 'ADD'), createRole);
router.put('/roles/:id', authenticate, requirePermission('USERS', 'ROLES', 'EDIT'), updateRole);
router.delete('/roles/:id', authenticate, requirePermission('USERS', 'ROLES', 'DELETE'), deleteRole);
router.patch('/roles/:id/status', authenticate, requirePermission('USERS', 'ROLES', 'EDIT'), toggleRoleStatus);
router.post('/roles/:id/assign-users', authenticate, requirePermission('USERS', 'ROLES', 'EDIT'), assignRoleUsers);

export default router;
