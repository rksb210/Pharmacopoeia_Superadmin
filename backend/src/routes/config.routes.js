import { Router } from 'express';
import {
  getPublicConfig,
  getFullConfig,
  updateConfig,
  restoreConfigVersion,
} from '../controllers/config.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';
import { requirePermission } from '../middlewares/rbac.middleware.js';

const router = Router();

// Public configuration endpoint
router.get('/public', getPublicConfig);

// Protected administrative configuration endpoints
router.use(authenticate);

router.get('/', requirePermission('SETTINGS', 'SYSTEM', 'VIEW'), getFullConfig);
router.put('/', requirePermission('SETTINGS', 'SYSTEM', 'EDIT'), updateConfig);
router.post('/restore/:version', requirePermission('SETTINGS', 'SYSTEM', 'EDIT'), restoreConfigVersion);

export default router;
