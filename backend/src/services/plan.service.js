import Plan from '../models/plan.model.js';
import Subscription from '../models/subscription.model.js';
import Subscriber from '../models/subscriber.model.js';

export const planService = {
  /**
   * Seed standard default NFI Plans
   */
  seedDefaultPlans: async () => {
    const defaultPlans = [
      {
        name: 'NFI 9th Edition Formulary - Individual Pass',
        code: 'NFI-INDIVIDUAL',
        description: 'Complete digital formulary monograph database for individual healthcare practitioners & pharmacists.',
        tier: 'Individual',
        priceINR: 3500,
        validityType: 'fixed_date',
        fixedDate: new Date('2031-12-31T23:59:59.999Z'),
        applicableUserTypes: ['DOCTOR', 'PHARMACIST', 'NURSE', 'OTHERS'],
        features: [
          'Full Digital Monograph Formulary (9th Edition)',
          'Drug Interaction Checker & Clinical Alerts',
          'Pediatric & Geriatric Dosage Calculator',
          'Periodic Addendum & Safety Broadcast Updates',
        ],
        trialEligibility: { isAllowed: true, trialDays: 14 },
        complimentaryEligibility: { isAllowed: true, defaultMonths: 12 },
        discountRules: { isDiscountAllowed: true, maxDiscountPercent: 50, defaultDiscountPercent: 0 },
        seatQuota: 1,
        isActive: true,
        isPopular: true,
        sortOrder: 1,
      },
      {
        name: 'NFI Institutional Campus License (Multi-Seat)',
        code: 'NFI-INSTITUTIONAL',
        description: 'Comprehensive campus-wide digital formulary subscription for medical colleges, universities, and tertiary teaching hospitals.',
        tier: 'Institutional',
        priceINR: 45000,
        validityType: 'duration_years',
        durationValue: 1,
        applicableUserTypes: ['INDUSTRY', 'OTHERS', 'DOCTOR'],
        features: [
          'Up to 50 Concurrent Institutional Workstation Seats',
          'IP Range & Institutional SSO Authentication Support',
          'Bulk PDF & Monograph Chapter Export Tools',
          'Institutional Usage & Utilization Analytics Dashboard',
        ],
        trialEligibility: { isAllowed: true, trialDays: 30 },
        complimentaryEligibility: { isAllowed: true, defaultMonths: 24 },
        discountRules: { isDiscountAllowed: true, maxDiscountPercent: 40, defaultDiscountPercent: 10 },
        seatQuota: 50,
        isActive: true,
        isPopular: false,
        sortOrder: 2,
      },
      {
        name: 'NFI Scholar Pass (Academic Special)',
        code: 'NFI-STUDENT-SPECIAL',
        description: 'Subsidized academic edition exclusively for verified undergraduate & postgraduate MBBS, B.Pharm, and Nursing scholars.',
        tier: 'Student',
        priceINR: 1200,
        validityType: 'fixed_date',
        fixedDate: new Date('2031-12-31T23:59:59.999Z'),
        applicableUserTypes: ['STUDENT'],
        features: [
          'Standard Formulary Monographs & Index Search',
          'Therapeutic Classification & Pharmacology Notes',
          'Verified APAAR / Edu-ID Integration',
          'Mobile & Tablet Browser Optimized Access',
        ],
        trialEligibility: { isAllowed: true, trialDays: 14 },
        complimentaryEligibility: { isAllowed: true, defaultMonths: 12 },
        discountRules: { isDiscountAllowed: true, maxDiscountPercent: 25, defaultDiscountPercent: 20 },
        seatQuota: 1,
        isActive: true,
        isPopular: false,
        sortOrder: 3,
      },
      {
        name: 'NFI Clinical Consultant & Specialist Edition',
        code: 'NFI-DOCTOR-PRO',
        description: 'Advanced therapeutic formulary suite tailored for clinical consultants, super-specialists, and medical directors.',
        tier: 'Doctor Professional',
        priceINR: 6000,
        validityType: 'fixed_date',
        fixedDate: new Date('2031-12-31T23:59:59.999Z'),
        applicableUserTypes: ['DOCTOR'],
        features: [
          'High-Risk Drug Monitoring & Black-Box Warnings',
          'Renal & Hepatic Dose Adjustment Guidelines',
          'Pharmacovigilance Direct Reporting Portal Link',
          'Priority Scientific Advisory Notifications',
        ],
        trialEligibility: { isAllowed: true, trialDays: 14 },
        complimentaryEligibility: { isAllowed: true, defaultMonths: 12 },
        discountRules: { isDiscountAllowed: true, maxDiscountPercent: 30, defaultDiscountPercent: 0 },
        seatQuota: 1,
        isActive: true,
        isPopular: false,
        sortOrder: 4,
      },
      {
        name: 'NFI Corporate & Manufacturing Formulary License',
        code: 'NFI-CORPORATE',
        description: 'Enterprise commercial license for pharmaceutical manufacturers, contract laboratories, and regulatory consultancies.',
        tier: 'Corporate',
        priceINR: 85000,
        validityType: 'duration_years',
        durationValue: 1,
        applicableUserTypes: ['INDUSTRY'],
        features: [
          'Official IPC Monograph Standards & Specifications',
          'Bulk Regulatory Compliance Export Pack',
          'Dedicated Technical Account Manager',
          'Enterprise REST API & Integration Webhooks',
        ],
        trialEligibility: { isAllowed: false, trialDays: 0 },
        complimentaryEligibility: { isAllowed: true, defaultMonths: 12 },
        discountRules: { isDiscountAllowed: true, maxDiscountPercent: 20, defaultDiscountPercent: 0 },
        seatQuota: 100,
        isActive: true,
        isPopular: false,
        sortOrder: 5,
      },
    ];

    for (const p of defaultPlans) {
      await Plan.findOneAndUpdate(
        { code: p.code },
        { ...p, $setOnInsert: { auditLogs: [{ changedBy: 'System Seeder', changeType: 'CREATED', reason: 'Initial default NFI plan configuration' }] } },
        { upsert: true, new: true }
      );
    }
  },

  /**
   * Aggregate KPI Statistics for Plans
   */
  getPlansStats: async () => {
    const totalPlans = await Plan.countDocuments();
    const activePlans = await Plan.countDocuments({ isActive: true });

    // Aggregate subscriber metrics from Subscription collection
    const [subStats, revenueStats, avgPrice] = await Promise.all([
      Subscription.countDocuments({ status: 'active' }),
      Subscription.aggregate([
        { $match: { paymentStatus: 'success' } },
        { $group: { _id: null, totalRevenue: { $sum: '$finalAmount' } } },
      ]),
      Plan.aggregate([
        { $match: { isActive: true } },
        { $group: { _id: null, avgPrice: { $avg: '$priceINR' } } },
      ]),
    ]);

    return {
      totalPlans,
      activePlans,
      totalActiveSubscribers: subStats,
      totalRevenueINR: revenueStats[0]?.totalRevenue || 0,
      averagePlanPriceINR: Math.round(avgPrice[0]?.avgPrice || 0),
    };
  },

  /**
   * List, Filter, Search Plans with Live Usage Counts
   */
  getPlansList: async ({
    search = '',
    tier = 'all',
    status = 'all',
    userType = 'all',
    sortBy = 'sortOrder',
    sortOrder = 'asc',
  }) => {
    const query = {};

    if (search && search.trim()) {
      const searchRegex = new RegExp(search.trim(), 'i');
      query.$or = [{ name: searchRegex }, { code: searchRegex }, { description: searchRegex }];
    }

    if (tier && tier !== 'all') {
      query.tier = tier;
    }

    if (status && status !== 'all') {
      query.isActive = status === 'active';
    }

    if (userType && userType !== 'all') {
      query.applicableUserTypes = { $in: [userType.toUpperCase(), 'ALL'] };
    }

    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1;

    let plans = await Plan.find(query).sort(sortOptions).lean();

    if (plans.length === 0 && !search && tier === 'all' && status === 'all') {
      await planService.seedDefaultPlans();
      plans = await Plan.find(query).sort(sortOptions).lean();
    }

    // Attach real-time subscriber counts & total revenue per plan
    const planUsagePromises = plans.map(async (plan) => {
      const [activeSubCount, revenueAgg] = await Promise.all([
        Subscription.countDocuments({ planCode: plan.code, status: 'active' }),
        Subscription.aggregate([
          { $match: { planCode: plan.code, paymentStatus: 'success' } },
          { $group: { _id: null, totalRevenue: { $sum: '$finalAmount' } } },
        ]),
      ]);

      return {
        ...plan,
        activeSubscribersCount: activeSubCount,
        revenueGeneratedINR: revenueAgg[0]?.totalRevenue || 0,
      };
    });

    const enrichedPlans = await Promise.all(planUsagePromises);

    return enrichedPlans;
  },

  /**
   * Get Single Plan by ID with Usage & Audit Logs
   */
  getPlanById: async (id) => {
    const plan = await Plan.findById(id);
    if (!plan) {
      throw new Error('Plan record not found');
    }

    const [activeSubCount, totalSubCount, revenueAgg] = await Promise.all([
      Subscription.countDocuments({ planCode: plan.code, status: 'active' }),
      Subscription.countDocuments({ planCode: plan.code }),
      Subscription.aggregate([
        { $match: { planCode: plan.code, paymentStatus: 'success' } },
        { $group: { _id: null, totalRevenue: { $sum: '$finalAmount' } } },
      ]),
    ]);

    return {
      plan,
      usage: {
        activeSubscribers: activeSubCount,
        totalSubscribers: totalSubCount,
        totalRevenueINR: revenueAgg[0]?.totalRevenue || 0,
      },
    };
  },

  /**
   * Get Enrolled Subscribers by Plan
   */
  getPlanSubscribers: async (id, { page = 1, limit = 10, search = '' }) => {
    const plan = await Plan.findById(id);
    if (!plan) throw new Error('Plan record not found');

    const query = { planCode: plan.code };

    if (search && search.trim()) {
      const searchRegex = new RegExp(search.trim(), 'i');
      const matchedSubs = await Subscriber.find({
        $or: [{ name: searchRegex }, { email: searchRegex }, { username: searchRegex }],
      }).select('_id');

      query.user = { $in: matchedSubs.map((s) => s._id) };
    }

    const pageNumber = Math.max(1, parseInt(page, 10));
    const pageSize = Math.max(1, Math.min(50, parseInt(limit, 10)));
    const skip = (pageNumber - 1) * pageSize;

    const [subscriptions, total] = await Promise.all([
      Subscription.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(pageSize)
        .populate('user', 'name email username userType phoneNumber dynamicFields')
        .lean(),
      Subscription.countDocuments(query),
    ]);

    return {
      planCode: plan.code,
      planName: plan.name,
      subscriptions,
      pagination: {
        total,
        page: pageNumber,
        limit: pageSize,
        totalPages: Math.ceil(total / pageSize) || 1,
      },
    };
  },

  /**
   * Create New Plan
   */
  createPlan: async (data, adminUser) => {
    const {
      name,
      code,
      description = '',
      tier = 'Individual',
      priceINR,
      validityType = 'fixed_date',
      fixedDate = '2031-12-31T23:59:59.999Z',
      durationValue = 365,
      applicableUserTypes = ['ALL'],
      features = [],
      trialEligibility = { isAllowed: true, trialDays: 14 },
      complimentaryEligibility = { isAllowed: true, defaultMonths: 12 },
      discountRules = { isDiscountAllowed: true, maxDiscountPercent: 50, defaultDiscountPercent: 0 },
      seatQuota = 1,
      isPopular = false,
      sortOrder = 0,
    } = data;

    const cleanCode = code.toUpperCase().trim();

    const existing = await Plan.findOne({ $or: [{ code: cleanCode }, { name: name.trim() }] });
    if (existing) {
      if (existing.code === cleanCode) throw new Error('A plan with this code slug already exists.');
      throw new Error('A plan with this name already exists.');
    }

    const newPlan = await Plan.create({
      name: name.trim(),
      code: cleanCode,
      description: description.trim(),
      tier,
      priceINR: Number(priceINR),
      validityType,
      fixedDate: new Date(fixedDate),
      durationValue: Number(durationValue),
      applicableUserTypes,
      features,
      trialEligibility,
      complimentaryEligibility,
      discountRules,
      seatQuota: Number(seatQuota),
      isPopular,
      sortOrder: Number(sortOrder),
      isActive: true,
      auditLogs: [
        {
          changedBy: adminUser?.name || 'Super Admin',
          changeType: 'CREATED',
          previousValues: null,
          newValues: { priceINR: Number(priceINR), tier, validityType },
          reason: 'Initial plan provisioning',
          timestamp: new Date(),
        },
      ],
    });

    return newPlan;
  },

  /**
   * Update Plan (Non-destructive: retains historical subscription integrity)
   */
  updatePlan: async (id, data, adminUser) => {
    const plan = await Plan.findById(id);
    if (!plan) throw new Error('Plan not found');

    const previousPricing = {
      priceINR: plan.priceINR,
      validityType: plan.validityType,
      fixedDate: plan.fixedDate,
      durationValue: plan.durationValue,
      discountRules: plan.discountRules,
      seatQuota: plan.seatQuota,
    };

    const {
      name,
      description,
      tier,
      priceINR,
      validityType,
      fixedDate,
      durationValue,
      applicableUserTypes,
      features,
      trialEligibility,
      complimentaryEligibility,
      discountRules,
      seatQuota,
      isPopular,
      sortOrder,
      reason = 'Pricing & configuration update',
    } = data;

    if (name) plan.name = name.trim();
    if (description !== undefined) plan.description = description.trim();
    if (tier) plan.tier = tier;
    if (priceINR !== undefined) plan.priceINR = Number(priceINR);
    if (validityType) plan.validityType = validityType;
    if (fixedDate) plan.fixedDate = new Date(fixedDate);
    if (durationValue !== undefined) plan.durationValue = Number(durationValue);
    if (applicableUserTypes) plan.applicableUserTypes = applicableUserTypes;
    if (features) plan.features = features;
    if (trialEligibility) plan.trialEligibility = trialEligibility;
    if (complimentaryEligibility) plan.complimentaryEligibility = complimentaryEligibility;
    if (discountRules) plan.discountRules = discountRules;
    if (seatQuota !== undefined) plan.seatQuota = Number(seatQuota);
    if (isPopular !== undefined) plan.isPopular = isPopular;
    if (sortOrder !== undefined) plan.sortOrder = Number(sortOrder);

    // Append Audit Log for compliance
    plan.auditLogs.push({
      changedBy: adminUser?.name || 'Administrator',
      changeType: 'PRICING_UPDATED',
      previousValues: previousPricing,
      newValues: {
        priceINR: plan.priceINR,
        validityType: plan.validityType,
        fixedDate: plan.fixedDate,
        durationValue: plan.durationValue,
        discountRules: plan.discountRules,
        seatQuota: plan.seatQuota,
      },
      reason,
      timestamp: new Date(),
    });

    await plan.save();
    return plan;
  },

  /**
   * Toggle Plan Active / Inactive Status
   */
  togglePlanStatus: async (id, isActive, adminUser) => {
    const plan = await Plan.findById(id);
    if (!plan) throw new Error('Plan not found');

    const previousStatus = plan.isActive;
    plan.isActive = !!isActive;

    plan.auditLogs.push({
      changedBy: adminUser?.name || 'Administrator',
      changeType: 'STATUS_TOGGLED',
      previousValues: { isActive: previousStatus },
      newValues: { isActive: plan.isActive },
      reason: `Plan status toggled to ${plan.isActive ? 'ACTIVE' : 'INACTIVE'}`,
      timestamp: new Date(),
    });

    await plan.save();
    return plan;
  },
};

export default planService;
