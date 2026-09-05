import Subscriber from '../models/subscriber.model.js';
import UserType from '../models/userType.model.js';
import { escapeRegex } from '../middlewares/security.middleware.js';

export const subscriberService = {
  /**
   * Seed default User Types master
   */
  seedUserTypes: async () => {
    const defaultTypes = [
      {
        name: 'Student',
        code: 'STUDENT',
        description: 'Medical, Pharmacy, and Nursing undergraduate/postgraduate scholars.',
        fields: [
          {
            fieldKey: 'apaarId',
            label: 'APAAR ID (Edu-Account)',
            type: 'text',
            required: true,
            placeholder: 'e.g. 1234-5678-9012',
          },
          {
            fieldKey: 'institution',
            label: 'College / University',
            type: 'text',
            required: false,
            placeholder: 'e.g. AIIMS New Delhi',
          },
        ],
      },
      {
        name: 'Doctor',
        code: 'DOCTOR',
        description: 'Registered medical practitioners & clinical consultants.',
        fields: [
          {
            fieldKey: 'registrationNo',
            label: 'Medical Registration Number',
            type: 'text',
            required: true,
            placeholder: 'e.g. MCI-2023-89102',
          },
          {
            fieldKey: 'stateCouncil',
            label: 'States',
            type: 'select',
            required: true,
            placeholder: 'Select State',
          },
        ],
      },
      {
        name: 'Pharmacist',
        code: 'PHARMACIST',
        description: 'Registered hospital, retail, and clinical pharmacists.',
        fields: [
          {
            fieldKey: 'registrationNo',
            label: 'Pharmacy Council Registration Number',
            type: 'text',
            required: true,
            placeholder: 'e.g. PCI-DL-9841',
          },
          {
            fieldKey: 'stateCouncil',
            label: 'States',
            type: 'select',
            required: true,
            placeholder: 'Select State',
          },
        ],
      },
      {
        name: 'Nurse',
        code: 'NURSE',
        description: 'Certified nursing officers and healthcare practitioners.',
        fields: [
          {
            fieldKey: 'registrationNo',
            label: 'Nursing Council Registration Number',
            type: 'text',
            required: true,
            placeholder: 'e.g. INC-RN-4819',
          },
          {
            fieldKey: 'stateCouncil',
            label: 'States',
            type: 'select',
            required: true,
            placeholder: 'Select State',
          },
        ],
      },
      {
        name: 'Industry',
        code: 'INDUSTRY',
        description: 'Pharmaceutical manufacturers, laboratories, and corporate entities.',
        fields: [
          {
            fieldKey: 'companyName',
            label: 'Company / Organization Name',
            type: 'text',
            required: true,
            placeholder: 'e.g. Cipla Healthcare Ltd',
          },
          {
            fieldKey: 'gstin',
            label: 'GSTIN Number (Optional if PAN is provided)',
            type: 'text',
            required: false,
            placeholder: 'e.g. 07AAAAA0000A1Z5',
          },
          {
            fieldKey: 'pan',
            label: 'Company PAN (Optional if GSTIN is provided)',
            type: 'text',
            required: false,
            placeholder: 'e.g. ABCDE1234F',
          },
        ],
      },
      {
        name: 'Others',
        code: 'OTHERS',
        description: 'General researchers, policymakers, and public stakeholders.',
        fields: [
          {
            fieldKey: 'designation',
            label: 'Designation / Professional Role',
            type: 'text',
            required: true,
            placeholder: 'e.g. Health Policy Researcher',
          },
          {
            fieldKey: 'organization',
            label: 'Affiliated Organization',
            type: 'text',
            required: false,
            placeholder: 'e.g. Indian Council of Medical Research',
          },
        ],
      },
    ];

    for (const t of defaultTypes) {
      await UserType.findOneAndUpdate({ code: t.code }, t, { upsert: true, new: true });
    }
  },

  /**
   * Get all active User Types
   */
  getUserTypes: async () => {
    let types = await UserType.find({ isActive: true }).sort({ createdAt: 1 });
    if (types.length === 0) {
      await subscriberService.seedUserTypes();
      types = await UserType.find({ isActive: true }).sort({ createdAt: 1 });
    }
    return types;
  },

  /**
   * Get Subscriber Dashboard KPI Stats
   */
  getSubscriberStats: async () => {
    const totalUsers = await Subscriber.countDocuments();
    const activeSubscribers = await Subscriber.countDocuments({
      'subscription.status': { $in: ['active', 'complimentary'] },
      isActive: true,
    });
    const trialUsers = await Subscriber.countDocuments({
      'subscription.status': 'trial',
      isActive: true,
    });
    const complimentaryUsers = await Subscriber.countDocuments({
      'subscription.status': 'complimentary',
      isActive: true,
    });

    return {
      totalUsers,
      activeSubscribers,
      trialUsers,
      complimentaryUsers,
    };
  },

  /**
   * Get distinct Industry Companies with employee counts
   */
  getIndustriesGrouped: async ({ search = '' } = {}) => {
    const match = { userType: 'INDUSTRY' };
    if (search && search.trim()) {
      match['dynamicFields.companyName'] = {
        $regex: escapeRegex(search.trim()),
        $options: 'i',
      };
    }

    const industries = await Subscriber.aggregate([
      { $match: match },
      {
        $group: {
          _id: { $ifNull: ['$dynamicFields.companyName', 'Unnamed Industry'] },
          companyName: { $first: { $ifNull: ['$dynamicFields.companyName', 'Unnamed Industry'] } },
          gstin: { $first: '$dynamicFields.gstin' },
          pan: { $first: '$dynamicFields.pan' },
          subscribersCount: { $sum: 1 },
        },
      },
      { $sort: { companyName: 1 } },
    ]);

    return industries;
  },

  /**
   * Get filtered, searchable, paginated subscribers
   */
  getSubscribersList: async ({
    page = 1,
    limit = 10,
    search = '',
    userType = '',
    companyName = '',
    subscriptionStatus = '',
    status = '',
    dateFrom = '',
    dateTo = '',
    sortBy = 'createdAt',
    sortOrder = 'desc',
  }) => {
    const query = {};

    // Search Name, Email, Username, Phone, and Dynamic Credentials
    if (search && search.trim()) {
      const safeSearch = escapeRegex(search.trim());
      const searchRegex = new RegExp(safeSearch, 'i');
      query.$or = [
        { name: searchRegex },
        { email: searchRegex },
        { username: searchRegex },
        { phoneNumber: searchRegex },
      ];
    }

    // User Type filter
    if (userType && userType !== 'all') {
      query.userType = userType.toUpperCase().trim();
    }

    // Filter by Company Name (for Industry subscribers)
    if (companyName && companyName.trim()) {
      query['dynamicFields.companyName'] = new RegExp(`^${escapeRegex(companyName.trim())}$`, 'i');
    }

    // Subscription Status filter
    if (subscriptionStatus && subscriptionStatus !== 'all') {
      query['subscription.status'] = subscriptionStatus.toLowerCase().trim();
    }

    // Active Status
    if (status && status !== 'all') {
      query.isActive = status === 'active';
    }

    // Date Range Filters
    if (dateFrom || dateTo) {
      query.createdAt = {};
      if (dateFrom) query.createdAt.$gte = new Date(dateFrom);
      if (dateTo) {
        const toDate = new Date(dateTo);
        toDate.setHours(23, 59, 59, 999);
        query.createdAt.$lte = toDate;
      }
    }

    const pageNumber = Math.max(1, parseInt(page, 10));
    const pageSize = Math.max(1, Math.min(100, parseInt(limit, 10)));
    const skip = (pageNumber - 1) * pageSize;

    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1;

    const [subscribers, total] = await Promise.all([
      Subscriber.find(query)
        .sort(sortOptions)
        .skip(skip)
        .limit(pageSize)
        .populate('userTypeRef', 'name code')
        .lean(),
      Subscriber.countDocuments(query),
    ]);

    const totalPages = Math.ceil(total / pageSize) || 1;

    return {
      subscribers,
      pagination: {
        total,
        page: pageNumber,
        limit: pageSize,
        totalPages,
      },
    };
  },

  /**
   * Get single Subscriber by ID
   */
  getSubscriberById: async (id) => {
    const subscriber = await Subscriber.findById(id).populate('userTypeRef', 'name code fields');
    if (!subscriber) {
      throw new Error('Subscriber account not found');
    }
    return subscriber;
  },

  /**
   * Create new Subscriber
   */
  createSubscriber: async (data) => {
    const {
      name,
      email,
      username,
      phoneNumber = '',
      password,
      userType,
      dynamicFields = {},
      notes = '',
    } = data;

    const cleanEmail = email.toLowerCase().trim();
    const cleanUsername = username.toLowerCase().trim();
    const uType = userType.toUpperCase().trim();

    // Check duplicate
    const existing = await Subscriber.findOne({
      $or: [{ email: cleanEmail }, { username: cleanUsername }],
    });

    if (existing) {
      if (existing.email === cleanEmail) {
        throw new Error('A subscriber account with this email already exists.');
      }
      throw new Error('A subscriber account with this username already exists.');
    }

    const userTypeDoc = await UserType.findOne({ code: uType });

    const newSubscriber = await Subscriber.create({
      name: name.trim(),
      email: cleanEmail,
      username: cleanUsername,
      phoneNumber: phoneNumber.trim(),
      password,
      userType: uType,
      userTypeRef: userTypeDoc ? userTypeDoc._id : null,
      dynamicFields,
      notes: notes.trim(),
      subscription: {
        status: 'none',
        planName: 'Free Access Tier',
      },
      isActive: true,
    });

    return newSubscriber;
  },

  /**
   * Update Subscriber profile and credentials
   */
  updateSubscriber: async (id, data) => {
    const subscriber = await Subscriber.findById(id);
    if (!subscriber) {
      throw new Error('Subscriber account not found');
    }

    const { name, email, username, phoneNumber, dynamicFields, notes } = data;

    if (name) subscriber.name = name.trim();
    if (phoneNumber !== undefined) subscriber.phoneNumber = phoneNumber.trim();
    if (notes !== undefined) subscriber.notes = notes.trim();

    if (email && email.toLowerCase().trim() !== subscriber.email) {
      const cleanEmail = email.toLowerCase().trim();
      const duplicate = await Subscriber.findOne({ email: cleanEmail, _id: { $ne: subscriber._id } });
      if (duplicate) throw new Error('Email address already in use by another subscriber.');
      subscriber.email = cleanEmail;
    }

    if (username && username.toLowerCase().trim() !== subscriber.username) {
      const cleanUsername = username.toLowerCase().trim();
      const duplicate = await Subscriber.findOne({ username: cleanUsername, _id: { $ne: subscriber._id } });
      if (duplicate) throw new Error('Username already in use by another subscriber.');
      subscriber.username = cleanUsername;
    }

    if (dynamicFields) {
      subscriber.dynamicFields = dynamicFields;
    }

    await subscriber.save();
    return subscriber;
  },

  /**
   * Toggle Active / Inactive status
   */
  toggleStatus: async (id, isActive) => {
    const subscriber = await Subscriber.findById(id);
    if (!subscriber) throw new Error('Subscriber account not found');

    subscriber.isActive = !!isActive;
    await subscriber.save();
    return subscriber;
  },

  /**
   * Reset Subscriber password
   */
  resetPassword: async (id, newPassword) => {
    const subscriber = await Subscriber.findById(id).select('+password');
    if (!subscriber) throw new Error('Subscriber account not found');

    if (subscriber.password) {
      const isSameAsOld = await subscriber.comparePassword(newPassword);
      if (isSameAsOld) {
        throw new Error('New password cannot be the same as the previous password. Please choose a different password.');
      }
    }

    subscriber.password = newPassword;
    await subscriber.save();
    return subscriber;
  },

  /**
   * Assign 14-day Free Trial
   */
  assignTrial: async (id, days = 14) => {
    const subscriber = await Subscriber.findById(id);
    if (!subscriber) throw new Error('Subscriber account not found');

    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + parseInt(days, 10));

    subscriber.subscription = {
      status: 'trial',
      planName: `${days}-Day Promotional Trial`,
      startDate,
      endDate,
      isTrial: true,
      isComplimentary: false,
    };

    await subscriber.save();
    return subscriber;
  },

  /**
   * Grant Complimentary License
   */
  assignComplimentary: async (id, planName = 'VIP Institutional Pass', months = 12) => {
    const subscriber = await Subscriber.findById(id);
    if (!subscriber) throw new Error('Subscriber account not found');

    const startDate = new Date();
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + parseInt(months, 10));

    subscriber.subscription = {
      status: 'complimentary',
      planName,
      startDate,
      endDate,
      isTrial: false,
      isComplimentary: true,
    };

    subscriber.orderHistory.push({
      orderId: `COMP-${Date.now().toString().slice(-6)}`,
      planName,
      amount: 0,
      date: new Date(),
      paymentStatus: 'Success',
    });

    await subscriber.save();
    return subscriber;
  },

  /**
   * Assign Custom Discount
   */
  assignDiscount: async (id, discountPercent = 10, notes = '') => {
    const subscriber = await Subscriber.findById(id);
    if (!subscriber) throw new Error('Subscriber account not found');

    subscriber.subscription.discountPercent = parseInt(discountPercent, 10);
    subscriber.subscription.discountNotes = notes;

    await subscriber.save();
    return subscriber;
  },
};

export default subscriberService;
