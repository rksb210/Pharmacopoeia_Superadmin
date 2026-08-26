import React from 'react';
import { Badge } from '../../ui/badge';
import { CheckCircle2, XCircle, AlertTriangle } from 'lucide-react';

export const AuditStatusBadge = ({ status }) => {
  switch (status) {
    case 'SUCCESS':
      return (
        <Badge variant="outline" className="bg-emerald-50 text-emerald-800 border-emerald-300 text-[9px] font-bold uppercase">
          <CheckCircle2 className="w-2.5 h-2.5 mr-1 text-emerald-600" />
          <span>Success</span>
        </Badge>
      );

    case 'WARNING':
      return (
        <Badge variant="outline" className="bg-amber-50 text-amber-800 border-amber-300 text-[9px] font-bold uppercase">
          <AlertTriangle className="w-2.5 h-2.5 mr-1 text-[#E76120]" />
          <span>Warning</span>
        </Badge>
      );

    case 'FAILURE':
    default:
      return (
        <Badge variant="destructive" className="text-[9px] font-black uppercase">
          <XCircle className="w-2.5 h-2.5 mr-1" />
          <span>Failure</span>
        </Badge>
      );
  }
};

export default AuditStatusBadge;
