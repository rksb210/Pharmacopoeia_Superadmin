import couponService from '../services/coupon.service.js';

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
    return res.status(200).json({
      success: true,
      message: `Coupon ${isActive ? 'activated' : 'deactivated'} successfully.`,
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
