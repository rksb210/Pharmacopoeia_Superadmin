import marqueeAlertService from '../services/marqueeAlert.service.js';

export const getAlertsList = async (req, res, next) => {
  try {
    const { search, userType, alertType, status, page, limit, sortBy, sortOrder } = req.query;
    const result = await marqueeAlertService.getAlertsList({
      search,
      userType,
      alertType,
      status,
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

export const getActiveAlertsForUser = async (req, res, next) => {
  try {
    const userType = req.user?.userType || req.query.userType || 'ALL';
    const alerts = await marqueeAlertService.getActiveAlertsForUser(userType);
    return res.status(200).json({
      success: true,
      alerts,
    });
  } catch (error) {
    next(error);
  }
};

export const createAlert = async (req, res) => {
  try {
    const newAlert = await marqueeAlertService.createAlert(req.body, req.user);
    return res.status(201).json({
      success: true,
      message: 'Marquee broadcast alert created successfully.',
      alert: newAlert,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

export const updateAlert = async (req, res) => {
  try {
    const updated = await marqueeAlertService.updateAlert(req.params.id, req.body, req.user);
    return res.status(200).json({
      success: true,
      message: 'Marquee broadcast alert updated successfully.',
      alert: updated,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

export const toggleAlertStatus = async (req, res) => {
  try {
    const { isActive } = req.body;
    const alert = await marqueeAlertService.toggleAlertStatus(req.params.id, isActive);
    return res.status(200).json({
      success: true,
      message: `Marquee alert ${isActive ? 'activated' : 'deactivated'} successfully.`,
      alert,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

export const deleteAlert = async (req, res) => {
  try {
    const result = await marqueeAlertService.deleteAlert(req.params.id);
    return res.status(200).json({
      success: true,
      message: result.message,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};
