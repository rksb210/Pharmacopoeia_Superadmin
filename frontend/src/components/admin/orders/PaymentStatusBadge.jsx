import React from 'react';
import { Badge } from '../../ui/badge';
import { CheckCircle2, Clock, XCircle, RotateCcw } from 'lucide-react';

export const PaymentStatusBadge = ({ status }) => {
  switch (status) {
    case 'paid':
      return (
        <Badge variant="outline" className="bg-emerald-50 text-emerald-800 border-emerald-300 text-[9px] font-bold uppercase">
          <CheckCircle2 className="w-2.5 h-2.5 mr-1 text-emerald-600" />
          <span>Paid</span>
        </Badge>
      );

    case 'pending':
      return (
        <Badge variant="outline" className="bg-amber-50 text-amber-800 border-amber-300 text-[9px] font-bold uppercase">
          <Clock className="w-2.5 h-2.5 mr-1 text-[#E76120]" />
          <span>Pending</span>
        </Badge>
      );

    case 'refunded':
    case 'partially_refunded':
      return (
        <Badge variant="outline" className="bg-purple-50 text-purple-800 border-purple-200 text-[9px] font-bold uppercase">
          <RotateCcw className="w-2.5 h-2.5 mr-1 text-purple-600" />
          <span>{status === 'partially_refunded' ? 'Partial Refund' : 'Refunded'}</span>
        </Badge>
      );

    case 'failed':
    default:
      return (
        <Badge variant="destructive" className="text-[9px] font-black uppercase">
          <XCircle className="w-2.5 h-2.5 mr-1" />
          <span>Failed</span>
        </Badge>
      );
  }
};

export default PaymentStatusBadge;
