/**
 * Validators for Subscription Management
 */

export const validateAssignSubscription = (req, res, next) => {
  const { userId, userIds, type = 'paid', planName, amount } = req.body;
  const errors = [];

  if (!userId && (!Array.isArray(userIds) || userIds.length === 0)) {
    errors.push('Subscriber User ID(s) are required');
  }

  if (!planName || !planName.trim()) {
    errors.push('Plan name is required');
  }

  const validTypes = ['paid', 'trial', 'complimentary', 'discounted'];
  if (!validTypes.includes(type)) {
    errors.push(`Invalid subscription type. Allowed: ${validTypes.join(', ')}`);
  }

  if (type === 'paid' || type === 'discounted') {
    if (amount === undefined || amount === null || Number(amount) < 0) {
      errors.push('Valid plan amount is required');
    }
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

export const validateCancelSubscription = (req, res, next) => {
  const { reason } = req.body;
  const errors = [];

  if (!reason || !reason.trim()) {
    errors.push('Cancellation reason is required for administrative audit');
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

export const validateChangeStatus = (req, res, next) => {
  const { status, reason } = req.body;
  const allowed = ['active', 'expired', 'cancelled', 'pending', 'suspended'];
  const errors = [];

  if (!status || !allowed.includes(status)) {
    errors.push(`Invalid status. Allowed values: ${allowed.join(', ')}`);
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
