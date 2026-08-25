import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { ShieldAlert } from 'lucide-react';
import { Button } from '../ui/button';

/**
 * Route guard ensuring only authenticated users with allowed roles can access Admin routes
 */
export const AdminRoute = ({ children, allowedRoles = ['superadmin', 'admin', 'editor', 'viewer'] }) => {
  const { isAuthenticated, user, loading, logout } = useAuth();

  if (loading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-[#F8FAFC]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-[#FFD243] border-t-[#E76120] rounded-full animate-spin" />
          <p className="text-sm font-semibold text-slate-500">Verifying administrator authorization...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Check if role is in allowed list
  const userRole = user?.role || 'viewer';
  if (!allowedRoles.includes(userRole)) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-[#F8FAFC] p-4">
        <div className="max-w-md w-full bg-white border border-red-100 rounded-3xl p-8 text-center space-y-4 shadow-xl">
          <div className="w-16 h-16 rounded-2xl bg-red-50 text-red-500 flex items-center justify-center mx-auto">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900">Access Restricted</h2>
            <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
              Your account ({user?.email}) does not have administrative privileges to access this module.
            </p>
          </div>
          <div className="pt-2 flex flex-col gap-2">
            <Button
              variant="nfiYellow"
              onClick={() => window.location.href = '/dashboard'}
              className="w-full font-bold"
            >
              Return to Subscriber Dashboard
            </Button>
            <Button
              variant="outline"
              onClick={logout}
              className="w-full text-xs"
            >
              Sign in with another account
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return children;
};

export default AdminRoute;
