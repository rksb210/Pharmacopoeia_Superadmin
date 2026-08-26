import React, { useState } from 'react';
import { Badge } from '../../ui/badge';
import { Button } from '../../ui/button';
import {
  Ticket,
  Copy,
  Check,
  Calendar,
  Users,
  Edit2,
  Eye,
  Percent,
  Sparkles,
} from 'lucide-react';
import CouponStatusBadge from './CouponStatusBadge';
import PermissionGuard from '../common/PermissionGuard';

export const CouponCard = ({
  coupon,
  onEdit,
  onViewDetails,
  onToggleStatus,
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(coupon.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const usagePercent =
    coupon.usageLimit > 0
      ? Math.min(100, Math.round((coupon.usageCount / coupon.usageLimit) * 100))
      : null;

  return (
    <div
      className={`
        bg-white rounded-2xl border transition-all duration-200 flex flex-col justify-between select-none font-sans relative shadow-2xs overflow-hidden
        ${
          coupon.isActive
            ? 'border-slate-200/80 hover:border-slate-300 hover:shadow-xs'
            : 'border-slate-200 bg-slate-50/70 opacity-75'
        }
      `}
    >
      {/* Top Scissor Cutout Ticket Header */}
      <div className="p-4 bg-gradient-to-r from-[#284661] to-[#386287] text-white flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-white/15 flex items-center justify-center">
            {coupon.discountType === 'percentage' ? (
              <Percent className="w-4 h-4 text-[#FFD243]" />
            ) : (
              <span className="font-black text-[#FFD243] text-sm">₹</span>
            )}
          </div>
          <div>
            <span className="text-lg font-black text-[#FFD243] leading-none block">
              {coupon.discountType === 'percentage'
                ? `${coupon.discountValue}% OFF`
                : `₹${coupon.discountValue?.toLocaleString('en-IN')} OFF`}
            </span>
            {coupon.maxDiscountINR > 0 && (
              <span className="text-[10px] text-white/80 font-semibold">
                Up to ₹{coupon.maxDiscountINR?.toLocaleString('en-IN')}
              </span>
            )}
          </div>
        </div>

        <CouponStatusBadge coupon={coupon} />
      </div>

      {/* Dashed Border Line */}
      <div className="border-b-2 border-dashed border-slate-200 relative my-0">
        <div className="w-3 h-3 rounded-full bg-[#F8FAFC] absolute -left-1.5 -top-1.5 border-r border-slate-200" />
        <div className="w-3 h-3 rounded-full bg-[#F8FAFC] absolute -right-1.5 -top-1.5 border-l border-slate-200" />
      </div>

      {/* Middle Body */}
      <div className="p-4 space-y-3 flex-1">
        {/* Title & Description */}
        <div className="space-y-1">
          <h4 className="font-bold text-slate-900 text-sm">{coupon.title}</h4>
          <p className="text-slate-500 text-xs line-clamp-2 leading-relaxed">
            {coupon.description || 'Promotional concession voucher for eligible subscribers.'}
          </p>
        </div>

        {/* Copyable Code Box */}
        <div className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded-xl px-3 py-2">
          <div className="flex items-center gap-1.5">
            <Ticket className="w-3.5 h-3.5 text-[#E76120]" />
            <span className="font-mono font-black text-slate-900 tracking-wider text-xs">
              {coupon.code}
            </span>
          </div>

          <button
            type="button"
            onClick={handleCopyCode}
            className="text-[10px] font-bold text-[#E76120] hover:text-[#284661] flex items-center gap-1 transition-colors cursor-pointer"
          >
            {copied ? (
              <>
                <Check className="w-3 h-3 text-emerald-600" />
                <span className="text-emerald-600">Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-3 h-3" />
                <span>Copy</span>
              </>
            )}
          </button>
        </div>

        {/* Target User Categories & Plans */}
        <div className="space-y-1.5 text-[11px] text-slate-600">
          <div className="flex items-center justify-between">
            <span className="text-slate-400">Applicability:</span>
            <span className="font-bold text-slate-800">
              {coupon.applicableUserTypes?.includes('ALL')
                ? 'Universal Access'
                : coupon.applicableUserTypes?.join(', ')}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-slate-400">Min. Order:</span>
            <span className="font-bold text-slate-800">
              {coupon.minOrderAmountINR > 0
                ? `₹${coupon.minOrderAmountINR.toLocaleString('en-IN')}`
                : 'No Minimum'}
            </span>
          </div>
        </div>

        {/* Usage Limit Progress Bar */}
        {coupon.usageLimit > 0 && (
          <div className="space-y-1 pt-1">
            <div className="flex items-center justify-between text-[10px] text-slate-500 font-bold">
              <span>Redemptions</span>
              <span>
                {coupon.usageCount} / {coupon.usageLimit}
              </span>
            </div>
            <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <div
                style={{ width: `${usagePercent}%` }}
                className={`h-full rounded-full transition-all ${
                  usagePercent >= 100
                    ? 'bg-red-500'
                    : usagePercent >= 80
                    ? 'bg-amber-500'
                    : 'bg-emerald-500'
                }`}
              />
            </div>
          </div>
        )}
      </div>

      {/* Footer & Actions */}
      <div className="p-4 pt-2 border-t border-slate-100 bg-slate-50/50 space-y-2.5">
        <div className="flex items-center justify-between text-[10px] text-slate-400">
          <span>Expires: {new Date(coupon.endDate).toLocaleDateString('en-IN')}</span>
          <span>{coupon.redemptionHistory?.length || 0} Redeemed</span>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onViewDetails(coupon)}
            className="flex-1 rounded-xl text-xs font-semibold h-8"
          >
            <Eye className="w-3.5 h-3.5 mr-1" />
            <span>Audit History</span>
          </Button>

          <PermissionGuard module="SUBSCRIPTIONS" section="DISCOUNTS" action="EDIT">
            <Button
              variant="nfiYellow"
              size="sm"
              onClick={() => onEdit(coupon)}
              className="rounded-xl text-xs font-bold h-8 px-3 shadow-2xs"
            >
              <Edit2 className="w-3.5 h-3.5 mr-1" />
              <span>Edit</span>
            </Button>
          </PermissionGuard>
        </div>
      </div>
    </div>
  );
};

export default CouponCard;
