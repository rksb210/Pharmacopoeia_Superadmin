import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import authService from '../services/auth.service';
import configService from '../services/config.service';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('nfi_user');
    return savedUser ? JSON.parse(savedUser) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('nfi_token') || null);
  const [loading, setLoading] = useState(true);
  const [sessionTimeoutMinutes, setSessionTimeoutMinutes] = useState(() => {
    const saved = localStorage.getItem('nfi_session_timeout_minutes');
    return saved ? Number(saved) : 120;
  });

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
      const minutes = sessionTimeoutMinutes || localStorage.getItem('nfi_session_timeout_minutes') || 120;
      window.location.href = `/login?reason=inactivity&timeout=${minutes}`;
    }
  }, [sessionTimeoutMinutes]);

  // Reset idle inactivity timer based on dynamic sessionTimeoutMinutes
  const resetIdleTimer = useCallback(() => {
    lastActivityRef.current = Date.now();

    if (idleTimerRef.current) {
      clearTimeout(idleTimerRef.current);
    }

    if (token) {
      const minutes = sessionTimeoutMinutes || 120;
      const timeoutMs = Math.max(1, minutes) * 60 * 1000;
      idleTimerRef.current = setTimeout(() => {
        console.warn(`[Auth] Inactivity timeout reached (${minutes} min). Auto-logging out.`);
        logout('inactivity');
      }, timeoutMs);
    }
  }, [token, sessionTimeoutMinutes, logout]);

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

  // Listen for config changes from Settings page or other tabs
  useEffect(() => {
    const handleConfigUpdate = (e) => {
      const minutes = e.detail?.sessionTimeoutMinutes;
      if (minutes) {
        setSessionTimeoutMinutes(Number(minutes));
        localStorage.setItem('nfi_session_timeout_minutes', String(minutes));
      }
    };

    const handleStorageChange = (e) => {
      if (e.key === 'nfi_session_timeout_minutes' && e.newValue) {
        setSessionTimeoutMinutes(Number(e.newValue));
      }
    };

    window.addEventListener('nfi_config_updated', handleConfigUpdate);
    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('nfi_config_updated', handleConfigUpdate);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

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
          if (res && res.sessionTimeoutMinutes) {
            setSessionTimeoutMinutes(res.sessionTimeoutMinutes);
            localStorage.setItem('nfi_session_timeout_minutes', String(res.sessionTimeoutMinutes));
          } else {
            try {
              const pubConfig = await configService.getPublicConfig();
              if (pubConfig && pubConfig.sessionTimeoutMinutes) {
                setSessionTimeoutMinutes(pubConfig.sessionTimeoutMinutes);
                localStorage.setItem('nfi_session_timeout_minutes', String(pubConfig.sessionTimeoutMinutes));
              }
            } catch (e) {
              // Ignore public config load error
            }
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
      if (res.sessionTimeoutMinutes) {
        setSessionTimeoutMinutes(res.sessionTimeoutMinutes);
        localStorage.setItem('nfi_session_timeout_minutes', String(res.sessionTimeoutMinutes));
      }
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
        isSuperAdmin: user?.role === 'superadmin',
        isAdminUser: ['superadmin', 'admin', 'subadmin', 'maker', 'reviewer', 'approver', 'editor', 'viewer'].includes(
          user?.role?.toLowerCase()
        ),
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
