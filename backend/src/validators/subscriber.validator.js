/**
 * Validation rules for Subscriber & User Management
 */

export const validateCreateSubscriber = (req, res, next) => {
  const { name, email, username, password, userType, dynamicFields = {} } = req.body;
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

  if (!userType || typeof userType !== 'string') {
    errors.push('User type is required');
  }

  const uType = (userType || '').toUpperCase().trim();

  // Dynamic Type-Specific Validations
  if (uType === 'STUDENT') {
    if (!dynamicFields.apaarId || !dynamicFields.apaarId.trim()) {
      errors.push('APAAR ID is required for Students');
    }
  } else if (uType === 'DOCTOR' || uType === 'PHARMACIST' || uType === 'NURSE') {
    if (!dynamicFields.registrationNo || !dynamicFields.registrationNo.trim()) {
      errors.push(`Registration Number is required for ${uType}`);
    }
    if (!dynamicFields.stateCouncil || !dynamicFields.stateCouncil.trim()) {
      errors.push(`State Council is required for ${uType}`);
    }
  } else if (uType === 'INDUSTRY') {
    if (!dynamicFields.companyName || !dynamicFields.companyName.trim()) {
      errors.push('Industry / Organization Name is required');
    }
    if (!dynamicFields.gstin || !dynamicFields.gstin.trim()) {
      errors.push('GSTIN is required for Industry subscribers');
    }
    if (!dynamicFields.pan || !dynamicFields.pan.trim()) {
      errors.push('PAN is required for Industry subscribers');
    }
  } else if (uType === 'OTHERS') {
    if (!dynamicFields.designation || !dynamicFields.designation.trim()) {
      errors.push('Designation / Role is required');
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

export const validateUpdateSubscriber = (req, res, next) => {
  const { name, email, username } = req.body;
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

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors,
    });
  }

  next();
};
