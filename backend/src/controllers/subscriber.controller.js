import subscriberService from '../services/subscriber.service.js';
import { auditService } from '../services/audit.service.js';

export const getUserTypes = async (req, res, next) => {
  try {
    const types = await subscriberService.getUserTypes();
    return res.status(200).json({
      success: true,
      types,
    });
  } catch (error) {
    next(error);
  }
};

export const getSubscriberStats = async (req, res, next) => {
  try {
    const stats = await subscriberService.getSubscriberStats();
    return res.status(200).json({
      success: true,
      stats,
    });
  } catch (error) {
    next(error);
  }
};

export const getIndustries = async (req, res, next) => {
  try {
    const { search, userType } = req.query;
    const industries = await subscriberService.getIndustriesGrouped({ search, userType });
    return res.status(200).json({
      success: true,
      industries,
    });
  } catch (error) {
    next(error);
  }
};

export const getUniversities = async (req, res, next) => {
  try {
    const { search } = req.query;
    const universities = await subscriberService.getIndustriesGrouped({
      search,
      userType: 'UNIVERSITIES_COLLEGES',
    });
    return res.status(200).json({
      success: true,
      universities,
      industries: universities,
    });
  } catch (error) {
    next(error);
  }
};

export const getSubscribers = async (req, res, next) => {
  try {
    const {
      page,
      limit,
      search,
      userType,
      companyName,
      subscriptionStatus,
      status,
      dateFrom,
      dateTo,
      sortBy,
      sortOrder,
    } = req.query;

    const result = await subscriberService.getSubscribersList({
      page,
      limit,
      search,
      userType,
      companyName,
      subscriptionStatus,
      status,
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

export const getSubscriberById = async (req, res, next) => {
  try {
    const subscriber = await subscriberService.getSubscriberById(req.params.id);
    return res.status(200).json({
      success: true,
      subscriber,
    });
  } catch (error) {
    next(error);
  }
};

export const createSubscriber = async (req, res) => {
  try {
    const newSubscriber = await subscriberService.createSubscriber(req.body);

    await auditService.log(req, {
      action: 'SUBSCRIBER_CREATED',
      module: 'SUBSCRIBERS',
      entity: 'Subscriber',
      entityId: newSubscriber._id,
      status: 'SUCCESS',
      details: `Created subscriber account for ${newSubscriber.name} (${newSubscriber.email}). Type: ${newSubscriber.userType}.`,
      newValues: {
        name: newSubscriber.name,
        email: newSubscriber.email,
        userType: newSubscriber.userType,
      },
    });

    return res.status(201).json({
      success: true,
      message: 'Subscriber account created successfully.',
      subscriber: newSubscriber,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

export const updateSubscriber = async (req, res) => {
  try {
    const updated = await subscriberService.updateSubscriber(req.params.id, req.body);

    await auditService.log(req, {
      action: 'SUBSCRIBER_UPDATED',
      module: 'SUBSCRIBERS',
      entity: 'Subscriber',
      entityId: updated._id,
      status: 'SUCCESS',
      details: `Updated subscriber profile for ${updated.name} (${updated.email}).`,
      newValues: {
        name: updated.name,
        email: updated.email,
        userType: updated.userType,
        phoneNumber: updated.phoneNumber,
      },
    });

    return res.status(200).json({
      success: true,
      message: 'Subscriber profile updated successfully.',
      subscriber: updated,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

export const toggleSubscriberStatus = async (req, res) => {
  try {
    const { isActive } = req.body;
    const subscriber = await subscriberService.toggleStatus(req.params.id, isActive);

    await auditService.log(req, {
      action: 'SUBSCRIBER_STATUS_CHANGED',
      module: 'SUBSCRIBERS',
      entity: 'Subscriber',
      entityId: subscriber._id,
      status: 'SUCCESS',
      details: `Subscriber ${subscriber.name} (${subscriber.email}) ${isActive ? 'activated' : 'deactivated'}.`,
      newValues: { isActive },
    });

    return res.status(200).json({
      success: true,
      message: `Subscriber account ${isActive ? 'activated' : 'deactivated'} successfully.`,
      subscriber,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

export const resetSubscriberPassword = async (req, res) => {
  try {
    const { newPassword } = req.body;
    const subscriber = await subscriberService.resetPassword(req.params.id, newPassword);

    await auditService.log(req, {
      action: 'SUBSCRIBER_PASSWORD_RESET',
      module: 'SUBSCRIBERS',
      entity: 'Subscriber',
      entityId: subscriber._id,
      status: 'SUCCESS',
      details: `Administrative password reset performed for subscriber ${subscriber.name} (${subscriber.email}).`,
    });

    return res.status(200).json({
      success: true,
      message: 'Subscriber password reset successfully.',
      subscriber: {
        id: subscriber._id,
        name: subscriber.name,
        email: subscriber.email,
      },
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

export const assignTrial = async (req, res) => {
  try {
    const { days = 14 } = req.body;
    const subscriber = await subscriberService.assignTrial(req.params.id, days);

    await auditService.log(req, {
      action: 'SUBSCRIBER_TRIAL_ASSIGNED',
      module: 'SUBSCRIBERS',
      entity: 'Subscriber',
      entityId: subscriber._id,
      status: 'SUCCESS',
      details: `Assigned ${days}-day Free Trial to subscriber ${subscriber.name} (${subscriber.email}).`,
    });

    return res.status(200).json({
      success: true,
      message: `${days}-day Free Trial assigned successfully.`,
      subscriber,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

export const assignComplimentary = async (req, res) => {
  try {
    const { planName = 'VIP Institutional Pass', months = 12 } = req.body;
    const subscriber = await subscriberService.assignComplimentary(req.params.id, planName, months);

    await auditService.log(req, {
      action: 'SUBSCRIBER_COMPLIMENTARY_GRANTED',
      module: 'SUBSCRIBERS',
      entity: 'Subscriber',
      entityId: subscriber._id,
      status: 'SUCCESS',
      details: `Granted ${months}-month Complimentary access (${planName}) to ${subscriber.name} (${subscriber.email}).`,
    });

    return res.status(200).json({
      success: true,
      message: 'Complimentary subscription license granted successfully.',
      subscriber,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

export const assignDiscount = async (req, res) => {
  try {
    const { discountPercent = 10, notes = '' } = req.body;
    const subscriber = await subscriberService.assignDiscount(req.params.id, discountPercent, notes);

    await auditService.log(req, {
      action: 'SUBSCRIBER_DISCOUNT_ASSIGNED',
      module: 'SUBSCRIBERS',
      entity: 'Subscriber',
      entityId: subscriber._id,
      status: 'SUCCESS',
      details: `Granted ${discountPercent}% discount voucher to ${subscriber.name} (${subscriber.email}). Notes: ${notes || 'None'}.`,
    });

    return res.status(200).json({
      success: true,
      message: `${discountPercent}% discount voucher assigned successfully.`,
      subscriber,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};
