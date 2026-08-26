import SystemConfig from '../models/systemConfig.model.js';
import auditService from './audit.service.js';

export const configService = {
  /**
   * Get Full Administrative Configuration (with Auto-Seeding)
   */
  getFullConfig: async () => {
    let config = await SystemConfig.findOne({ key: 'NFI_SYSTEM_CONFIG' });
    if (!config) {
      config = new SystemConfig({
        key: 'NFI_SYSTEM_CONFIG',
        version: 1,
        history: [
          {
            version: 1,
            updatedBy: 'System Initializer',
            updatedByEmail: 'system@nfi.gov.in',
            updatedAt: new Date(),
            note: 'Initial default BRD configuration provisioned',
            changesSnapshot: {
              subscription: { fixedExpiryDate: new Date('2031-12-31T23:59:59.999Z'), renewalWindowDays: 90 },
              trial: { defaultTrialDays: 14, maxTrialsPerUser: 1 },
              userRegistration: { allowPublicRegistration: true, requireCredentialVerification: true },
            },
          },
        ],
      });
      await config.save();
    }
    return config;
  },

  /**
   * Get Safe Public Configuration (for unauthenticated client portals)
   */
  getPublicConfig: async () => {
    const config = await configService.getFullConfig();
    return {
      fixedExpiryDate: config.subscription?.fixedExpiryDate,
      allowPublicRegistration: config.userRegistration?.allowPublicRegistration,
      allowedUserTypes: config.userRegistration?.allowedUserTypes,
      defaultTrialDays: config.trial?.defaultTrialDays,
      enablePublicFeedback: config.contentAndSearch?.enablePublicFeedback,
      maintenanceMode: config.maintenanceAndGeneral?.maintenanceMode,
      maintenanceMessage: config.maintenanceAndGeneral?.maintenanceMessage,
      announcementBanner: config.maintenanceAndGeneral?.announcementBanner,
      announcementActive: config.maintenanceAndGeneral?.announcementActive,
      supportEmail: config.notificationsAndComms?.supportEmail,
      supportHotline: config.notificationsAndComms?.supportHotline,
    };
  },

  /**
   * Update Application Configuration with Versioning and Audit Logging
   */
  updateConfig: async (updates, adminUser, req) => {
    const config = await configService.getFullConfig();

    const oldValues = {
      subscription: { ...config.subscription.toObject() },
      trial: { ...config.trial.toObject() },
      userRegistration: { ...config.userRegistration.toObject() },
      contentAndSearch: { ...config.contentAndSearch.toObject() },
      securityAndSessions: { ...config.securityAndSessions.toObject() },
      notificationsAndComms: { ...config.notificationsAndComms.toObject() },
      maintenanceAndGeneral: { ...config.maintenanceAndGeneral.toObject() },
    };

    // Save previous snapshot into history
    config.history.unshift({
      version: config.version,
      updatedBy: adminUser?.name || 'Administrator',
      updatedByEmail: adminUser?.email || 'admin@nfi.gov.in',
      updatedAt: new Date(),
      note: updates.note || 'Administrative settings adjustment',
      changesSnapshot: oldValues,
    });

    // Apply updates across categories
    if (updates.subscription) Object.assign(config.subscription, updates.subscription);
    if (updates.trial) Object.assign(config.trial, updates.trial);
    if (updates.userRegistration) Object.assign(config.userRegistration, updates.userRegistration);
    if (updates.contentAndSearch) Object.assign(config.contentAndSearch, updates.contentAndSearch);
    if (updates.securityAndSessions) Object.assign(config.securityAndSessions, updates.securityAndSessions);
    if (updates.notificationsAndComms) Object.assign(config.notificationsAndComms, updates.notificationsAndComms);
    if (updates.maintenanceAndGeneral) Object.assign(config.maintenanceAndGeneral, updates.maintenanceAndGeneral);

    config.version += 1;
    await config.save();

    const newValues = {
      subscription: config.subscription,
      trial: config.trial,
      userRegistration: config.userRegistration,
      contentAndSearch: config.contentAndSearch,
      securityAndSessions: config.securityAndSessions,
      notificationsAndComms: config.notificationsAndComms,
      maintenanceAndGeneral: config.maintenanceAndGeneral,
    };

    // Log to centralized audit trail
    await auditService.log(req, {
      action: 'SYSTEM_CONFIG_UPDATED',
      module: 'SYSTEM',
      entity: 'SystemConfig',
      entityId: `v${config.version}`,
      user: adminUser,
      status: 'SUCCESS',
      details: `Application configuration updated to version v${config.version}. Note: ${updates.note || 'N/A'}`,
      oldValues,
      newValues,
    });

    return config;
  },

  /**
   * Restore a historical configuration version
   */
  restoreConfigVersion: async (versionNumber, adminUser, req) => {
    const config = await configService.getFullConfig();
    const historyEntry = config.history.find((h) => h.version === Number(versionNumber));

    if (!historyEntry || !historyEntry.changesSnapshot) {
      throw new Error(`Configuration snapshot for version v${versionNumber} not found.`);
    }

    const snapshot = historyEntry.changesSnapshot;
    return await configService.updateConfig(
      {
        ...snapshot,
        note: `Restored to historical state from version v${versionNumber}`,
      },
      adminUser,
      req
    );
  },
};

export default configService;
