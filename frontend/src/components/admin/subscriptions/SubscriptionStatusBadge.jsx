import React from 'react';
import { Badge } from '../../ui/badge';
import { Clock, CheckCircle2, AlertTriangle, XCircle, Gift, Percent } from 'lucide-react';

export const SubscriptionStatusBadge = ({ status = 'active', type = 'paid', isExpiringSoon = false }) => {
  if (status === 'cancelled') {
    return (
      <Badge variant="destructive" className="text-[10px] font-bold gap-1">
        <XCircle className="w-3 h-3" />
        <span>Cancelled</span>
      </Badge>
    );
  }

  if (status === 'expired') {
    return (
      <Badge variant="destructive" className="text-[10px] font-bold gap-1 bg-red-100 text-red-700 border-red-200">
        <XCircle className="w-3 h-3" />
        <span>Expired</span>
      </Badge>
    );
  }

  if (status === 'suspended') {
    return (
      <Badge variant="outline" className="text-[10px] font-bold text-amber-700 bg-amber-50 border-amber-200 gap-1">
        <AlertTriangle className="w-3 h-3 text-amber-600" />
        <span>Suspended</span>
      </Badge>
    );
  }

  if (isExpiringSoon) {
    return (
      <Badge variant="nfiYellow" className="text-[10px] font-extrabold gap-1 animate-pulse">
        <Clock className="w-3 h-3" />
        <span>Expiring Soon</span>
      </Badge>
    );
  }

  // Active status by type
  if (type === 'trial') {
    return (
      <Badge variant="nfiYellow" className="text-[10px] font-bold gap-1">
        <Clock className="w-3 h-3" />
        <span>Free Trial</span>
      </Badge>
    );
  }

  if (type === 'complimentary') {
    return (
      <Badge variant="secondary" className="text-[10px] font-bold gap-1 bg-purple-100 text-purple-800 border-purple-200">
        <Gift className="w-3 h-3 text-purple-600" />
        <span>Complimentary VIP</span>
      </Badge>
    );
  }

  if (type === 'discounted') {
    return (
      <Badge variant="outline" className="text-[10px] font-bold gap-1 bg-emerald-50 text-emerald-700 border-emerald-200">
        <Percent className="w-3 h-3 text-emerald-600" />
        <span>Discounted Active</span>
      </Badge>
    );
  }

  return (
    <Badge variant="nfiNavy" className="text-[10px] font-bold gap-1">
      <CheckCircle2 className="w-3 h-3" />
      <span>Active License</span>
    </Badge>
  );
};

export default SubscriptionStatusBadge;
