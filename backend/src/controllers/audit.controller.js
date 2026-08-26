import auditService from '../services/audit.service.js';

export const getAuditStats = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;
    const stats = await auditService.getAuditStats({ startDate, endDate });
    return res.status(200).json({
      success: true,
      stats,
    });
  } catch (error) {
    next(error);
  }
};

export const getAuditLogsList = async (req, res, next) => {
  try {
    const {
      search,
      module,
      action,
      status,
      startDate,
      endDate,
      page,
      limit,
      sortBy,
      sortOrder,
    } = req.query;

    const result = await auditService.getAuditLogsList({
      search,
      module,
      action,
      status,
      startDate,
      endDate,
      page,
      limit,
      sortBy,
      sortOrder,
    });

    return res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error) {
    next(error);
  }
};

export const getAuditLogById = async (req, res, next) => {
  try {
    const log = await auditService.getAuditLogById(req.params.id);
    return res.status(200).json({
      success: true,
      log,
    });
  } catch (error) {
    next(error);
  }
};

export const exportAuditLogs = async (req, res, next) => {
  try {
    const { search, module, action, status, startDate, endDate } = req.query;

    const excelBuffer = await auditService.exportAuditExcel({
      search,
      module,
      action,
      status,
      startDate,
      endDate,
    });

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="NFI_Security_Audit_Trail_${new Date().toISOString().split('T')[0]}.xlsx"`
    );
    return res.send(excelBuffer);
  } catch (error) {
    next(error);
  }
};
