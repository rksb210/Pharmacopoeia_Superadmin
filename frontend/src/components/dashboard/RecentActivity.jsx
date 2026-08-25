import React from 'react';

export const RecentActivity = () => {
  const activities = [
    {
      id: 1,
      action: 'Bookmarked',
      target: 'Vitamin D — Monograph',
      time: 'Today, 9:14 AM',
    },
    {
      id: 2,
      action: 'Searched',
      target: '"nimesulide contraindication"',
      time: 'Yesterday, 9:14 AM',
    },
    {
      id: 3,
      action: 'Downloaded',
      target: 'Paracetamol monograph (PDF)',
      time: 'Today, 9:14 AM',
    },
    {
      id: 4,
      action: 'Used Interaction Checker',
      target: '— 2 medicines',
      time: 'Today, 9:14 AM',
    },
  ];

  return (
    <div className="bg-white border border-slate-200/80 rounded-2xl p-6 select-none shadow-2xs">
      <h3 className="text-sm sm:text-base font-bold text-slate-900 mb-4">
        Recent Activity
      </h3>

      <div className="divide-y divide-slate-100">
        {activities.map((item) => (
          <div
            key={item.id}
            className="py-3 flex items-center justify-between gap-4 text-xs sm:text-sm"
          >
            <div className="text-slate-800 truncate">
              <span className="font-semibold">{item.action} </span>
              <span className="text-slate-700">{item.target}</span>
            </div>
            <span className="text-xs text-slate-400 shrink-0 font-medium">
              {item.time}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RecentActivity;
