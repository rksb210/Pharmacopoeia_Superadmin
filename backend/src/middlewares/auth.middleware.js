import mongoose from 'mongoose';
import { verifyToken } from '../utils/jwt.js';
import User from '../models/user.model.js';
import Subscriber from '../models/subscriber.model.js';

/**
 * Universal resolver to find user in User or Subscriber tables by ID or email/username,
 * with fallback synthesis from verified JWT payload.
 */
async function resolveUserFromDecoded(decoded) {
  if (!decoded) return null;
  const userId = decoded.id || decoded.sub;
  const email = (decoded.email || '').toLowerCase().trim();
  const username = (decoded.username || '').toLowerCase().trim();

  let user = null;
  let source = 'User';

  // 1. Check User model
  if (User) {
    if (userId && mongoose.isValidObjectId(userId)) {
      user = await User.findById(userId);
    }
    if (!user && (email || username)) {
      const or = [];
      if (email) or.push({ email });
      if (username) or.push({ username });
      user = await User.findOne({ $or: or });
    }
  }

  // 2. Check Subscriber model
  if (!user && Subscriber) {
    if (userId && mongoose.isValidObjectId(userId)) {
      user = await Subscriber.findById(userId);
    }
    if (!user && (email || username)) {
      const or = [];
      if (email) or.push({ email });
      if (username) or.push({ username });
      user = await Subscriber.findOne({ $or: or });
    }
    if (user) {
      if (!user.role) user.role = decoded.role || 'subscriber';
      source = 'Subscriber';
    }
  }

  // 3. Fallback synthesis from verified JWT payload
  if (!user && (userId || email || username)) {
    const syntheticId = (userId && mongoose.isValidObjectId(userId)) ? userId : new mongoose.Types.ObjectId();
    user = {
      _id: syntheticId,
      id: syntheticId,
      email: email || 'user@nfi.gov.in',
      name: decoded.name || decoded.username || (email ? email.split('@')[0] : 'User'),
      username: username || (email ? email.split('@')[0] : 'user'),
      role: decoded.role || 'subscriber',
      userType: decoded.userType || 'INDIVIDUAL',
      isActive: true,
      active: true,
      isSynthetic: true,
    };
    source = 'JwtPayload';
  }

  if (!user) return null;
  return { user, source };
}

/**
 * Authentication Middleware
 * Checks for Bearer token in headers or auth token in cookies
 */
export const authenticate = async (req, res, next) => {
  try {
    let token = null;

    // 1. Check Authorization header (Bearer <token>)
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }
    // 2. Check HTTP-only cookie
    else if (req.cookies && (req.cookies.token || req.cookies.nfi_token)) {
      token = req.cookies.token || req.cookies.nfi_token;
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required. Please log in.',
      });
    }

    // Verify token
    const decoded = verifyToken(token);
    if (!decoded || (!decoded.id && !decoded.sub && !decoded.email)) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired authentication token.',
      });
    }

    const resolved = await resolveUserFromDecoded(decoded);
    if (!resolved || !resolved.user) {
      return res.status(401).json({
        success: false,
        message: 'User belonging to this token no longer exists.',
      });
    }

    const { user, source } = resolved;

    if (user.isActive === false || user.active === false) {
      return res.status(403).json({
        success: false,
        message: 'Account has been deactivated. Please contact administrator.',
      });
    }

    if (user.isLocked && typeof user.isLocked === 'function' && user.isLocked()) {
      const mins = Math.ceil((user.lockUntil - Date.now()) / 60000);
      return res.status(423).json({
        success: false,
        message: `Account temporarily locked. Try again in ${mins} minute(s).`,
      });
    }

    // Concurrent session enforcement (CWE-557)
    if (user.currentSessionId && (!decoded.sessionId || decoded.sessionId !== user.currentSessionId)) {
      return res.status(401).json({
        success: false,
        code: 'CONCURRENT_LOGIN_DETECTED',
        message: 'Session expired: Your account was logged in from another device or browser.',
      });
    }

    // Attach user to request
    req.user = user;
    req.user._authSource = source;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired token.',
      error: error.message,
    });
  }
};

/**
 * Role-Based Access Control (RBAC) Middleware
 * @param  {...String} roles - Allowed roles e.g. 'superadmin', 'admin'
 */
export const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Requires one of roles: [${roles.join(', ')}]`,
      });
    }
    next();
  };
};

/**
 * Scans-specific Auth: authenticates via `users` OR `subscribers` table.
 */
export const authenticateForScans = async (req, res, next) => {
  return authenticate(req, res, next);
};

// Backward compat alias — scans route should import authenticateForScans
export const authenticateScans = authenticateForScans;

/**
 * Optional Authentication Middleware
 * Attaches req.user if valid token provided, but doesn't block unauthenticated requests
 */
export const optionalAuthenticate = async (req, res, next) => {
  try {
    let token = null;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies && (req.cookies.token || req.cookies.nfi_token)) {
      token = req.cookies.token || req.cookies.nfi_token;
    }

    if (token) {
      const decoded = verifyToken(token);
      if (decoded) {
        const resolved = await resolveUserFromDecoded(decoded);
        if (resolved && resolved.user && resolved.user.isActive !== false) {
          if (!resolved.user.currentSessionId || (decoded.sessionId && decoded.sessionId === resolved.user.currentSessionId)) {
            req.user = resolved.user;
            req.user._authSource = resolved.source;
          }
        }
      }
    }
  } catch (err) {
    // Ignore error for optional auth
  }
  next();
};

export const optionalAuth = optionalAuthenticate;
