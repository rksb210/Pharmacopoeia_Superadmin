import { Router } from 'express';
import {
  login,
  signup,
  getMe,
  logout,
  seedSuperAdmin,
  changePassword,
  forgotPassword,
  resetPassword,
} from '../controllers/auth.controller.js';
import {
  validateLogin,
  validateSignup,
  validateChangePassword,
  validateForgotPassword,
  validateResetPassword,
} from '../validators/auth.validator.js';
import { authenticate } from '../middlewares/auth.middleware.js';
import { authLimiter } from '../middlewares/security.middleware.js';

const router = Router();

// Public Authentication Routes (Rate Limited)
router.post('/login', authLimiter, validateLogin, login);
router.post('/signup', authLimiter, validateSignup, signup);
router.post('/logout', logout);
router.post('/seed', seedSuperAdmin);
router.post('/forgot-password', authLimiter, validateForgotPassword, forgotPassword);
router.post('/reset-password/:token', authLimiter, validateResetPassword, resetPassword);

// Protected Authentication & Profile Routes
router.get('/me', authenticate, getMe);
router.post('/change-password', authenticate, validateChangePassword, changePassword);

export default router;
