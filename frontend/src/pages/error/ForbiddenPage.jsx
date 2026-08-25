import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldX, ArrowLeft, Home } from 'lucide-react';
import Header from '../../components/common/Header';
import { Button } from '../../components/ui/button';
import { useAuth } from '../../context/AuthContext';

export const ForbiddenPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  return (
    <div className="h-screen w-screen flex flex-col bg-[#F8FAFC] overflow-hidden font-sans select-none">
      <Header />

      <main className="flex-1 w-full flex items-center justify-center p-4 sm:p-6">
        <div className="max-w-md w-full bg-white border border-red-100 rounded-3xl p-8 text-center space-y-5 shadow-xl">
          <div className="w-16 h-16 rounded-2xl bg-red-50 text-red-500 flex items-center justify-center mx-auto ring-8 ring-red-50/50">
            <ShieldX className="w-8 h-8" />
          </div>

          <div className="space-y-1.5">
            <span className="text-[11px] font-bold text-red-600 tracking-wider uppercase">
              Error 403 · Access Forbidden
            </span>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              Insufficient Permissions
            </h1>
            <p className="text-xs text-slate-500 leading-relaxed max-w-sm mx-auto">
              Your assigned role ({user?.role?.toUpperCase() || 'USER'}) does not have permission to view or modify this resource.
            </p>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row items-center gap-2.5 justify-center">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate(-1)}
              className="w-full sm:w-auto text-xs rounded-xl"
            >
              <ArrowLeft className="w-3.5 h-3.5 mr-1" />
              <span>Go Back</span>
            </Button>

            <Button
              variant="nfiYellow"
              size="sm"
              onClick={() => navigate('/admin/dashboard')}
              className="w-full sm:w-auto text-xs font-bold rounded-xl shadow-2xs"
            >
              <Home className="w-3.5 h-3.5 mr-1" />
              <span>Admin Dashboard</span>
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ForbiddenPage;
