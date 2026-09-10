import subscriptionService from '../services/subscription.service.js';
import { auditService } from '../services/audit.service.js';

export const getSubscriptionStats = async (req, res, next) => {
  try {
    const stats = await subscriptionService.getSubscriptionStats();
    return res.status(200).json({
      success: true,
      stats,
    });
  } catch (error) {
    next(error);
  }
};

export const getSystemConfigs = async (req, res, next) => {
  try {
    const configs = await subscriptionService.getSystemConfigs();
    return res.status(200).json({
      success: true,
      configs,
    });
  } catch (error) {
    next(error);
  }
};

export const updateSystemConfig = async (req, res, next) => {
  try {
    const { key, value, description } = req.body;
    const updated = await subscriptionService.updateSystemConfig(key, value, description);

    await auditService.log(req, {
      action: 'SUBSCRIPTION_RULE_UPDATED',
      module: 'SUBSCRIPTIONS',
      entity: 'SystemConfig',
      entityId: key,
      status: 'SUCCESS',
      details: `Subscription system rule '${key}' modified to value '${value}'.`,
      newValues: { key, value, description },
    });

    return res.status(200).json({
      success: true,
      message: `System rule '${key}' updated successfully.`,
      config: updated,
    });
  } catch (error) {
    next(error);
  }
};

export const getSubscriptions = async (req, res, next) => {
  try {
    const {
      page,
      limit,
      search,
      type,
      status,
      userType,
      dateFrom,
      dateTo,
      sortBy,
      sortOrder,
    } = req.query;

    const result = await subscriptionService.getSubscriptionsList({
      page,
      limit,
      search,
      type,
      status,
      userType,
      dateFrom,
      dateTo,
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

export const getSubscriptionById = async (req, res, next) => {
  try {
    const subscription = await subscriptionService.getSubscriptionById(req.params.id);
    return res.status(200).json({
      success: true,
      subscription,
    });
  } catch (error) {
    next(error);
  }
};

export const assignSubscription = async (req, res) => {
  try {
    const newSubscription = await subscriptionService.assignSubscriptionManually(
      req.body,
      req.user
    );

    await auditService.log(req, {
      action: 'SUBSCRIPTION_PROVISIONED',
      module: 'SUBSCRIPTIONS',
      entity: 'Subscription',
      entityId: newSubscription._id,
      status: 'SUCCESS',
      details: `Provisioned manual subscription (${newSubscription.planName}) for user ${newSubscription.userEmail || newSubscription.user}. Valid until: ${new Date(newSubscription.endDate).toLocaleDateString('en-IN')}.`,
      newValues: {
        planName: newSubscription.planName,
        planCode: newSubscription.planCode,
        status: newSubscription.status,
        endDate: newSubscription.endDate,
      },
    });

    return res.status(201).json({
      success: true,
      message: 'Subscription provisioned and activated successfully.',
      subscription: newSubscription,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

export const renewSubscription = async (req, res) => {
  try {
    const renewed = await subscriptionService.renewSubscription(
      req.params.id,
      req.body,
      req.user
    );

    await auditService.log(req, {
      action: 'SUBSCRIPTION_RENEWED',
      module: 'SUBSCRIPTIONS',
      entity: 'Subscription',
      entityId: renewed._id,
      status: 'SUCCESS',
      details: `Renewed subscription ID ${renewed._id}. Extended until ${new Date(renewed.endDate).toLocaleDateString('en-IN')}.`,
      newValues: {
        endDate: renewed.endDate,
        status: renewed.status,
      },
    });

    return res.status(200).json({
      success: true,
      message: 'Subscription renewed successfully.',
      subscription: renewed,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

export const cancelSubscription = async (req, res) => {
  try {
    const cancelled = await subscriptionService.cancelSubscription(
      req.params.id,
      req.body.reason,
      req.user
    );

    await auditService.log(req, {
      action: 'SUBSCRIPTION_CANCELLED',
      module: 'SUBSCRIPTIONS',
      entity: 'Subscription',
      entityId: cancelled._id,
      status: 'WARNING',
      details: `Cancelled subscription ID ${cancelled._id}. Reason: ${req.body.reason || 'Administrative termination'}.`,
    });

    return res.status(200).json({
      success: true,
      message: 'Subscription cancelled successfully.',
      subscription: cancelled,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

export const changeSubscriptionStatus = async (req, res) => {
  try {
    const updated = await subscriptionService.changeStatus(
      req.params.id,
      req.body.status,
      req.body.reason,
      req.user
    );

    await auditService.log(req, {
      action: 'SUBSCRIPTION_STATUS_CHANGED',
      module: 'SUBSCRIPTIONS',
      entity: 'Subscription',
      entityId: updated._id,
      status: 'SUCCESS',
      details: `Subscription ID ${updated._id} status updated to '${req.body.status}'. Reason: ${req.body.reason || 'N/A'}.`,
      newValues: { status: req.body.status },
    });

    return res.status(200).json({
      success: true,
      message: `Subscription status updated to '${req.body.status}'.`,
      subscription: updated,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

export const getUserSubscriptionTimeline = async (req, res, next) => {
  try {
    const history = await subscriptionService.getUserSubscriptionTimeline(req.params.userId);
    return res.status(200).json({
      success: true,
      history,
    });
  } catch (error) {
    next(error);
  }
};
