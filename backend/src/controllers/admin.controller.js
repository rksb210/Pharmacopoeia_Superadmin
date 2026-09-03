import adminService from '../services/admin.service.js';
import { auditService } from '../services/audit.service.js';

/**
 * @desc    Get Admin dashboard KPI statistics
 * @route   GET /api/admins/stats
 * @access  Private
 */
export const getAdminStats = async (req, res, next) => {
  try {
    const stats = await adminService.getAdminStats();
    return res.status(200).json({
      success: true,
      stats,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get paginated list of Admins with search, filters, sorting
 * @route   GET /api/admins
 * @access  Private
 */
export const getAdmins = async (req, res, next) => {
  try {
    const { page, limit, search, role, status, sortBy, sortOrder } = req.query;

    const result = await adminService.getAdminsList({
      page,
      limit,
      search,
      role,
      status,
      sortBy,
      sortOrder,
    });

    return res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get single Admin details by ID
 * @route   GET /api/admins/:id
 * @access  Private
 */
export const getAdminById = async (req, res, next) => {
  try {
    const result = await adminService.getAdminById(req.params.id);
    return res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Create a new Admin
 * @route   POST /api/admins
 * @access  Private (Superadmin / Admin with ADD permission)
 */
export const createAdmin = async (req, res, next) => {
  try {
    const newAdmin = await adminService.createAdmin(req.body, req.user);

    // Record Audit Log
    await auditService.log(req, {
      action: 'ADMIN_CREATED',
      module: 'ADMINS',
      entity: 'User',
      entityId: newAdmin._id,
      status: 'SUCCESS',
      details: `Created new ${newAdmin.role} account for ${newAdmin.name} (${newAdmin.email}).`,
      newValues: {
        name: newAdmin.name,
        email: newAdmin.email,
        role: newAdmin.role,
        department: newAdmin.department,
        designation: newAdmin.designation,
      },
    });

    return res.status(201).json({
      success: true,
      message: 'Administrator created successfully.',
      admin: newAdmin,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * @desc    Update an existing Admin
 * @route   PUT /api/admins/:id
 * @access  Private
 */
export const updateAdmin = async (req, res, next) => {
  try {
    const updatedAdmin = await adminService.updateAdmin(req.params.id, req.body, req.user);

    // Record Audit Log
    await auditService.log(req, {
      action: 'ADMIN_UPDATED',
      module: 'ADMINS',
      entity: 'User',
      entityId: updatedAdmin._id,
      status: 'SUCCESS',
      details: `Updated details for ${updatedAdmin.role} account ${updatedAdmin.name}.`,
      newValues: {
        name: updatedAdmin.name,
        email: updatedAdmin.email,
        role: updatedAdmin.role,
        department: updatedAdmin.department,
        designation: updatedAdmin.designation,
      },
    });

    return res.status(200).json({
      success: true,
      message: 'Administrator updated successfully.',
      admin: updatedAdmin,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * @desc    Activate or Deactivate an Admin
 * @route   PATCH /api/admins/:id/status
 * @access  Private
 */
export const toggleAdminStatus = async (req, res, next) => {
  try {
    const { isActive } = req.body;
    const admin = await adminService.toggleAdminStatus(req.params.id, isActive, req.user);

    // Record Audit Log
    await auditService.log(req, {
      action: 'ADMIN_STATUS_CHANGED',
      module: 'ADMINS',
      entity: 'User',
      entityId: admin._id,
      status: 'SUCCESS',
      details: `Administrator ${admin.name} (${admin.email}) ${isActive ? 'activated' : 'deactivated'}.`,
      newValues: { isActive },
    });

    return res.status(200).json({
      success: true,
      message: `Administrator account ${isActive ? 'activated' : 'deactivated'} successfully.`,
      admin,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * @desc    Reset Admin password
 * @route   POST /api/admins/:id/reset-password
 * @access  Private
 */
export const resetAdminPassword = async (req, res, next) => {
  try {
    const { newPassword } = req.body;
    const admin = await adminService.resetAdminPassword(req.params.id, newPassword, req.user);

    // Record Audit Log
    await auditService.log(req, {
      action: 'ADMIN_PASSWORD_RESET',
      module: 'ADMINS',
      entity: 'User',
      entityId: admin._id,
      status: 'SUCCESS',
      details: `Password reset performed for administrator ${admin.name} (${admin.email}).`,
    });

    return res.status(200).json({
      success: true,
      message: 'Administrator password reset successfully.',
      admin: {
        id: admin._id,
        name: admin.name,
        email: admin.email,
      },
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * @desc    Assign custom permissions to an Admin
 * @route   PUT /api/admins/:id/permissions
 * @access  Private (Superadmin)
 */
export const updateAdminPermissions = async (req, res, next) => {
  try {
    const { customPermissions } = req.body;
    const admin = await adminService.updateAdminPermissions(
      req.params.id,
      customPermissions,
      req.user
    );

    // Record Audit Log
    await auditService.log(req, {
      action: 'ADMIN_PERMISSIONS_UPDATED',
      module: 'ADMINS',
      entity: 'User',
      entityId: admin._id,
      status: 'SUCCESS',
      details: `Assigned direct custom permissions to ${admin.name} (${admin.email}).`,
      newValues: { customPermissions },
    });

    return res.status(200).json({
      success: true,
      message: 'Administrator permissions updated successfully.',
      admin,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};
