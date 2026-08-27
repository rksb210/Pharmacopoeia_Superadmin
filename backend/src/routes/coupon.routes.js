import { Router } from 'express';
import {
  getCouponStats,
  getCoupons,
  getCouponById,
  createCoupon,
  updateCoupon,
  toggleCouponStatus,
  validateAndApplyCoupon,
  assignDirectDiscount,
} from '../controllers/coupon.controller.js';
import {
  validateCreateCoupon,
  validateUpdateCoupon,
  validateCouponApplication,
} from '../validators/coupon.validator.js';
import { authenticate } from '../middlewares/auth.middleware.js';
import { requirePermission } from '../middlewares/rbac.middleware.js';

const router = Router();

// Authentication required for administrative coupon management
router.use(authenticate);

// Stats & Listing
router.get('/stats', requirePermission('COMMERCIAL', 'COUPONS', 'VIEW'), getCouponStats);
router.get('/', requirePermission('COMMERCIAL', 'COUPONS', 'VIEW'), getCoupons);
router.get('/:id', requirePermission('COMMERCIAL', 'COUPONS', 'VIEW'), getCouponById);

// Validation & Calculation Engine
router.post('/validate', validateCouponApplication, validateAndApplyCoupon);

// Mutations
router.post('/', requirePermission('COMMERCIAL', 'COUPONS', 'ADD'), validateCreateCoupon, createCoupon);
router.put('/:id', requirePermission('COMMERCIAL', 'COUPONS', 'EDIT'), validateUpdateCoupon, updateCoupon);
router.patch('/:id/status', requirePermission('COMMERCIAL', 'COUPONS', 'EDIT'), toggleCouponStatus);
router.post('/direct-assign', requirePermission('COMMERCIAL', 'DISCOUNTS', 'ADD'), assignDirectDiscount);

export default router;
