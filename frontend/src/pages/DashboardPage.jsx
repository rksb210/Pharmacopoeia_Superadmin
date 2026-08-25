import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import DashboardLayout from '../layouts/DashboardLayout';
import SubscriptionBanner from '../components/dashboard/SubscriptionBanner';
import QuickActionCards from '../components/dashboard/QuickActionCards';
import RecentActivity from '../components/dashboard/RecentActivity';
import BookmarksWidget from '../components/dashboard/BookmarksWidget';
import ContinueReading from '../components/dashboard/ContinueReading';
import NotificationsWidget from '../components/dashboard/NotificationsWidget';
import { Button } from '../components/ui/button';

export const DashboardPage = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('Dashboard');

  // Format user display name (e.g. Dr. Sharma or user.name)
  const displayName = user?.name || 'Superadmin';

  return (
    <DashboardLayout activeTab={activeTab} onTabChange={setActiveTab}>
      {activeTab === 'Dashboard' ? (
        <div className="space-y-6">
          {/* Top Greeting & Action Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 select-none">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                Welcome, {displayName}
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 mt-1 font-medium">
                Institutional access via AIIMS Delhi · Last visit : Today, 8:42 AM
              </p>
            </div>

            <div className="shrink-0">
              <Button
                variant="nfiYellow"
                className="h-10 px-5 text-sm font-semibold rounded-lg shadow-2xs"
              >
                Search Medicine
              </Button>
            </div>
          </div>

          {/* Subscription Status Banner */}
          <SubscriptionBanner />

          {/* 4 Quick Action Cards */}
          <QuickActionCards onCardClick={(tabId) => console.log('Clicked card:', tabId)} />

          {/* 2-Column Modular Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Column (Recent Activity + Continue Reading) */}
            <div className="lg:col-span-7 space-y-6">
              <RecentActivity />
              <ContinueReading />
            </div>

            {/* Right Column (My Bookmarks + Notifications) */}
            <div className="lg:col-span-5 space-y-6">
              <BookmarksWidget />
              <NotificationsWidget />
            </div>
          </div>
        </div>
      ) : (
        /* Dynamic Tab Placeholder (Ready for future Admin pages) */
        <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center space-y-3">
          <h2 className="text-xl font-bold text-[#284661]">{activeTab}</h2>
          <p className="text-sm text-slate-500">
            This module is ready for your dynamic content and future admin tools.
          </p>
        </div>
      )}
    </DashboardLayout>
  );
};

export default DashboardPage;
