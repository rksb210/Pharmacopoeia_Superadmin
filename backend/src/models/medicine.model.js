import mongoose from 'mongoose';

const sectionSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Section title is required'],
      trim: true,
      maxlength: [200, 'Section title cannot exceed 200 characters'],
    },
    content: {
      type: String,
      default: '',
    },
    order: {
      type: Number,
      default: 0,
    },
    // Optional reference to a reusable ContentTable
    tableId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ContentTable',
      default: null,
    },
    // Optional embedded custom table specific to this section
    customTable: {
      headers: {
        type: [String],
        default: [],
      },
      rows: {
        type: [[String]],
        default: [],
      },
      caption: {
        type: String,
        default: '',
      },
      footnotes: {
        type: String,
        default: '',
      },
    },
  },
  { _id: true }
);

const medicineSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Medicine generic name is required'],
      trim: true,
      maxlength: [200, 'Medicine name cannot exceed 200 characters'],
    },
    brandNames: {
      type: [String],
      default: [],
    },
    chapterId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Chapter',
      required: [true, 'Chapter is required'],
      index: true,
    },
    subChapterId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'SubChapter',
      default: null,
      index: true,
    },
    therapeuticClass: {
      type: String,
      trim: true,
      default: '',
    },
    dosageForm: {
      type: String,
      trim: true,
      default: '',
    },
    strength: {
      type: String,
      trim: true,
      default: '',
    },
    atcCode: {
      type: String,
      trim: true,
      uppercase: true,
      default: '',
    },
    schedule: {
      type: String,
      trim: true,
      default: 'Schedule H',
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
    sections: [sectionSchema],
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

medicineSchema.index({ name: 1 });
medicineSchema.index({ chapterId: 1 });
medicineSchema.index({ subChapterId: 1 });
medicineSchema.index({ status: 1 });
medicineSchema.index({ isActive: 1 });

export const Medicine = mongoose.model('Medicine', medicineSchema);
export default Medicine;
