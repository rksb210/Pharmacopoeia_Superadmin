/**
 * Validators for Plans & Pricing Management
 */

export const validateCreatePlan = (req, res, next) => {
  const { name, code, priceINR, tier } = req.body;
  const errors = [];

  if (!name || typeof name !== 'string' || !name.trim()) {
    errors.push('Plan name is required');
  }

  if (!code || typeof code !== 'string' || !code.trim()) {
    errors.push('Plan code slug is required');
  }

  if (priceINR === undefined || priceINR === null || Number(priceINR) < 0) {
    errors.push('Valid plan price in INR is required');
  }

  const validTiers = ['Individual', 'Institutional', 'Student', 'Doctor Professional', 'Corporate', 'General'];
  if (tier && !validTiers.includes(tier)) {
    errors.push(`Invalid tier. Allowed: ${validTiers.join(', ')}`);
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

export const validateUpdatePlan = (req, res, next) => {
  const { name, priceINR, tier } = req.body;
  const errors = [];

  if (name !== undefined && (!name || !name.trim())) {
    errors.push('Plan name cannot be empty');
  }

  if (priceINR !== undefined && (priceINR === null || Number(priceINR) < 0)) {
    errors.push('Plan price cannot be negative');
  }

  const validTiers = ['Individual', 'Institutional', 'Student', 'Doctor Professional', 'Corporate', 'General'];
  if (tier && !validTiers.includes(tier)) {
    errors.push(`Invalid tier. Allowed: ${validTiers.join(', ')}`);
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
