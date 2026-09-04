import DikshaCourse from '../models/dikshaCourse.model.js';
import DikshaEnrollment from '../models/dikshaEnrollment.model.js';
import Subscriber from '../models/subscriber.model.js';

const DEFAULT_COURSES_SEED = [
  {
    code: 'DIKSHA-NFI-01',
    title: 'Orientation to National Formulary of India (NFI) & Rational Drug Usage',
    description: 'Foundational certification programme covering NFI 9th Edition structure, digital monograph search, and clinical pharmacology principles.',
    thumbnailUrl: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=600&auto=format&fit=crop&q=60',
    category: 'NFI_ORIENTATION',
    targetAudience: ['DOCTOR', 'PHARMACIST', 'STUDENT', 'NURSE', 'INDUSTRY', 'OTHERS'],
    status: 'PUBLISHED',
    pricing: {
      isPaid: false,
      priceINR: 0,
      discountPriceINR: 0,
    },
    videos: [
      {
        title: 'Welcome & NFI Portal Architecture Guide',
        youtubeUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        durationMinutes: 8,
        isHelpVideo: true,
        order: 1,
      },
      {
        title: 'Navigating Digital Drug Monographs & Therapeutic Indexes',
        youtubeUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        durationMinutes: 14,
        isHelpVideo: true,
        order: 2,
      },
      {
        title: 'Principles of Rational Prescribing in Primary Healthcare',
        youtubeUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        durationMinutes: 22,
        isHelpVideo: false,
        order: 3,
      },
    ],
    materials: [
      {
        title: 'NFI 9th Edition Orientation Syllabus & User Handbook',
        fileUrl: 'https://ipc.gov.in/documents/nfi-guide.pdf',
        type: 'PDF',
      },
    ],
    assessment: {
      enabled: true,
      title: 'NFI Orientation MCQ Certification Exam',
      timeLimitMinutes: 15,
      passingScorePercent: 70,
      questions: [
        {
          questionText: 'What is the primary governing objective of the National Formulary of India (NFI)?',
          options: [
            'Commercial marketing of generic formulations',
            'Promotion of rational use of medicines in healthcare practice',
            'Fixing maximum retail prices for schedule drugs',
            'Import licensing for foreign active pharmaceutical ingredients',
          ],
          correctOptionIndex: 1,
          explanation: 'NFI is published by IPC to guide clinicians, pharmacists, and nurses on rational drug prescribing and patient safety.',
          points: 1,
        },
        {
          questionText: 'Which publication year corresponds to the official 9th Edition of the NFI?',
          options: ['2021', '2024', '2026', '2030'],
          correctOptionIndex: 2,
          explanation: 'The current official digital edition is NFI 9th Edition 2026.',
          points: 1,
        },
        {
          questionText: 'In an NFI digital monograph, where are pediatric and geriatric dosages documented?',
          options: [
            'Therapeutic Indications & Posology section',
            'Financial schedule index',
            'Packaging guidelines appendix',
            'Pharmacopoeial manufacturer list',
          ],
          correctOptionIndex: 0,
          explanation: 'Posology and dosage modifications appear under the Indications & Dosages section.',
          points: 1,
        },
      ],
    },
    certificate: {
      enabled: true,
      title: 'Certificate of Competency in National Formulary of India (NFI)',
      validityMonths: 24,
      signatoryName: 'Secretary-cum-Scientific Director',
      signatoryTitle: 'Indian Pharmacopoeia Commission (IPC)',
    },
    stats: {
      enrolledCount: 128,
      completedCount: 94,
      totalRevenueINR: 0,
      avgScorePercent: 82,
    },
  },
  {
    code: 'DIKSHA-PV-02',
    title: 'Pharmacovigilance & Adverse Drug Reaction (ADR) Reporting Protocol',
    description: 'Advanced masterclass for clinical pharmacists and doctors on detecting, evaluating, and submitting ADR reports to the PvPI national center.',
    thumbnailUrl: 'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?w=600&auto=format&fit=crop&q=60',
    category: 'PHARMACOVIGILANCE',
    targetAudience: ['DOCTOR', 'PHARMACIST', 'NURSE', 'STUDENT'],
    status: 'PUBLISHED',
    pricing: {
      isPaid: true,
      priceINR: 499,
      discountPriceINR: 349,
    },
    videos: [
      {
        title: 'Overview of Pharmacovigilance Programme of India (PvPI)',
        youtubeUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        durationMinutes: 18,
        isHelpVideo: false,
        order: 1,
      },
      {
        title: 'Suspected ADR Yellow Form & Electronic VigiFlow Submission',
        youtubeUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        durationMinutes: 25,
        isHelpVideo: false,
        order: 2,
      },
    ],
    materials: [
      {
        title: 'PvPI Standard Operating Procedure & Causality Assessment Form',
        fileUrl: 'https://ipc.gov.in/documents/pvpi-sop.pdf',
        type: 'PDF',
      },
    ],
    assessment: {
      enabled: true,
      title: 'PvPI ADR Surveillance Assessment',
      timeLimitMinutes: 20,
      passingScorePercent: 75,
      questions: [
        {
          questionText: 'Who is designated as the National Coordinating Centre (NCC) for the Pharmacovigilance Programme of India?',
          options: [
            'All India Institute of Medical Sciences (AIIMS)',
            'Indian Pharmacopoeia Commission (IPC), Ghaziabad',
            'Central Drugs Standard Control Organisation (CDSCO)',
            'Indian Council of Medical Research (ICMR)',
          ],
          correctOptionIndex: 1,
          explanation: 'IPC Ghaziabad operates as the National Coordinating Centre for PvPI under MoHFW.',
          points: 1,
        },
        {
          questionText: 'Which causality assessment algorithm is most widely applied in national ADR reporting?',
          options: [
            'WHO-UMC Causality Scale',
            'Glasgow Coma Scale',
            'APGAR Score Metric',
            'Hounsfield Unit Index',
          ],
          correctOptionIndex: 0,
          explanation: 'The WHO-UMC system is standard for causality categorization.',
          points: 1,
        },
      ],
    },
    certificate: {
      enabled: true,
      title: 'Certificate of Excellence in Pharmacovigilance & ADR Surveillance',
      validityMonths: 36,
      signatoryName: 'Officer-in-Charge, PvPI',
      signatoryTitle: 'National Coordinating Centre, IPC',
    },
    stats: {
      enrolledCount: 65,
      completedCount: 48,
      totalRevenueINR: 22685,
      avgScorePercent: 88,
    },
  },
  {
    code: 'DIKSHA-MED-03',
    title: 'Medication Safety & High-Alert Drug Management in Hospital Wards',
    description: 'Specialized clinical module on look-alike sound-alike (LASA) medications, concentrated electrolytes, and high-risk pediatric dosage calculations.',
    thumbnailUrl: 'https://images.unsplash.com/photo-1532938911079-1b06ac7ceec7?w=600&auto=format&fit=crop&q=60',
    category: 'MEDICATION_SAFETY',
    targetAudience: ['DOCTOR', 'PHARMACIST', 'NURSE'],
    status: 'DRAFT',
    pricing: {
      isPaid: true,
      priceINR: 799,
      discountPriceINR: 599,
    },
    videos: [
      {
        title: 'Managing Look-Alike Sound-Alike (LASA) Drug Inventories',
        youtubeUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        durationMinutes: 16,
        isHelpVideo: false,
        order: 1,
      },
    ],
    materials: [],
    assessment: {
      enabled: true,
      title: 'Hospital Medication Safety Quiz',
      timeLimitMinutes: 10,
      passingScorePercent: 80,
      questions: [
        {
          questionText: 'Which technique is recommended by safety guidelines to differentiate LASA drug names on pharmacy shelves?',
          options: [
            'Tall Man Lettering',
            'Italicized font only',
            'Underlining all vowels',
            'Alphabetical storage without warning stickers',
          ],
          correctOptionIndex: 0,
          explanation: 'Tall Man Lettering uses capitalized portions to highlight unique syllable differences (e.g., DOPamine vs DoBUTamine).',
          points: 1,
        },
      ],
    },
    certificate: {
      enabled: true,
      title: 'Certificate in Hospital Medication Safety Standards',
      validityMonths: 12,
      signatoryName: 'Secretary-cum-Scientific Director',
      signatoryTitle: 'Indian Pharmacopoeia Commission (IPC)',
    },
    stats: {
      enrolledCount: 0,
      completedCount: 0,
      totalRevenueINR: 0,
      avgScorePercent: 0,
    },
  },
];

export const dikshaService = {
  /**
   * Seed default courses if collection is empty
   */
  seedDefaultCourses: async () => {
    const count = await DikshaCourse.countDocuments();
    if (count === 0) {
      await DikshaCourse.insertMany(DEFAULT_COURSES_SEED);
    }
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
    await dikshaService.seedDefaultCourses();

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

    return {
      courses,
      pagination: {
        total,
        page: pageNum,
        limit: pageSize,
        totalPages: Math.ceil(total / pageSize) || 1,
      },
    };
  },

  /**
   * Get single course details
   */
  getCourseById: async (courseId) => {
    const course = await DikshaCourse.findById(courseId).lean();
    if (!course) {
      throw new Error('DIKSHA Course not found.');
    }
    return course;
  },

  /**
   * Create course
   */
  createCourse: async (data, creatorUser = null) => {
    const existing = await DikshaCourse.findOne({ code: data.code.trim().toUpperCase() });
    if (existing) {
      throw new Error(`Course with code "${data.code}" already exists.`);
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
   * Toggle status
   */
  toggleCourseStatus: async (courseId, newStatus) => {
    if (!['DRAFT', 'PUBLISHED', 'ARCHIVED'].includes(newStatus)) {
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
   * Get Aggregate KPI Statistics
   */
  getDikshaStats: async () => {
    await dikshaService.seedDefaultCourses();

    const [
      totalCourses,
      publishedCourses,
      draftCourses,
      coursesAgg,
      totalEnrollments,
      completedEnrollments,
    ] = await Promise.all([
      DikshaCourse.countDocuments(),
      DikshaCourse.countDocuments({ status: 'PUBLISHED' }),
      DikshaCourse.countDocuments({ status: 'DRAFT' }),
      DikshaCourse.aggregate([
        {
          $group: {
            _id: null,
            totalEnrolledSum: { $sum: '$stats.enrolledCount' },
            totalCompletedSum: { $sum: '$stats.completedCount' },
            totalRevenueSum: { $sum: '$stats.totalRevenueINR' },
            avgScore: { $avg: '$stats.avgScorePercent' },
          },
        },
      ]),
      DikshaEnrollment.countDocuments(),
      DikshaEnrollment.countDocuments({ status: 'COMPLETED' }),
    ]);

    const statsSum = coursesAgg[0] || {};
    const totalEnrolled = Math.max(statsSum.totalEnrolledSum || 0, totalEnrollments);
    const totalCompleted = Math.max(statsSum.totalCompletedSum || 0, completedEnrollments);
    const totalRevenue = statsSum.totalRevenueSum || 0;
    const avgScore = Math.round(statsSum.avgScore || 78);
    const completionRate = totalEnrolled > 0 ? Math.round((totalCompleted / totalEnrolled) * 100) : 0;

    return {
      totalCourses,
      publishedCourses,
      draftCourses,
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
        .populate('subscriber', 'name email userType organization')
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
