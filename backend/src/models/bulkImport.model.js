import mongoose from 'mongoose';

const bulkRecordSchema = new mongoose.Schema(
  {
    rowNumber: {
      type: Number,
      required: true,
    },
    name: {
      type: String,
      trim: true,
      default: '',
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      default: '',
    },
    phoneNumber: {
      type: String,
      trim: true,
      default: '',
    },
    userType: {
      type: String,
      uppercase: true,
      trim: true,
      default: 'OTHERS',
    },
    dynamicFields: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    planCode: {
      type: String,
      uppercase: true,
      trim: true,
      default: '',
    },
    status: {
      type: String,
      enum: ['valid', 'invalid', 'imported', 'failed'],
      default: 'valid',
    },
    errors: [
      {
        type: String,
      },
    ],
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Subscriber',
      default: null,
    },
    subscriptionId: {
      type: String,
      default: '',
    },
  },
  { _id: false }
);

const consolidatedInvoiceSchema = new mongoose.Schema(
  {
    invoiceNumber: {
      type: String,
      required: true,
      // e.g. "C-INV-2026-00001"
    },
    institutionName: {
      type: String,
      required: true,
    },
    billingContact: {
      type: String,
      default: '',
    },
    billingAddress: {
      type: String,
      default: '',
    },
    gstin: {
      type: String,
      default: '',
    },
    totalSubscribers: {
      type: Number,
      required: true,
    },
    unitPriceINR: {
      type: Number,
      required: true,
    },
    subtotalINR: {
      type: Number,
      required: true,
    },
    discountINR: {
      type: Number,
      default: 0,
    },
    taxPercent: {
      type: Number,
      default: 18, // 18% GST standard
    },
    taxAmountINR: {
      type: Number,
      default: 0,
    },
    finalAmountINR: {
      type: Number,
      required: true,
    },
    paymentMethod: {
      type: String,
      default: 'Institutional Invoice / NEFT',
    },
    paymentStatus: {
      type: String,
      enum: ['paid', 'pending', 'waived'],
      default: 'paid',
    },
    generatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

const bulkImportSchema = new mongoose.Schema(
  {
    jobId: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      // e.g. "BLK-2026-0001"
    },
    fileName: {
      type: String,
      required: true,
    },
    institutionName: {
      type: String,
      required: true,
    },
    billingContact: {
      type: String,
      default: '',
    },
    planCode: {
      type: String,
      required: true,
    },
    planName: {
      type: String,
      default: '',
    },
    tier: {
      type: String,
      default: 'Institutional',
    },
    totalRows: {
      type: Number,
      default: 0,
    },
    validCount: {
      type: Number,
      default: 0,
    },
    invalidCount: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ['preview', 'processing', 'completed', 'failed', 'cancelled'],
      default: 'preview',
    },
    records: [bulkRecordSchema],
    consolidatedInvoice: consolidatedInvoiceSchema,
    importedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    startedAt: {
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

bulkImportSchema.index({ jobId: 1 });
bulkImportSchema.index({ status: 1 });
bulkImportSchema.index({ createdAt: -1 });

export const BulkImport = mongoose.model('BulkImport', bulkImportSchema);
export default BulkImport;
