import mongoose from 'mongoose';

const chapterSchema = new mongoose.Schema(
  {
    chapterNumber: {
      type: String,
      trim: true,
      default: '',
    },
    title: {
      type: String,
      required: [true, 'Chapter title is required'],
      trim: true,
      maxlength: [200, 'Chapter title cannot exceed 200 characters'],
    },
    code: {
      type: String,
      required: [true, 'Chapter code is required'],
      unique: true,
      uppercase: true,
      trim: true,
      maxlength: [50, 'Chapter code cannot exceed 50 characters'],
    },
    description: {
      type: String,
      trim: true,
      default: '',
      maxlength: [2000, 'Description cannot exceed 2000 characters'],
    },
    order: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ['draft', 'in_review', 'published', 'archived'],
      default: 'published',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    level: {
      type: Number,
      default: 1,
    },
    parentChapterId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Chapter',
      default: null,
    },
    number: {
      type: String,
      default: '',
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    submittedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    submittedAt: {
      type: Date,
      default: null,
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    reviewedAt: {
      type: Date,
      default: null,
    },
    reviewNotes: {
      type: String,
      default: '',
    },
    workflowHistory: [
      {
        action: { type: String, required: true },
        performedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
        performerName: { type: String, default: 'Admin' },
        roleName: { type: String, default: 'Admin' },
        previousStatus: { type: String },
        newStatus: { type: String },
        comments: { type: String, default: '' },
        timestamp: { type: Date, default: Date.now },
      },
    ],
  },
  {
    timestamps: true,
  }
);

chapterSchema.index({ title: 1 });
chapterSchema.index({ order: 1 });
chapterSchema.index({ status: 1 });
chapterSchema.index({ isActive: 1 });
chapterSchema.index({ level: 1 });

export const Chapter = mongoose.model('Chapter', chapterSchema);
export default Chapter;
