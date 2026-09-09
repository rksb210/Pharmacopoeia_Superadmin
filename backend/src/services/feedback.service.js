import crypto from 'crypto';
import Feedback from '../models/feedback.model.js';
import User from '../models/user.model.js';

export const feedbackService = {
  /**
   * Seed realistic clinical and monograph feedback tickets (Disabled to keep feedback 100% dynamic)
   */
  seedDefaultFeedback: async () => {
    return;
  },

  /**
   * Aggregate KPI Statistics
   */
  getFeedbackStats: async () => {
    const [total, pending, inReview, completed] = await Promise.all([
      Feedback.countDocuments(),
      Feedback.countDocuments({ status: 'pending' }),
      Feedback.countDocuments({ status: 'in_review' }),
      Feedback.countDocuments({ status: 'completed' }),
    ]);

    const resolutionRatePercent = total > 0 ? Math.round((completed / total) * 100) : 0;

    return {
      totalTickets: total,
      pendingCount: pending,
      inReviewCount: inReview,
      completedCount: completed,
      resolutionRatePercent,
    };
  },

  /**
   * List, Search, and Filter Feedback Tickets
   */
  getFeedbackList: async ({
    search = '',
    status = 'all',
    category = 'all',
    section = 'all',
    priority = 'all',
    userType = 'all',
    assignedTo = 'all',
    startDate,
    endDate,
    page = 1,
    limit = 10,
    sortBy = 'createdAt',
    sortOrder = 'desc',
  }) => {
    const query = {};

    if (search && search.trim()) {
      const searchRegex = new RegExp(search.trim(), 'i');
      query.$or = [
        { ticketId: searchRegex },
        { subject: searchRegex },
        { message: searchRegex },
        { userName: searchRegex },
        { userEmail: searchRegex },
        { 'content.monographTitle': searchRegex },
      ];
    }

    if (status && status !== 'all') {
      query.status = status;
    }

    if (category && category !== 'all') {
      query.category = category;
    }

    if (section && section !== 'all') {
      query['content.section'] = section;
    }

    if (priority && priority !== 'all') {
      query.priority = priority;
    }

    if (userType && userType !== 'all') {
      query.userType = userType;
    }

    if (assignedTo && assignedTo !== 'all') {
      query.assignedTo = assignedTo;
    }

    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(new Date(endDate).setHours(23, 59, 59, 999));
    }

    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1;

    const pageNumber = Math.max(1, parseInt(page, 10));
    const pageSize = Math.max(1, Math.min(100, parseInt(limit, 10)));
    const skip = (pageNumber - 1) * pageSize;

    const [tickets, total] = await Promise.all([
      Feedback.find(query)
        .sort(sortOptions)
        .skip(skip)
        .limit(pageSize)
        .populate('assignedTo', 'name email role')
        .lean(),
      Feedback.countDocuments(query),
    ]);

    return {
      tickets,
      pagination: {
        total,
        page: pageNumber,
        limit: pageSize,
        totalPages: Math.ceil(total / pageSize) || 1,
      },
    };
  },

  /**
   * Get Single Feedback Ticket Details by ID
   */
  getFeedbackById: async (id) => {
    const ticket = await Feedback.findById(id)
      .populate('assignedTo', 'name email role')
      .populate('user', 'name email role userType');

    if (!ticket) throw new Error('Feedback ticket not found');
    return ticket;
  },

  /**
   * Public/Subscriber Submission
   */
  createFeedback: async (data, req) => {
    const {
      userName,
      userEmail,
      userType = 'PUBLIC',
      content = {},
      category = 'GENERAL_FEEDBACK',
      priority = 'medium',
      subject,
      message,
    } = data;

    const clientIp =
      req?.headers?.['x-forwarded-for']?.split(',')[0]?.trim() ||
      req?.socket?.remoteAddress ||
      '127.0.0.1';
    const userAgent = req?.headers?.['user-agent'] || 'Web Browser';

    const randomSuffix = crypto.randomBytes(3).toString('hex').toUpperCase();
    const ticketId = `FBK-${new Date().getFullYear()}-${randomSuffix}`;

    const newTicket = await Feedback.create({
      ticketId,
      user: req?.user?._id || null,
      userName: userName.trim(),
      userEmail: userEmail.toLowerCase().trim(),
      userType,
      content,
      category,
      priority,
      status: 'pending',
      subject: subject.trim(),
      message: message.trim(),
      ipAddress: clientIp,
      userAgent,
      timeline: [
        {
          action: 'Ticket Created',
          performedBy: `${userName} (${userType})`,
          timestamp: new Date(),
          note: `Public submission received from IP ${clientIp}`,
          previousStatus: null,
          newStatus: 'pending',
        },
      ],
    });

    return newTicket;
  },

  /**
   * Assign Ticket to an Administrator
   */
  assignFeedback: async (id, assignedToUserId, adminUser, note = '') => {
    const ticket = await Feedback.findById(id);
    if (!ticket) throw new Error('Ticket not found');

    const assignee = await User.findById(assignedToUserId);
    if (!assignee) throw new Error('Assignee user not found');

    ticket.assignedTo = assignee._id;
    ticket.assignedAt = new Date();

    if (ticket.status === 'pending') {
      ticket.status = 'in_review';
    }

    ticket.timeline.push({
      action: 'Staff Assignment',
      performedBy: adminUser?.name || 'Administrator',
      timestamp: new Date(),
      note: note || `Assigned to ${assignee.name} (${assignee.role || 'Staff'})`,
      previousStatus: ticket.status,
      newStatus: ticket.status,
    });

    await ticket.save();
    return ticket;
  },

  /**
   * Update Status (pending -> in_review -> completed -> reopened)
   */
  updateStatus: async (id, newStatus, adminUser, note = '') => {
    const ticket = await Feedback.findById(id);
    if (!ticket) throw new Error('Ticket not found');

    const previousStatus = ticket.status;
    ticket.status = newStatus;

    if (newStatus === 'completed') {
      ticket.resolvedAt = new Date();
    } else if (newStatus === 'reopened') {
      ticket.resolvedAt = null;
    }

    ticket.timeline.push({
      action: `Status Changed to ${newStatus.toUpperCase()}`,
      performedBy: adminUser?.name || 'Administrator',
      timestamp: new Date(),
      note: note || `Status updated from ${previousStatus} to ${newStatus}`,
      previousStatus,
      newStatus,
    });

    await ticket.save();
    return ticket;
  },

  /**
   * Add Reply (Official Response or Internal Staff Note)
   */
  addReply: async (id, { message, isInternalNote = false }, adminUser) => {
    const ticket = await Feedback.findById(id);
    if (!ticket) throw new Error('Ticket not found');

    ticket.replies.push({
      sender: adminUser?._id || null,
      senderName: adminUser?.name || 'Editorial Team',
      senderRole: adminUser?.role || 'Admin',
      message: message.trim(),
      isInternalNote: !!isInternalNote,
      sentAt: new Date(),
    });

    ticket.timeline.push({
      action: isInternalNote ? 'Internal Note Added' : 'Official Response Dispatched',
      performedBy: adminUser?.name || 'Administrator',
      timestamp: new Date(),
      note: isInternalNote ? 'Confidential staff note added' : 'Public response sent to subscriber email',
      previousStatus: ticket.status,
      newStatus: ticket.status,
    });

    await ticket.save();
    return ticket;
  },
};

export default feedbackService;
