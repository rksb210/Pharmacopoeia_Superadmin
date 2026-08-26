import crmService from '../services/crm.service.js';

export const getCRMStats = async (req, res, next) => {
  try {
    const stats = await crmService.getCRMStats();
    return res.status(200).json({
      success: true,
      stats,
    });
  } catch (error) {
    next(error);
  }
};

export const getCustomers = async (req, res, next) => {
  try {
    const { search, userType, segment, status, page, limit, sortBy, sortOrder } = req.query;
    const result = await crmService.getCustomersList({
      search,
      userType,
      segment,
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

export const getCustomerProfile360 = async (req, res, next) => {
  try {
    const profile = await crmService.getCustomerProfile360(req.params.id);
    return res.status(200).json({
      success: true,
      profile,
    });
  } catch (error) {
    next(error);
  }
};

export const addCustomerNote = async (req, res) => {
  try {
    const { note, priority } = req.body;
    if (!note || !note.trim()) {
      return res.status(400).json({
        success: false,
        message: 'CRM contact note cannot be empty',
      });
    }

    const newNote = await crmService.addCustomerNote(
      req.params.id,
      { note, priority },
      req.user
    );
    return res.status(201).json({
      success: true,
      message: 'CRM note recorded successfully.',
      note: newNote,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};
