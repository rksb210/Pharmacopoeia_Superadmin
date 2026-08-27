import { verifyToken } from '../utils/jwt.js';
import User from '../models/user.model.js';
import Subscriber from '../models/subscriber.model.js';

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
    else if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required. Please log in.',
      });
    }

    // Verify token
    const decoded = verifyToken(token);
    if (!decoded || !decoded.id) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired authentication token.',
      });
    }

    // Find user in DB (Check User model first, then Subscriber model)
    let user = await User.findById(decoded.id);
    if (!user) {
      user = await Subscriber.findById(decoded.id);
      if (user) {
        user.role = 'subscriber';
      }
    }

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User belonging to this token no longer exists.',
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Account has been deactivated. Please contact administrator.',
      });
    }

    // Attach user to request
    req.user = user;
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
 * Optional Authentication Middleware
 * Attaches req.user if valid token provided, but doesn't block unauthenticated requests
 */
export const optionalAuthenticate = async (req, res, next) => {
  try {
    let token = null;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    }

    if (token) {
      const decoded = verifyToken(token);
      if (decoded && decoded.id) {
        const user = await User.findById(decoded.id);
        if (user && user.isActive) {
          req.user = user;
        }
      }
    }
  } catch (err) {
    // Ignore error for optional auth
  }
  next();
};

