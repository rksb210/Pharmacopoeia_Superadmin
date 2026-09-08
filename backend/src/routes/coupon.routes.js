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
import { requireAnyPermission } from '../middlewares/rbac.middleware.js';

const router = Router();

// Authentication required for administrative coupon management
router.use(authenticate);

// Stats & Listing
router.get(
  '/stats',
  requireAnyPermission([
    { module: 'COMMERCIAL', section: 'COUPONS', action: 'VIEW' },
    { module: 'COMMERCIAL', section: 'DISCOUNTS', action: 'VIEW' },
  ]),
  getCouponStats
);
router.get(
  '/',
  requireAnyPermission([
    { module: 'COMMERCIAL', section: 'COUPONS', action: 'VIEW' },
    { module: 'COMMERCIAL', section: 'DISCOUNTS', action: 'VIEW' },
  ]),
  getCoupons
);
router.get(
  '/:id',
  requireAnyPermission([
    { module: 'COMMERCIAL', section: 'COUPONS', action: 'VIEW' },
    { module: 'COMMERCIAL', section: 'DISCOUNTS', action: 'VIEW' },
  ]),
  getCouponById
);

// Validation & Calculation Engine
router.post('/validate', validateCouponApplication, validateAndApplyCoupon);

// Mutations
router.post(
  '/',
  requireAnyPermission([
    { module: 'COMMERCIAL', section: 'COUPONS', action: 'ADD' },
    { module: 'COMMERCIAL', section: 'DISCOUNTS', action: 'ADD' },
  ]),
  validateCreateCoupon,
  createCoupon
);
router.put(
  '/:id',
  requireAnyPermission([
    { module: 'COMMERCIAL', section: 'COUPONS', action: 'EDIT' },
    { module: 'COMMERCIAL', section: 'DISCOUNTS', action: 'EDIT' },
  ]),
  validateUpdateCoupon,
  updateCoupon
);
router.patch(
  '/:id/status',
  requireAnyPermission([
    { module: 'COMMERCIAL', section: 'COUPONS', action: 'EDIT' },
    { module: 'COMMERCIAL', section: 'DISCOUNTS', action: 'EDIT' },
  ]),
  toggleCouponStatus
);
router.post(
  '/direct-assign',
  requireAnyPermission([
    { module: 'COMMERCIAL', section: 'COUPONS', action: 'ADD' },
    { module: 'COMMERCIAL', section: 'DISCOUNTS', action: 'ADD' },
  ]),
  assignDirectDiscount
);

export default router;
