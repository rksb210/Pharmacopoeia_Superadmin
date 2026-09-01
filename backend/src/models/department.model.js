import mongoose from 'mongoose';

const departmentSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Department name is required'],
      unique: true,
      trim: true,
      maxlength: [100, 'Department name cannot exceed 100 characters'],
    },
    code: {
      type: String,
      required: [true, 'Department code is required'],
      unique: true,
      uppercase: true,
      trim: true,
      maxlength: [30, 'Department code cannot exceed 30 characters'],
      match: [/^[A-Z0-9_-]+$/, 'Code can only contain uppercase letters, numbers, hyphens and underscores'],
    },
    description: {
      type: String,
      trim: true,
      default: '',
      maxlength: [500, 'Description cannot exceed 500 characters'],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

departmentSchema.index({ name: 1 });
departmentSchema.index({ code: 1 });
departmentSchema.index({ isActive: 1 });

export const Department = mongoose.model('Department', departmentSchema);
export default Department;
