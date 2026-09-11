import institutionalSubscriptionService from '../services/institutionalSubscription.service.js';
import { auditService } from '../services/audit.service.js';

export const getInstitutionalStats = async (req, res, next) => {
  try {
    const stats = await institutionalSubscriptionService.getInstitutionalStats();
    return res.status(200).json({
      success: true,
      stats,
    });
  } catch (error) {
    next(error);
  }
};

export const getBatchesLedger = async (req, res, next) => {
  try {
    const { page, limit, search, stakeholderType, status, dateFrom, dateTo } = req.query;
    const result = await institutionalSubscriptionService.getBatchesLedger({
      page,
      limit,
      search,
      stakeholderType,
      status,
      dateFrom,
      dateTo,
    });

    return res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error) {
    next(error);
  }
};

export const getBatchRoster = async (req, res, next) => {
  try {
    const result = await institutionalSubscriptionService.getBatchRoster(req.params.id);
    return res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error) {
    next(error);
  }
};

export const exportBatchRosterCSV = async (req, res, next) => {
  try {
    const csvBuffer = await institutionalSubscriptionService.exportBatchRosterCSV(req.params.id);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="NFI_Batch_Roster_${req.params.id}.csv"`
    );
    return res.send(csvBuffer);
  } catch (error) {
    next(error);
  }
};

export const getGlobalEnrolledMembers = async (req, res, next) => {
  try {
    const { page, limit, search, stakeholderType, status } = req.query;
    const result = await institutionalSubscriptionService.getGlobalEnrolledMembers({
      page,
      limit,
      search,
      stakeholderType,
      status,
    });

    return res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error) {
    next(error);
  }
};

export const toggleMemberSeatStatus = async (req, res, next) => {
  try {
    const result = await institutionalSubscriptionService.toggleMemberSeatStatus(req.params.id);

    await auditService.log(req, {
      action: 'SUBSCRIBER_STATUS_TOGGLED',
      module: 'USERS',
      entity: 'Subscriber',
      entityId: result._id,
      status: 'SUCCESS',
      details: `Admin changed subscriber seat status for "${result.name}" (${result.email}) to ${result.isActive ? 'ACTIVE' : 'INACTIVE'}.`,
      newValues: { isActive: result.isActive },
    });

    return res.status(200).json({
      success: true,
      message: `Subscriber seat is now ${result.isActive ? 'Active' : 'Inactive'}.`,
      member: result,
    });
  } catch (error) {
    next(error);
  }
};

export const getInstitutionMaster = async (req, res, next) => {
  try {
    const { search, stakeholderType } = req.query;
    const institutions = await institutionalSubscriptionService.getInstitutionMaster({
      search,
      stakeholderType,
    });

    return res.status(200).json({
      success: true,
      institutions,
    });
  } catch (error) {
    next(error);
  }
};
