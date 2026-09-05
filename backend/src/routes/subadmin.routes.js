import { Router } from 'express';
import {
  validateCreateAdmin,
  validateUpdateAdmin,
  validateAdminStatus,
  validateResetAdminPassword,
  validateUpdatePermissions,
} from '../validators/admin.validator.js';
import { authenticate } from '../middlewares/auth.middleware.js';
import { requirePermission } from '../middlewares/rbac.middleware.js';
import adminService from '../services/admin.service.js';
import User from '../models/user.model.js';

const router = Router();

// Require session authentication
router.use(authenticate);

/**
 * @desc    Get KPI stats specifically for Sub Admins
 * @route   GET /api/sub-admins/stats
 * @access  Private (USERS:SUBADMINS:VIEW)
 */
router.get(
  '/stats',
  requirePermission('USERS', 'SUBADMINS', 'VIEW'),
  async (req, res, next) => {
    try {
      const subAdminRoles = ['subadmin', 'maker', 'reviewer', 'approver'];
      const totalSubAdmins = await User.countDocuments({ role: { $in: subAdminRoles } });
      const activeSubAdmins = await User.countDocuments({ role: { $in: subAdminRoles }, isActive: true });
      const inactiveSubAdmins = await User.countDocuments({ role: { $in: subAdminRoles }, isActive: false });

      return res.status(200).json({
        success: true,
        stats: {
          totalSubAdmins,
          activeSubAdmins,
          inactiveSubAdmins,
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @desc    Get paginated list of Sub Admins
 * @route   GET /api/sub-admins
 * @access  Private (USERS:SUBADMINS:VIEW)
 */
router.get(
  '/',
  requirePermission('USERS', 'SUBADMINS', 'VIEW'),
  async (req, res, next) => {
    try {
      const { page, limit, search, role, status, sortBy, sortOrder } = req.query;
      const subAdminRoles = ['subadmin', 'maker', 'reviewer', 'approver'];
      const subAdminRole = role && role !== 'all' ? role : undefined;

      const result = await adminService.getAdminsList({
        page,
        limit,
        search,
        role: subAdminRole,
        status,
        sortBy,
        sortOrder,
        allowedRoles: subAdminRoles,
      });

      return res.status(200).json({
        success: true,
        ...result,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @desc    Get single Sub Admin by ID
 * @route   GET /api/sub-admins/:id
 * @access  Private (USERS:SUBADMINS:VIEW)
 */
router.get(
  '/:id',
  requirePermission('USERS', 'SUBADMINS', 'VIEW'),
  async (req, res, next) => {
    try {
      const result = await adminService.getAdminById(req.params.id);
      return res.status(200).json({
        success: true,
        ...result,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @desc    Create new Sub Admin
 * @route   POST /api/sub-admins
 * @access  Private (USERS:SUBADMINS:ADD)
 */
router.post(
  '/',
  requirePermission('USERS', 'SUBADMINS', 'ADD'),
  validateCreateAdmin,
  async (req, res) => {
    try {
      // Ensure role is a subadmin-tier role
      const role = req.body.role || 'subadmin';
      const allowedRoles = ['subadmin', 'maker', 'reviewer', 'approver'];
      if (!allowedRoles.includes(role.toLowerCase())) {
        return res.status(400).json({
          success: false,
          message: `Sub Admin role must be one of: ${allowedRoles.join(', ')}`,
        });
      }

      const newSubAdmin = await adminService.createAdmin(
        { ...req.body, role },
        req.user
      );

      return res.status(201).json({
        success: true,
        message: 'Sub Administrator created successfully.',
        subAdmin: newSubAdmin,
      });
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }
);

/**
 * @desc    Update Sub Admin
 * @route   PUT /api/sub-admins/:id
 * @access  Private (USERS:SUBADMINS:EDIT)
 */
router.put(
  '/:id',
  requirePermission('USERS', 'SUBADMINS', 'EDIT'),
  validateUpdateAdmin,
  async (req, res) => {
    try {
      const updated = await adminService.updateAdmin(req.params.id, req.body, req.user);
      return res.status(200).json({
        success: true,
        message: 'Sub Administrator updated successfully.',
        subAdmin: updated,
      });
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }
);

/**
 * @desc    Toggle Sub Admin Active/Inactive Status
 * @route   PATCH /api/sub-admins/:id/status
 * @access  Private (USERS:SUBADMINS:EDIT)
 */
router.patch(
  '/:id/status',
  requirePermission('USERS', 'SUBADMINS', 'EDIT'),
  validateAdminStatus,
  async (req, res) => {
    try {
      const { isActive } = req.body;
      const subAdmin = await adminService.toggleAdminStatus(
        req.params.id,
        isActive,
        req.user
      );
      return res.status(200).json({
        success: true,
        message: `Sub Administrator account ${isActive ? 'activated' : 'deactivated'} successfully.`,
        subAdmin,
      });
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }
);

/**
 * @desc    Reset Sub Admin password
 * @route   POST /api/sub-admins/:id/reset-password
 * @access  Private (USERS:SUBADMINS:EDIT)
 */
router.post(
  '/:id/reset-password',
  requirePermission('USERS', 'SUBADMINS', 'EDIT'),
  validateResetAdminPassword,
  async (req, res) => {
    try {
      const { newPassword } = req.body;
      const subAdmin = await adminService.resetAdminPassword(
        req.params.id,
        newPassword,
        req.user
      );
      return res.status(200).json({
        success: true,
        message: 'Sub Administrator password reset successfully.',
        subAdmin: {
          id: subAdmin._id,
          name: subAdmin.name,
          email: subAdmin.email,
        },
      });
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }
);

/**
 * @desc    Assign custom module/section/action permissions to Sub Admin
 * @route   PUT /api/sub-admins/:id/permissions
 * @access  Private (USERS:SUBADMINS:EDIT)
 */
router.put(
  '/:id/permissions',
  requirePermission('USERS', 'SUBADMINS', 'EDIT'),
  validateUpdatePermissions,
  async (req, res) => {
    try {
      const { customPermissions } = req.body;
      const subAdmin = await adminService.updateAdminPermissions(
        req.params.id,
        customPermissions,
        req.user
      );
      return res.status(200).json({
        success: true,
        message: 'Sub Administrator permissions updated successfully.',
        subAdmin,
      });
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }
);

export default router;
