import mongoose from 'mongoose';

const subscriptionTimelineSchema = new mongoose.Schema(
  {
    action: {
      type: String,
      required: true,
      // e.g. "ASSIGNED", "RENEWED", "CANCELLED", "STATUS_CHANGED", "EXPIRED"
    },
    statusFrom: {
      type: String,
      default: null,
    },
    statusTo: {
      type: String,
      default: null,
    },
    performedBy: {
      type: String,
      default: 'System / Admin',
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

const subscriptionSchema = new mongoose.Schema(
  {
    subscriptionId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      // e.g. "SUB-2026-00891"
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Subscriber',
      required: true,
    },
    planName: {
      type: String,
      required: true,
      trim: true,
      // e.g. "NFI 9th Edition Formulary - Individual Annual Pass"
    },
    planCode: {
      type: String,
      required: true,
      trim: true,
      // e.g. "NFI-INDIVIDUAL", "NFI-INSTITUTIONAL", "NFI-STUDENT-SPECIAL"
    },
    tier: {
      type: String,
      enum: ['Individual', 'Institutional', 'Student', 'Doctor Professional', 'Corporate'],
      default: 'Individual',
    },
    type: {
      type: String,
      enum: ['paid', 'trial', 'complimentary', 'discounted'],
      default: 'paid',
    },
    status: {
      type: String,
      enum: ['active', 'expired', 'cancelled', 'pending', 'suspended'],
      default: 'active',
    },
    startDate: {
      type: Date,
      default: Date.now,
    },
    endDate: {
      type: Date,
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      default: 0,
    },
    discountPercent: {
      type: Number,
      default: 0,
    },
    discountAmount: {
      type: Number,
      default: 0,
    },
    finalAmount: {
      type: Number,
      required: true,
      default: 0,
    },
    paymentMethod: {
      type: String,
      default: 'UPI / NetBanking',
    },
    paymentStatus: {
      type: String,
      enum: ['success', 'pending', 'failed', 'refunded', 'waived'],
      default: 'success',
    },
    transactionRef: {
      type: String,
      default: '',
    },
    invoiceNumber: {
      type: String,
      default: '',
    },
    assignedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    notes: {
      type: String,
      default: '',
    },
    timeline: [subscriptionTimelineSchema],
  },
  {
    timestamps: true,
  }
);

// Indexes for fast multi-filter querying
subscriptionSchema.index({ user: 1 });
subscriptionSchema.index({ status: 1 });
subscriptionSchema.index({ type: 1 });
subscriptionSchema.index({ endDate: 1 });
subscriptionSchema.index({ createdAt: -1 });

export const Subscription = mongoose.model('Subscription', subscriptionSchema);
export default Subscription;
