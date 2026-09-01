import Role, { SYSTEM_ROLES } from '../models/role.model.js';
import Permission, { RBAC_ACTIONS, RBAC_MODULES } from '../models/permission.model.js';
import User from '../models/user.model.js';
import {
  getUserEffectivePermissions,
  invalidateRBACCache,
} from '../middlewares/rbac.middleware.js';

/**
 * @desc    Get all registered system roles with assigned user counts
 * @route   GET /api/rbac/roles
 * @access  Private (USERS:ROLES:VIEW)
 */
export const getRoles = async (req, res, next) => {
  try {
    const roles = await Role.find().sort({ isSystemDefault: -1, createdAt: 1 }).lean();

    // Compute assigned user counts in parallel
    const rolesWithCounts = await Promise.all(
      roles.map(async (role) => {
        const assignedUsersCount = await User.countDocuments({
          $or: [{ role: role.code }, { roleRef: role._id }],
        });
        return {
          ...role,
          assignedUsersCount,
        };
      })
    );

    const stats = {
      totalRoles: rolesWithCounts.length,
      systemRoles: rolesWithCounts.filter((r) => r.isSystemDefault).length,
      customRoles: rolesWithCounts.filter((r) => !r.isSystemDefault).length,
    };

    return res.status(200).json({
      success: true,
      stats,
      roles: rolesWithCounts,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get single role details and assigned users list
 * @route   GET /api/rbac/roles/:id
 * @access  Private (USERS:ROLES:VIEW)
 */
export const getRoleById = async (req, res, next) => {
  try {
    const role = await Role.findById(req.params.id);
    if (!role) {
      return res.status(404).json({
        success: false,
        message: 'Role not found.',
      });
    }

    // Fetch assigned users
    const assignedUsers = await User.find({
      $or: [{ role: role.code }, { roleRef: role._id }],
    })
      .select('name email username department designation isActive lastLogin')
      .sort({ name: 1 })
      .lean();

    return res.status(200).json({
      success: true,
      role,
      assignedUsers,
      assignedUsersCount: assignedUsers.length,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all available system permissions grouped by module
 * @route   GET /api/rbac/permissions
 * @access  Private
 */
export const getPermissions = async (req, res, next) => {
  try {
    const permissions = await Permission.find({ isActive: true }).sort({ module: 1, section: 1, action: 1 });

    // Group by module and section for UI matrix
    const grouped = {};
    permissions.forEach((p) => {
      if (!grouped[p.module]) grouped[p.module] = {};
      if (!grouped[p.module][p.section]) grouped[p.module][p.section] = [];
      grouped[p.module][p.section].push(p);
    });

    return res.status(200).json({
      success: true,
      total: permissions.length,
      permissions,
      grouped,
      modules: RBAC_MODULES,
      actions: RBAC_ACTIONS,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get effective permissions for the currently authenticated user
 * @route   GET /api/rbac/my-permissions
 * @access  Private
 */
export const getMyPermissions = async (req, res, next) => {
  try {
    const effectivePermissions = await getUserEffectivePermissions(req.user);
    return res.status(200).json({
      success: true,
      role: req.user.role,
      isSuperAdmin: req.user.role === 'superadmin',
      permissions: effectivePermissions,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Create a new custom role
 * @route   POST /api/rbac/roles
 * @access  Private (USERS:ROLES:ADD)
 */
export const createRole = async (req, res, next) => {
  try {
    const { name, code, description, permissionCodes = [] } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Role name is required.' });
    }

    const normalizedCode = (code || name.replace(/\s+/g, '_')).toLowerCase().trim();

    const existingRole = await Role.findOne({
      $or: [{ name: name.trim() }, { code: normalizedCode }],
    });

    if (existingRole) {
      return res.status(400).json({
        success: false,
        message: 'A role with this name or code already exists.',
      });
    }

    const role = await Role.create({
      name: name.trim(),
      code: normalizedCode,
      description: description || '',
      permissionCodes: permissionCodes.map((p) => p.toUpperCase()),
      isSystemDefault: false,
      isActive: true,
    });

    invalidateRBACCache();

    return res.status(201).json({
      success: true,
      message: 'Role created successfully.',
      role,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update role permissions & metadata
 * @route   PUT /api/rbac/roles/:id
 * @access  Private (USERS:ROLES:EDIT)
 */
export const updateRole = async (req, res, next) => {
  try {
    const { name, description, permissionCodes, isActive } = req.body;

    const role = await Role.findById(req.params.id);
    if (!role) {
      return res.status(404).json({
        success: false,
        message: 'Role not found.',
      });
    }

    // Protect renaming system default roles
    if (name && !role.isSystemDefault) {
      role.name = name.trim();
    }

    if (description !== undefined) role.description = description;

    // Superadmin role permissions cannot be altered from wildcard
    if (permissionCodes && role.code !== 'superadmin') {
      role.permissionCodes = permissionCodes.map((p) => p.toUpperCase());
    }

    if (isActive !== undefined && !role.isSystemDefault) {
      role.isActive = isActive;
    }

    await role.save();
    invalidateRBACCache();

    return res.status(200).json({
      success: true,
      message: 'Role updated successfully.',
      role,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete a custom role
 * @route   DELETE /api/rbac/roles/:id
 * @access  Private (USERS:ROLES:DELETE)
 */
export const deleteRole = async (req, res, next) => {
  try {
    const role = await Role.findById(req.params.id);
    if (!role) {
      return res.status(404).json({
        success: false,
        message: 'Role not found.',
      });
    }

    // Critical Guard 1: Cannot delete system-default roles
    if (role.isSystemDefault) {
      return res.status(403).json({
        success: false,
        message: 'System-critical roles cannot be deleted.',
      });
    }

    // Critical Guard 2: Cannot delete role if users are assigned
    const assignedUsersCount = await User.countDocuments({
      $or: [{ role: role.code }, { roleRef: role._id }],
    });

    if (assignedUsersCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete role '${role.name}' because it currently has ${assignedUsersCount} active user(s) assigned. Reassign them first.`,
      });
    }

    await Role.findByIdAndDelete(req.params.id);
    invalidateRBACCache();

    return res.status(200).json({
      success: true,
      message: `Role '${role.name}' deleted successfully.`,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Toggle Role active / inactive status
 * @route   PATCH /api/rbac/roles/:id/status
 * @access  Private (USERS:ROLES:EDIT)
 */
export const toggleRoleStatus = async (req, res, next) => {
  try {
    const { isActive } = req.body;
    const role = await Role.findById(req.params.id);

    if (!role) {
      return res.status(404).json({
        success: false,
        message: 'Role not found.',
      });
    }

    if (role.isSystemDefault && !isActive) {
      return res.status(403).json({
        success: false,
        message: 'System-default roles cannot be deactivated.',
      });
    }

    role.isActive = !!isActive;
    await role.save();
    invalidateRBACCache();

    return res.status(200).json({
      success: true,
      message: `Role '${role.name}' ${isActive ? 'activated' : 'deactivated'} successfully.`,
      role,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Bulk assign users to a role
 * @route   POST /api/rbac/roles/:id/assign-users
 * @access  Private (USERS:ROLES:EDIT)
 */
export const assignRoleUsers = async (req, res, next) => {
  try {
    const { userIds = [] } = req.body;

    const role = await Role.findById(req.params.id);
    if (!role) {
      return res.status(404).json({
        success: false,
        message: 'Role not found.',
      });
    }

    // Hierarchy protection: Only superadmin can assign users to superadmin
    if (role.code === 'superadmin' && req.user.role !== 'superadmin') {
      return res.status(403).json({
        success: false,
        message: 'Only Superadmin can assign users to the Super Admin role.',
      });
    }

    if (!Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please provide an array of user IDs to assign.',
      });
    }

    // Update target users
    const updateResult = await User.updateMany(
      { _id: { $in: userIds } },
      { $set: { role: role.code, roleRef: role._id } }
    );

    return res.status(200).json({
      success: true,
      message: `Assigned ${updateResult.modifiedCount} user(s) to role '${role.name}'.`,
      modifiedCount: updateResult.modifiedCount,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Seed default RBAC permissions and 6 core roles
 * @route   POST /api/rbac/seed
 * @access  Public (Dev) / Superadmin
 */
export const seedRBAC = async (req, res, next) => {
  try {
    const matrix = [
      { module: 'OVERVIEW', section: 'DASHBOARD', actions: ['VIEW', 'EXPORT'] },
      { module: 'USERS', section: 'USERS', actions: ['VIEW', 'ADD', 'EDIT', 'DELETE', 'EXPORT'] },
      { module: 'USERS', section: 'ADMINS', actions: ['VIEW', 'ADD', 'EDIT', 'DELETE', 'EXPORT'] },
      { module: 'USERS', section: 'SUBADMINS', actions: ['VIEW', 'ADD', 'EDIT', 'DELETE', 'EXPORT'] },
      { module: 'USERS', section: 'ROLES', actions: ['VIEW', 'ADD', 'EDIT', 'DELETE'] },
      { module: 'SYSTEM', section: 'DEPARTMENTS', actions: ['VIEW', 'ADD', 'EDIT', 'DELETE', 'EXPORT'] },
      { module: 'SYSTEM', section: 'DESIGNATIONS', actions: ['VIEW', 'ADD', 'EDIT', 'DELETE', 'EXPORT'] },
      { module: 'CONTENT', section: 'MONOGRAPHS', actions: ['VIEW', 'ADD', 'EDIT', 'DELETE', 'APPROVE', 'REJECT', 'PUBLISH', 'EXPORT', 'DOWNLOAD', 'PRINT'] },
      { module: 'CONTENT', section: 'WORKFLOW', actions: ['VIEW', 'ADD', 'EDIT', 'APPROVE', 'REJECT', 'PUBLISH'] },
      { module: 'CONTENT', section: 'SEARCH_INDEX', actions: ['VIEW', 'EDIT'] },
      { module: 'COMMERCIAL', section: 'SUBSCRIPTIONS', actions: ['VIEW', 'ADD', 'EDIT', 'DELETE', 'APPROVE', 'EXPORT'] },
      { module: 'COMMERCIAL', section: 'PLANS', actions: ['VIEW', 'ADD', 'EDIT', 'DELETE'] },
      { module: 'COMMERCIAL', section: 'DISCOUNTS', actions: ['VIEW', 'ADD', 'EDIT', 'DELETE'] },
      { module: 'COMMERCIAL', section: 'COUPONS', actions: ['VIEW', 'ADD', 'EDIT', 'DELETE', 'EXPORT'] },
      { module: 'COMMERCIAL', section: 'BULK_SUBSCRIPTION', actions: ['VIEW', 'ADD', 'EDIT', 'APPROVE', 'EXPORT'] },
      { module: 'ENGAGEMENT', section: 'CRM', actions: ['VIEW', 'ADD', 'EDIT', 'DELETE', 'EXPORT'] },
      { module: 'ENGAGEMENT', section: 'FEEDBACK', actions: ['VIEW', 'EDIT', 'DELETE', 'REJECT', 'EXPORT'] },
      { module: 'ENGAGEMENT', section: 'NOTIFICATIONS', actions: ['VIEW', 'ADD', 'EDIT', 'DELETE', 'PUBLISH'] },
      { module: 'INTEGRATED', section: 'DIKSHA', actions: ['VIEW', 'ADD', 'EDIT', 'EXPORT'] },
      { module: 'INTEGRATED', section: 'KAYM', actions: ['VIEW', 'ADD', 'EDIT', 'EXPORT'] },
      { module: 'SYSTEM', section: 'REPORTS', actions: ['VIEW', 'EXPORT', 'DOWNLOAD', 'PRINT'] },
      { module: 'SYSTEM', section: 'AUDIT_LOGS', actions: ['VIEW', 'EXPORT', 'PRINT'] },
      { module: 'SYSTEM', section: 'SETTINGS', actions: ['VIEW', 'EDIT'] },
    ];

    const permissionDocs = [];
    for (const item of matrix) {
      for (const action of item.actions) {
        const code = `${item.module}:${item.section}:${action}`;
        const name = `${action} ${item.section}`;
        const doc = await Permission.findOneAndUpdate(
          { code },
          {
            code,
            module: item.module,
            section: item.section,
            action,
            name,
            description: `Allow user to ${action.toLowerCase()} in ${item.module} / ${item.section}`,
            isActive: true,
          },
          { upsert: true, new: true }
        );
        permissionDocs.push(doc);
      }
    }

    const allPermissionCodes = permissionDocs.map((p) => p.code);

    const defaultRolesConfig = [
      {
        name: 'Super Admin',
        code: SYSTEM_ROLES.SUPERADMIN,
        description: 'Complete unrestricted access across all portal modules and governance tools.',
        isSystemDefault: true,
        permissionCodes: ['*'],
      },
      {
        name: 'Admin',
        code: SYSTEM_ROLES.ADMIN,
        description: 'Full administrative access across users, monographs, subscriptions, and reports.',
        isSystemDefault: true,
        permissionCodes: allPermissionCodes.filter(
          (c) => !c.includes('ROLES:DELETE') && !c.includes('ADMINS:DELETE')
        ),
      },
      {
        name: 'Sub Admin',
        code: SYSTEM_ROLES.SUBADMIN,
        description: 'Departmental coordinator managing assigned users, feedback, and viewable reports.',
        isSystemDefault: true,
        permissionCodes: allPermissionCodes.filter(
          (c) => c.startsWith('OVERVIEW:') || c.startsWith('USERS:USERS:') || c.startsWith('ENGAGEMENT:') || c.startsWith('CONTENT:MONOGRAPHS:VIEW') || c.startsWith('SYSTEM:REPORTS:VIEW')
        ),
      },
      {
        name: 'Maker',
        code: SYSTEM_ROLES.MAKER,
        description: 'Draft author who creates and edits monograph content, courses, and notifications.',
        isSystemDefault: true,
        permissionCodes: [
          'OVERVIEW:DASHBOARD:VIEW',
          'CONTENT:MONOGRAPHS:VIEW',
          'CONTENT:MONOGRAPHS:ADD',
          'CONTENT:MONOGRAPHS:EDIT',
          'CONTENT:WORKFLOW:VIEW',
          'CONTENT:WORKFLOW:ADD',
          'CONTENT:WORKFLOW:EDIT',
          'INTEGRATED:DIKSHA:VIEW',
          'INTEGRATED:DIKSHA:ADD',
          'INTEGRATED:KAYM:VIEW',
          'INTEGRATED:KAYM:ADD',
        ],
      },
      {
        name: 'Reviewer',
        code: SYSTEM_ROLES.REVIEWER,
        description: 'Editorial reviewer who checks monograph drafts, suggests amendments, and verifies accuracy.',
        isSystemDefault: true,
        permissionCodes: [
          'OVERVIEW:DASHBOARD:VIEW',
          'CONTENT:MONOGRAPHS:VIEW',
          'CONTENT:MONOGRAPHS:EDIT',
          'CONTENT:WORKFLOW:VIEW',
          'CONTENT:WORKFLOW:EDIT',
          'CONTENT:WORKFLOW:REJECT',
          'ENGAGEMENT:FEEDBACK:VIEW',
          'ENGAGEMENT:FEEDBACK:EDIT',
          'SYSTEM:REPORTS:VIEW',
        ],
      },
      {
        name: 'Approver',
        code: SYSTEM_ROLES.APPROVER,
        description: 'Scientific committee authority with signing privilege to approve and publish monographs.',
        isSystemDefault: true,
        permissionCodes: [
          'OVERVIEW:DASHBOARD:VIEW',
          'CONTENT:MONOGRAPHS:VIEW',
          'CONTENT:MONOGRAPHS:APPROVE',
          'CONTENT:MONOGRAPHS:REJECT',
          'CONTENT:MONOGRAPHS:PUBLISH',
          'CONTENT:WORKFLOW:VIEW',
          'CONTENT:WORKFLOW:APPROVE',
          'CONTENT:WORKFLOW:REJECT',
          'CONTENT:WORKFLOW:PUBLISH',
          'SYSTEM:REPORTS:VIEW',
          'SYSTEM:AUDIT_LOGS:VIEW',
        ],
      },
    ];

    const seededRoles = [];
    for (const rConfig of defaultRolesConfig) {
      const role = await Role.findOneAndUpdate(
        { code: rConfig.code },
        rConfig,
        { upsert: true, new: true }
      );
      seededRoles.push(role);
    }

    invalidateRBACCache();

    return res.status(200).json({
      success: true,
      message: 'RBAC permissions matrix and default roles seeded successfully.',
      permissionsCount: permissionDocs.length,
      roles: seededRoles,
    });
  } catch (error) {
    next(error);
  }
};

export default {
  getRoles,
  getRoleById,
  getPermissions,
  getMyPermissions,
  createRole,
  updateRole,
  deleteRole,
  toggleRoleStatus,
  assignRoleUsers,
  seedRBAC,
};
