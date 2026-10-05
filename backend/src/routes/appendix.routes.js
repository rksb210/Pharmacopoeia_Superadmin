import { Router } from 'express';
import {
  getAppendixStats,
  getAppendices,
  getAppendixById,
  createAppendix,
  updateAppendix,
  toggleAppendixStatus,
  deleteAppendix,
} from '../controllers/appendix.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';
import { requireAnyPermission } from '../middlewares/rbac.middleware.js';

const router = Router();

// Protect all appendix routes
router.use(authenticate);

const canView = requireAnyPermission([
  { module: 'CONTENT', section: 'APPENDICES', action: 'VIEW' },
  { module: 'CONTENT', section: 'MONOGRAPHS', action: 'VIEW' },
]);

const canAdd = requireAnyPermission([
  { module: 'CONTENT', section: 'APPENDICES', action: 'ADD' },
  { module: 'CONTENT', section: 'MONOGRAPHS', action: 'ADD' },
]);

const canEdit = requireAnyPermission([
  { module: 'CONTENT', section: 'APPENDICES', action: 'EDIT' },
  { module: 'CONTENT', section: 'MONOGRAPHS', action: 'EDIT' },
]);

const canDelete = requireAnyPermission([
  { module: 'CONTENT', section: 'APPENDICES', action: 'DELETE' },
  { module: 'CONTENT', section: 'MONOGRAPHS', action: 'DELETE' },
]);

// Stats
router.get('/stats', canView, getAppendixStats);

// List & Single Appendix
router.get('/', canView, getAppendices);
router.get('/:id', canView, getAppendixById);

// CRUD
router.post('/', canAdd, createAppendix);
router.put('/:id', canEdit, updateAppendix);
router.patch('/:id/status', canEdit, toggleAppendixStatus);
router.delete('/:id', canDelete, deleteAppendix);

export default router;
