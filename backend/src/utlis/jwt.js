import jwt from 'jsonwebtoken';

/**
 * Generate a signed JWT token for a user payload
 * @param {Object} payload - User identification and role object
 * @returns {String} Signed JWT token
 */
export const generateToken = (payload) => {
  const secret = process.env.JWT_SECRET || 'fallback_secret_pharmacopoeia_superadmin';
  const expiresIn = process.env.JWT_EXPIRES_IN || '7d';

  return jwt.sign(payload, secret, { expiresIn });
};

/**
 * Verify and decode a JWT token
 * @param {String} token - Raw JWT token string
 * @returns {Object} Decoded payload
 */
export const verifyToken = (token) => {
  const secret = process.env.JWT_SECRET || 'fallback_secret_pharmacopoeia_superadmin';
  return jwt.verify(token, secret);
};

export default {
  generateToken,
  verifyToken,
};
