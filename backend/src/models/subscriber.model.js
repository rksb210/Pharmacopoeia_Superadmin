import mongoose from 'mongoose';
import bcrypt from 'bcrypt';

const orderHistorySchema = new mongoose.Schema(
  {
    orderId: {
      type: String,
      required: true,
      trim: true,
    },
    planName: {
      type: String,
      required: true,
      trim: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    date: {
      type: Date,
      default: Date.now,
    },
    paymentStatus: {
      type: String,
      enum: ['Success', 'Pending', 'Failed', 'Refunded'],
      default: 'Success',
    },
  },
  { _id: false }
);

const subscriberSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        'Please provide a valid email address',
      ],
    },
    username: {
      type: String,
      required: [true, 'Username is required'],
      unique: true,
      lowercase: true,
      trim: true,
      minlength: [3, 'Username must be at least 3 characters'],
    },
    phoneNumber: {
      type: String,
      trim: true,
      default: '',
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters'],
      select: false,
    },
    // Configurable User Type
    userType: {
      type: String,
      required: [true, 'User type is required'],
      uppercase: true,
      trim: true,
      // e.g. "STUDENT", "DOCTOR", "PHARMACIST", "NURSE", "INDUSTRY", "OTHERS"
    },
    userTypeRef: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'UserType',
      default: null,
    },
    // Dynamic credentials object (APAAR ID, Reg No, State Council, GSTIN, PAN, Company, Designation)
    dynamicFields: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    // Subscription Lifecycle
    subscription: {
      status: {
        type: String,
        enum: ['none', 'trial', 'active', 'expired', 'complimentary'],
        default: 'none',
      },
      planName: {
        type: String,
        default: 'NFI 9th Edition Formulary - Universal Access Pass',
      },
      startDate: {
        type: Date,
        default: null,
      },
      endDate: {
        type: Date,
        default: null,
      },
      isTrial: {
        type: Boolean,
        default: false,
      },
      isComplimentary: {
        type: Boolean,
        default: false,
      },
      discountPercent: {
        type: Number,
        default: 0,
      },
      discountNotes: {
        type: String,
        default: '',
      },
    },
    orderHistory: [orderHistorySchema],
    isActive: {
      type: Boolean,
      default: true,
    },
    // Audit & Activity Tracking
    lastLogin: {
      type: Date,
      default: null,
    },
    lastLoginIP: {
      type: String,
      default: null,
    },
    lastLoginDevice: {
      type: String,
      default: null,
    },
    notes: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

// Hash password before save
subscriberSchema.pre('save', async function () {
  if (!this.isModified('password')) return;
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Compare password
subscriberSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Clean output
subscriberSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  delete obj.__v;
  return obj;
};

export const Subscriber = mongoose.model('Subscriber', subscriberSchema);
export default Subscriber;
