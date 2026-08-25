import React, { createContext, useContext, useState, useEffect } from 'react';
import authService from '../services/auth.service';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('nfi_user');
    return savedUser ? JSON.parse(savedUser) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('nfi_token') || null);
  const [loading, setLoading] = useState(true);

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
  }, []);

  const login = async (identifier, password, rememberMe) => {
    const res = await authService.login(identifier, password, rememberMe);
    if (res && res.token) {
      setToken(res.token);
      setUser(res.user);
      localStorage.setItem('nfi_token', res.token);
      localStorage.setItem('nfi_user', JSON.stringify(res.user));
      return res;
    }
    throw new Error('Invalid response from authentication server');
  };

  const logout = async () => {
    await authService.logout();
    setToken(null);
    setUser(null);
    localStorage.removeItem('nfi_token');
    localStorage.removeItem('nfi_user');
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
