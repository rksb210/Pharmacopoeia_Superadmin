import couponService from '../services/coupon.service.js';
import { auditService } from '../services/audit.service.js';

export const getCouponStats = async (req, res, next) => {
  try {
    const stats = await couponService.getCouponStats();
    return res.status(200).json({
      success: true,
      stats,
    });
  } catch (error) {
    next(error);
  }
};

export const getCoupons = async (req, res, next) => {
  try {
    const { search, discountType, status, userType, page, limit, sortBy, sortOrder } = req.query;
    const result = await couponService.getCouponsList({
      search,
      discountType,
      status,
      userType,
      page,
      limit,
      sortBy,
      sortOrder,
    });
    return res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error) {
    next(error);
  }
};

export const getCouponById = async (req, res, next) => {
  try {
    const coupon = await couponService.getCouponById(req.params.id);
    return res.status(200).json({
      success: true,
      coupon,
    });
  } catch (error) {
    next(error);
  }
};

export const createCoupon = async (req, res) => {
  try {
    const newCoupon = await couponService.createCoupon(req.body, req.user);

    await auditService.log(req, {
      action: 'COUPON_CREATED',
      module: 'COUPONS',
      entity: 'Coupon',
      entityId: newCoupon._id,
      status: 'SUCCESS',
      details: `Created new discount coupon "${newCoupon.code}" (${newCoupon.discountType === 'percentage' ? `${newCoupon.discountValue}%` : `₹${newCoupon.discountValue}`}).`,
      newValues: {
        code: newCoupon.code,
        discountType: newCoupon.discountType,
        discountValue: newCoupon.discountValue,
        applicableUserTypes: newCoupon.applicableUserTypes,
      },
    });

    return res.status(201).json({
      success: true,
      message: 'Voucher coupon created successfully.',
      coupon: newCoupon,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

export const updateCoupon = async (req, res) => {
  try {
    const updated = await couponService.updateCoupon(req.params.id, req.body);

    await auditService.log(req, {
      action: 'COUPON_UPDATED',
      module: 'COUPONS',
      entity: 'Coupon',
      entityId: updated._id,
      status: 'SUCCESS',
      details: `Updated coupon configurations for "${updated.code}".`,
      newValues: {
        discountType: updated.discountType,
        discountValue: updated.discountValue,
        usageLimit: updated.usageLimit,
        validUntil: updated.validUntil,
      },
    });

    return res.status(200).json({
      success: true,
      message: 'Coupon configurations updated successfully.',
      coupon: updated,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

export const toggleCouponStatus = async (req, res) => {
  try {
    const { isActive } = req.body;
    const coupon = await couponService.toggleCouponStatus(req.params.id, isActive);

    await auditService.log(req, {
      action: 'COUPON_STATUS_CHANGED',
      module: 'COUPONS',
      entity: 'Coupon',
      entityId: coupon._id,
      status: 'SUCCESS',
      details: `Coupon "${coupon.code}" status set to ${isActive ? 'Active' : 'Inactive'}.`,
      newValues: { isActive },
    });

    return res.status(200).json({
      success: true,
      message: `Coupon status set to ${isActive ? 'Active' : 'Inactive'} successfully.`,
      coupon,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

export const validateAndApplyCoupon = async (req, res) => {
  try {
    const calculation = await couponService.validateAndApplyCoupon(req.body);
    return res.status(200).json({
      success: true,
      ...calculation,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

export const assignDirectDiscount = async (req, res) => {
  try {
    const coupon = await couponService.assignDirectDiscount(req.body, req.user);

    await auditService.log(req, {
      action: 'DIRECT_DISCOUNT_ASSIGNED',
      module: 'COUPONS',
      entity: 'Coupon',
      entityId: coupon._id,
      status: 'SUCCESS',
      details: `Granted direct discount voucher "${coupon.code}" (${coupon.discountValue}%) to beneficiary ${req.body.subscriberEmail || req.body.subscriberId || 'Subscriber'}.`,
    });

    return res.status(201).json({
      success: true,
      message: 'Direct concession voucher created successfully.',
      coupon,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};
