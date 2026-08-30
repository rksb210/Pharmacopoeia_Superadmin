import mongoose from 'mongoose';

const marqueeAlertSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Alert title or tag is required'],
      trim: true,
      maxlength: [100, 'Title cannot exceed 100 characters'],
      // e.g. "STUDENT EXAM NOTICE", "CLINICAL ADVISORY", "URGENT UPDATE"
    },
    message: {
      type: String,
      required: [true, 'Marquee message text is required'],
      trim: true,
    },
    targetUserTypes: [
      {
        type: String,
        uppercase: true,
        trim: true,
        // e.g. 'ALL', 'STUDENT', 'DOCTOR', 'PHARMACIST', 'NURSE', 'INDUSTRY', 'OTHERS'
      },
    ],
    alertType: {
      type: String,
      enum: ['info', 'warning', 'critical', 'success'],
      default: 'info',
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'urgent'],
      default: 'medium',
    },
    speed: {
      type: String,
      enum: ['slow', 'normal', 'fast'],
      default: 'normal',
    },
    linkUrl: {
      type: String,
      trim: true,
      default: '',
    },
    linkLabel: {
      type: String,
      trim: true,
      default: '',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    startDate: {
      type: Date,
      default: Date.now,
    },
    endDate: {
      type: Date,
      default: null,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    authorName: {
      type: String,
      default: 'Superadmin',
    },
  },
  {
    timestamps: true,
  }
);

marqueeAlertSchema.index({ isActive: 1 });
marqueeAlertSchema.index({ targetUserTypes: 1 });
marqueeAlertSchema.index({ createdAt: -1 });

export const MarqueeAlert = mongoose.model('MarqueeAlert', marqueeAlertSchema);
export default MarqueeAlert;
