import { Router } from 'express';
import {
  login,
  getMe,
  logout,
  seedSuperAdmin,
} from '../controllers/auth.controller.js';
import { validateLogin } from '../validators/auth.validator.js';
import { authenticate } from '../middlewares/auth.middleware.js';

const router = Router();

// Public routes
router.post('/login', validateLogin, login);
router.post('/logout', logout);
router.post('/seed', seedSuperAdmin);

// Protected routes
router.get('/me', authenticate, getMe);

export default router;
