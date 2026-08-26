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
router.get('/stats', requirePermission('SUBSCRIPTIONS', 'DISCOUNTS', 'VIEW'), getCouponStats);
router.get('/', requirePermission('SUBSCRIPTIONS', 'DISCOUNTS', 'VIEW'), getCoupons);
router.get('/:id', requirePermission('SUBSCRIPTIONS', 'DISCOUNTS', 'VIEW'), getCouponById);

// Validation & Calculation Engine
router.post('/validate', validateCouponApplication, validateAndApplyCoupon);

// Mutations
router.post('/', requirePermission('SUBSCRIPTIONS', 'DISCOUNTS', 'ADD'), validateCreateCoupon, createCoupon);
router.put('/:id', requirePermission('SUBSCRIPTIONS', 'DISCOUNTS', 'EDIT'), validateUpdateCoupon, updateCoupon);
router.patch('/:id/status', requirePermission('SUBSCRIPTIONS', 'DISCOUNTS', 'EDIT'), toggleCouponStatus);
router.post('/direct-assign', requirePermission('SUBSCRIPTIONS', 'DISCOUNTS', 'ADD'), assignDirectDiscount);

export default router;
