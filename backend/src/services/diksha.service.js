import DikshaCourse from '../models/dikshaCourse.model.js';
import DikshaEnrollment from '../models/dikshaEnrollment.model.js';
import Subscriber from '../models/subscriber.model.js';
import User from '../models/user.model.js';

export const dikshaService = {
  /**
   * Seed default courses (Disabled to keep courses and stats 100% dynamic)
   */
  seedDefaultCourses: async () => {
    // Disabled: Courses and stats are strictly dynamic from database
    return;
  },

  /**
   * List courses with filtering & pagination
   */
  getCoursesList: async ({
    search = '',
    category = 'all',
    status = 'all',
    pricing = 'all',
    page = 1,
    limit = 10,
    sortBy = 'createdAt',
    sortOrder = 'desc',
  } = {}) => {
    const query = {};

    if (search && search.trim()) {
      const safe = search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(safe, 'i');
      query.$or = [{ title: regex }, { code: regex }, { description: regex }];
    }

    if (category && category !== 'all') {
      query.category = category;
    }

    if (status && status !== 'all') {
      query.status = status.toUpperCase();
    }

    if (pricing && pricing !== 'all') {
      if (pricing === 'FREE') query['pricing.isPaid'] = false;
      if (pricing === 'PAID') query['pricing.isPaid'] = true;
    }

    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1;

    const pageNum = Math.max(1, parseInt(page, 10));
    const pageSize = Math.max(1, Math.min(100, parseInt(limit, 10)));
    const skip = (pageNum - 1) * pageSize;

    const [courses, total] = await Promise.all([
      DikshaCourse.find(query).sort(sortOptions).skip(skip).limit(pageSize).lean(),
      DikshaCourse.countDocuments(query),
    ]);

    // Dynamically calculate course stats from real DikshaEnrollment records
    const courseIds = courses.map((c) => c._id);
    const enrollmentStats = courseIds.length > 0
      ? await DikshaEnrollment.aggregate([
          { $match: { course: { $in: courseIds } } },
          {
            $group: {
              _id: '$course',
              enrolledCount: { $sum: 1 },
              completedCount: {
                $sum: { $cond: [{ $eq: ['$status', 'COMPLETED'] }, 1, 0] },
              },
              totalRevenueINR: { $sum: { $ifNull: ['$payment.amountPaidINR', 0] } },
              avgScorePercent: { $avg: '$assessmentScore' },
            },
          },
        ])
      : [];

    const statsMap = new Map();
    enrollmentStats.forEach((st) => {
      statsMap.set(st._id.toString(), {
        enrolledCount: st.enrolledCount || 0,
        completedCount: st.completedCount || 0,
        totalRevenueINR: st.totalRevenueINR || 0,
        avgScorePercent: st.avgScorePercent ? Math.round(st.avgScorePercent) : 0,
      });
    });

    const enrichedCourses = courses.map((c) => ({
      ...c,
      stats: statsMap.get(c._id.toString()) || {
        enrolledCount: 0,
        completedCount: 0,
        totalRevenueINR: 0,
        avgScorePercent: 0,
      },
    }));

    return {
      courses: enrichedCourses,
      pagination: {
        total,
        page: pageNum,
        limit: pageSize,
        totalPages: Math.ceil(total / pageSize) || 1,
      },
    };
  },

  /**
   * Get single course details with live dynamic stats
   */
  getCourseById: async (courseId) => {
    const course = await DikshaCourse.findById(courseId).lean();
    if (!course) {
      throw new Error('DIKSHA Course not found.');
    }

    const enrollmentStats = await DikshaEnrollment.aggregate([
      { $match: { course: course._id } },
      {
        $group: {
          _id: '$course',
          enrolledCount: { $sum: 1 },
          completedCount: {
            $sum: { $cond: [{ $eq: ['$status', 'COMPLETED'] }, 1, 0] },
          },
          totalRevenueINR: { $sum: { $ifNull: ['$payment.amountPaidINR', 0] } },
          avgScorePercent: { $avg: '$assessmentScore' },
        },
      },
    ]);

    const dynStats = enrollmentStats[0]
      ? {
          enrolledCount: enrollmentStats[0].enrolledCount || 0,
          completedCount: enrollmentStats[0].completedCount || 0,
          totalRevenueINR: enrollmentStats[0].totalRevenueINR || 0,
          avgScorePercent: enrollmentStats[0].avgScorePercent
            ? Math.round(enrollmentStats[0].avgScorePercent)
            : 0,
        }
      : {
          enrolledCount: 0,
          completedCount: 0,
          totalRevenueINR: 0,
          avgScorePercent: 0,
        };

    return {
      ...course,
      stats: dynStats,
    };
  },

  /**
   * Create course
   */
  createCourse: async (data, creatorUser = null) => {
    const existing = await DikshaCourse.findOne({ code: data.code.trim().toUpperCase() });
    if (existing) {
      throw new Error(`Course with code "${data.code}" already exists.`);
    }

    if (data.pricing?.isPaid) {
      const price = Number(data.pricing.priceINR) || 0;
      const discount = Number(data.pricing.discountPriceINR) || 0;
      if (price <= 0) {
        throw new Error('Standard enrollment fee must be greater than 0 for commercial paid courses.');
      }
      if (discount > price) {
        throw new Error(`Special discounted fee (₹${discount}) cannot exceed the standard enrollment fee (₹${price}).`);
      }
    }

    const newCourse = new DikshaCourse({
      ...data,
      code: data.code.trim().toUpperCase(),
      createdBy: creatorUser?._id || null,
    });

    return await newCourse.save();
  },

  /**
   * Update course
   */
  updateCourse: async (courseId, data) => {
    if (data.code) {
      const existing = await DikshaCourse.findOne({
        code: data.code.trim().toUpperCase(),
        _id: { $ne: courseId },
      });
      if (existing) {
        throw new Error(`Course with code "${data.code}" already exists on another course.`);
      }
      data.code = data.code.trim().toUpperCase();
    }

    if (data.pricing?.isPaid) {
      const price = Number(data.pricing.priceINR) || 0;
      const discount = Number(data.pricing.discountPriceINR) || 0;
      if (price <= 0) {
        throw new Error('Standard enrollment fee must be greater than 0 for commercial paid courses.');
      }
      if (discount > price) {
        throw new Error(`Special discounted fee (₹${discount}) cannot exceed the standard enrollment fee (₹${price}).`);
      }
    }

    const updated = await DikshaCourse.findByIdAndUpdate(courseId, { $set: data }, { new: true, runValidators: true });
    if (!updated) {
      throw new Error('Course not found.');
    }
    return updated;
  },

  /**
   * Delete course
   */
  deleteCourse: async (courseId) => {
    const deleted = await DikshaCourse.findByIdAndDelete(courseId);
    if (!deleted) {
      throw new Error('Course not found.');
    }
    // Clean enrollments associated with this course
    await DikshaEnrollment.deleteMany({ course: courseId });
    return deleted;
  },

  /**
   * Toggle status directly (admin/superadmin override)
   */
  toggleCourseStatus: async (courseId, newStatus) => {
    const validStatuses = [
      'DRAFT',
      'UNDER_REVIEW',
      'NEEDS_REVISION',
      'REVIEWED',
      'APPROVED',
      'REJECTED',
      'PUBLISHED',
      'ARCHIVED',
    ];
    if (!validStatuses.includes(newStatus)) {
      throw new Error('Invalid course status.');
    }
    const updated = await DikshaCourse.findByIdAndUpdate(
      courseId,
      { $set: { status: newStatus } },
      { new: true }
    );
    if (!updated) throw new Error('Course not found.');
    return updated;
  },

  /**
   * Step 1: Submit for Review (Maker/Editor Action)
   */
  submitForReview: async (courseId, user, comments = '') => {
    const course = await DikshaCourse.findById(courseId);
    if (!course) throw new Error('Course not found.');

    const prevStatus = course.status;
    course.status = 'UNDER_REVIEW';
    course.submittedBy = user?._id || null;
    course.submittedAt = new Date();

    const performerName = user?.name || user?.fullName || user?.email || 'Admin';
    const roleName = user?.role?.name || user?.role || 'Maker';

    course.workflowHistory.push({
      action: 'SUBMIT_FOR_REVIEW',
      performedBy: user?._id || null,
      performerName,
      roleName,
      previousStatus: prevStatus,
      newStatus: 'UNDER_REVIEW',
      comments: comments || 'Submitted course for reviewer inspection.',
      timestamp: new Date(),
    });

    return await course.save();
  },

  /**
   * Step 2: Reviewer Action (Approve Review / Request Revision / Reject)
   */
  reviewCourse: async (courseId, { decision, comments }, user) => {
    const course = await DikshaCourse.findById(courseId);
    if (!course) throw new Error('Course not found.');

    const prevStatus = course.status;
    let nextStatus = 'REVIEWED';
    let actionLabel = 'REVIEW_APPROVED';

    if (decision === 'REQUEST_REVISION') {
      nextStatus = 'NEEDS_REVISION';
      actionLabel = 'REQUEST_REVISION';
    } else if (decision === 'REJECT') {
      nextStatus = 'REJECTED';
      actionLabel = 'REVIEW_REJECTED';
    }

    course.status = nextStatus;
    course.reviewedBy = user?._id || null;
    course.reviewedAt = new Date();

    const performerName = user?.name || user?.fullName || user?.email || 'Reviewer';
    const roleName = user?.role?.name || user?.role || 'Reviewer';

    course.workflowHistory.push({
      action: actionLabel,
      performedBy: user?._id || null,
      performerName,
      roleName,
      previousStatus: prevStatus,
      newStatus: nextStatus,
      comments: comments || (decision === 'APPROVE' ? 'Course verified and approved by Reviewer.' : 'Revision requested.'),
      timestamp: new Date(),
    });

    return await course.save();
  },

  /**
   * Step 3: Approver Action (Final Approve & Publish / Reject)
   */
  approveCourse: async (courseId, { decision, comments }, user) => {
    const course = await DikshaCourse.findById(courseId);
    if (!course) throw new Error('Course not found.');

    const prevStatus = course.status;
    let nextStatus = 'PUBLISHED';
    let actionLabel = 'FINAL_APPROVED_PUBLISHED';

    if (decision === 'REJECT') {
      nextStatus = 'REJECTED';
      actionLabel = 'FINAL_REJECTED';
    } else if (decision === 'REQUEST_REVISION') {
      nextStatus = 'NEEDS_REVISION';
      actionLabel = 'FINAL_REQUEST_REVISION';
    }

    course.status = nextStatus;
    course.approvedBy = user?._id || null;
    course.approvedAt = new Date();

    const performerName = user?.name || user?.fullName || user?.email || 'Approver';
    const roleName = user?.role?.name || user?.role || 'Approver';

    course.workflowHistory.push({
      action: actionLabel,
      performedBy: user?._id || null,
      performerName,
      roleName,
      previousStatus: prevStatus,
      newStatus: nextStatus,
      comments: comments || (decision === 'APPROVE_PUBLISH' ? 'Final approval granted. Course published live to subscribers.' : 'Course rejected by Approver.'),
      timestamp: new Date(),
    });

    return await course.save();
  },

  /**
   * Get Aggregate KPI Statistics (100% dynamic from real database collections)
   */
  getDikshaStats: async () => {
    const [
      totalCourses,
      publishedCourses,
      draftCourses,
      underReviewCourses,
      needsRevisionCourses,
      pendingApprovalCourses,
      totalEnrolled,
      totalCompleted,
      enrollmentsAgg,
    ] = await Promise.all([
      DikshaCourse.countDocuments(),
      DikshaCourse.countDocuments({ status: 'PUBLISHED' }),
      DikshaCourse.countDocuments({ status: 'DRAFT' }),
      DikshaCourse.countDocuments({ status: 'UNDER_REVIEW' }),
      DikshaCourse.countDocuments({ status: 'NEEDS_REVISION' }),
      DikshaCourse.countDocuments({ status: 'REVIEWED' }),
      DikshaEnrollment.countDocuments(),
      DikshaEnrollment.countDocuments({ status: 'COMPLETED' }),
      DikshaEnrollment.aggregate([
        {
          $group: {
            _id: null,
            totalRevenue: { $sum: { $ifNull: ['$payment.amountPaidINR', 0] } },
            avgScore: { $avg: '$assessmentScore' },
          },
        },
      ]),
    ]);

    const completionRate = totalEnrolled > 0 ? Math.round((totalCompleted / totalEnrolled) * 100) : 0;
    const totalRevenue = enrollmentsAgg[0]?.totalRevenue || 0;
    const avgScore = enrollmentsAgg[0]?.avgScore ? Math.round(enrollmentsAgg[0].avgScore) : 0;

    return {
      totalCourses,
      publishedCourses,
      draftCourses,
      underReviewCourses,
      needsRevisionCourses,
      pendingApprovalCourses,
      totalEnrolled,
      totalCompleted,
      completionRate,
      totalRevenue,
      avgScore,
    };
  },

  /**
   * Get Enrollments List
   */
  getEnrollmentsList: async ({
    courseId = null,
    search = '',
    status = 'all',
    page = 1,
    limit = 10,
  } = {}) => {
    const query = {};
    if (courseId) query.course = courseId;
    if (status && status !== 'all') query.status = status.toUpperCase();

    const pageNum = Math.max(1, parseInt(page, 10));
    const pageSize = Math.max(1, Math.min(100, parseInt(limit, 10)));
    const skip = (pageNum - 1) * pageSize;

    const [enrollments, total] = await Promise.all([
      DikshaEnrollment.find(query)
        .populate('course', 'title code pricing')
        .populate('subscriber', 'name email userType role organization department designation')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(pageSize)
        .lean(),
      DikshaEnrollment.countDocuments(query),
    ]);

    return {
      enrollments,
      pagination: {
        total,
        page: pageNum,
        limit: pageSize,
        totalPages: Math.ceil(total / pageSize) || 1,
      },
    };
  },
};

export default dikshaService;
