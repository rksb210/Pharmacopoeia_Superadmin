import mongoose from 'mongoose';

/**
 * Standard Actions supported in the Pharmacopoeia RBAC Engine
 */
export const RBAC_ACTIONS = [
  'VIEW',
  'ADD',
  'EDIT',
  'DELETE',
  'APPROVE',
  'REJECT',
  'PUBLISH',
  'EXPORT',
  'DOWNLOAD',
  'PRINT',
];

/**
 * Core Modules in Pharmacopoeia Superadmin
 */
export const RBAC_MODULES = [
  'OVERVIEW',
  'USERS',
  'CONTENT',
  'COMMERCIAL',
  'ENGAGEMENT',
  'INTEGRATED',
  'SYSTEM',
];

const permissionSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: [true, 'Permission code is required'],
      unique: true,
      uppercase: true,
      trim: true,
      // e.g. "CONTENT:MONOGRAPHS:EDIT", "USERS:ADMINS:VIEW"
    },
    module: {
      type: String,
      required: [true, 'Module is required'],
      uppercase: true,
      trim: true,
      // e.g. "CONTENT", "USERS", "COMMERCIAL"
    },
    section: {
      type: String,
      required: [true, 'Section is required'],
      uppercase: true,
      trim: true,
      // e.g. "MONOGRAPHS", "WORKFLOW", "ROLES", "PLANS"
    },
    action: {
      type: String,
      required: [true, 'Action is required'],
      enum: RBAC_ACTIONS,
      uppercase: true,
      trim: true,
    },
    name: {
      type: String,
      required: [true, 'Display name is required'],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for fast lookup
permissionSchema.index({ module: 1, section: 1, action: 1 }, { unique: true });

export const Permission = mongoose.model('Permission', permissionSchema);
export default Permission;
