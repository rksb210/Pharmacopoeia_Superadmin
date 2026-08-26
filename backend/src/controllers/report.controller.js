import reportService from '../services/report.service.js';

export const getOverview = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;
    const overview = await reportService.getExecutiveOverview({ startDate, endDate });
    return res.status(200).json({
      success: true,
      overview,
    });
  } catch (error) {
    next(error);
  }
};

export const getUserReports = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;
    const data = await reportService.getUserAnalytics({ startDate, endDate });
    return res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    next(error);
  }
};

export const getSubscriptionReports = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;
    const data = await reportService.getSubscriptionAnalytics({ startDate, endDate });
    return res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    next(error);
  }
};

export const getContentReports = async (req, res, next) => {
  try {
    const data = await reportService.getContentAnalytics();
    return res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    next(error);
  }
};

export const getWorkflowReports = async (req, res, next) => {
  try {
    const data = await reportService.getWorkflowAnalytics();
    return res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    next(error);
  }
};

export const getCommerceReports = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;
    const data = await reportService.getCommerceAnalytics({ startDate, endDate });
    return res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    next(error);
  }
};

export const getCRMReports = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;
    const data = await reportService.getCRMAnalytics({ startDate, endDate });
    return res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    next(error);
  }
};

export const exportReport = async (req, res, next) => {
  try {
    const { domain } = req.params;
    const { startDate, endDate } = req.query;

    const buffer = await reportService.exportReportExcel(domain, { startDate, endDate });

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="NFI_${domain.toUpperCase()}_Report_${new Date().toISOString().split('T')[0]}.xlsx"`
    );
    return res.send(buffer);
  } catch (error) {
    next(error);
  }
};
