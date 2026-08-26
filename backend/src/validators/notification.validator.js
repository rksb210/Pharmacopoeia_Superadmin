/**
 * Validators for Notification Management
 */

export const validateCreateNotification = (req, res, next) => {
  const { title, message, category, channels, priority } = req.body;
  const errors = [];

  if (!title || typeof title !== 'string' || !title.trim()) {
    errors.push('Notification title is required');
  } else if (title.trim().length > 200) {
    errors.push('Title cannot exceed 200 characters');
  }

  if (!message || typeof message !== 'string' || !message.trim()) {
    errors.push('Notification message body is required');
  }

  const validCategories = [
    'NEW_CONTENT',
    'SUBSCRIPTION_EXPIRY',
    'EVENTS',
    'WEBINARS',
    'TRAINING',
    'ANNOUNCEMENT',
    'WORKFLOW',
    'GENERAL',
  ];
  if (category && !validCategories.includes(category)) {
    errors.push(`Invalid category. Allowed: ${validCategories.join(', ')}`);
  }

  const validChannels = ['in_app', 'email', 'sms', 'broadcast_banner'];
  if (channels && Array.isArray(channels)) {
    const invalidCh = channels.filter((c) => !validChannels.includes(c));
    if (invalidCh.length > 0) {
      errors.push(`Invalid channel(s): ${invalidCh.join(', ')}`);
    }
  } else if (channels && !Array.isArray(channels)) {
    errors.push('Channels must be an array of selected platforms');
  }

  const validPriorities = ['low', 'medium', 'high', 'urgent'];
  if (priority && !validPriorities.includes(priority)) {
    errors.push(`Invalid priority level. Allowed: ${validPriorities.join(', ')}`);
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

export const validateUpdateNotification = (req, res, next) => {
  const { title, message, category, priority } = req.body;
  const errors = [];

  if (title !== undefined && (!title || !title.trim())) {
    errors.push('Title cannot be empty');
  }

  if (message !== undefined && (!message || !message.trim())) {
    errors.push('Message body cannot be empty');
  }

  const validCategories = [
    'NEW_CONTENT',
    'SUBSCRIPTION_EXPIRY',
    'EVENTS',
    'WEBINARS',
    'TRAINING',
    'ANNOUNCEMENT',
    'WORKFLOW',
    'GENERAL',
  ];
  if (category && !validCategories.includes(category)) {
    errors.push(`Invalid category. Allowed: ${validCategories.join(', ')}`);
  }

  const validPriorities = ['low', 'medium', 'high', 'urgent'];
  if (priority && !validPriorities.includes(priority)) {
    errors.push(`Invalid priority level. Allowed: ${validPriorities.join(', ')}`);
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
