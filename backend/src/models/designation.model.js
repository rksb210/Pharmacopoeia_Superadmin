import mongoose from 'mongoose';

const designationSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Designation name is required'],
      trim: true,
      maxlength: [100, 'Designation name cannot exceed 100 characters'],
    },
    code: {
      type: String,
      required: [true, 'Designation code is required'],
      uppercase: true,
      trim: true,
      maxlength: [30, 'Designation code cannot exceed 30 characters'],
      match: [/^[A-Z0-9_-]+$/, 'Code can only contain uppercase letters, numbers, hyphens and underscores'],
    },
    department: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Department',
      required: [true, 'Department reference is required'],
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

designationSchema.index({ department: 1, name: 1 }, { unique: true });
designationSchema.index({ department: 1, code: 1 }, { unique: true });
designationSchema.index({ isActive: 1 });

export const Designation = mongoose.model('Designation', designationSchema);
export default Designation;
