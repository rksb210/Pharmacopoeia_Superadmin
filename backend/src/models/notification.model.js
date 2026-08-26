import mongoose from 'mongoose';

const deliveryLogSchema = new mongoose.Schema(
  {
    recipient: {
      type: String,
      required: true,
      trim: true,
    },
    channel: {
      type: String,
      enum: ['in_app', 'email', 'sms', 'broadcast_banner'],
      required: true,
    },
    status: {
      type: String,
      enum: ['delivered', 'sent', 'opened', 'failed', 'queued'],
      default: 'sent',
    },
    sentAt: {
      type: Date,
      default: Date.now,
    },
    error: {
      type: String,
      default: '',
    },
  },
  { _id: false }
);

const readReceiptSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    readAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

const notificationSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Notification title is required'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    message: {
      type: String,
      required: [true, 'Notification message body is required'],
      trim: true,
    },
    category: {
      type: String,
      enum: [
        'NEW_CONTENT',
        'SUBSCRIPTION_EXPIRY',
        'EVENTS',
        'WEBINARS',
        'TRAINING',
        'ANNOUNCEMENT',
        'WORKFLOW',
        'GENERAL',
      ],
      default: 'ANNOUNCEMENT',
    },
    channels: [
      {
        type: String,
        enum: ['in_app', 'email', 'sms', 'broadcast_banner'],
        default: 'in_app',
      },
    ],
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'urgent'],
      default: 'medium',
    },
    targetAudience: {
      type: {
        type: String,
        enum: ['ALL', 'ROLES', 'USER_TYPES', 'SPECIFIC_USERS', 'SPECIFIC_EMAILS'],
        default: 'ALL',
      },
      roles: [
        {
          type: String,
          lowercase: true,
          trim: true,
        },
      ],
      userTypes: [
        {
          type: String,
          uppercase: true,
          trim: true,
        },
      ],
      specificUsers: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
      ],
      specificEmails: [
        {
          type: String,
          lowercase: true,
          trim: true,
        },
      ],
    },
    actionUrl: {
      type: String,
      trim: true,
      default: '',
      // e.g. "/admin/subscriptions", "/monographs/9th-edition"
    },
    actionLabel: {
      type: String,
      trim: true,
      default: 'View Details',
    },
    status: {
      type: String,
      enum: ['draft', 'scheduled', 'sending', 'sent', 'failed', 'cancelled'],
      default: 'draft',
    },
    scheduledAt: {
      type: Date,
      default: null,
    },
    sentAt: {
      type: Date,
      default: null,
    },
    startDate: {
      type: Date,
      default: Date.now,
    },
    endDate: {
      type: Date,
      default: null, // Expiry date for banner / in-app
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    deliveryStats: {
      targetCount: {
        type: Number,
        default: 0,
      },
      deliveredCount: {
        type: Number,
        default: 0,
      },
      readCount: {
        type: Number,
        default: 0,
      },
      failedCount: {
        type: Number,
        default: 0,
      },
      channelsSummary: {
        in_app: { sent: { type: Number, default: 0 }, read: { type: Number, default: 0 } },
        email: { sent: { type: Number, default: 0 }, opened: { type: Number, default: 0 } },
        sms: { sent: { type: Number, default: 0 }, delivered: { type: Number, default: 0 } },
        broadcast_banner: { views: { type: Number, default: 0 } },
      },
    },
    deliveryLogs: [deliveryLogSchema],
    readBy: [readReceiptSchema],
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

notificationSchema.index({ status: 1 });
notificationSchema.index({ category: 1 });
notificationSchema.index({ priority: 1 });
notificationSchema.index({ createdAt: -1 });

export const Notification = mongoose.model('Notification', notificationSchema);
export default Notification;
