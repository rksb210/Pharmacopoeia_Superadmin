/**
 * Validators for Discount & Coupon Management
 */

export const validateCreateCoupon = (req, res, next) => {
  const { code, title, discountType = 'percentage', discountValue, endDate } = req.body;
  const errors = [];

  if (!code || typeof code !== 'string' || !code.trim()) {
    errors.push('Coupon code is required');
  }

  if (!title || typeof title !== 'string' || !title.trim()) {
    errors.push('Coupon title is required');
  }

  if (discountValue === undefined || discountValue === null || Number(discountValue) <= 0) {
    errors.push('Valid positive discount value is required');
  } else if (discountType === 'percentage' && Number(discountValue) > 100) {
    errors.push('Percentage discount cannot exceed 100%');
  }

  if (!endDate) {
    errors.push('Coupon expiration date is required');
  } else if (new Date(endDate) <= new Date()) {
    errors.push('Expiration date must be in the future');
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors,
    });
  }

  next();
};

export const validateUpdateCoupon = (req, res, next) => {
  const { title, discountType, discountValue, endDate } = req.body;
  const errors = [];

  if (title !== undefined && (!title || !title.trim())) {
    errors.push('Title cannot be empty');
  }

  if (discountValue !== undefined && Number(discountValue) <= 0) {
    errors.push('Discount value must be greater than 0');
  } else if (discountType === 'percentage' && Number(discountValue) > 100) {
    errors.push('Percentage discount cannot exceed 100%');
  }

  if (endDate !== undefined && new Date(endDate) <= new Date()) {
    errors.push('Expiration date must be in the future');
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors,
    });
  }

  next();
};

export const validateCouponApplication = (req, res, next) => {
  const { code, orderAmount } = req.body;
  const errors = [];

  if (!code || typeof code !== 'string' || !code.trim()) {
    errors.push('Coupon code is required');
  }

  if (orderAmount === undefined || Number(orderAmount) <= 0) {
    errors.push('Valid order amount is required for discount calculation');
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors,
    });
  }

  next();
};
