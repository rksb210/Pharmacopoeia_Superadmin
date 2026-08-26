import mongoose from 'mongoose';

const auditTimelineSchema = new mongoose.Schema(
  {
    action: {
      type: String,
      required: true,
    },
    performedBy: {
      type: String,
      required: true,
      default: 'System',
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
    note: {
      type: String,
      default: '',
    },
    previousStatus: {
      type: String,
      default: null,
    },
    newStatus: {
      type: String,
      default: null,
    },
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    orderNumber: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
      // e.g. "ORD-2026-981245"
    },
    invoiceNumber: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
      // e.g. "INV-2026-004512"
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Subscriber',
      required: true,
    },
    userName: {
      type: String,
      required: true,
      trim: true,
    },
    userEmail: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    userType: {
      type: String,
      enum: ['DOCTOR', 'PHARMACIST', 'STUDENT', 'NURSE', 'INDUSTRY', 'OTHERS'],
      default: 'DOCTOR',
    },
    plan: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Plan',
      default: null,
    },
    planName: {
      type: String,
      required: true,
      trim: true,
    },
    planCode: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
    },
    tier: {
      type: String,
      enum: ['INDIVIDUAL', 'INSTITUTIONAL', 'STUDENT', 'COMMERCIAL'],
      default: 'INDIVIDUAL',
    },
    pricing: {
      baseAmount: {
        type: Number,
        required: true,
        default: 0,
      },
      discountAmount: {
        type: Number,
        default: 0,
      },
      couponCode: {
        type: String,
        default: '',
      },
      taxRatePercent: {
        type: Number,
        default: 18, // 18% GST
      },
      taxAmount: {
        type: Number,
        default: 0,
      },
      totalAmount: {
        type: Number,
        required: true,
        default: 0,
      },
      currency: {
        type: String,
        default: 'INR',
      },
    },
    orderStatus: {
      type: String,
      enum: ['completed', 'processing', 'failed', 'cancelled', 'refunded'],
      default: 'processing',
    },
    payment: {
      status: {
        type: String,
        enum: ['paid', 'pending', 'failed', 'refunded', 'partially_refunded'],
        default: 'pending',
      },
      gateway: {
        type: String,
        enum: ['Razorpay', 'BillDesk', 'PayU', 'NEFT_RTGS', 'Direct_Treasury'],
        default: 'Razorpay',
      },
      gatewayTransactionId: {
        type: String,
        trim: true,
        default: '',
        // e.g. "pay_Nx81Ksl012A"
      },
      paymentMethod: {
        type: String,
        enum: ['UPI', 'Credit_Card', 'Debit_Card', 'NetBanking', 'NEFT_RTGS', 'Wallet'],
        default: 'UPI',
      },
      paidAt: {
        type: Date,
        default: null,
      },
      gatewaySignature: {
        type: String,
        default: '',
      },
      failureReason: {
        type: String,
        default: '',
      },
      failureCode: {
        type: String,
        default: '',
      },
    },
    refund: {
      isRefunded: {
        type: Boolean,
        default: false,
      },
      refundAmount: {
        type: Number,
        default: 0,
      },
      refundReason: {
        type: String,
        default: '',
      },
      refundTransactionId: {
        type: String,
        default: '',
      },
      refundedAt: {
        type: Date,
        default: null,
      },
      refundedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null,
      },
    },
    subscription: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Subscription',
      default: null,
    },
    clientIp: {
      type: String,
      default: '127.0.0.1',
    },
    auditTimeline: [auditTimelineSchema],
  },
  {
    timestamps: true,
  }
);

orderSchema.index({ orderNumber: 1 });
orderSchema.index({ invoiceNumber: 1 });
orderSchema.index({ orderStatus: 1 });
orderSchema.index({ 'payment.status': 1 });
orderSchema.index({ createdAt: -1 });

export const Order = mongoose.model('Order', orderSchema);
export default Order;
