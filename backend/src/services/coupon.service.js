import Coupon from '../models/coupon.model.js';
import Subscriber from '../models/subscriber.model.js';

export const couponService = {
  /**
   * Seed default promotional and institutional coupons
   */
  seedDefaultCoupons: async () => {
    const defaultCoupons = [
      {
        code: 'NFI-IMA2026',
        title: 'Indian Medical Association 25% Concession',
        description: 'National concession for verified clinical practitioners and IMA council members.',
        discountType: 'percentage',
        discountValue: 25,
        maxDiscountINR: 2000,
        minOrderAmountINR: 3000,
        startDate: new Date(),
        endDate: new Date('2028-12-31T23:59:59.999Z'),
        usageLimit: 1000,
        usageCount: 0,
        perUserLimit: 1,
        applicablePlans: ['ALL'],
        applicableUserTypes: ['DOCTOR'],
        isActive: true,
      },
      {
        code: 'STUDENT-SPECIAL',
        title: 'Academic Scholar 30% Concession',
        description: 'Subsidized academic discount for medical and pharmacy undergraduate scholars.',
        discountType: 'percentage',
        discountValue: 30,
        maxDiscountINR: 1000,
        minOrderAmountINR: 1000,
        startDate: new Date(),
        endDate: new Date('2029-12-31T23:59:59.999Z'),
        usageLimit: 5000,
        usageCount: 0,
        perUserLimit: 1,
        applicablePlans: ['NFI-STUDENT-SPECIAL', 'NFI-INDIVIDUAL'],
        applicableUserTypes: ['STUDENT'],
        isActive: true,
      },
      {
        code: 'CAMPUS-FLAT5000',
        title: 'Institutional Campus Flat ₹5,000 Grant',
        description: 'Flat fee concession on multi-seat campus licenses for medical colleges.',
        discountType: 'fixed_amount',
        discountValue: 5000,
        maxDiscountINR: 0,
        minOrderAmountINR: 40000,
        startDate: new Date(),
        endDate: new Date('2027-12-31T23:59:59.999Z'),
        usageLimit: 200,
        usageCount: 0,
        perUserLimit: 2,
        applicablePlans: ['NFI-INSTITUTIONAL'],
        applicableUserTypes: ['INDUSTRY', 'OTHERS'],
        isActive: true,
      },
      {
        code: 'PHARMA-WELCOME15',
        title: 'Welcome Formulary 15% Pass',
        description: 'Introductory concession for newly registered pharmacists and healthcare officers.',
        discountType: 'percentage',
        discountValue: 15,
        maxDiscountINR: 1500,
        minOrderAmountINR: 2000,
        startDate: new Date(),
        endDate: new Date('2028-06-30T23:59:59.999Z'),
        usageLimit: 2500,
        usageCount: 0,
        perUserLimit: 1,
        applicablePlans: ['ALL'],
        applicableUserTypes: ['PHARMACIST', 'NURSE', 'OTHERS'],
        isActive: true,
      },
    ];

    for (const c of defaultCoupons) {
      await Coupon.findOneAndUpdate({ code: c.code }, c, { upsert: true, new: true });
    }
  },

  /**
   * Aggregate KPI Statistics for Coupons & Discounts
   */
  getCouponStats: async () => {
    const now = new Date();
    const [totalCount, activeCount, expiredCount, usageAgg] = await Promise.all([
      Coupon.countDocuments(),
      Coupon.countDocuments({ isActive: true, endDate: { $gt: now } }),
      Coupon.countDocuments({ $or: [{ isActive: false }, { endDate: { $lte: now } }] }),
      Coupon.aggregate([
        { $unwind: { path: '$redemptionHistory', preserveNullAndEmptyArrays: true } },
        {
          $group: {
            _id: null,
            totalRedemptions: { $sum: { $cond: [{ $ifNull: ['$redemptionHistory', false] }, 1, 0] } },
            totalDiscountSaved: { $sum: '$redemptionHistory.discountApplied' },
          },
        },
      ]),
    ]);

    const totalRedemptions = usageAgg[0]?.totalRedemptions || 0;
    const totalDiscountSaved = usageAgg[0]?.totalDiscountSaved || 0;

    return {
      totalCoupons: totalCount,
      activeCoupons: activeCount,
      expiredOrInactive: expiredCount,
      totalRedemptions,
      totalDiscountSavedINR: totalDiscountSaved,
    };
  },

  /**
   * List, Search, and Filter Coupons
   */
  getCouponsList: async ({
    search = '',
    discountType = 'all',
    status = 'all',
    userType = 'all',
    page = 1,
    limit = 10,
    sortBy = 'createdAt',
    sortOrder = 'desc',
  }) => {
    const query = {};
    const now = new Date();

    if (search && search.trim()) {
      const searchRegex = new RegExp(search.trim(), 'i');
      query.$or = [{ code: searchRegex }, { title: searchRegex }, { description: searchRegex }];
    }

    if (discountType && discountType !== 'all') {
      query.discountType = discountType;
    }

    if (userType && userType !== 'all') {
      query.applicableUserTypes = { $in: [userType.toUpperCase(), 'ALL'] };
    }

    if (status === 'active') {
      query.isActive = true;
      query.endDate = { $gt: now };
    } else if (status === 'expired') {
      query.endDate = { $lte: now };
    } else if (status === 'inactive') {
      query.isActive = false;
    } else if (status === 'expiring_soon') {
      const threshold = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
      query.isActive = true;
      query.endDate = { $gte: now, $lte: threshold };
    }

    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1;

    const pageNumber = Math.max(1, parseInt(page, 10));
    const pageSize = Math.max(1, Math.min(100, parseInt(limit, 10)));
    const skip = (pageNumber - 1) * pageSize;

    let [coupons, total] = await Promise.all([
      Coupon.find(query)
        .sort(sortOptions)
        .skip(skip)
        .limit(pageSize)
        .populate('specificUsers', 'name email username userType')
        .lean(),
      Coupon.countDocuments(query),
    ]);

    if (coupons.length === 0 && !search && discountType === 'all' && status === 'all') {
      await couponService.seedDefaultCoupons();
      [coupons, total] = await Promise.all([
        Coupon.find(query)
          .sort(sortOptions)
          .skip(skip)
          .limit(pageSize)
          .populate('specificUsers', 'name email username userType')
          .lean(),
        Coupon.countDocuments(query),
      ]);
    }

    const totalPages = Math.ceil(total / pageSize) || 1;

    return {
      coupons,
      pagination: {
        total,
        page: pageNumber,
        limit: pageSize,
        totalPages,
      },
    };
  },

  /**
   * Get Single Coupon by ID
   */
  getCouponById: async (id) => {
    const coupon = await Coupon.findById(id)
      .populate('specificUsers', 'name email username userType')
      .populate('createdBy', 'name email role');

    if (!coupon) throw new Error('Coupon record not found');
    return coupon;
  },

  /**
   * Create New Coupon
   */
  createCoupon: async (data, adminUser) => {
    const {
      code,
      title,
      description = '',
      discountType = 'percentage',
      discountValue,
      maxDiscountINR = 0,
      minOrderAmountINR = 0,
      startDate = new Date(),
      endDate,
      usageLimit = 0,
      perUserLimit = 1,
      applicablePlans = ['ALL'],
      applicableUserTypes = ['ALL'],
      specificUsers = [],
      specificEmails = [],
    } = data;

    const cleanCode = code.toUpperCase().trim();

    const existing = await Coupon.findOne({ code: cleanCode });
    if (existing) throw new Error(`A coupon with code '${cleanCode}' already exists.`);

    const newCoupon = await Coupon.create({
      code: cleanCode,
      title: title.trim(),
      description: description.trim(),
      discountType,
      discountValue: Number(discountValue),
      maxDiscountINR: Number(maxDiscountINR),
      minOrderAmountINR: Number(minOrderAmountINR),
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      usageLimit: Number(usageLimit),
      usageCount: 0,
      perUserLimit: Number(perUserLimit),
      applicablePlans,
      applicableUserTypes,
      specificUsers,
      specificEmails: specificEmails.map((e) => e.toLowerCase().trim()),
      isActive: true,
      createdBy: adminUser?._id || null,
    });

    return newCoupon;
  },

  /**
   * Update Coupon
   */
  updateCoupon: async (id, data) => {
    const coupon = await Coupon.findById(id);
    if (!coupon) throw new Error('Coupon not found');

    const {
      title,
      description,
      discountType,
      discountValue,
      maxDiscountINR,
      minOrderAmountINR,
      startDate,
      endDate,
      usageLimit,
      perUserLimit,
      applicablePlans,
      applicableUserTypes,
      specificUsers,
      specificEmails,
    } = data;

    if (title) coupon.title = title.trim();
    if (description !== undefined) coupon.description = description.trim();
    if (discountType) coupon.discountType = discountType;
    if (discountValue !== undefined) coupon.discountValue = Number(discountValue);
    if (maxDiscountINR !== undefined) coupon.maxDiscountINR = Number(maxDiscountINR);
    if (minOrderAmountINR !== undefined) coupon.minOrderAmountINR = Number(minOrderAmountINR);
    if (startDate) coupon.startDate = new Date(startDate);
    if (endDate) coupon.endDate = new Date(endDate);
    if (usageLimit !== undefined) coupon.usageLimit = Number(usageLimit);
    if (perUserLimit !== undefined) coupon.perUserLimit = Number(perUserLimit);
    if (applicablePlans) coupon.applicablePlans = applicablePlans;
    if (applicableUserTypes) coupon.applicableUserTypes = applicableUserTypes;
    if (specificUsers) coupon.specificUsers = specificUsers;
    if (specificEmails) coupon.specificEmails = specificEmails.map((e) => e.toLowerCase().trim());

    await coupon.save();
    return coupon;
  },

  /**
   * Toggle Coupon Active Status
   */
  toggleCouponStatus: async (id, isActive) => {
    const coupon = await Coupon.findById(id);
    if (!coupon) throw new Error('Coupon not found');

    coupon.isActive = !!isActive;
    await coupon.save();
    return coupon;
  },

  /**
   * Core Server-Side Calculation Engine: Validate & Calculate Discount
   */
  validateAndApplyCoupon: async ({
    code,
    orderAmount,
    userId = null,
    userEmail = '',
    userType = '',
    planCode = '',
  }) => {
    const cleanCode = (code || '').toUpperCase().trim();
    const coupon = await Coupon.findOne({ code: cleanCode });

    if (!coupon) {
      throw new Error(`Invalid voucher code '${cleanCode}'. Please check and try again.`);
    }

    if (!coupon.isActive) {
      throw new Error(`Voucher '${cleanCode}' is currently inactive or disabled.`);
    }

    const now = new Date();
    if (now < new Date(coupon.startDate)) {
      throw new Error(`Voucher '${cleanCode}' is not yet active. Valid starting ${coupon.startDate.toDateString()}.`);
    }

    if (now > new Date(coupon.endDate)) {
      throw new Error(`Voucher '${cleanCode}' expired on ${coupon.endDate.toDateString()}.`);
    }

    // Check Global Usage Limit
    if (coupon.usageLimit > 0 && coupon.usageCount >= coupon.usageLimit) {
      throw new Error(`Voucher '${cleanCode}' has reached its maximum allowable redemption limit.`);
    }

    // Check Minimum Order Amount
    const amount = Number(orderAmount);
    if (coupon.minOrderAmountINR > 0 && amount < coupon.minOrderAmountINR) {
      throw new Error(`Order amount (₹${amount}) does not meet the minimum requirement of ₹${coupon.minOrderAmountINR} for this voucher.`);
    }

    // Check Plan Applicability
    if (
      planCode &&
      coupon.applicablePlans.length > 0 &&
      !coupon.applicablePlans.includes('ALL') &&
      !coupon.applicablePlans.includes(planCode)
    ) {
      throw new Error(`Voucher '${cleanCode}' is not applicable to the selected plan (${planCode}).`);
    }

    // Check User Type Applicability
    if (
      userType &&
      coupon.applicableUserTypes.length > 0 &&
      !coupon.applicableUserTypes.includes('ALL') &&
      !coupon.applicableUserTypes.includes(userType.toUpperCase())
    ) {
      throw new Error(`Voucher '${cleanCode}' is exclusively reserved for ${coupon.applicableUserTypes.join(', ')} users.`);
    }

    // Check Specific Users Target
    if (coupon.specificUsers && coupon.specificUsers.length > 0) {
      const isUserMatched = userId && coupon.specificUsers.some((u) => u.toString() === userId.toString());
      if (!isUserMatched) {
        throw new Error(`This voucher code is targeted to specific designated accounts only.`);
      }
    }

    // Check Specific Email Domains Target
    if (coupon.specificEmails && coupon.specificEmails.length > 0) {
      const emailLower = (userEmail || '').toLowerCase().trim();
      const isEmailMatched = coupon.specificEmails.some((pattern) => {
        if (pattern.startsWith('@')) return emailLower.endsWith(pattern);
        return emailLower === pattern;
      });

      if (!isEmailMatched) {
        throw new Error(`Voucher is restricted to designated institutional email addresses.`);
      }
    }

    // Check Per-User Redemption Limit
    if (userId && coupon.redemptionHistory && coupon.redemptionHistory.length > 0) {
      const userRedemptions = coupon.redemptionHistory.filter(
        (r) => r.user?.toString() === userId.toString()
      ).length;

      if (userRedemptions >= coupon.perUserLimit) {
        throw new Error(`You have already redeemed voucher '${cleanCode}' the maximum permitted ${coupon.perUserLimit} time(s).`);
      }
    }

    // Calculate Discount Amount
    let discountApplied = 0;
    if (coupon.discountType === 'percentage') {
      discountApplied = Math.round((amount * coupon.discountValue) / 100);
      if (coupon.maxDiscountINR > 0 && discountApplied > coupon.maxDiscountINR) {
        discountApplied = coupon.maxDiscountINR;
      }
    } else if (coupon.discountType === 'fixed_amount') {
      discountApplied = Math.min(amount, coupon.discountValue);
    }

    const finalAmount = Math.max(0, amount - discountApplied);

    return {
      couponId: coupon._id,
      code: coupon.code,
      title: coupon.title,
      discountType: coupon.discountType,
      discountValue: coupon.discountValue,
      originalAmount: amount,
      discountApplied,
      finalAmount,
      savingsMessage: `Saved ₹${discountApplied.toLocaleString('en-IN')} with voucher ${coupon.code}!`,
    };
  },

  /**
   * Direct User / Email Discount Assignment
   */
  assignDirectDiscount: async (payload, adminUser) => {
    const { userId, email, discountType = 'percentage', discountValue = 20, endDate, notes = '' } = payload;

    const subscriber = userId ? await Subscriber.findById(userId) : await Subscriber.findOne({ email: email.toLowerCase() });
    if (!subscriber) throw new Error('Subscriber account not found for direct concession');

    const code = `DIRECT-${subscriber.username?.toUpperCase() || Date.now().toString().slice(-6)}`;

    const newCoupon = await Coupon.create({
      code,
      title: `Direct Concession for ${subscriber.name}`,
      description: notes || 'Direct administrative concession assignment',
      discountType,
      discountValue: Number(discountValue),
      startDate: new Date(),
      endDate: new Date(endDate || new Date(Date.now() + 90 * 24 * 60 * 60 * 1000)),
      usageLimit: 1,
      perUserLimit: 1,
      applicablePlans: ['ALL'],
      applicableUserTypes: ['ALL'],
      specificUsers: [subscriber._id],
      specificEmails: [subscriber.email],
      isActive: true,
      createdBy: adminUser?._id || null,
    });

    return newCoupon;
  },
};

export default couponService;
