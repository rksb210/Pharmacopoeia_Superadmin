import planService from '../services/plan.service.js';

export const getPlansStats = async (req, res, next) => {
  try {
    const stats = await planService.getPlansStats();
    return res.status(200).json({
      success: true,
      stats,
    });
  } catch (error) {
    next(error);
  }
};

export const getPlans = async (req, res, next) => {
  try {
    const { search, tier, status, userType, sortBy, sortOrder } = req.query;
    const plans = await planService.getPlansList({
      search,
      tier,
      status,
      userType,
      sortBy,
      sortOrder,
    });
    return res.status(200).json({
      success: true,
      plans,
    });
  } catch (error) {
    next(error);
  }
};

export const getPlanById = async (req, res, next) => {
  try {
    const data = await planService.getPlanById(req.params.id);
    return res.status(200).json({
      success: true,
      ...data,
    });
  } catch (error) {
    next(error);
  }
};

export const getPlanSubscribers = async (req, res, next) => {
  try {
    const { page, limit, search } = req.query;
    const data = await planService.getPlanSubscribers(req.params.id, {
      page,
      limit,
      search,
    });
    return res.status(200).json({
      success: true,
      ...data,
    });
  } catch (error) {
    next(error);
  }
};

export const createPlan = async (req, res) => {
  try {
    const newPlan = await planService.createPlan(req.body, req.user);
    return res.status(201).json({
      success: true,
      message: 'Plan created successfully.',
      plan: newPlan,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

export const updatePlan = async (req, res) => {
  try {
    const updated = await planService.updatePlan(req.params.id, req.body, req.user);
    return res.status(200).json({
      success: true,
      message: 'Plan pricing & configurations updated successfully.',
      plan: updated,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

export const togglePlanStatus = async (req, res) => {
  try {
    const { isActive } = req.body;
    const plan = await planService.togglePlanStatus(req.params.id, isActive, req.user);
    return res.status(200).json({
      success: true,
      message: `Plan ${isActive ? 'activated' : 'deactivated'} successfully.`,
      plan,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};
