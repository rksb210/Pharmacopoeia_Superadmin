import mongoose from 'mongoose';

const subChapterSchema = new mongoose.Schema(
  {
    chapterId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Chapter',
      required: [true, 'Parent Chapter is required'],
      index: true,
    },
    subChapterNumber: {
      type: String,
      trim: true,
      default: '',
    },
    title: {
      type: String,
      required: [true, 'Sub-Chapter title is required'],
      trim: true,
      maxlength: [200, 'Sub-Chapter title cannot exceed 200 characters'],
    },
    code: {
      type: String,
      required: [true, 'Sub-Chapter code is required'],
      uppercase: true,
      trim: true,
      maxlength: [50, 'Sub-Chapter code cannot exceed 50 characters'],
    },
    description: {
      type: String,
      trim: true,
      default: '',
      maxlength: [2000, 'Description cannot exceed 2000 characters'],
    },
    pageRange: {
      start: { type: Number },
      end: { type: Number },
    },
    order: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ['draft', 'in_review', 'published', 'archived', 'ACTIVE', 'INACTIVE'],
      default: 'published',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    lastPublishedSnapshot: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
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

subChapterSchema.index({ chapterId: 1, code: 1 }, { unique: true });
subChapterSchema.index({ chapterId: 1, order: 1 });
subChapterSchema.index({ status: 1 });
subChapterSchema.index({ isActive: 1 });

export const SubChapter = mongoose.model('SubChapter', subChapterSchema);
export default SubChapter;
