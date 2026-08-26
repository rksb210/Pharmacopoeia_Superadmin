import React from 'react';
import { Badge } from '../../ui/badge';
import {
  BookOpen,
  Activity,
  MessageSquare,
  AlertCircle,
  ShieldAlert,
  Sparkles,
} from 'lucide-react';

export const FeedbackCategoryBadge = ({ category }) => {
  switch (category) {
    case 'MONOGRAPH_AMENDMENT':
      return (
        <Badge variant="outline" className="bg-sky-50 text-sky-800 border-sky-200 text-[9px] font-bold">
          <BookOpen className="w-2.5 h-2.5 mr-1 text-sky-600" />
          <span>Monograph Amendment</span>
        </Badge>
      );

    case 'DOSAGE_CORRECTION':
      return (
        <Badge variant="outline" className="bg-amber-50 text-amber-800 border-amber-300 text-[9px] font-bold">
          <Activity className="w-2.5 h-2.5 mr-1 text-[#E76120]" />
          <span>Dosage Correction</span>
        </Badge>
      );

    case 'SAFETY_QUERY':
      return (
        <Badge variant="outline" className="bg-red-50 text-red-800 border-red-200 text-[9px] font-bold">
          <ShieldAlert className="w-2.5 h-2.5 mr-1 text-red-600" />
          <span>Safety Query</span>
        </Badge>
      );

    case 'CLINICAL_SUGGESTION':
      return (
        <Badge variant="outline" className="bg-purple-50 text-purple-800 border-purple-200 text-[9px] font-bold">
          <Sparkles className="w-2.5 h-2.5 mr-1 text-purple-600" />
          <span>Clinical Suggestion</span>
        </Badge>
      );

    case 'BUG_REPORT':
      return (
        <Badge variant="outline" className="bg-slate-100 text-slate-800 border-slate-300 text-[9px] font-bold">
          <AlertCircle className="w-2.5 h-2.5 mr-1 text-slate-600" />
          <span>Portal UI Bug</span>
        </Badge>
      );

    case 'GENERAL_FEEDBACK':
    default:
      return (
        <Badge variant="outline" className="bg-slate-50 text-slate-600 border-slate-200 text-[9px] font-bold">
          <MessageSquare className="w-2.5 h-2.5 mr-1 text-slate-500" />
          <span>General Feedback</span>
        </Badge>
      );
  }
};

export default FeedbackCategoryBadge;
