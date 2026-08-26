import mongoose from 'mongoose';

const planAuditLogSchema = new mongoose.Schema(
  {
    changedBy: {
      type: String,
      required: true,
      default: 'System / Admin',
    },
    changeType: {
      type: String,
      required: true,
      // e.g. "CREATED", "PRICING_UPDATED", "VALIDITY_UPDATED", "RULES_UPDATED", "STATUS_TOGGLED"
    },
    previousValues: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    newValues: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    reason: {
      type: String,
      default: '',
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

const planSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Plan name is required'],
      unique: true,
      trim: true,
      // e.g. "NFI 9th Edition Formulary - Individual Pass"
    },
    code: {
      type: String,
      required: [true, 'Plan code is required'],
      unique: true,
      uppercase: true,
      trim: true,
      // e.g. "NFI-INDIVIDUAL-PASS"
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
    tier: {
      type: String,
      enum: ['Individual', 'Institutional', 'Student', 'Doctor Professional', 'Corporate', 'General'],
      default: 'Individual',
    },
    priceINR: {
      type: Number,
      required: [true, 'Plan price in INR is required'],
      min: [0, 'Price cannot be negative'],
      default: 0,
    },
    // Validity Configuration
    validityType: {
      type: String,
      enum: ['fixed_date', 'duration_days', 'duration_months', 'duration_years'],
      default: 'fixed_date',
    },
    fixedDate: {
      type: Date,
      default: new Date('2031-12-31T23:59:59.999Z'),
    },
    durationValue: {
      type: Number,
      default: 365, // e.g. 365 days / 12 months / 1 year
    },
    // Applicable User Types (e.g. ['STUDENT', 'DOCTOR', 'ALL'])
    applicableUserTypes: [
      {
        type: String,
        uppercase: true,
        trim: true,
      },
    ],
    // Feature benefit list
    features: [
      {
        type: String,
        trim: true,
      },
    ],
    // Trial Eligibility Rules
    trialEligibility: {
      isAllowed: {
        type: Boolean,
        default: true,
      },
      trialDays: {
        type: Number,
        default: 14,
        min: 1,
      },
    },
    // Complimentary Eligibility Rules
    complimentaryEligibility: {
      isAllowed: {
        type: Boolean,
        default: true,
      },
      defaultMonths: {
        type: Number,
        default: 12,
        min: 1,
      },
    },
    // Discount / Concession Rules
    discountRules: {
      isDiscountAllowed: {
        type: Boolean,
        default: true,
      },
      maxDiscountPercent: {
        type: Number,
        default: 50,
        min: 0,
        max: 100,
      },
      defaultDiscountPercent: {
        type: Number,
        default: 0,
        min: 0,
        max: 100,
      },
    },
    seatQuota: {
      type: Number,
      default: 1, // 1 for individual, 50 for institutional, 0 for unlimited
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    isPopular: {
      type: Boolean,
      default: false,
    },
    sortOrder: {
      type: Number,
      default: 0,
    },
    auditLogs: [planAuditLogSchema],
  },
  {
    timestamps: true,
  }
);

planSchema.index({ code: 1 });
planSchema.index({ tier: 1 });
planSchema.index({ isActive: 1 });

export const Plan = mongoose.model('Plan', planSchema);
export default Plan;
