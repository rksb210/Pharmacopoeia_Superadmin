import React from 'react';
import { Clock, Shield, FileText, CreditCard, ArrowRight } from 'lucide-react';
import { Badge } from '../../ui/badge';
import { NavLink } from 'react-router-dom';

export const ActivityList = ({ activities = [] }) => {
  const getActivityIcon = (type) => {
    switch (type) {
      case 'content':
        return <FileText className="w-3.5 h-3.5 text-[#284661]" />;
      case 'security':
        return <Shield className="w-3.5 h-3.5 text-[#E76120]" />;
      case 'commercial':
        return <CreditCard className="w-3.5 h-3.5 text-emerald-600" />;
      default:
        return <Clock className="w-3.5 h-3.5 text-slate-400" />;
    }
  };

  return (
    <div className="bg-white border border-slate-200/80 rounded-2xl p-4 sm:p-5 shadow-2xs space-y-3 sm:space-y-4 select-none font-sans overflow-hidden min-w-0">
      {/* Header */}
      <div className="flex items-center justify-between gap-2 min-w-0">
        <div className="min-w-0">
          <h3 className="font-bold text-slate-900 text-sm truncate">Recent Audit Activities</h3>
          <p className="text-slate-400 text-xs truncate block">Administrative and content actions</p>
        </div>
        <NavLink
          to="/admin/audit-logs"
          className="text-xs font-bold text-[#E76120] hover:underline flex items-center gap-1 shrink-0"
        >
          <span>View All</span>
          <ArrowRight className="w-3 h-3" />
        </NavLink>
      </div>

      {/* Activity Timeline */}
      <div className="space-y-2.5 min-w-0">
        {activities.length === 0 ? (
          <p className="text-xs text-slate-400 text-center py-6">No recent activities logged.</p>
        ) : (
          activities.map((act) => (
            <div
              key={act.id}
              className="p-3 bg-slate-50/70 border border-slate-100 rounded-xl flex items-start gap-2.5 sm:gap-3 hover:border-slate-200 transition-colors min-w-0"
            >
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center shrink-0 shadow-2xs mt-0.5">
                {getActivityIcon(act.type)}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-1.5 flex-wrap min-w-0">
                  <div className="flex items-center gap-1.5 min-w-0 flex-wrap">
                    <span className="font-bold text-slate-800 text-xs truncate max-w-[140px] block" title={act.user}>
                      {act.user}
                    </span>
                    <Badge variant="outline" className="text-[9px] px-1 py-0 uppercase font-semibold shrink-0">
                      {act.role}
                    </Badge>
                  </div>
                  <span className="text-[10px] text-slate-400 shrink-0 font-medium">{act.timestamp}</span>
                </div>

                <p className="text-[11px] text-slate-600 font-medium mt-0.5 break-words">
                  <span className="text-[#E76120] font-bold">{act.action}:</span> {act.target}
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ActivityList;
