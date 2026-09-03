import React from 'react';
import { Bell, AlertTriangle, Info, CheckCircle2, ArrowRight } from 'lucide-react';
import { NavLink } from 'react-router-dom';

export const NotificationWidget = ({ notifications = [] }) => {
  const getIcon = (severity) => {
    switch (severity) {
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-amber-600" />;
      case 'success':
        return <CheckCircle2 className="w-4 h-4 text-emerald-600" />;
      default:
        return <Info className="w-4 h-4 text-[#284661]" />;
    }
  };

  const getBorderColor = (severity) => {
    switch (severity) {
      case 'warning':
        return 'border-amber-200 bg-amber-50/50';
      case 'success':
        return 'border-emerald-200 bg-emerald-50/50';
      default:
        return 'border-blue-100 bg-blue-50/40';
    }
  };

  return (
    <div className="bg-white border border-slate-200/80 rounded-2xl p-4 sm:p-5 shadow-2xs space-y-3 sm:space-y-4 select-none font-sans overflow-hidden min-w-0">
      {/* Header */}
      <div className="flex items-center justify-between gap-2 min-w-0">
        <div className="flex items-center gap-2 min-w-0">
          <Bell className="w-4 h-4 text-[#E76120] shrink-0" />
          <h3 className="font-bold text-slate-900 text-sm truncate">Advisories &amp; Notifications</h3>
        </div>
        <NavLink
          to="/admin/notifications"
          className="text-xs font-bold text-[#E76120] hover:underline flex items-center gap-1 shrink-0"
        >
          <span>Manage</span>
          <ArrowRight className="w-3 h-3" />
        </NavLink>
      </div>

      {/* Notifications List */}
      <div className="space-y-2.5 min-w-0">
        {notifications.length === 0 ? (
          <p className="text-xs text-slate-400 text-center py-4">No active broadcasts.</p>
        ) : (
          notifications.map((notif) => (
            <div
              key={notif.id}
              className={`p-3 rounded-xl border flex items-start gap-2.5 sm:gap-3 transition-colors min-w-0 ${getBorderColor(
                notif.severity
              )}`}
            >
              <div className="mt-0.5 shrink-0">{getIcon(notif.severity)}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2 flex-wrap min-w-0">
                  <h4 className="font-bold text-slate-900 text-xs truncate max-w-full">{notif.title}</h4>
                  <span className="text-[10px] text-slate-400 font-medium shrink-0">
                    {notif.timestamp}
                  </span>
                </div>
                <p className="text-[11px] text-slate-600 mt-0.5 leading-relaxed break-words">
                  {notif.message}
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default NotificationWidget;
