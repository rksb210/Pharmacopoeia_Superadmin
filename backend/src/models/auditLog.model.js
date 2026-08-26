import mongoose from 'mongoose';

const auditLogSchema = new mongoose.Schema(
  {
    action: {
      type: String,
      required: true,
      trim: true,
      // e.g. "LOGIN_SUCCESS", "PLAN_PRICING_UPDATED", "ROLE_UPDATED", "CONTENT_PUBLISHED"
    },
    module: {
      type: String,
      required: true,
      enum: [
        'AUTH',
        'ADMINS',
        'ROLES',
        'SUBSCRIBERS',
        'SUBSCRIPTIONS',
        'PLANS',
        'COUPONS',
        'ORDERS',
        'NOTIFICATIONS',
        'FEEDBACK',
        'CONTENT',
        'SYSTEM',
      ],
      default: 'SYSTEM',
    },
    entity: {
      type: String,
      required: true,
      trim: true,
      // e.g. "User", "Role", "Plan", "Subscription", "Coupon", "Order", "Monograph"
    },
    entityId: {
      type: String,
      default: '',
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    userName: {
      type: String,
      default: 'System / Guest',
    },
    userEmail: {
      type: String,
      default: 'system@nfi.gov.in',
    },
    userRole: {
      type: String,
      default: 'System',
    },
    status: {
      type: String,
      enum: ['SUCCESS', 'FAILURE', 'WARNING'],
      default: 'SUCCESS',
    },
    ipAddress: {
      type: String,
      default: '127.0.0.1',
    },
    userAgent: {
      type: String,
      default: 'Unknown Browser',
    },
    requestMethod: {
      type: String,
      default: 'GET',
    },
    requestUrl: {
      type: String,
      default: '',
    },
    details: {
      type: String,
      default: '',
    },
    oldValues: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    newValues: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    errorMessage: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

auditLogSchema.index({ action: 1 });
auditLogSchema.index({ module: 1 });
auditLogSchema.index({ status: 1 });
auditLogSchema.index({ userEmail: 1 });
auditLogSchema.index({ createdAt: -1 });

export const AuditLog = mongoose.model('AuditLog', auditLogSchema);
export default AuditLog;
