/**
 * Validators for Feedback and Comments Management
 */

export const validateCreateFeedback = (req, res, next) => {
  const { userName, userEmail, subject, message } = req.body;
  const errors = [];

  if (!userName || typeof userName !== 'string' || !userName.trim()) {
    errors.push('User name is required');
  }

  if (!userEmail || typeof userEmail !== 'string' || !userEmail.trim()) {
    errors.push('User email is required');
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(userEmail.trim())) {
    errors.push('Invalid email format');
  }

  if (!subject || typeof subject !== 'string' || !subject.trim()) {
    errors.push('Feedback subject is required');
  } else if (subject.trim().length > 200) {
    errors.push('Subject cannot exceed 200 characters');
  }

  if (!message || typeof message !== 'string' || !message.trim()) {
    errors.push('Feedback message body is required');
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

export const validateReply = (req, res, next) => {
  const { message } = req.body;
  if (!message || typeof message !== 'string' || !message.trim()) {
    return res.status(400).json({
      success: false,
      message: 'Reply message cannot be empty',
    });
  }
  next();
};

export const validateStatusUpdate = (req, res, next) => {
  const { status } = req.body;
  const validStatuses = ['pending', 'in_review', 'completed', 'reopened'];

  if (!status || !validStatuses.includes(status)) {
    return res.status(400).json({
      success: false,
      message: `Invalid status. Allowed: ${validStatuses.join(', ')}`,
    });
  }

  next();
};
