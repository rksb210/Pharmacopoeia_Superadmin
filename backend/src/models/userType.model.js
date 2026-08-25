import mongoose from 'mongoose';

const userTypeFieldSchema = new mongoose.Schema(
  {
    fieldKey: {
      type: String,
      required: true,
      trim: true,
      // e.g. "apaarId", "registrationNo", "stateCouncil", "gstin", "pan", "companyName", "designation"
    },
    label: {
      type: String,
      required: true,
      trim: true,
      // e.g. "APAAR ID", "Medical Council Registration No."
    },
    type: {
      type: String,
      enum: ['text', 'select', 'number'],
      default: 'text',
    },
    required: {
      type: Boolean,
      default: true,
    },
    placeholder: {
      type: String,
      default: '',
    },
    options: [
      {
        type: String,
      },
    ],
  },
  { _id: false }
);

const userTypeSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'User type name is required'],
      unique: true,
      trim: true,
      // e.g. "Student", "Doctor", "Pharmacist", "Nurse", "Industry", "Others"
    },
    code: {
      type: String,
      required: [true, 'User type code is required'],
      unique: true,
      uppercase: true,
      trim: true,
      // e.g. "STUDENT", "DOCTOR", "PHARMACIST", "NURSE", "INDUSTRY", "OTHERS"
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
    fields: [userTypeFieldSchema],
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

export const UserType = mongoose.model('UserType', userTypeSchema);
export default UserType;
