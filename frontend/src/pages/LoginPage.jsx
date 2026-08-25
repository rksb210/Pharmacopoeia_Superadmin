import React from 'react';
import Header from '../components/common/Header';
import LeftBanner from '../components/login/LeftBanner';
import LoginForm from '../components/login/LoginForm';

/**
 * LoginPage Component
 * Top Header + Left Banner + Right Login Form
 * Perfectly proportioned gap between left banner and right form.
 */
export const LoginPage = () => {
  const handleLoginSuccess = (data) => {
    console.log('Login submitted:', data);
  };

  return (
    <div className="h-screen w-screen flex flex-col bg-white overflow-hidden font-sans select-none">
      {/* Top Government Bar (44px fixed) */}
      <Header />

      {/* Main Content Area */}
      <main className="flex-1 w-full flex items-center justify-center px-4 sm:px-6 lg:px-10 py-2 overflow-hidden">
        <div className="w-full max-w-[1260px] h-full max-h-[calc(100vh-60px)] flex flex-col lg:flex-row items-center justify-center gap-6 lg:gap-16 xl:gap-24">
          {/* Left Hero / Trust Banner */}
          <div className="w-full lg:w-auto h-full flex items-center justify-center shrink-0">
            <LeftBanner />
          </div>

          {/* Right Login Form */}
          <div className="w-full lg:w-[420px] flex items-center justify-center shrink-0">
            <LoginForm onLoginSuccess={handleLoginSuccess} />
          </div>
        </div>
      </main>
    </div>
  );
};

export default LoginPage;
