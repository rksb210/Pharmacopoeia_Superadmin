import mongoose from 'mongoose';

const configHistorySchema = new mongoose.Schema(
  {
    version: {
      type: Number,
      required: true,
    },
    updatedBy: {
      type: String,
      required: true,
      default: 'System',
    },
    updatedByEmail: {
      type: String,
      default: 'admin@nfi.gov.in',
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
    note: {
      type: String,
      default: 'Configuration updated',
    },
    changesSnapshot: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
    },
  },
  { _id: false }
);

const systemConfigSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      required: true,
      unique: true,
      default: 'NFI_SYSTEM_CONFIG',
    },
    // 1. Subscription & Validity Policies
    subscription: {
      fixedExpiryDate: {
        type: Date,
        default: new Date('2031-12-31T23:59:59.999Z'),
      },
      renewalWindowDays: {
        type: Number,
        default: 90,
      },
      gracePeriodDays: {
        type: Number,
        default: 15,
      },
      allowEarlyRenewals: {
        type: Boolean,
        default: true,
      },
    },
    // 2. Trial License Settings
    trial: {
      defaultTrialDays: {
        type: Number,
        default: 14,
      },
      maxTrialsPerUser: {
        type: Number,
        default: 1,
      },
      allowTrialExtension: {
        type: Boolean,
        default: false,
      },
    },
    // 3. User Registration & Credential Verification
    userRegistration: {
      allowPublicRegistration: {
        type: Boolean,
        default: true,
      },
      requireCredentialVerification: {
        type: Boolean,
        default: true,
      },
      allowedUserTypes: {
        type: [String],
        default: ['DOCTOR', 'PHARMACIST', 'STUDENT', 'NURSE', 'INDUSTRY', 'OTHERS'],
      },
      autoApproveStudents: {
        type: Boolean,
        default: false,
      },
    },
    // 4. Content & Search Indexing Rules
    contentAndSearch: {
      enablePublicFeedback: {
        type: Boolean,
        default: true,
      },
      enableMonographWatermarking: {
        type: Boolean,
        default: true,
      },
      enableFuzzySearch: {
        type: Boolean,
        default: true,
      },
      maxSearchResults: {
        type: Number,
        default: 50,
      },
      monographReviewStages: {
        type: Number,
        default: 2,
      },
    },
    // 5. Security & Session Governance
    securityAndSessions: {
      maxLoginAttempts: {
        type: Number,
        default: 5,
      },
      lockoutDurationMinutes: {
        type: Number,
        default: 15,
      },
      sessionTimeoutMinutes: {
        type: Number,
        default: 120,
      },
      requireMFAForAdmins: {
        type: Boolean,
        default: true,
      },
      passwordExpiryDays: {
        type: Number,
        default: 90,
      },
    },
    // 6. Notifications & Communication Channels
    notificationsAndComms: {
      enableInAppNotifications: {
        type: Boolean,
        default: true,
      },
      enableEmailDispatches: {
        type: Boolean,
        default: true,
      },
      enableSmsAlerts: {
        type: Boolean,
        default: false,
      },
      supportEmail: {
        type: String,
        default: 'support@nfi.gov.in',
      },
      supportHotline: {
        type: String,
        default: '+91-120-2783400',
      },
    },
    // 7. System Maintenance & Emergency Banners
    maintenanceAndGeneral: {
      maintenanceMode: {
        type: Boolean,
        default: false,
      },
      maintenanceMessage: {
        type: String,
        default: 'Formulary portal is undergoing scheduled maintenance. Please check back shortly.',
      },
      announcementBanner: {
        type: String,
        default: 'National Formulary of India (NFI) 9th Edition 2026 digital monographs are now active.',
      },
      announcementActive: {
        type: Boolean,
        default: true,
      },
    },
    version: {
      type: Number,
      default: 1,
    },
    history: [configHistorySchema],
  },
  {
    timestamps: true,
  }
);

export const SystemConfig = mongoose.model('SystemConfig', systemConfigSchema);
export default SystemConfig;
