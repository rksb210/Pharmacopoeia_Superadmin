import dikshaService from '../services/diksha.service.js';
import { auditService } from '../services/audit.service.js';

/**
 * @desc    Get aggregated DIKSHA stats
 * @route   GET /api/diksha/stats
 * @access  Private (INTEGRATED:DIKSHA:VIEW)
 */
export const getStats = async (req, res, next) => {
  try {
    const stats = await dikshaService.getDikshaStats();
    return res.status(200).json({
      success: true,
      stats,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get courses list with pagination and search
 * @route   GET /api/diksha/courses
 * @access  Private (INTEGRATED:DIKSHA:VIEW)
 */
export const getCourses = async (req, res, next) => {
  try {
    const { search, category, status, pricing, page, limit, sortBy, sortOrder } = req.query;
    const result = await dikshaService.getCoursesList({
      search,
      category,
      status,
      pricing,
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

/**
 * @desc    Get single course details
 * @route   GET /api/diksha/courses/:id
 * @access  Private (INTEGRATED:DIKSHA:VIEW)
 */
export const getCourseById = async (req, res, next) => {
  try {
    const course = await dikshaService.getCourseById(req.params.id);
    return res.status(200).json({
      success: true,
      course,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Create new DIKSHA course
 * @route   POST /api/diksha/courses
 * @access  Private (INTEGRATED:DIKSHA:CREATE)
 */
export const createCourse = async (req, res, next) => {
  try {
    const course = await dikshaService.createCourse(req.body, req.user);

    // Tamper-Evident Audit Logging
    await auditService.log(req, {
      action: 'DIKSHA_COURSE_CREATED',
      module: 'INTEGRATED',
      entity: 'DikshaCourse',
      entityId: course._id,
      status: 'SUCCESS',
      details: `Created new DIKSHA Course "${course.title}" (${course.code}). Pricing: ${course.pricing?.isPaid ? `₹${course.pricing?.priceINR}` : 'Free'}. Assessment: ${course.assessment?.enabled ? 'Enabled' : 'Disabled'}.`,
      newValues: {
        code: course.code,
        title: course.title,
        status: course.status,
        pricing: course.pricing,
      },
    });

    return res.status(201).json({
      success: true,
      message: 'DIKSHA Course created successfully.',
      course,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update course
 * @route   PUT /api/diksha/courses/:id
 * @access  Private (INTEGRATED:DIKSHA:EDIT)
 */
export const updateCourse = async (req, res, next) => {
  try {
    const oldCourse = await dikshaService.getCourseById(req.params.id);
    const updated = await dikshaService.updateCourse(req.params.id, req.body);

    // Audit Log
    await auditService.log(req, {
      action: 'DIKSHA_COURSE_UPDATED',
      module: 'INTEGRATED',
      entity: 'DikshaCourse',
      entityId: updated._id,
      status: 'SUCCESS',
      details: `Updated DIKSHA Course "${updated.title}" (${updated.code}).`,
      oldValues: {
        title: oldCourse.title,
        status: oldCourse.status,
        pricing: oldCourse.pricing,
      },
      newValues: {
        title: updated.title,
        status: updated.status,
        pricing: updated.pricing,
      },
    });

    return res.status(200).json({
      success: true,
      message: 'DIKSHA Course updated successfully.',
      course: updated,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete course
 * @route   DELETE /api/diksha/courses/:id
 * @access  Private (INTEGRATED:DIKSHA:DELETE)
 */
export const deleteCourse = async (req, res, next) => {
  try {
    const course = await dikshaService.getCourseById(req.params.id);
    await dikshaService.deleteCourse(req.params.id);

    // Audit Log
    await auditService.log(req, {
      action: 'DIKSHA_COURSE_DELETED',
      module: 'INTEGRATED',
      entity: 'DikshaCourse',
      entityId: req.params.id,
      status: 'SUCCESS',
      details: `Deleted DIKSHA Course "${course.title}" (${course.code}).`,
    });

    return res.status(200).json({
      success: true,
      message: 'Course and related enrollments removed.',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Toggle course status (Draft / Published / Archived)
 * @route   PATCH /api/diksha/courses/:id/status
 * @access  Private (INTEGRATED:DIKSHA:EDIT)
 */
export const toggleStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const updated = await dikshaService.toggleCourseStatus(req.params.id, status);

    // Audit Log
    await auditService.log(req, {
      action: 'DIKSHA_COURSE_STATUS_CHANGED',
      module: 'INTEGRATED',
      entity: 'DikshaCourse',
      entityId: updated._id,
      status: 'SUCCESS',
      details: `Changed DIKSHA Course "${updated.title}" status to ${status}.`,
    });

    return res.status(200).json({
      success: true,
      message: `Course status changed to ${status}.`,
      course: updated,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Submit course for Review (Maker action)
 * @route   POST /api/diksha/courses/:id/submit-review
 * @access  Private (INTEGRATED:DIKSHA:EDIT)
 */
export const submitForReview = async (req, res, next) => {
  try {
    const { comments } = req.body;
    const course = await dikshaService.submitForReview(req.params.id, req.user, comments);

    await auditService.log(req, {
      action: 'DIKSHA_COURSE_SUBMITTED_FOR_REVIEW',
      module: 'INTEGRATED',
      entity: 'DikshaCourse',
      entityId: course._id,
      status: 'SUCCESS',
      details: `Submitted DIKSHA Course "${course.title}" (${course.code}) for reviewer inspection.`,
    });

    return res.status(200).json({
      success: true,
      message: 'Course submitted for review successfully.',
      course,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Review course (Reviewer action)
 * @route   POST /api/diksha/courses/:id/review
 * @access  Private (INTEGRATED:DIKSHA:APPROVE or EDIT)
 */
export const reviewCourse = async (req, res, next) => {
  try {
    const { decision, comments } = req.body; // 'APPROVE' | 'REQUEST_REVISION' | 'REJECT'
    const course = await dikshaService.reviewCourse(req.params.id, { decision, comments }, req.user);

    await auditService.log(req, {
      action: `DIKSHA_COURSE_REVIEW_${decision}`,
      module: 'INTEGRATED',
      entity: 'DikshaCourse',
      entityId: course._id,
      status: 'SUCCESS',
      details: `Review action "${decision}" performed on course "${course.title}". Remarks: ${comments || 'None'}`,
    });

    return res.status(200).json({
      success: true,
      message: `Course review updated (${course.status}).`,
      course,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Approve and Publish course (Approver action)
 * @route   POST /api/diksha/courses/:id/approve
 * @access  Private (INTEGRATED:DIKSHA:APPROVE)
 */
export const approveCourse = async (req, res, next) => {
  try {
    const { decision, comments } = req.body; // 'APPROVE_PUBLISH' | 'REQUEST_REVISION' | 'REJECT'
    const course = await dikshaService.approveCourse(req.params.id, { decision, comments }, req.user);

    await auditService.log(req, {
      action: `DIKSHA_COURSE_FINAL_${decision}`,
      module: 'INTEGRATED',
      entity: 'DikshaCourse',
      entityId: course._id,
      status: 'SUCCESS',
      details: `Final approval action "${decision}" performed on course "${course.title}". Status is now ${course.status}.`,
    });

    return res.status(200).json({
      success: true,
      message: `Course status is now ${course.status}.`,
      course,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get enrollments list
 * @route   GET /api/diksha/enrollments
 * @access  Private (INTEGRATED:DIKSHA:VIEW)
 */
export const getEnrollments = async (req, res, next) => {
  try {
    const { courseId, search, status, page, limit } = req.query;
    const result = await dikshaService.getEnrollmentsList({
      courseId,
      search,
      status,
      page,
      limit,
    });

    return res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error) {
    next(error);
  }
};

