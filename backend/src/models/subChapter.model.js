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
    order: {
      type: Number,
      default: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
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

subChapterSchema.index({ chapterId: 1, code: 1 }, { unique: true });
subChapterSchema.index({ chapterId: 1, order: 1 });
subChapterSchema.index({ isActive: 1 });

export const SubChapter = mongoose.model('SubChapter', subChapterSchema);
export default SubChapter;
