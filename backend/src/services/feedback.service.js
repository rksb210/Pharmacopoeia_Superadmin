import crypto from 'crypto';
import Feedback from '../models/feedback.model.js';
import User from '../models/user.model.js';

export const feedbackService = {
  /**
   * Seed realistic clinical and monograph feedback tickets
   */
  seedDefaultFeedback: async () => {
    const defaultTickets = [
      {
        ticketId: 'FBK-2026-A91201',
        userName: 'Dr. Suresh Varma',
        userEmail: 'suresh.varma@aiims.edu',
        userType: 'DOCTOR',
        content: {
          section: 'Monographs',
          monographTitle: 'Paracetamol Paediatric Oral Suspension',
          edition: '9th Edition 2022',
          pageNumber: 'Page 412',
          contentUrl: '/monographs/paracetamol-paediatric',
        },
        category: 'DOSAGE_CORRECTION',
        priority: 'high',
        status: 'in_review',
        subject: 'Clarification on recommended maximum daily dose for infants under 6 months',
        message: 'In section 4.2 of the paediatric formulation, the maximum single dose mentions 15mg/kg every 4-6 hours, but daily ceiling guidance for premature neonates is missing. Kindly consider adding explicit neonate guidelines as per CDSCO circular 2025.',
        ipAddress: '103.21.124.55',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36',
        createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        replies: [
          {
            senderName: 'Dr. Anita Joshi (Senior Reviewer)',
            senderRole: 'Reviewer',
            message: 'Thank you Dr. Suresh. We have cross-referenced the CDSCO 2025 neonate circular and referred this to the Paediatric Scientific Sub-Committee.',
            isInternalNote: false,
            sentAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
          },
          {
            senderName: 'NFI Editorial Desk',
            senderRole: 'Admin',
            message: 'Internal Note: Sub-committee approved addendum inclusion in upcoming 2026 batch release.',
            isInternalNote: true,
            sentAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
          },
        ],
        timeline: [
          {
            action: 'Ticket Submitted',
            performedBy: 'Dr. Suresh Varma (Public Subscriber)',
            timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
            note: 'Submitted via digital formulary web portal',
            previousStatus: null,
            newStatus: 'pending',
          },
          {
            action: 'Assigned to Reviewer',
            performedBy: 'Superadmin',
            timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
            note: 'Assigned to Dr. Anita Joshi for paediatric clinical evaluation',
            previousStatus: 'pending',
            newStatus: 'in_review',
          },
        ],
      },
      {
        ticketId: 'FBK-2026-B83102',
        userName: 'Pooja Deshmukh',
        userEmail: 'pooja.d@sunpharma.com',
        userType: 'INDUSTRY',
        content: {
          section: 'Appendices',
          monographTitle: 'Appendix 2.3: Dissolution Testing Standards for Extended Release Tablets',
          edition: 'Addendum 2026',
          pageNumber: 'Appendix 2.3 - B',
          contentUrl: '/appendices/dissolution-testing',
        },
        category: 'MONOGRAPH_AMENDMENT',
        priority: 'medium',
        status: 'pending',
        subject: 'Apparatus specification typo in Paddle Speed RPM Table',
        message: 'In Appendix 2.3 table B, row 4 specifies 150 RPM for Apparatus 2, which appears to be a typographical error compared to standard 50-75 RPM range for aqueous media.',
        ipAddress: '49.36.18.92',
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        timeline: [
          {
            action: 'Ticket Submitted',
            performedBy: 'Pooja Deshmukh (Industry Subscriber)',
            timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
            note: 'Submitted from Maharashtra regional IP',
            previousStatus: null,
            newStatus: 'pending',
          },
        ],
      },
      {
        ticketId: 'FBK-2026-C44903',
        userName: 'Vikram Sethi',
        userEmail: 'vikram.sethi@apollo.org',
        userType: 'PHARMACIST',
        content: {
          section: 'Dosage Guidelines',
          monographTitle: 'Amoxicillin + Potassium Clavulanate Formulations',
          edition: '9th Edition 2022',
          pageNumber: 'Page 188',
          contentUrl: '/monographs/amoxicillin-clavulanate',
        },
        category: 'SAFETY_QUERY',
        priority: 'urgent',
        status: 'completed',
        subject: 'Hepatic monitoring advisories for extended courses',
        message: 'Requesting clarification on mandatory liver function testing intervals for treatment durations exceeding 14 continuous days.',
        ipAddress: '14.139.60.2',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        createdAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000),
        resolvedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
        replies: [
          {
            senderName: 'IPC Clinical Secretariat',
            senderRole: 'Admin',
            message: 'LFT monitoring is recommended after 14 days of continuous therapy, particularly in elderly cohorts and patients with pre-existing hepatic impairment as updated in section 4.4.',
            isInternalNote: false,
            sentAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
          },
        ],
        timeline: [
          {
            action: 'Ticket Submitted',
            performedBy: 'Vikram Sethi',
            timestamp: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000),
            note: 'Logged as urgent safety inquiry',
            previousStatus: null,
            newStatus: 'pending',
          },
          {
            action: 'Marked In Review',
            performedBy: 'Admin Team',
            timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
            note: 'Triage complete',
            previousStatus: 'pending',
            newStatus: 'in_review',
          },
          {
            action: 'Ticket Completed & Resolved',
            performedBy: 'Clinical Committee Approver',
            timestamp: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
            note: 'Official guidance dispatched to subscriber email',
            previousStatus: 'in_review',
            newStatus: 'completed',
          },
        ],
      },
    ];

    for (const ticket of defaultTickets) {
      await Feedback.findOneAndUpdate({ ticketId: ticket.ticketId }, ticket, {
        upsert: true,
        new: true,
      });
    }
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

    let [tickets, total] = await Promise.all([
      Feedback.find(query)
        .sort(sortOptions)
        .skip(skip)
        .limit(pageSize)
        .populate('assignedTo', 'name email role')
        .lean(),
      Feedback.countDocuments(query),
    ]);

    if (tickets.length === 0 && !search && status === 'all' && category === 'all') {
      await feedbackService.seedDefaultFeedback();
      [tickets, total] = await Promise.all([
        Feedback.find(query)
          .sort(sortOptions)
          .skip(skip)
          .limit(pageSize)
          .populate('assignedTo', 'name email role')
          .lean(),
        Feedback.countDocuments(query),
      ]);
    }

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
