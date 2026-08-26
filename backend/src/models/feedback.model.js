import mongoose from 'mongoose';

const replySchema = new mongoose.Schema(
  {
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    senderName: {
      type: String,
      required: true,
      trim: true,
    },
    senderRole: {
      type: String,
      default: 'Admin',
    },
    message: {
      type: String,
      required: true,
      trim: true,
    },
    isInternalNote: {
      type: Boolean,
      default: false,
    },
    sentAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: true }
);

const timelineEventSchema = new mongoose.Schema(
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

const feedbackSchema = new mongoose.Schema(
  {
    ticketId: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    userName: {
      type: String,
      required: [true, 'User name is required'],
      trim: true,
    },
    userEmail: {
      type: String,
      required: [true, 'User email is required'],
      lowercase: true,
      trim: true,
    },
    userType: {
      type: String,
      enum: ['DOCTOR', 'PHARMACIST', 'STUDENT', 'NURSE', 'INDUSTRY', 'OTHERS', 'PUBLIC'],
      default: 'PUBLIC',
    },
    content: {
      section: {
        type: String,
        enum: [
          'Monographs',
          'Dosage Guidelines',
          'General Notices',
          'Appendices',
          'Formulary Search',
          'Portal UI',
          'Other',
        ],
        default: 'Monographs',
      },
      monographTitle: {
        type: String,
        trim: true,
        default: '',
      },
      edition: {
        type: String,
        default: '9th Edition 2022',
      },
      contentUrl: {
        type: String,
        default: '',
      },
      pageNumber: {
        type: String,
        default: '',
      },
    },
    category: {
      type: String,
      enum: [
        'MONOGRAPH_AMENDMENT',
        'DOSAGE_CORRECTION',
        'GENERAL_FEEDBACK',
        'BUG_REPORT',
        'SAFETY_QUERY',
        'CLINICAL_SUGGESTION',
      ],
      default: 'GENERAL_FEEDBACK',
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'urgent'],
      default: 'medium',
    },
    status: {
      type: String,
      enum: ['pending', 'in_review', 'completed', 'reopened'],
      default: 'pending',
    },
    subject: {
      type: String,
      required: [true, 'Feedback subject is required'],
      trim: true,
      maxlength: [200, 'Subject cannot exceed 200 characters'],
    },
    message: {
      type: String,
      required: [true, 'Feedback message body is required'],
      trim: true,
    },
    ipAddress: {
      type: String,
      default: '127.0.0.1',
    },
    userAgent: {
      type: String,
      default: '',
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    assignedAt: {
      type: Date,
      default: null,
    },
    resolvedAt: {
      type: Date,
      default: null,
    },
    replies: [replySchema],
    timeline: [timelineEventSchema],
  },
  {
    timestamps: true,
  }
);

feedbackSchema.index({ ticketId: 1 });
feedbackSchema.index({ status: 1 });
feedbackSchema.index({ category: 1 });
feedbackSchema.index({ priority: 1 });
feedbackSchema.index({ createdAt: -1 });

export const Feedback = mongoose.model('Feedback', feedbackSchema);
export default Feedback;
