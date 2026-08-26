import React from 'react';
import { Badge } from '../../ui/badge';
import { Clock, Eye, CheckCircle2, RotateCcw } from 'lucide-react';

export const FeedbackStatusBadge = ({ status }) => {
  switch (status) {
    case 'pending':
      return (
        <Badge variant="outline" className="bg-amber-50 text-amber-800 border-amber-300 text-[9px] font-bold uppercase">
          <Clock className="w-2.5 h-2.5 mr-1 text-[#E76120]" />
          <span>Pending</span>
        </Badge>
      );

    case 'in_review':
      return (
        <Badge variant="outline" className="bg-blue-50 text-[#284661] border-blue-200 text-[9px] font-bold uppercase">
          <Eye className="w-2.5 h-2.5 mr-1 text-[#284661]" />
          <span>In Review</span>
        </Badge>
      );

    case 'completed':
      return (
        <Badge variant="outline" className="bg-emerald-50 text-emerald-800 border-emerald-300 text-[9px] font-bold uppercase">
          <CheckCircle2 className="w-2.5 h-2.5 mr-1 text-emerald-600" />
          <span>Completed</span>
        </Badge>
      );

    case 'reopened':
      return (
        <Badge variant="outline" className="bg-rose-50 text-rose-800 border-rose-300 text-[9px] font-bold uppercase">
          <RotateCcw className="w-2.5 h-2.5 mr-1 text-rose-600" />
          <span>Reopened</span>
        </Badge>
      );

    default:
      return (
        <Badge variant="outline" className="text-[9px] font-bold uppercase">
          {status}
        </Badge>
      );
  }
};

export default FeedbackStatusBadge;
