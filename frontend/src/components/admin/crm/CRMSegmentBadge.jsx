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
    case 'INSTITUTIONAL_VIP':
      return (
        <Badge variant="outline" className="bg-amber-50 text-amber-900 border-amber-300 text-[9px] font-black uppercase">
          <Crown className="w-2.5 h-2.5 mr-1 text-[#E76120]" />
          <span>Institutional VIP</span>
        </Badge>
      );

    case 'ACTIVE_PRACTITIONER':
      return (
        <Badge variant="outline" className="bg-emerald-50 text-emerald-800 border-emerald-300 text-[9px] font-bold uppercase">
          <Stethoscope className="w-2.5 h-2.5 mr-1 text-emerald-600" />
          <span>Active Practitioner</span>
        </Badge>
      );

    case 'SCHOLAR':
      return (
        <Badge variant="outline" className="bg-indigo-50 text-indigo-800 border-indigo-200 text-[9px] font-bold uppercase">
          <GraduationCap className="w-2.5 h-2.5 mr-1 text-indigo-600" />
          <span>Scholar</span>
        </Badge>
      );

    case 'PROMOTIONAL_TRIAL':
      return (
        <Badge variant="outline" className="bg-sky-50 text-sky-800 border-sky-200 text-[9px] font-bold uppercase">
          <Sparkles className="w-2.5 h-2.5 mr-1 text-sky-600" />
          <span>Trialist</span>
        </Badge>
      );

    case 'EXPIRING_SOON':
      return (
        <Badge variant="destructive" className="bg-orange-600 text-white text-[9px] font-black uppercase">
          <AlertTriangle className="w-2.5 h-2.5 mr-1" />
          <span>Expiring Soon</span>
        </Badge>
      );

    case 'INACTIVE_CHURNED':
      return (
        <Badge variant="outline" className="bg-slate-100 text-slate-500 border-slate-300 text-[9px] font-semibold uppercase">
          <UserX className="w-2.5 h-2.5 mr-1" />
          <span>Inactive / Lapsed</span>
        </Badge>
      );

    case 'LEAD_PROSPECT':
    default:
      return (
        <Badge variant="outline" className="bg-purple-50 text-purple-800 border-purple-200 text-[9px] font-bold uppercase">
          <UserPlus className="w-2.5 h-2.5 mr-1 text-purple-600" />
          <span>Lead / Prospect</span>
        </Badge>
      );
  }
};

export default CRMSegmentBadge;
