import crypto from 'crypto';
import User from '../models/user.model.js';
import Subscriber from '../models/subscriber.model.js';
import { generateToken } from '../utils/jwt.js';

/**
 * Extract client IP address from request
 */
const getClientIP = (req) => {
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  return req.socket?.remoteAddress || req.ip || '127.0.0.1';
};

/**
 * Extract simple device / user agent summary
 */
const getClientDevice = (req) => {
  const userAgent = req.headers['user-agent'] || 'Unknown Device';
  if (userAgent.includes('Windows')) return 'Windows PC';
  if (userAgent.includes('Macintosh')) return 'Mac OS';
  if (userAgent.includes('iPhone')) return 'iPhone (iOS)';
  if (userAgent.includes('Android')) return 'Android Device';
  if (userAgent.includes('Linux')) return 'Linux Device';
  return userAgent.slice(0, 50);
};

/**
 * @desc    Authenticate user & get token (supports Official Email or Username)
 * @route   POST /api/auth/login
 * @access  Public
 */
export const login = async (req, res, next) => {
  try {
    const { identifier, password, rememberMe } = req.body;
    const cleanIdentifier = (identifier || '').toLowerCase().trim();

    // 1. Search Admin/Staff Users by Email OR Username
    let user = await User.findOne({
      $or: [
        { email: cleanIdentifier },
        { username: cleanIdentifier },
      ],
    }).select('+password +failedLoginAttempts +lockUntil +twoFactorEnabled');

    let isSubscriber = false;

    // 2. If not found in User collection, search Subscriber collection by Email OR Username
    if (!user) {
      user = await Subscriber.findOne({
        $or: [
          { email: cleanIdentifier },
          { username: cleanIdentifier },
        ],
      }).select('+password');
      if (user) {
        isSubscriber = true;
      }
    }

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid official email address/username or password.',
      });
    }

    // Check if account is temporarily locked due to excessive failed attempts
    if (!isSubscriber && user.isLocked && user.isLocked()) {
      const lockMinutesRemaining = Math.ceil((user.lockUntil - Date.now()) / (60 * 1000));
      return res.status(423).json({
        success: false,
        message: `Account is temporarily locked due to multiple failed login attempts. Please try again in ${lockMinutesRemaining} minute(s).`,
      });
    }

    // Check account active status
    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Your account has been deactivated. Please contact the administrator.',
      });
    }

    // Verify password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      if (!isSubscriber) {
        // Increment failed attempts for security
        user.failedLoginAttempts = (user.failedLoginAttempts || 0) + 1;
        
        // Lock account for 15 minutes after 5 consecutive failed attempts
        if (user.failedLoginAttempts >= 5) {
          user.lockUntil = new Date(Date.now() + 15 * 60 * 1000);
          await user.save({ validateBeforeSave: false });
          return res.status(423).json({
            success: false,
            message: 'Too many failed login attempts. Account temporarily locked for 15 minutes.',
          });
        }

        await user.save({ validateBeforeSave: false });
      }

      return res.status(401).json({
        success: false,
        message: 'Invalid official email address/username or password.',
      });
    }

    // 2FA Hook Readiness: If 2FA is enabled on account, return 2FA challenge
    if (user.twoFactorEnabled) {
      return res.status(200).json({
        success: true,
        requires2FA: true,
        tempToken: generateToken({ id: user._id, step: '2fa_verify' }),
        message: '2FA verification code required.',
      });
    }

    // Reset failed attempts & update login telemetry on successful login
    if (!isSubscriber) {
      user.failedLoginAttempts = 0;
      user.lockUntil = null;
    }
    user.lastLogin = new Date();
    user.lastLoginIP = getClientIP(req);
    user.lastLoginDevice = getClientDevice(req);
    await user.save({ validateBeforeSave: false });

    const role = isSubscriber ? 'subscriber' : user.role;

    // Generate JWT token
    const token = generateToken({
      id: user._id,
      email: user.email,
      username: user.username,
      role,
      userType: isSubscriber ? user.userType : undefined,
    });

    // Cookie options
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: rememberMe ? 30 * 24 * 60 * 60 * 1000 : 7 * 24 * 60 * 60 * 1000,
    };

    // Set cookie & send response
    res.cookie('token', token, cookieOptions);

    return res.status(200).json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        username: user.username,
        role,
        userType: isSubscriber ? user.userType : undefined,
        subscription: isSubscriber ? user.subscription : undefined,
        lastLogin: user.lastLogin,
        lastLoginIP: user.lastLoginIP,
        lastLoginDevice: user.lastLoginDevice,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Change password for authenticated user
 * @route   POST /api/auth/change-password
 * @access  Private
 */
export const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const user = await User.findById(req.user.id).select('+password');
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found.',
      });
    }

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: 'Current password entered is incorrect.',
      });
    }

    user.password = newPassword;
    await user.save();

    return res.status(200).json({
      success: true,
      message: 'Password changed successfully. Please keep your new credentials secure.',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Initiate forgot password request
 * @route   POST /api/auth/forgot-password
 * @access  Public
 */
export const forgotPassword = async (req, res, next) => {
  try {
    const { identifier } = req.body;
    const cleanIdentifier = (identifier || '').toLowerCase().trim();

    const user = await User.findOne({
      $or: [{ email: cleanIdentifier }, { username: cleanIdentifier }],
    });

    if (!user) {
      // Return ambiguous response for security to prevent user enumeration
      return res.status(200).json({
        success: true,
        message: 'If an account exists with this email/username, a password reset link has been generated.',
      });
    }

    // Generate reset token
    const resetToken = user.createPasswordResetToken();
    await user.save({ validateBeforeSave: false });

    return res.status(200).json({
      success: true,
      message: 'Password reset link generated successfully.',
      // In production, this would be emailed. Included for local dev & testing:
      resetToken,
      resetUrl: `/reset-password/${resetToken}`,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Reset password using valid token
 * @route   POST /api/auth/reset-password/:token
 * @access  Public
 */
export const resetPassword = async (req, res, next) => {
  try {
    const hashedToken = crypto
      .createHash('sha256')
      .update(req.params.token)
      .digest('hex');

    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Password reset token is invalid or has expired.',
      });
    }

    user.password = req.body.password;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    user.failedLoginAttempts = 0;
    user.lockUntil = null;
    await user.save();

    return res.status(200).json({
      success: true,
      message: 'Password reset successful. You can now log in with your new password.',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get currently logged in user profile
 * @route   GET /api/auth/me
 * @access  Private
 */
export const getMe = async (req, res, next) => {
  try {
    let user = await User.findById(req.user.id);
    let isSubscriber = false;

    if (!user) {
      user = await Subscriber.findById(req.user.id);
      if (user) {
        isSubscriber = true;
      }
    }

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User profile not found.',
      });
    }

    const role = isSubscriber ? 'subscriber' : user.role;

    return res.status(200).json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        username: user.username,
        role,
        userType: isSubscriber ? user.userType : undefined,
        subscription: isSubscriber ? user.subscription : undefined,
        department: user.department,
        designation: user.designation,
        phoneNumber: user.phoneNumber,
        lastLogin: user.lastLogin,
        lastLoginIP: user.lastLoginIP,
        lastLoginDevice: user.lastLoginDevice,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Log out current user & clear cookie
 * @route   POST /api/auth/logout
 * @access  Public
 */
export const logout = async (req, res) => {
  res.cookie('token', '', {
    httpOnly: true,
    expires: new Date(0),
  });

  return res.status(200).json({
    success: true,
    message: 'Logged out successfully.',
  });
};

/**
 * @desc    Seed initial Superadmin user (local development helper)
 * @route   POST /api/auth/seed
 * @access  Public
 */
export const seedSuperAdmin = async (req, res, next) => {
  try {
    if (process.env.NODE_ENV === 'production') {
      return res.status(403).json({
        success: false,
        message: 'Seeding endpoint is disabled in production environment.',
      });
    }

    const existingAdmin = await User.findOne({
      $or: [{ email: 'admin@nfi.gov.in' }, { username: 'superadmin' }],
    });

    if (existingAdmin) {
      return res.status(200).json({
        success: true,
        message: 'Default Superadmin already initialized.',
        user: existingAdmin,
      });
    }

    const newAdmin = await User.create({
      name: 'NFI Super Administrator',
      email: 'admin@nfi.gov.in',
      username: 'superadmin',
      password: 'admin123Password',
      role: 'superadmin',
      isActive: true,
    });

    return res.status(201).json({
      success: true,
      message: 'Default Superadmin user initialized successfully.',
      user: newAdmin,
    });
  } catch (error) {
    next(error);
  }
};
