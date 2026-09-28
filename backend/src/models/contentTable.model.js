import mongoose from 'mongoose';

const contentTableSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Table title is required'],
      trim: true,
      maxlength: [250, 'Table title cannot exceed 250 characters'],
    },
    tableCode: {
      type: String,
      required: [true, 'Table code is required'],
      unique: true,
      uppercase: true,
      trim: true,
      maxlength: [60, 'Table code cannot exceed 60 characters'],
    },
    caption: {
      type: String,
      trim: true,
      default: '',
      maxlength: [500, 'Caption cannot exceed 500 characters'],
    },
    headers: {
      type: [String],
      default: ['Column 1', 'Column 2'],
    },
    rows: {
      type: [[String]],
      default: [['Data 1', 'Data 2']],
    },
    footnotes: {
      type: String,
      trim: true,
      default: '',
      maxlength: [2000, 'Footnotes cannot exceed 2000 characters'],
    },
    medicineId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Medicine',
      default: null,
      index: true,
    },
    chapterId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Chapter',
      default: null,
      index: true,
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

contentTableSchema.index({ tableCode: 1 });
contentTableSchema.index({ title: 1 });
contentTableSchema.index({ isActive: 1 });

export const ContentTable = mongoose.model('ContentTable', contentTableSchema);
export default ContentTable;
