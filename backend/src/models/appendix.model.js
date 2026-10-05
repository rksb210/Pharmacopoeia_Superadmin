import mongoose from 'mongoose';

const structuredSectionSchema = new mongoose.Schema(
  {
    sectionId: { type: String, trim: true },
    heading: { type: String, trim: true },
    type: { type: String, default: 'heading' },
    content: { type: String, default: '' },
    order: { type: Number, default: 0 },
  },
  { _id: true }
);

const subSectionSchema = new mongoose.Schema(
  {
    title: { type: String, trim: true },
    bookPage: { type: Number },
  },
  { _id: true }
);

const structuredTableSchema = new mongoose.Schema(
  {
    tableId: { type: String, trim: true },
    label: { type: String, trim: true },
    title: { type: String, trim: true },
    headers: [{ type: String }],
    rows: [[{ type: mongoose.Schema.Types.Mixed }]],
    rowCount: { type: Number, default: 0 },
    pageNumber: { type: Number },
  },
  { _id: true }
);

const appendixSchema = new mongoose.Schema(
  {
    documentId: { type: String, trim: true },
    documentVersion: { type: String, default: 'v1' },
    number: {
      type: String,
      required: [true, 'Appendix number is required'],
      trim: true,
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Appendix title is required'],
      trim: true,
      index: true,
    },
    slug: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      index: true,
    },
    order: {
      type: Number,
      default: 1,
      index: true,
    },
    pageRange: {
      start: { type: Number },
      end: { type: Number },
    },
    bookPageRange: {
      start: { type: Number },
      end: { type: Number },
    },
    sourceText: {
      type: String,
      default: '',
    },
    subSections: [subSectionSchema],
    pages: [{ type: mongoose.Schema.Types.Mixed }],
    tables: [{ type: mongoose.Schema.Types.Mixed }],
    structuredTables: [structuredTableSchema],
    structuredSections: [structuredSectionSchema],
    figures: [{ type: mongoose.Schema.Types.Mixed }],
    medicineCount: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ['ACTIVE', 'INACTIVE', 'DRAFT'],
      default: 'ACTIVE',
      uppercase: true,
      index: true,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    submittedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AdminUser',
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AdminUser',
    },
  },
  {
    timestamps: true,
    collection: 'appendixes',
  }
);

// Pre-save hook: auto-sync isActive with status
appendixSchema.pre('save', function () {
  if (this.isModified('status')) {
    this.isActive = this.status === 'ACTIVE';
  } else if (this.isModified('isActive')) {
    this.status = this.isActive ? 'ACTIVE' : 'INACTIVE';
  }
});

export const Appendix = mongoose.model('Appendix', appendixSchema);
export default Appendix;
