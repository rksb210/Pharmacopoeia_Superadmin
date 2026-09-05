/**
 * Validate incoming login request body
 */
export const validateLogin = (req, res, next) => {
  const { identifier, email, username, password } = req.body;
  const loginIdentifier = identifier || email || username;

  const errors = [];

  if (!loginIdentifier || typeof loginIdentifier !== 'string' || !loginIdentifier.trim()) {
    errors.push('Email or username is required');
  }

  if (!password || typeof password !== 'string' || !password.trim()) {
    errors.push('Password is required');
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors,
    });
  }

  // Normalize identifier on req.body for controller
  req.body.identifier = loginIdentifier.trim();
  next();
};

/**
 * Validate password change request
 */
export const validateChangePassword = (req, res, next) => {
  const { currentPassword, newPassword, confirmPassword } = req.body;
  const errors = [];

  if (!currentPassword) errors.push('Current password is required');
  if (!newPassword || newPassword.length < 6) {
    errors.push('New password must be at least 6 characters long');
  }
  if (confirmPassword && newPassword !== confirmPassword) {
    errors.push('New password and confirmation do not match');
  }
  if (currentPassword && newPassword && currentPassword === newPassword) {
    errors.push('New password must be different from current password');
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

/**
 * Validate forgot password request
 */
export const validateForgotPassword = (req, res, next) => {
  const { email, identifier } = req.body;
  const target = email || identifier;

  if (!target || !target.trim()) {
    return res.status(400).json({
      success: false,
      message: 'Email address or username is required',
    });
  }

  req.body.identifier = target.trim();
  next();
};

/**
 * Validate reset password request
 */
export const validateResetPassword = (req, res, next) => {
  const { password, confirmPassword } = req.body;
  const errors = [];

  if (!password || password.length < 6) {
    errors.push('Password must be at least 6 characters long');
  }
  if (confirmPassword && password !== confirmPassword) {
    errors.push('Passwords do not match');
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

/**
 * Validate user creation request body
 */
export const validateRegister = (req, res, next) => {
  const { name, email, username, password, role } = req.body;
  const errors = [];

  if (!name || !name.trim()) errors.push('Name is required');
  if (!email || !email.trim()) errors.push('Email is required');
  if (!username || !username.trim()) errors.push('Username is required');
  if (!password || password.length < 6) errors.push('Password must be at least 6 characters long');

  if (role && !['superadmin', 'admin', 'editor', 'viewer'].includes(role)) {
    errors.push('Invalid role specified');
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

/**
 * Validate public subscriber signup request body
 */
export const validateSignup = (req, res, next) => {
  const { name, email, username, password, phoneNumber, userType, dynamicFields } = req.body;
  const errors = [];

  if (!name || typeof name !== 'string' || !name.trim()) {
    errors.push('Full name is required');
  } else if (name.trim().length > 100) {
    errors.push('Name cannot exceed 100 characters');
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
  } else if (username.trim().length > 30) {
    errors.push('Username cannot exceed 30 characters');
  } else if (!/^[a-zA-Z0-9._-]+$/.test(username.trim())) {
    errors.push('Username can only contain letters, numbers, dots, underscores, and hyphens');
  }

  if (!password || typeof password !== 'string' || password.length < 6) {
    errors.push('Password must be at least 6 characters long');
  }

  if (!userType || typeof userType !== 'string' || !userType.trim()) {
    errors.push('User type is required');
  }

  if (phoneNumber && typeof phoneNumber === 'string' && phoneNumber.trim()) {
    const digits = phoneNumber.replace(/\D/g, '').slice(-10);
    if (digits.length !== 10 || !/^[6-9]\d{9}$/.test(digits)) {
      errors.push('Please enter a valid 10-digit Indian mobile number (e.g. 98765 43210)');
    }
  }

  if (dynamicFields !== undefined && (typeof dynamicFields !== 'object' || Array.isArray(dynamicFields))) {
    errors.push('Dynamic fields must be an object');
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
