import React from 'react';
import { Badge } from '../../ui/badge';
import {
  Crown,
  Stethoscope,
  GraduationCap,
  Sparkles,
  AlertTriangle,
  UserX,
  UserPlus,
} from 'lucide-react';

export const CRMSegmentBadge = ({ segment }) => {
  switch (segment) {
    case 'INSTITUTIONAL':
    case 'INSTITUTIONAL_VIP':
      return (
        <Badge variant="outline" className="bg-amber-50 text-amber-900 border-amber-300 text-[9px] font-black uppercase">
          <Crown className="w-2.5 h-2.5 mr-1 text-[#E76120]" />
          <span>Institutional</span>
        </Badge>
      );

    case 'PRACTITIONER':
    case 'ACTIVE_PRACTITIONER':
      return (
        <Badge variant="outline" className="bg-emerald-50 text-emerald-800 border-emerald-300 text-[9px] font-bold uppercase">
          <Stethoscope className="w-2.5 h-2.5 mr-1 text-emerald-600" />
          <span>Practitioner</span>
        </Badge>
      );

    case 'STUDENT_SCHOLAR':
    case 'SCHOLAR':
      return (
        <Badge variant="outline" className="bg-indigo-50 text-indigo-800 border-indigo-200 text-[9px] font-bold uppercase">
          <GraduationCap className="w-2.5 h-2.5 mr-1 text-indigo-600" />
          <span>Scholar (Student)</span>
        </Badge>
      );

    case 'SUBSCRIBED':
    case 'PROMOTIONAL_TRIAL':
      return (
        <Badge variant="outline" className="bg-sky-50 text-sky-800 border-sky-200 text-[9px] font-bold uppercase">
          <Sparkles className="w-2.5 h-2.5 mr-1 text-sky-600" />
          <span>Active Pass</span>
        </Badge>
      );

    case 'PROSPECT':
    case 'LEAD_PROSPECT':
    default:
      return (
        <Badge variant="outline" className="bg-slate-100 text-slate-600 border-slate-300 text-[9px] font-bold uppercase">
          <UserPlus className="w-2.5 h-2.5 mr-1 text-slate-500" />
          <span>Prospect (No Pass)</span>
        </Badge>
      );
  }
};

export default CRMSegmentBadge;
