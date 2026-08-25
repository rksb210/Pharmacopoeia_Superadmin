import User from '../models/user.model.js';
import { generateToken } from '../utlis/jwt.js';

/**
 * @desc    Authenticate user & get token (supports Email or Username)
 * @route   POST /api/auth/login
 * @access  Public
 */
export const login = async (req, res, next) => {
  try {
    const { identifier, password, rememberMe } = req.body;

    const cleanIdentifier = (identifier || '').toLowerCase().trim();

    // Query user by either email or username + explicitly select password
    const user = await User.findOne({
      $or: [
        { email: cleanIdentifier },
        { username: cleanIdentifier },
      ],
    }).select('+password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email/username or password.',
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
      return res.status(401).json({
        success: false,
        message: 'Invalid email/username or password.',
      });
    }

    // Generate JWT token
    const token = generateToken({
      id: user._id,
      email: user.email,
      username: user.username,
      role: user.role,
    });

    // Update lastLogin timestamp
    user.lastLogin = new Date();
    await user.save({ validateBeforeSave: false });

    // Cookie options
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: rememberMe ? 30 * 24 * 60 * 60 * 1000 : 7 * 24 * 60 * 60 * 1000, // 30 days or 7 days
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
        role: user.role,
        lastLogin: user.lastLogin,
      },
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
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found.',
      });
    }

    return res.status(200).json({
      success: true,
      user,
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
    const existingAdmin = await User.findOne({
      $or: [{ email: 'admin@nfi.gov.in' }, { username: 'superadmin' }],
    });

    if (existingAdmin) {
      return res.status(200).json({
        success: true,
        message: 'Default Superadmin already exists.',
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
      message: 'Default Superadmin user created successfully.',
      user: newAdmin,
      credentials: {
        email: 'admin@nfi.gov.in',
        username: 'superadmin',
        password: 'admin123Password',
      },
    });
  } catch (error) {
    next(error);
  }
};
