import mongoose from 'mongoose';

const VideoItemSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    youtubeUrl: { type: String, required: true, trim: true },
    durationMinutes: { type: Number, default: 0, min: 0 },
    isHelpVideo: { type: Boolean, default: false },
    order: { type: Number, default: 1 },
  },
  { _id: true }
);

const MaterialItemSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    fileUrl: { type: String, required: true, trim: true },
    type: { type: String, default: 'PDF' },
  },
  { _id: true }
);

const QuestionSchema = new mongoose.Schema(
  {
    questionText: { type: String, required: true, trim: true },
    options: [{ type: String, required: true, trim: true }],
    correctOptionIndex: { type: Number, required: true, min: 0 },
    explanation: { type: String, default: '' },
    points: { type: Number, default: 1, min: 1 },
  },
  { _id: true }
);

const AssessmentSchema = new mongoose.Schema(
  {
    enabled: { type: Boolean, default: true },
    title: { type: String, default: 'End-of-Course Assessment' },
    timeLimitMinutes: { type: Number, default: 15, min: 1 },
    passingScorePercent: { type: Number, default: 70, min: 0, max: 100 },
    questions: [QuestionSchema],
  },
  { _id: false }
);

const CertificateSchema = new mongoose.Schema(
  {
    enabled: { type: Boolean, default: true },
    title: { type: String, default: 'Certificate of Competency in National Formulary of India (NFI)' },
    validityMonths: { type: Number, default: 24, min: 1 },
    signatoryName: { type: String, default: 'Secretary-cum-Scientific Director' },
    signatoryTitle: { type: String, default: 'Indian Pharmacopoeia Commission' },
  },
  { _id: false }
);

const PricingSchema = new mongoose.Schema(
  {
    isPaid: { type: Boolean, default: false },
    priceINR: { type: Number, default: 0, min: 0 },
    discountPriceINR: { type: Number, default: 0, min: 0 },
  },
  { _id: false }
);

const StatsSchema = new mongoose.Schema(
  {
    enrolledCount: { type: Number, default: 0, min: 0 },
    completedCount: { type: Number, default: 0, min: 0 },
    totalRevenueINR: { type: Number, default: 0, min: 0 },
    avgScorePercent: { type: Number, default: 0, min: 0 },
  },
  { _id: false }
);

const DikshaCourseSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      default: '',
      trim: true,
    },
    thumbnailUrl: {
      type: String,
      default: '',
      trim: true,
    },
    category: {
      type: String,
      default: 'NFI_ORIENTATION',
      enum: [
        'NFI_ORIENTATION',
        'PHARMACOVIGILANCE',
        'CLINICAL_PRACTICE',
        'MEDICATION_SAFETY',
        'DRUG_REGULATORY',
        'PATIENT_COUNSELING',
        'OTHER',
      ],
    },
    targetAudience: {
      type: [String],
      default: ['DOCTOR', 'PHARMACIST', 'STUDENT', 'NURSE', 'INDUSTRY', 'OTHERS'],
    },
    status: {
      type: String,
      enum: ['DRAFT', 'PUBLISHED', 'ARCHIVED'],
      default: 'DRAFT',
    },
    pricing: {
      type: PricingSchema,
      default: () => ({}),
    },
    videos: [VideoItemSchema],
    materials: [MaterialItemSchema],
    assessment: {
      type: AssessmentSchema,
      default: () => ({}),
    },
    certificate: {
      type: CertificateSchema,
      default: () => ({}),
    },
    stats: {
      type: StatsSchema,
      default: () => ({}),
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

DikshaCourseSchema.index({ code: 1, status: 1 });
DikshaCourseSchema.index({ title: 'text', description: 'text' });

export default mongoose.model('DikshaCourse', DikshaCourseSchema);
