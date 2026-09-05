/**
 * Validation middleware for Admin Management operations
 */

export const validateCreateAdmin = (req, res, next) => {
  const { name, email, username, password, role, departmentRef, designationRef, phoneNumber } = req.body;
  const errors = [];

  if (!name || typeof name !== 'string' || !name.trim()) {
    errors.push('Full name is required');
  }

  if (!email || typeof email !== 'string' || !email.trim()) {
    errors.push('Email address is required');
  } else if (!/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/.test(email.trim())) {
    errors.push('Please enter a valid email address');
  }

  if (!username || typeof username !== 'string' || !username.trim()) {
    errors.push('Username is required');
  } else if (username.trim().length < 3) {
    errors.push('Username must be at least 3 characters');
  }

  if (!password || typeof password !== 'string' || password.length < 6) {
    errors.push('Password must be at least 6 characters long');
  }

  if (role && (typeof role !== 'string' || !role.trim())) {
    errors.push('Role must be a valid non-empty identifier');
  }

  if (phoneNumber && typeof phoneNumber === 'string' && phoneNumber.trim()) {
    const digits = phoneNumber.replace(/\D/g, '').slice(-10);
    if (digits.length !== 10 || !/^[6-9]\d{9}$/.test(digits)) {
      errors.push('Please enter a valid 10-digit Indian mobile number (e.g. 98765 43210)');
    }
  }

  if (departmentRef && !/^[0-9a-fA-F]{24}$/.test(String(departmentRef))) errors.push('Invalid department selected');
  if (designationRef && !/^[0-9a-fA-F]{24}$/.test(String(designationRef))) errors.push('Invalid designation selected');

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors,
    });
  }

  next();
};

export const validateUpdateAdmin = (req, res, next) => {
  const { name, email, username, role, departmentRef, designationRef, phoneNumber } = req.body;
  const errors = [];

  if (name !== undefined && (!name || !name.trim())) {
    errors.push('Name cannot be empty');
  }

  if (email !== undefined && (!email || !/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/.test(email.trim()))) {
    errors.push('Please provide a valid email address');
  }

  if (username !== undefined && (!username || username.trim().length < 3)) {
    errors.push('Username must be at least 3 characters');
  }

  if (role !== undefined && (typeof role !== 'string' || !role.trim())) {
    errors.push('Role must be a valid non-empty identifier');
  }

  if (phoneNumber !== undefined && phoneNumber !== null && String(phoneNumber).trim()) {
    const digits = String(phoneNumber).replace(/\D/g, '').slice(-10);
    if (digits.length !== 10 || !/^[6-9]\d{9}$/.test(digits)) {
      errors.push('Please enter a valid 10-digit Indian mobile number (e.g. 98765 43210)');
    }
  }

  if (departmentRef !== undefined && departmentRef !== null && departmentRef !== '' && !/^[0-9a-fA-F]{24}$/.test(String(departmentRef))) errors.push('Invalid department selected');
  if (designationRef !== undefined && designationRef !== null && designationRef !== '' && !/^[0-9a-fA-F]{24}$/.test(String(designationRef))) errors.push('Invalid designation selected');

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors,
    });
  }

  next();
};

export const validateAdminStatus = (req, res, next) => {
  const { isActive } = req.body;
  if (typeof isActive !== 'boolean') {
    return res.status(400).json({
      success: false,
      message: 'isActive field must be a boolean (true or false)',
    });
  }
  next();
};

export const validateResetAdminPassword = (req, res, next) => {
  const { newPassword } = req.body;
  if (!newPassword || typeof newPassword !== 'string' || newPassword.length < 6) {
    return res.status(400).json({
      success: false,
      message: 'New password must be at least 6 characters long',
    });
  }
  next();
};

export const validateUpdatePermissions = (req, res, next) => {
  const { customPermissions } = req.body;
  if (!Array.isArray(customPermissions)) {
    return res.status(400).json({
      success: false,
      message: 'customPermissions must be an array of permission codes',
    });
  }
  next();
};
