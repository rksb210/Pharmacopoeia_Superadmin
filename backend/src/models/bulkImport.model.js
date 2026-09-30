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
    phone: {
      type: String,
      trim: true,
      default: '',
    },
    phoneNumber: {
      type: String,
      trim: true,
      default: '',
    },
    address: {
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
    roleOrCategory: {
      type: String,
      trim: true,
      default: '',
    },
    rollOrEmployeeId: {
      type: String,
      trim: true,
      default: '',
    },
    department: {
      type: String,
      trim: true,
      default: '',
    },
    status: {
      type: String,
      enum: ['valid', 'invalid', 'imported', 'failed', 'VALID', 'INVALID', 'ENROLLED', 'FAILED'],
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
    createdSubscriberId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Subscriber',
      default: null,
    },
    subscriptionId: {
      type: String,
      default: '',
    },
    credentialsSent: {
      type: Boolean,
      default: true,
    },
    remarks: {
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
    pan: {
      type: String,
      default: '',
    },
    state: {
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
    slabDiscountPercent: {
      type: Number,
      default: 0,
    },
    slabDiscountINR: {
      type: Number,
      default: 0,
    },
    couponCode: {
      type: String,
      default: '',
    },
    couponDiscountINR: {
      type: Number,
      default: 0,
    },
    discountINR: {
      type: Number,
      default: 0,
    },
    taxPercent: {
      type: Number,
      default: 0,
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
      enum: ['paid', 'pending', 'waived', 'PAID', 'PENDING', 'WAIVED'],
      default: 'paid',
    },
    paymentReference: {
      type: String,
      trim: true,
      default: '',
    },
    transactionId: {
      type: String,
      trim: true,
      default: '',
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
      trim: true,
      uppercase: true,
      default: '',
    },
    batchReference: {
      type: String,
      trim: true,
      index: true,
      default: '',
    },
    fileName: {
      type: String,
      default: 'Direct_Manual_Roster.xlsx',
    },
    uploadedFileName: {
      type: String,
      default: '',
    },
    institutionName: {
      type: String,
      required: true,
    },
    institutionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Subscriber',
      default: null,
      index: true,
    },
    userType: {
      type: String,
      uppercase: true,
      trim: true,
      default: 'UNIVERSITIES_COLLEGES',
    },
    billingContact: {
      type: String,
      default: '',
    },
    coordinator: {
      name: { type: String, default: '' },
      email: { type: String, default: '' },
      phone: { type: String, default: '' },
      address: { type: String, default: '' },
      gstin: { type: String, default: '' },
      pan: { type: String, default: '' },
      state: { type: String, default: '' },
    },
    planCode: {
      type: String,
      default: '',
    },
    planName: {
      type: String,
      default: '',
    },
    plan: {
      planId: { type: String, default: '' },
      name: { type: String, default: '' },
      pricePerSeat: { type: Number, default: 0 },
      validityMonths: { type: Number, default: 12 },
      validUntil: { type: Date, default: null },
    },
    tier: {
      type: String,
      default: 'Institutional',
    },
    couponCode: {
      type: String,
      default: '',
    },
    paymentMethod: {
      type: String,
      default: 'Institutional Invoice / NEFT',
    },
    paymentStatus: {
      type: String,
      default: 'paid',
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
    validRows: {
      type: Number,
      default: 0,
    },
    failedRows: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: [
        'preview',
        'processing',
        'completed',
        'failed',
        'cancelled',
        'PENDING',
        'PROCESSING',
        'COMPLETED',
        'PARTIAL',
        'FAILED',
      ],
      default: 'preview',
    },
    records: [bulkRecordSchema],
    consolidatedInvoice: consolidatedInvoiceSchema,
    invoice: {
      invoiceNumber: { type: String, default: '' },
      invoiceDate: { type: Date, default: null },
      subtotal: { type: Number, default: 0 },
      discountAmount: { type: Number, default: 0 },
      taxRate: { type: Number, default: 0 },
      taxAmount: { type: Number, default: 0 },
      totalAmount: { type: Number, default: 0 },
      paymentStatus: { type: String, default: 'PAID' },
      paymentMethod: { type: String, default: 'Institutional Invoice / NEFT' },
      paymentReference: { type: String, default: '' },
      transactionId: { type: String, default: '' },
      status: { type: String, default: 'PAID' },
    },
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
    collection: 'bulk_import_jobs',
  }
);

bulkImportSchema.index({ jobId: 1 });
bulkImportSchema.index({ status: 1 });
bulkImportSchema.index({ createdAt: -1 });

export const BulkImport = mongoose.model('BulkImport', bulkImportSchema);
export default BulkImport;
