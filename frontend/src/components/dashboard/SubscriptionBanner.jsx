import React from 'react';
import { UserCheck } from 'lucide-react';

export const SubscriptionBanner = ({
  type = 'Individual',
  status = 'Active',
  validUntil = '31-Mar-2027',
  onManage,
}) => {
  return (
    <div className="w-full bg-[#FFF5EE] border border-[#FFD9C2] rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 select-none">
      <div className="flex items-center gap-3.5">
        {/* User / Badge Icon */}
        <div className="w-10 h-10 rounded-xl bg-[#FDBA74]/40 flex items-center justify-center text-[#E76120] shrink-0">
          <UserCheck className="w-5 h-5 text-[#E76120]" />
        </div>

        {/* Text Details */}
        <div className="text-xs sm:text-sm text-slate-800">
          <span className="font-semibold text-slate-900">Subscription: </span>
          <span>{type} — </span>
          <span className="text-emerald-600 font-bold">{status} </span>
          <span className="text-slate-600">until {validUntil}</span>
        </div>
      </div>

      {/* Manage Action Link */}
      <button
        type="button"
        onClick={onManage}
        className="text-xs sm:text-sm font-semibold text-[#E76120] hover:underline self-end sm:self-auto cursor-pointer"
      >
        Manage
      </button>
    </div>
  );
};

export default SubscriptionBanner;
