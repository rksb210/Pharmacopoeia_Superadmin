import React from 'react';
import { ArrowRight } from 'lucide-react';

export const NotificationsWidget = () => {
  const notifications = [
    {
      id: 1,
      dotColor: 'bg-red-500',
      title: 'Safety Alert',
      desc: 'Nimesulide — contraindication revised',
    },
    {
      id: 2,
      dotColor: 'bg-amber-500',
      title: 'Subscription',
      desc: 'Renews in 10 days',
    },
    {
      id: 3,
      dotColor: 'bg-emerald-500',
      title: 'New Course',
      desc: 'Clinical Pharmacokinetics — DIKSHA',
    },
  ];

  return (
    <div className="bg-white border border-slate-200/80 rounded-2xl p-6 select-none shadow-2xs">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm sm:text-base font-bold text-slate-900">
          Notifications
        </h3>
        <a
          href="#notifications"
          onClick={(e) => e.preventDefault()}
          className="text-xs sm:text-sm font-semibold text-[#E76120] hover:underline flex items-center gap-1"
        >
          <span>View all</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </a>
      </div>

      {/* List */}
      <div className="space-y-4">
        {notifications.map((item) => (
          <div key={item.id} className="flex items-start gap-3">
            <span className={`w-2 h-2 rounded-full ${item.dotColor} mt-1.5 shrink-0`} />
            <div className="text-xs sm:text-sm">
              <span className="font-semibold text-slate-900">{item.title}</span>
              <p className="text-xs text-slate-500 mt-0.5">{item.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default NotificationsWidget;
