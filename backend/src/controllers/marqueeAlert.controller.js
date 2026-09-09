import marqueeAlertService from '../services/marqueeAlert.service.js';
import { auditService } from '../services/audit.service.js';

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

    await auditService.log(req, {
      action: 'CRM_ALERT_CREATED',
      module: 'CRM',
      entity: 'MarqueeAlert',
      entityId: newAlert._id,
      status: 'SUCCESS',
      details: `Created new broadcast marquee alert: "${newAlert.title}" (${newAlert.alertType || 'INFO'}). Target: ${newAlert.targetAudience || 'ALL'}.`,
      newValues: {
        title: newAlert.title,
        alertType: newAlert.alertType,
        targetAudience: newAlert.targetAudience,
        isActive: newAlert.isActive,
      },
    });

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

    await auditService.log(req, {
      action: 'CRM_ALERT_UPDATED',
      module: 'CRM',
      entity: 'MarqueeAlert',
      entityId: updated._id,
      status: 'SUCCESS',
      details: `Updated broadcast marquee alert: "${updated.title}".`,
      newValues: {
        title: updated.title,
        alertType: updated.alertType,
        targetAudience: updated.targetAudience,
        isActive: updated.isActive,
      },
    });

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

    await auditService.log(req, {
      action: 'CRM_ALERT_STATUS_CHANGED',
      module: 'CRM',
      entity: 'MarqueeAlert',
      entityId: alert._id,
      status: 'SUCCESS',
      details: `Broadcast marquee alert "${alert.title}" ${isActive ? 'activated' : 'deactivated'}.`,
      newValues: { isActive },
    });

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

    await auditService.log(req, {
      action: 'CRM_ALERT_DELETED',
      module: 'CRM',
      entity: 'MarqueeAlert',
      entityId: req.params.id,
      status: 'SUCCESS',
      details: `Deleted broadcast marquee alert ID ${req.params.id}.`,
    });

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
