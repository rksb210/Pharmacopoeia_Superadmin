import mongoose from 'mongoose';

const redemptionHistorySchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Subscriber',
      required: true,
    },
    userEmail: {
      type: String,
      required: true,
      trim: true,
    },
    orderAmount: {
      type: Number,
      required: true,
    },
    discountApplied: {
      type: Number,
      required: true,
    },
    finalAmount: {
      type: Number,
      required: true,
    },
    subscriptionId: {
      type: String,
      default: '',
    },
    date: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

const couponSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: [true, 'Coupon code is required'],
      unique: true,
      uppercase: true,
      trim: true,
      // e.g. "NFI-DOC2026", "STUDENT50", "MOHFW-VIP"
    },
    title: {
      type: String,
      required: [true, 'Coupon title is required'],
      trim: true,
      // e.g. "IMA Doctors National Concession"
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
    discountType: {
      type: String,
      enum: ['percentage', 'fixed_amount'],
      default: 'percentage',
    },
    discountValue: {
      type: Number,
      required: [true, 'Discount value is required'],
      min: [1, 'Discount value must be at least 1'],
    },
    maxDiscountINR: {
      type: Number,
      default: 0, // 0 = no cap for percentage
    },
    minOrderAmountINR: {
      type: Number,
      default: 0,
    },
    startDate: {
      type: Date,
      default: Date.now,
    },
    endDate: {
      type: Date,
      required: [true, 'Expiration date is required'],
    },
    usageLimit: {
      type: Number,
      default: 0, // 0 = unlimited
    },
    usageCount: {
      type: Number,
      default: 0,
    },
    perUserLimit: {
      type: Number,
      default: 1,
    },
    // Applicable Plans (e.g. ['NFI-INDIVIDUAL', 'NFI-STUDENT-SPECIAL'] or ['ALL'])
    applicablePlans: [
      {
        type: String,
        trim: true,
      },
    ],
    // Applicable User Types (e.g. ['STUDENT', 'DOCTOR', 'ALL'])
    applicableUserTypes: [
      {
        type: String,
        uppercase: true,
        trim: true,
      },
    ],
    // Targeted specific users
    specificUsers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Subscriber',
      },
    ],
    // Targeted specific emails / domains (e.g. 'aiims.edu', 'doctor@hospital.org')
    specificEmails: [
      {
        type: String,
        lowercase: true,
        trim: true,
      },
    ],
    isActive: {
      type: Boolean,
      default: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    redemptionHistory: [redemptionHistorySchema],
  },
  {
    timestamps: true,
  }
);

couponSchema.index({ code: 1 });
couponSchema.index({ isActive: 1 });
couponSchema.index({ endDate: 1 });

export const Coupon = mongoose.model('Coupon', couponSchema);
export default Coupon;
