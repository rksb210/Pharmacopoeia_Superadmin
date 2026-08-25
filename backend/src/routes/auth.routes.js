import { Router } from 'express';
import {
  login,
  getMe,
  logout,
  seedSuperAdmin,
  changePassword,
  forgotPassword,
  resetPassword,
} from '../controllers/auth.controller.js';
import {
  validateLogin,
  validateChangePassword,
  validateForgotPassword,
  validateResetPassword,
} from '../validators/auth.validator.js';
import { authenticate } from '../middlewares/auth.middleware.js';

const router = Router();

// Public Authentication Routes
router.post('/login', validateLogin, login);
router.post('/logout', logout);
router.post('/seed', seedSuperAdmin);
router.post('/forgot-password', validateForgotPassword, forgotPassword);
router.post('/reset-password/:token', validateResetPassword, resetPassword);

// Protected Authentication & Profile Routes
router.get('/me', authenticate, getMe);
router.post('/change-password', authenticate, validateChangePassword, changePassword);

export default router;
