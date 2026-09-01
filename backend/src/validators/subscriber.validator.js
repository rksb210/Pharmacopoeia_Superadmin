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

    const gstinVal = (dynamicFields.gstin || '').trim().toUpperCase();
    const panVal = (dynamicFields.pan || '').trim().toUpperCase();

    if (!gstinVal && !panVal) {
      errors.push('Either Company GSTIN or Corporate PAN is required for Industry subscribers');
    } else {
      if (gstinVal) {
        const gstinRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
        if (!gstinRegex.test(gstinVal)) {
          errors.push('Invalid Company GSTIN format. Must be exactly 15 characters (e.g. 22AAAAA0000A1Z5)');
        }
      }

      if (panVal) {
        const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
        if (!panRegex.test(panVal)) {
          errors.push('Invalid Corporate PAN format. Must be exactly 10 characters (e.g. AAAAA9999A)');
        }
      }
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

  if (req.body.dynamicFields && typeof req.body.dynamicFields === 'object') {
    const { gstin, pan } = req.body.dynamicFields;
    const gstinRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
    const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;

    if (gstin !== undefined && gstin.trim() && !gstinRegex.test(gstin.trim().toUpperCase())) {
      errors.push('Invalid Company GSTIN format. Must be exactly 15 characters (e.g. 22AAAAA0000A1Z5)');
    }
    if (pan !== undefined && pan.trim() && !panRegex.test(pan.trim().toUpperCase())) {
      errors.push('Invalid Corporate PAN format. Must be exactly 10 characters (e.g. AAAAA9999A)');
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
