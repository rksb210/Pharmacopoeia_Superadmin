import mongoose from 'mongoose';
import crypto from 'crypto';

const signupSessionSchema = new mongoose.Schema(
  {
    sessionToken: {
      type: String,
      required: true,
      unique: true,
      index: true,
      default: () => crypto.randomBytes(32).toString('hex'),
    },
    userType: {
      type: String,
      required: [true, 'User type is required'],
      uppercase: true,
      trim: true,
    },
    dynamicFields: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    verificationStatus: {
      type: String,
      enum: ['UNVERIFIED', 'PENDING', 'VERIFIED', 'REJECTED'],
      default: 'UNVERIFIED',
      uppercase: true,
      trim: true,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    verificationDetails: {
      authoritativeSource: { type: String, default: null },
      registrationNo: { type: String, default: null },
      council: { type: String, default: null },
      verifiedAt: { type: Date, default: null },
      verifiedBy: { type: String, default: null },
      remarks: { type: String, default: null },
    },
    ipAddress: {
      type: String,
      default: null,
    },
    isUsed: {
      type: Boolean,
      default: false,
      index: true,
    },
    usedAt: {
      type: Date,
      default: null,
    },
    expiresAt: {
      type: Date,
      required: true,
      // Default expiration: 30 minutes from creation
      default: () => new Date(Date.now() + 30 * 60 * 1000),
    },
  },
  {
    timestamps: true,
  }
);

// MongoDB TTL index: automatically purge expired sessions
signupSessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const SignupSession = mongoose.model('SignupSession', signupSessionSchema);
export default SignupSession;
