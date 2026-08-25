import api from './api';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

/**
 * Authentication Service for API communication
 */
export const authService = {
  /**
   * Log in user with identifier (email or username) and password
   */
  login: async (identifier, password, rememberMe = false) => {
    return api.post('/auth/login', { identifier, password, rememberMe });
  },

  /**
   * Get current authenticated user profile
   */
  getMe: async (token = null) => {
    const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};
    return api.get('/auth/me', config);
  },

  /**
   * Change password for logged in administrator
   */
  changePassword: async (currentPassword, newPassword, confirmPassword) => {
    return api.post('/auth/change-password', {
      currentPassword,
      newPassword,
      confirmPassword,
    });
  },

  /**
   * Request password reset token / link
   */
  forgotPassword: async (identifier) => {
    return api.post('/auth/forgot-password', { identifier });
  },

  /**
   * Reset password using token
   */
  resetPassword: async (token, password, confirmPassword) => {
    return api.post(`/auth/reset-password/${token}`, {
      password,
      confirmPassword,
    });
  },

  /**
   * Log out user
   */
  logout: async () => {
    try {
      await api.post('/auth/logout');
    } catch (err) {
      console.warn('Logout API warning:', err.message);
    }
  },
};

export default authService;
