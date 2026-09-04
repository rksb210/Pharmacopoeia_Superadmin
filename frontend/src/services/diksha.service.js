import api from './api';

export const dikshaService = {
  /**
   * Fetch aggregate KPI statistics
   */
  getStats: async () => {
    try {
      const response = await api.get('/diksha/stats');
      return response.data;
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

      const response = await api.get(`/diksha/courses?${params.toString()}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  /**
   * Get single course details
   */
  getCourseById: async (courseId) => {
    try {
      const response = await api.get(`/diksha/courses/${courseId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  /**
   * Create new course
   */
  createCourse: async (courseData) => {
    try {
      const response = await api.post('/diksha/courses', courseData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  /**
   * Update existing course
   */
  updateCourse: async (courseId, courseData) => {
    try {
      const response = await api.put(`/diksha/courses/${courseId}`, courseData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  /**
   * Delete course
   */
  deleteCourse: async (courseId) => {
    try {
      const response = await api.delete(`/diksha/courses/${courseId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  /**
   * Change course status
   */
  toggleStatus: async (courseId, status) => {
    try {
      const response = await api.patch(`/diksha/courses/${courseId}/status`, { status });
      return response.data;
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

      const response = await api.get(`/diksha/enrollments?${params.toString()}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },
};

export default dikshaService;
