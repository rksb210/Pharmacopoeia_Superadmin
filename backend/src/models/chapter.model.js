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

chapterSchema.index({ code: 1 });
chapterSchema.index({ title: 1 });
chapterSchema.index({ order: 1 });
chapterSchema.index({ isActive: 1 });

export const Chapter = mongoose.model('Chapter', chapterSchema);
export default Chapter;
