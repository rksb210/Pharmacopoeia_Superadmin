import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import authService from '../services/auth.service';

const AuthContext = createContext(null);

// 45 minutes idle inactivity timeout (in milliseconds)
const IDLE_TIMEOUT_MS = 45 * 60 * 1000;

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('nfi_user');
    return savedUser ? JSON.parse(savedUser) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('nfi_token') || null);
  const [loading, setLoading] = useState(true);

  const idleTimerRef = useRef(null);
  const lastActivityRef = useRef(Date.now());

  // Logout method
  const logout = useCallback(async (reason = null) => {
    try {
      await authService.logout();
    } catch (e) {
      // Ignore cleanup error
    }

    if (idleTimerRef.current) {
      clearTimeout(idleTimerRef.current);
    }

    setToken(null);
    setUser(null);
    localStorage.removeItem('nfi_token');
    localStorage.removeItem('nfi_user');

    if (reason === 'inactivity') {
      window.location.href = '/login?reason=inactivity';
    }
  }, []);

  // Reset idle inactivity timer
  const resetIdleTimer = useCallback(() => {
    lastActivityRef.current = Date.now();

    if (idleTimerRef.current) {
      clearTimeout(idleTimerRef.current);
    }

    if (token) {
      idleTimerRef.current = setTimeout(() => {
        console.warn('[Auth] Inactivity timeout reached (45 min). Auto-logging out.');
        logout('inactivity');
      }, IDLE_TIMEOUT_MS);
    }
  }, [token, logout]);

  // Attach global user activity listeners for idle timeout tracking
  useEffect(() => {
    if (!token) return;

    const activityEvents = ['mousemove', 'mousedown', 'keydown', 'scroll', 'touchstart'];

    let throttleTimer = null;
    const handleUserActivity = () => {
      if (!throttleTimer) {
        throttleTimer = setTimeout(() => {
          resetIdleTimer();
          throttleTimer = null;
        }, 1000); // Throttled to once per second
      }
    };

    activityEvents.forEach((event) => {
      window.addEventListener(event, handleUserActivity, { passive: true });
    });

    // Start idle timer
    resetIdleTimer();

    return () => {
      activityEvents.forEach((event) => {
        window.removeEventListener(event, handleUserActivity);
      });
      if (idleTimerRef.current) {
        clearTimeout(idleTimerRef.current);
      }
      if (throttleTimer) {
        clearTimeout(throttleTimer);
      }
    };
  }, [token, resetIdleTimer]);

  // Validate token on mount
  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem('nfi_token');
      if (storedToken) {
        try {
          const res = await authService.getMe(storedToken);
          if (res && res.user) {
            setUser(res.user);
            localStorage.setItem('nfi_user', JSON.stringify(res.user));
          }
        } catch (err) {
          console.warn('Session expired or invalid:', err.message);
          logout();
        }
      }
      setLoading(false);
    };

    initAuth();
  }, [logout]);

  const login = async (identifier, password, rememberMe) => {
    const res = await authService.login(identifier, password, rememberMe);
    if (res && res.token) {
      setToken(res.token);
      setUser(res.user);
      localStorage.setItem('nfi_token', res.token);
      localStorage.setItem('nfi_user', JSON.stringify(res.user));
      resetIdleTimer();
      return res;
    }
    return res;
  };

  const changePassword = async (currentPassword, newPassword, confirmPassword) => {
    return authService.changePassword(currentPassword, newPassword, confirmPassword);
  };

  const forgotPassword = async (identifier) => {
    return authService.forgotPassword(identifier);
  };

  const resetPassword = async (tokenParam, password, confirmPassword) => {
    return authService.resetPassword(tokenParam, password, confirmPassword);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user && !!token,
        isSuperAdmin: user?.role === 'superadmin' || user?.role === 'admin',
        loading,
        login,
        logout,
        changePassword,
        forgotPassword,
        resetPassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
