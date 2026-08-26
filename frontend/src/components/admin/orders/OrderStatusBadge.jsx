import React from 'react';
import { Badge } from '../../ui/badge';
import { CheckCircle2, Clock, XCircle, RotateCcw, AlertTriangle } from 'lucide-react';

export const OrderStatusBadge = ({ status }) => {
  switch (status) {
    case 'completed':
      return (
        <Badge variant="outline" className="bg-emerald-50 text-emerald-800 border-emerald-300 text-[9px] font-bold uppercase">
          <CheckCircle2 className="w-2.5 h-2.5 mr-1 text-emerald-600" />
          <span>Completed</span>
        </Badge>
      );

    case 'processing':
      return (
        <Badge variant="outline" className="bg-sky-50 text-sky-800 border-sky-200 text-[9px] font-bold uppercase">
          <Clock className="w-2.5 h-2.5 mr-1 text-sky-600" />
          <span>Processing</span>
        </Badge>
      );

    case 'refunded':
      return (
        <Badge variant="outline" className="bg-purple-50 text-purple-800 border-purple-200 text-[9px] font-bold uppercase">
          <RotateCcw className="w-2.5 h-2.5 mr-1 text-purple-600" />
          <span>Refunded</span>
        </Badge>
      );

    case 'failed':
      return (
        <Badge variant="destructive" className="text-[9px] font-black uppercase">
          <XCircle className="w-2.5 h-2.5 mr-1" />
          <span>Failed</span>
        </Badge>
      );

    case 'cancelled':
    default:
      return (
        <Badge variant="outline" className="bg-slate-100 text-slate-600 border-slate-300 text-[9px] font-semibold uppercase">
          <AlertTriangle className="w-2.5 h-2.5 mr-1" />
          <span>Cancelled</span>
        </Badge>
      );
  }
};

export default OrderStatusBadge;
