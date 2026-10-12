import rateLimit from 'express-rate-limit';

/**
 * Strict Rate Limiter for Authentication Endpoints (Brute-Force Defense)
 * Allows up to 15 attempts per 15 minutes per IP
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 15, // limit each IP to 15 requests per windowMs
  standardHeaders: true, // Return rate limit info in `RateLimit-*` headers
  legacyHeaders: true, // Also return `X-RateLimit-*` headers for scanner compatibility
  handler: (req, res, next, options) => {
    const retryAfter = Math.ceil(options.windowMs / 1000);
    res.setHeader('Retry-After', retryAfter);
    res.status(429).json({
      success: false,
      error: 'Too Many Requests',
      code: 'AUTH_RATE_LIMIT_EXCEEDED',
      message: 'Too many authentication attempts from this IP. Please try again after 15 minutes.',
      retryAfterSeconds: retryAfter,
    });
  },
});

/**
 * Rate Limiter for Public Feedback Submissions
 * Prevents spam bots from flooding the feedback queue
 */
export const publicSubmissionLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20, // 20 submissions per hour
  standardHeaders: true,
  legacyHeaders: true,
  handler: (req, res, next, options) => {
    const retryAfter = Math.ceil(options.windowMs / 1000);
    res.setHeader('Retry-After', retryAfter);
    res.status(429).json({
      success: false,
      error: 'Too Many Requests',
      code: 'SUBMISSION_RATE_LIMIT_EXCEEDED',
      message: 'Feedback submission rate limit exceeded. Please try again later.',
      retryAfterSeconds: retryAfter,
    });
  },
});

/**
 * General API Rate Limiter
 * 1,000 requests per 15 minutes per IP
 */
export const generalApiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  standardHeaders: true,
  legacyHeaders: true,
  handler: (req, res, next, options) => {
    const retryAfter = Math.ceil(options.windowMs / 1000);
    res.setHeader('Retry-After', retryAfter);
    res.status(429).json({
      success: false,
      error: 'Too Many Requests',
      code: 'API_RATE_LIMIT_EXCEEDED',
      message: 'API rate limit exceeded. Please reduce request frequency.',
      retryAfterSeconds: retryAfter,
    });
  },
});

/**
 * Helper to escape special characters in regular expressions to prevent ReDoS attacks
 */
export const escapeRegex = (string = '') => {
  if (typeof string !== 'string') return '';
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

/**
 * Middleware: NoSQL Injection Sanitizer
 * Recursively strips keys starting with '$' or containing '.' from req.body, req.query, and req.params
 */
export const sanitizeNoSql = (req, res, next) => {
  const cleanInPlace = (obj) => {
    if (!obj || typeof obj !== 'object') return;

    if (Array.isArray(obj)) {
      obj.forEach(cleanInPlace);
      return;
    }

    for (const key of Object.keys(obj)) {
      if (key.startsWith('$') || key.includes('.')) {
        delete obj[key];
      } else if (typeof obj[key] === 'object' && obj[key] !== null) {
        cleanInPlace(obj[key]);
      }
    }
  };

  if (req.body && typeof req.body === 'object') cleanInPlace(req.body);
  if (req.query && typeof req.query === 'object') cleanInPlace(req.query);
  if (req.params && typeof req.params === 'object') cleanInPlace(req.params);

  next();
};

export default {
  authLimiter,
  publicSubmissionLimiter,
  generalApiLimiter,
  escapeRegex,
  sanitizeNoSql,
};
