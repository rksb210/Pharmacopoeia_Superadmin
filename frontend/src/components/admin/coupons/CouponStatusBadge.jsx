import React from 'react';
import { Badge } from '../../ui/badge';
import { CheckCircle2, Clock, XCircle, AlertTriangle } from 'lucide-react';

export const CouponStatusBadge = ({ coupon }) => {
  if (!coupon) return null;

  const now = new Date();
  const isExpired = new Date(coupon.endDate) <= now;
  const isDepleted = coupon.usageLimit > 0 && coupon.usageCount >= coupon.usageLimit;
  const isExpiringSoon =
    coupon.isActive &&
    !isExpired &&
    new Date(coupon.endDate) <= new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  if (!coupon.isActive) {
    return (
      <Badge variant="outline" className="text-[9px] font-bold text-slate-500 bg-slate-100">
        Disabled
      </Badge>
    );
  }

  if (isExpired) {
    return (
      <Badge variant="destructive" className="text-[9px] font-bold bg-red-100 text-red-700 border-red-200">
        <XCircle className="w-2.5 h-2.5 mr-1" />
        <span>Expired</span>
      </Badge>
    );
  }

  if (isDepleted) {
    return (
      <Badge variant="secondary" className="text-[9px] font-bold bg-amber-100 text-amber-800 border-amber-200">
        <AlertTriangle className="w-2.5 h-2.5 mr-1" />
        <span>Limit Reached</span>
      </Badge>
    );
  }

  if (isExpiringSoon) {
    return (
      <Badge variant="nfiYellow" className="text-[9px] font-extrabold animate-pulse">
        <Clock className="w-2.5 h-2.5 mr-1" />
        <span>Expiring Soon</span>
      </Badge>
    );
  }

  return (
    <Badge variant="nfiNavy" className="text-[9px] font-bold">
      <CheckCircle2 className="w-2.5 h-2.5 mr-1" />
      <span>Active</span>
    </Badge>
  );
};

export default CouponStatusBadge;
