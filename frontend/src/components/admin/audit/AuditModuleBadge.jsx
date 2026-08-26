import React from 'react';
import { Badge } from '../../ui/badge';

export const AuditModuleBadge = ({ module }) => {
  const getBadgeStyle = (m) => {
    switch (m) {
      case 'AUTH':
        return 'bg-slate-100 text-slate-800 border-slate-300';
      case 'ADMINS':
        return 'bg-blue-50 text-blue-800 border-blue-200';
      case 'ROLES':
        return 'bg-indigo-50 text-indigo-800 border-indigo-200';
      case 'SUBSCRIBERS':
        return 'bg-emerald-50 text-emerald-800 border-emerald-200';
      case 'SUBSCRIPTIONS':
        return 'bg-[#284661] text-white border-transparent';
      case 'PLANS':
        return 'bg-amber-50 text-amber-900 border-amber-300';
      case 'COUPONS':
        return 'bg-purple-50 text-purple-800 border-purple-200';
      case 'ORDERS':
        return 'bg-rose-50 text-rose-800 border-rose-200';
      case 'NOTIFICATIONS':
        return 'bg-sky-50 text-sky-800 border-sky-200';
      case 'FEEDBACK':
        return 'bg-teal-50 text-teal-800 border-teal-200';
      case 'CONTENT':
        return 'bg-cyan-50 text-cyan-800 border-cyan-200';
      case 'SYSTEM':
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  return (
    <Badge
      variant="outline"
      className={`text-[8px] font-bold uppercase tracking-wider ${getBadgeStyle(module)}`}
    >
      {module}
    </Badge>
  );
};

export default AuditModuleBadge;
