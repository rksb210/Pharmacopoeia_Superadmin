import React from 'react';
import { Badge } from '../../ui/badge';
import { Button } from '../../ui/button';
import {
  Check,
  Users,
  Calendar,
  Sparkles,
  Edit2,
  Eye,
  CreditCard,
  ShieldCheck,
  TrendingUp,
} from 'lucide-react';
import PermissionGuard from '../common/PermissionGuard';

export const PlanCard = ({
  plan,
  onEdit,
  onViewDetails,
  onViewSubscribers,
  onToggleStatus,
}) => {
  const getValidThruBadge = () => {
    if (plan.validityType === 'fixed_date') {
      const formattedDate = plan.fixedDate
        ? new Date(plan.fixedDate).toLocaleDateString('en-GB', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
          })
        : '31 Dec 2031';
      return (
        <Badge variant="nfiNavy" className="text-[9px] font-bold">
          Valid thru {formattedDate}
        </Badge>
      );
    }
    return (
      <Badge variant="secondary" className="text-[9px] font-bold">
        {plan.durationValue} {plan.validityType?.replace('duration_', '')}
      </Badge>
    );
  };

  return (
    <div
      className={`
        bg-white rounded-2xl border transition-all duration-200 flex flex-col justify-between p-5 select-none font-sans relative shadow-2xs
        ${
          plan.isActive
            ? 'border-slate-200/80 hover:border-slate-300 hover:shadow-xs'
            : 'border-slate-200 bg-slate-50/70 opacity-75'
        }
      `}
    >
      {/* Top Tag & Popular Ribbon */}
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-1.5">
          <Badge variant="outline" className="text-[9px] font-extrabold uppercase tracking-wider">
            {plan.tier}
          </Badge>
          {plan.isPopular && (
            <Badge
              variant="nfiYellow"
              className="text-[9px] font-black uppercase tracking-wider flex items-center gap-1 shadow-2xs"
            >
              <Sparkles className="w-2.5 h-2.5" />
              <span>Recommended</span>
            </Badge>
          )}
        </div>

        {/* Status Toggle Pill */}
        <PermissionGuard module="SUBSCRIPTIONS" section="PLANS" action="EDIT">
          <button
            type="button"
            onClick={() => onToggleStatus(plan)}
            className={`
              inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold transition-all cursor-pointer
              ${
                plan.isActive
                  ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                  : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
              }
            `}
            title="Toggle plan availability"
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                plan.isActive ? 'bg-emerald-500' : 'bg-slate-400'
              }`}
            />
            <span>{plan.isActive ? 'Active' : 'Disabled'}</span>
          </button>
        </PermissionGuard>
      </div>

      {/* Plan Title & Description */}
      <div className="space-y-1.5">
        <h3 className="font-extrabold text-slate-900 text-base leading-snug">{plan.name}</h3>
        <p className="text-slate-500 text-xs line-clamp-2 leading-relaxed">{plan.description}</p>
      </div>

      {/* Pricing Tag */}
      <div className="my-4 py-3 border-y border-slate-100 flex items-baseline justify-between">
        <div>
          <span className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            ₹{plan.priceINR?.toLocaleString('en-IN')}
          </span>
          <span className="text-slate-400 text-xs ml-1 font-medium">
            {plan.validityType === 'duration_years'
              ? '/ year'
              : plan.validityType === 'duration_months'
              ? `/${plan.durationValue} mo`
              : ''}
          </span>
        </div>

        {/* Validity Tag */}
        <div className="text-right">
          {getValidThruBadge()}
        </div>
      </div>

      {/* Seat & User Type Badges */}
      <div className="space-y-2 mb-4">
        <div className="flex items-center justify-between text-[11px] text-slate-600">
          <span>Seat Quota:</span>
          <strong className="text-slate-900">
            {plan.seatQuota === 1
              ? 'Single User (1 Seat)'
              : plan.seatQuota === 0
              ? 'Unlimited Seats'
              : `${plan.seatQuota} Concurrent Seats`}
          </strong>
        </div>

        <div className="flex flex-wrap gap-1 items-center">
          <span className="text-[10px] text-slate-400 font-semibold mr-1">Target:</span>
          {plan.applicableUserTypes?.includes('ALL') ? (
            <Badge variant="outline" className="text-[9px] font-bold">
              Universal Access
            </Badge>
          ) : (
            plan.applicableUserTypes?.map((ut) => (
              <Badge key={ut} variant="outline" className="text-[9px] font-bold uppercase">
                {ut}
              </Badge>
            ))
          )}
        </div>
      </div>

      {/* Feature Benefit Checklist */}
      <div className="space-y-2 mb-5">
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
          Formulary Inclusions
        </span>
        <ul className="space-y-1.5 text-xs text-slate-700">
          {plan.features?.slice(0, 4).map((feat, idx) => (
            <li key={idx} className="flex items-start gap-2">
              <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
              <span className="leading-tight text-[11px] font-medium">{feat}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Usage Analytics Footer & Actions */}
      <div className="pt-3 border-t border-slate-100 space-y-3">
        <div className="flex items-center justify-between text-[11px]">
          <button
            type="button"
            onClick={() => onViewSubscribers(plan)}
            className="flex items-center gap-1.5 text-[#284661] hover:underline font-bold cursor-pointer"
          >
            <Users className="w-3.5 h-3.5" />
            <span>{plan.activeSubscribersCount || 0} Active Subscribers</span>
          </button>

          <span className="text-emerald-700 font-bold">
            ₹{(plan.revenueGeneratedINR || 0).toLocaleString('en-IN')}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onViewDetails(plan)}
            className="flex-1 rounded-xl text-xs font-semibold h-8"
          >
            <Eye className="w-3.5 h-3.5 mr-1" />
            <span>Details &amp; Audit</span>
          </Button>

          <PermissionGuard module="SUBSCRIPTIONS" section="PLANS" action="EDIT">
            <Button
              variant="nfiYellow"
              size="sm"
              onClick={() => onEdit(plan)}
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

export default PlanCard;
