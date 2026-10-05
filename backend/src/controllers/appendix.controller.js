import appendixService from '../services/appendix.service.js';
import { auditService } from '../services/audit.service.js';

export const getAppendixStats = async (req, res, next) => {
  try {
    const stats = await appendixService.getStats();
    return res.status(200).json({ success: true, stats });
  } catch (error) {
    next(error);
  }
};

export const getAppendices = async (req, res, next) => {
  try {
    const { page, limit, search, status, sortBy, sortOrder } = req.query;
    const result = await appendixService.getAppendices({
      page,
      limit,
      search,
      status,
      sortBy,
      sortOrder,
    });
    return res.status(200).json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
};

export const getAppendixById = async (req, res, next) => {
  try {
    const appendix = await appendixService.getAppendixById(req.params.id);
    return res.status(200).json({ success: true, appendix });
  } catch (error) {
    next(error);
  }
};

export const createAppendix = async (req, res, next) => {
  try {
    const appendix = await appendixService.createAppendix(req.body, req.user);

    await auditService.log(req, {
      action: 'APPENDIX_CREATED',
      module: 'CONTENT',
      entity: 'Appendix',
      entityId: appendix._id,
      status: 'SUCCESS',
      details: `Created Appendix ${appendix.number}: "${appendix.title}"`,
    });

    return res.status(201).json({
      success: true,
      message: 'Appendix created successfully.',
      appendix,
    });
  } catch (error) {
    next(error);
  }
};

export const updateAppendix = async (req, res, next) => {
  try {
    const appendix = await appendixService.updateAppendix(req.params.id, req.body, req.user);

    await auditService.log(req, {
      action: 'APPENDIX_UPDATED',
      module: 'CONTENT',
      entity: 'Appendix',
      entityId: appendix._id,
      status: 'SUCCESS',
      details: `Updated Appendix ${appendix.number}: "${appendix.title}"`,
    });

    return res.status(200).json({
      success: true,
      message: 'Appendix updated successfully.',
      appendix,
    });
  } catch (error) {
    next(error);
  }
};

export const toggleAppendixStatus = async (req, res, next) => {
  try {
    const { isActive } = req.body;
    const appendix = await appendixService.toggleAppendixStatus(req.params.id, isActive);

    await auditService.log(req, {
      action: 'APPENDIX_STATUS_TOGGLED',
      module: 'CONTENT',
      entity: 'Appendix',
      entityId: appendix._id,
      status: 'SUCCESS',
      details: `Toggled status of Appendix ${appendix.number} to ${appendix.status}`,
    });

    return res.status(200).json({
      success: true,
      message: `Appendix status updated to ${appendix.status}.`,
      appendix,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteAppendix = async (req, res, next) => {
  try {
    const result = await appendixService.deleteAppendix(req.params.id);

    await auditService.log(req, {
      action: 'APPENDIX_DELETED',
      module: 'CONTENT',
      entity: 'Appendix',
      entityId: req.params.id,
      status: 'SUCCESS',
      details: result.message,
    });

    return res.status(200).json({ success: true, message: result.message });
  } catch (error) {
    next(error);
  }
};
