import React from 'react';
import { Badge } from '../../ui/badge';
import { AlertCircle, AlertTriangle, Info, ArrowDown } from 'lucide-react';

export const NotificationPriorityBadge = ({ priority }) => {
  switch (priority) {
    case 'urgent':
      return (
        <Badge variant="destructive" className="text-[9px] font-black uppercase tracking-wider bg-red-600 animate-pulse">
          <AlertCircle className="w-2.5 h-2.5 mr-1" />
          <span>Urgent</span>
        </Badge>
      );

    case 'high':
      return (
        <Badge variant="outline" className="text-[9px] font-bold uppercase tracking-wider bg-amber-50 text-amber-800 border-amber-300">
          <AlertTriangle className="w-2.5 h-2.5 mr-1 text-[#E76120]" />
          <span>High</span>
        </Badge>
      );

    case 'medium':
      return (
        <Badge variant="outline" className="text-[9px] font-semibold uppercase tracking-wider bg-sky-50 text-sky-800 border-sky-200">
          <Info className="w-2.5 h-2.5 mr-1 text-sky-600" />
          <span>Medium</span>
        </Badge>
      );

    case 'low':
    default:
      return (
        <Badge variant="outline" className="text-[9px] font-medium uppercase tracking-wider bg-slate-50 text-slate-500 border-slate-200">
          <ArrowDown className="w-2.5 h-2.5 mr-1" />
          <span>Low</span>
        </Badge>
      );
  }
};

export default NotificationPriorityBadge;
