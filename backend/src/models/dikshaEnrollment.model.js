import mongoose from 'mongoose';

const CertificateIssuedSchema = new mongoose.Schema(
  {
    issued: { type: Boolean, default: false },
    certificateNumber: { type: String, default: '' },
    issuedAt: { type: Date, default: null },
    expiresAt: { type: Date, default: null },
    downloadUrl: { type: String, default: '' },
  },
  { _id: false }
);

const DikshaEnrollmentSchema = new mongoose.Schema(
  {
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'DikshaCourse',
      required: true,
      index: true,
    },
    subscriber: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Subscriber',
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ['ENROLLED', 'IN_PROGRESS', 'COMPLETED', 'FAILED'],
      default: 'ENROLLED',
    },
    progressPercent: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    assessmentScore: {
      type: Number,
      default: null,
      min: 0,
      max: 100,
    },
    passed: {
      type: Boolean,
      default: false,
    },
    certificate: {
      type: CertificateIssuedSchema,
      default: () => ({}),
    },
    payment: {
      orderId: { type: String, default: '' },
      amountPaidINR: { type: Number, default: 0 },
      status: { type: String, default: 'FREE' },
    },
    enrolledAt: {
      type: Date,
      default: Date.now,
    },
    completedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

DikshaEnrollmentSchema.index({ course: 1, subscriber: 1 }, { unique: true });

export default mongoose.model('DikshaEnrollment', DikshaEnrollmentSchema);
