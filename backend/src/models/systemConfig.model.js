import mongoose from 'mongoose';

const systemConfigSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
      // e.g. "SUBSCRIPTION_FIXED_EXPIRY_DATE", "DEFAULT_TRIAL_DAYS"
    },
    value: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
    category: {
      type: String,
      default: 'SUBSCRIPTION',
      trim: true,
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

export const SystemConfig = mongoose.model('SystemConfig', systemConfigSchema);
export default SystemConfig;
