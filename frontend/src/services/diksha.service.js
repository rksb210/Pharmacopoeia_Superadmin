import api from './api';

export const dikshaService = {
  /**
   * Fetch aggregate KPI statistics
   */
  getStats: async () => {
    try {
      return await api.get('/diksha/stats');
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  /**
   * Fetch paginated and filtered course catalogue
   */
  getCourses: async ({
    page = 1,
    limit = 10,
    search = '',
    category = 'all',
    status = 'all',
    pricing = 'all',
    sortBy = 'createdAt',
    sortOrder = 'desc',
  } = {}) => {
    try {
      const params = new URLSearchParams();
      if (page) params.append('page', page);
      if (limit) params.append('limit', limit);
      if (search) params.append('search', search);
      if (category && category !== 'all') params.append('category', category);
      if (status && status !== 'all') params.append('status', status);
      if (pricing && pricing !== 'all') params.append('pricing', pricing);
      if (sortBy) params.append('sortBy', sortBy);
      if (sortOrder) params.append('sortOrder', sortOrder);

      return await api.get(`/diksha/courses?${params.toString()}`);
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  /**
   * Get single course details
   */
  getCourseById: async (courseId) => {
    try {
      return await api.get(`/diksha/courses/${courseId}`);
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  /**
   * Create new course
   */
  createCourse: async (courseData) => {
    try {
      return await api.post('/diksha/courses', courseData);
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  /**
   * Update existing course
   */
  updateCourse: async (courseId, courseData) => {
    try {
      return await api.put(`/diksha/courses/${courseId}`, courseData);
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  /**
   * Delete course
   */
  deleteCourse: async (courseId) => {
    try {
      return await api.delete(`/diksha/courses/${courseId}`);
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  /**
   * Change course status
   */
  toggleStatus: async (courseId, status) => {
    try {
      return await api.patch(`/diksha/courses/${courseId}/status`, { status });
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  /**
   * Submit course for review (Maker action)
   */
  submitForReview: async (courseId, comments = '') => {
    try {
      return await api.post(`/diksha/courses/${courseId}/submit-review`, { comments });
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  /**
   * Review course (Reviewer action)
   */
  reviewCourse: async (courseId, { decision, comments }) => {
    try {
      return await api.post(`/diksha/courses/${courseId}/review`, { decision, comments });
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  /**
   * Final approve & publish (Approver action)
   */
  approveCourse: async (courseId, { decision, comments }) => {
    try {
      return await api.post(`/diksha/courses/${courseId}/approve`, { decision, comments });
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  /**
   * Get course learner enrollments
   */
  getEnrollments: async ({
    courseId = null,
    search = '',
    status = 'all',
    page = 1,
    limit = 10,
  } = {}) => {
    try {
      const params = new URLSearchParams();
      if (courseId) params.append('courseId', courseId);
      if (search) params.append('search', search);
      if (status && status !== 'all') params.append('status', status);
      if (page) params.append('page', page);
      if (limit) params.append('limit', limit);

      return await api.get(`/diksha/enrollments?${params.toString()}`);
    } catch (error) {
      throw error.response?.data || error;
    }
  },
};

export default dikshaService;


