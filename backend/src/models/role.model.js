import mongoose from 'mongoose';

/**
 * Standard System Roles
 */
export const SYSTEM_ROLES = {
  SUPERADMIN: 'superadmin',
  ADMIN: 'admin',
  SUBADMIN: 'subadmin',
  MAKER: 'maker',
  REVIEWER: 'reviewer',
  APPROVER: 'approver',
};

const roleSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Role name is required'],
      unique: true,
      trim: true,
      // e.g. "Super Admin", "Admin", "Sub Admin", "Maker", "Reviewer", "Approver"
    },
    code: {
      type: String,
      required: [true, 'Role code identifier is required'],
      unique: true,
      lowercase: true,
      trim: true,
      // e.g. "superadmin", "admin", "subadmin", "maker", "reviewer", "approver"
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
    isSystemDefault: {
      type: Boolean,
      default: false,
    },
    permissions: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Permission',
      },
    ],
    // Cached permission codes for fast lookup without deep population queries
    permissionCodes: [
      {
        type: String,
        uppercase: true,
      },
    ],
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Helper to check if role has specific permission code
roleSchema.methods.hasPermission = function (permissionCode) {
  if (this.code === SYSTEM_ROLES.SUPERADMIN) return true; // Superadmin has all permissions
  const target = (permissionCode || '').toUpperCase();
  return this.permissionCodes.includes(target) || this.permissionCodes.includes('*');
};

export const Role = mongoose.model('Role', roleSchema);
export default Role;
