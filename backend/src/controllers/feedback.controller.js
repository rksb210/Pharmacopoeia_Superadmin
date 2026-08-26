import feedbackService from '../services/feedback.service.js';

export const getFeedbackStats = async (req, res, next) => {
  try {
    const stats = await feedbackService.getFeedbackStats();
    return res.status(200).json({
      success: true,
      stats,
    });
  } catch (error) {
    next(error);
  }
};

export const getFeedbackList = async (req, res, next) => {
  try {
    const {
      search,
      status,
      category,
      section,
      priority,
      userType,
      assignedTo,
      startDate,
      endDate,
      page,
      limit,
      sortBy,
      sortOrder,
    } = req.query;

    const result = await feedbackService.getFeedbackList({
      search,
      status,
      category,
      section,
      priority,
      userType,
      assignedTo,
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

export const getFeedbackById = async (req, res, next) => {
  try {
    const ticket = await feedbackService.getFeedbackById(req.params.id);
    return res.status(200).json({
      success: true,
      ticket,
    });
  } catch (error) {
    next(error);
  }
};

export const submitPublicFeedback = async (req, res) => {
  try {
    const newTicket = await feedbackService.createFeedback(req.body, req);
    return res.status(201).json({
      success: true,
      message: 'Feedback submitted successfully. Ticket ID generated.',
      ticket: newTicket,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

export const assignFeedback = async (req, res) => {
  try {
    const { assignedTo, note } = req.body;
    const updated = await feedbackService.assignFeedback(
      req.params.id,
      assignedTo,
      req.user,
      note
    );
    return res.status(200).json({
      success: true,
      message: 'Ticket assigned successfully.',
      ticket: updated,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

export const updateFeedbackStatus = async (req, res) => {
  try {
    const { status, note } = req.body;
    const updated = await feedbackService.updateStatus(
      req.params.id,
      status,
      req.user,
      note
    );
    return res.status(200).json({
      success: true,
      message: `Ticket status updated to ${status}.`,
      ticket: updated,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

export const replyToFeedback = async (req, res) => {
  try {
    const { message, isInternalNote } = req.body;
    const updated = await feedbackService.addReply(
      req.params.id,
      { message, isInternalNote },
      req.user
    );
    return res.status(200).json({
      success: true,
      message: isInternalNote ? 'Internal note added.' : 'Response sent to subscriber.',
      ticket: updated,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};
