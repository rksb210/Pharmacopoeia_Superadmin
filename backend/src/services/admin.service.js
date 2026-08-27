import User from '../models/user.model.js';
import Role from '../models/role.model.js';
import { getUserEffectivePermissions, invalidateRBACCache } from '../middlewares/rbac.middleware.js';

export const adminService = {
  /**
   * Get KPI statistics for Admins dashboard
   */
  getAdminStats: async () => {
    const adminRoles = ['superadmin', 'admin', 'subadmin', 'maker', 'reviewer', 'approver'];

    const totalAdmins = await User.countDocuments({ role: { $in: adminRoles } });
    const activeAdmins = await User.countDocuments({ role: { $in: adminRoles }, isActive: true });
    const superAdmins = await User.countDocuments({ role: 'superadmin', isActive: true });
    const inactiveAdmins = await User.countDocuments({ role: { $in: adminRoles }, isActive: false });

    return {
      totalAdmins,
      activeAdmins,
      superAdmins,
      inactiveAdmins,
    };
  },

  /**
   * Get paginated and filtered list of Admin users
   */
  getAdminsList: async ({
    page = 1,
    limit = 10,
    search = '',
    role = '',
    status = '',
    sortBy = 'createdAt',
    sortOrder = 'desc',
  }) => {
    const adminRoles = ['superadmin', 'admin', 'subadmin', 'maker', 'reviewer', 'approver'];
    const query = { role: { $in: adminRoles } };

    // Search by Name, Email, Username, or Department
    if (search && search.trim()) {
      const searchRegex = new RegExp(search.trim(), 'i');
      query.$or = [
        { name: searchRegex },
        { email: searchRegex },
        { username: searchRegex },
        { department: searchRegex },
        { designation: searchRegex },
      ];
    }

    // Role filter
    if (role && role !== 'all') {
      query.role = role.toLowerCase();
    }

    // Status filter
    if (status && status !== 'all') {
      query.isActive = status === 'active';
    }

    const pageNumber = Math.max(1, parseInt(page, 10));
    const pageSize = Math.max(1, Math.min(100, parseInt(limit, 10)));
    const skip = (pageNumber - 1) * pageSize;

    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1;

    const [admins, total] = await Promise.all([
      User.find(query)
        .sort(sortOptions)
        .skip(skip)
        .limit(pageSize)
        .populate('roleRef', 'name code description')
        .lean(),
      User.countDocuments(query),
    ]);

    const totalPages = Math.ceil(total / pageSize) || 1;

    return {
      admins,
      pagination: {
        total,
        page: pageNumber,
        limit: pageSize,
        totalPages,
      },
    };
  },

  /**
   * Get Admin by ID with effective permissions
   */
  getAdminById: async (id) => {
    const admin = await User.findById(id).populate('roleRef', 'name code description');
    if (!admin) {
      throw new Error('Administrator not found');
    }

    const effectivePermissions = await getUserEffectivePermissions(admin);

    return {
      admin,
      effectivePermissions,
    };
  },

  /**
   * Create a new Admin user
   */
  createAdmin: async (data, requester) => {
    const {
      name,
      email,
      username,
      password,
      role = 'admin',
      department = 'Indian Pharmacopoeia Commission',
      designation = 'Administrator',
      phoneNumber = '',
      notes = '',
      customPermissions = [],
    } = data;

    // Hierarchy protection: Non-superadmin cannot create superadmin
    if (role === 'superadmin' && requester.role !== 'superadmin') {
      throw new Error('Only a Superadmin can create accounts with the Superadmin role.');
    }

    const cleanEmail = email.toLowerCase().trim();
    const cleanUsername = username.toLowerCase().trim();

    // Check duplicate
    const existing = await User.findOne({
      $or: [{ email: cleanEmail }, { username: cleanUsername }],
    });

    if (existing) {
      if (existing.email === cleanEmail) {
        throw new Error('An account with this email address already exists.');
      }
      throw new Error('An account with this username already exists.');
    }

    // Lookup roleRef if available
    const roleDoc = await Role.findOne({ code: role.toLowerCase() });

    const newAdmin = await User.create({
      name: name.trim(),
      email: cleanEmail,
      username: cleanUsername,
      password,
      role: role.toLowerCase(),
      roleRef: roleDoc ? roleDoc._id : null,
      department: department.trim(),
      designation: designation.trim(),
      phoneNumber: phoneNumber.trim(),
      notes: notes.trim(),
      customPermissions: customPermissions.map((p) => p.toUpperCase()),
      isActive: true,
    });

    return newAdmin;
  },

  /**
   * Update Admin profile & metadata
   */
  updateAdmin: async (id, data, requester) => {
    const admin = await User.findById(id);
    if (!admin) {
      throw new Error('Administrator not found');
    }

    // Hierarchy protection: Only Superadmin can edit another Superadmin
    if (admin.role === 'superadmin' && requester.role !== 'superadmin') {
      throw new Error('Permission denied: Only Superadmin can modify Superadmin accounts.');
    }

    // Hierarchy protection: Only Superadmin can promote to superadmin
    if (data.role && data.role === 'superadmin' && requester.role !== 'superadmin') {
      throw new Error('Permission denied: You cannot assign the Superadmin role.');
    }

    const {
      name,
      email,
      username,
      role,
      department,
      designation,
      phoneNumber,
      notes,
    } = data;

    if (name) admin.name = name.trim();
    if (department !== undefined) admin.department = department.trim();
    if (designation !== undefined) admin.designation = designation.trim();
    if (phoneNumber !== undefined) admin.phoneNumber = phoneNumber.trim();
    if (notes !== undefined) admin.notes = notes.trim();

    if (email && email.toLowerCase().trim() !== admin.email) {
      const cleanEmail = email.toLowerCase().trim();
      const duplicate = await User.findOne({ email: cleanEmail, _id: { $ne: admin._id } });
      if (duplicate) throw new Error('Email address is already in use by another account.');
      admin.email = cleanEmail;
    }

    if (username && username.toLowerCase().trim() !== admin.username) {
      const cleanUsername = username.toLowerCase().trim();
      const duplicate = await User.findOne({ username: cleanUsername, _id: { $ne: admin._id } });
      if (duplicate) throw new Error('Username is already in use by another account.');
      admin.username = cleanUsername;
    }

    if (role && role !== admin.role) {
      admin.role = role.toLowerCase();
      const roleDoc = await Role.findOne({ code: role.toLowerCase() });
      admin.roleRef = roleDoc ? roleDoc._id : null;
    }

    await admin.save();
    return admin;
  },

  /**
   * Toggle Admin Active / Inactive status
   */
  toggleAdminStatus: async (id, isActive, requester) => {
    const admin = await User.findById(id);
    if (!admin) {
      throw new Error('Administrator not found');
    }

    // Self-deactivation protection
    if (admin._id.toString() === requester._id.toString() && !isActive) {
      throw new Error('You cannot deactivate your own administrative account.');
    }

    // Hierarchy protection
    if (admin.role === 'superadmin' && requester.role !== 'superadmin') {
      throw new Error('Permission denied: Only Superadmin can alter Superadmin status.');
    }

    // Prevent deactivating the last active superadmin
    if (admin.role === 'superadmin' && !isActive) {
      const activeSuperAdmins = await User.countDocuments({
        role: 'superadmin',
        isActive: true,
      });
      if (activeSuperAdmins <= 1) {
        throw new Error('Cannot deactivate the only remaining active Superadmin account.');
      }
    }

    admin.isActive = !!isActive;
    await admin.save();

    return admin;
  },

  /**
   * Reset Admin password
   */
  resetAdminPassword: async (id, newPassword, requester) => {
    const admin = await User.findById(id);
    if (!admin) {
      throw new Error('Administrator not found');
    }

    // Hierarchy protection
    if (admin.role === 'superadmin' && requester.role !== 'superadmin') {
      throw new Error('Permission denied: Only Superadmin can reset Superadmin passwords.');
    }

    admin.password = newPassword;
    admin.failedLoginAttempts = 0;
    admin.lockUntil = null;
    await admin.save();

    return admin;
  },

  /**
   * Update custom permissions for an Admin
   */
  updateAdminPermissions: async (id, customPermissions = [], requester) => {
    const admin = await User.findById(id);
    if (!admin) {
      throw new Error('Administrator not found');
    }

    if (admin.role === 'superadmin' && requester.role !== 'superadmin') {
      throw new Error('Permission denied: Only Superadmin can alter Superadmin permissions.');
    }

    admin.customPermissions = customPermissions.map((p) => p.toUpperCase());
    admin.hasCustomPermissions = true;
    await admin.save();

    invalidateRBACCache();

    return admin;
  },
};

export default adminService;
