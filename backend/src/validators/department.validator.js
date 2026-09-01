export const validateCreateDepartment = (req, res, next) => {
  const { name, code, description } = req.body;
  const errors = [];
  if (!name || typeof name !== 'string' || !name.trim()) errors.push('Department name is required');
  else if (name.trim().length > 100) errors.push('Department name cannot exceed 100 characters');
  if (code !== undefined && code !== null && code !== '') {
    if (typeof code !== 'string' || !code.trim()) errors.push('Department code cannot be empty');
    else if (code.trim().length > 30) errors.push('Department code cannot exceed 30 characters');
    else if (!/^[A-Za-z0-9_-]+$/.test(code.trim())) errors.push('Department code can only contain letters, numbers, hyphens and underscores');
  }
  if (description !== undefined && typeof description !== 'string') errors.push('Description must be a string');
  else if (description && description.length > 500) errors.push('Description cannot exceed 500 characters');

  if (errors.length) return res.status(400).json({ success: false, message: 'Validation failed', errors });
  next();
};

export const validateUpdateDepartment = (req, res, next) => {
  const { name, code, description } = req.body;
  const errors = [];
  if (name !== undefined) {
    if (!name || typeof name !== 'string' || !name.trim()) errors.push('Department name cannot be empty');
    else if (name.trim().length > 100) errors.push('Department name cannot exceed 100 characters');
  }
  if (code !== undefined) {
    if (!code || typeof code !== 'string' || !code.trim()) errors.push('Department code cannot be empty');
    else if (code.trim().length > 30) errors.push('Department code cannot exceed 30 characters');
    else if (!/^[A-Za-z0-9_-]+$/.test(code.trim())) errors.push('Department code can only contain letters, numbers, hyphens and underscores');
  }
  if (description !== undefined && typeof description !== 'string') errors.push('Description must be a string');
  else if (description && description.length > 500) errors.push('Description cannot exceed 500 characters');

  if (errors.length) return res.status(400).json({ success: false, message: 'Validation failed', errors });
  next();
};

export const validateCreateDesignation = (req, res, next) => {
  const { name, code, department, description } = req.body;
  const errors = [];
  if (!name || typeof name !== 'string' || !name.trim()) errors.push('Designation name is required');
  else if (name.trim().length > 100) errors.push('Designation name cannot exceed 100 characters');
  if (!department || typeof department !== 'string' || !department.trim()) errors.push('Department is required');
  if (code !== undefined && code !== null && code !== '') {
    if (typeof code !== 'string' || !code.trim()) errors.push('Designation code cannot be empty');
    else if (code.trim().length > 30) errors.push('Designation code cannot exceed 30 characters');
    else if (!/^[A-Za-z0-9_-]+$/.test(code.trim())) errors.push('Designation code can only contain letters, numbers, hyphens and underscores');
  }
  if (description !== undefined && typeof description !== 'string') errors.push('Description must be a string');
  else if (description && description.length > 500) errors.push('Description cannot exceed 500 characters');

  if (errors.length) return res.status(400).json({ success: false, message: 'Validation failed', errors });
  next();
};

export const validateUpdateDesignation = (req, res, next) => {
  const { name, code, department, description } = req.body;
  const errors = [];
  if (name !== undefined) {
    if (!name || typeof name !== 'string' || !name.trim()) errors.push('Designation name cannot be empty');
    else if (name.trim().length > 100) errors.push('Designation name cannot exceed 100 characters');
  }
  if (department !== undefined) {
    if (!department || typeof department !== 'string' || !department.trim()) errors.push('Department cannot be empty');
  }
  if (code !== undefined) {
    if (!code || typeof code !== 'string' || !code.trim()) errors.push('Designation code cannot be empty');
    else if (code.trim().length > 30) errors.push('Designation code cannot exceed 30 characters');
    else if (!/^[A-Za-z0-9_-]+$/.test(code.trim())) errors.push('Designation code can only contain letters, numbers, hyphens and underscores');
  }
  if (description !== undefined && typeof description !== 'string') errors.push('Description must be a string');
  else if (description && description.length > 500) errors.push('Description cannot exceed 500 characters');

  if (errors.length) return res.status(400).json({ success: false, message: 'Validation failed', errors });
  next();
};

export const validateStatusToggle = (req, res, next) => {
  const { isActive } = req.body;
  if (typeof isActive !== 'boolean') return res.status(400).json({ success: false, message: 'isActive must be a boolean' });
  next();
};
