import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, LogIn } from 'lucide-react';
import Header from '../../components/common/Header';
import { Button } from '../../components/ui/button';
import { useAuth } from '../../context/AuthContext';

export const UnauthorizedPage = () => {
  const navigate = useNavigate();
  const { logout } = useAuth();

  return (
    <div className="h-screen w-screen flex flex-col bg-[#F8FAFC] overflow-hidden font-sans select-none">
      <Header />

      <main className="flex-1 w-full flex items-center justify-center p-4 sm:p-6">
        <div className="max-w-md w-full bg-white border border-amber-100 rounded-3xl p-8 text-center space-y-5 shadow-xl">
          <div className="w-16 h-16 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto ring-8 ring-amber-50/50">
            <Lock className="w-8 h-8" />
          </div>

          <div className="space-y-1.5">
            <span className="text-[11px] font-bold text-amber-600 tracking-wider uppercase">
              Error 401 · Unauthorized
            </span>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              Authentication Required
            </h1>
            <p className="text-xs text-slate-500 leading-relaxed max-w-sm mx-auto">
              You must be logged in with an active administrative session to view this page.
            </p>
          </div>

          <div className="pt-2 flex items-center gap-2.5 justify-center">
            <Button
              variant="nfiYellow"
              size="sm"
              onClick={async () => {
                await logout();
                navigate('/login');
              }}
              className="w-full text-xs font-bold rounded-xl shadow-2xs"
            >
              <LogIn className="w-3.5 h-3.5 mr-1" />
              <span>Go to Login</span>
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default UnauthorizedPage;
