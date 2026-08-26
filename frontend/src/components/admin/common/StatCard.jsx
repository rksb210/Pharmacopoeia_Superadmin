import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { Card } from '../../ui/card';

/**
 * Metric KPI Stat Card component with guaranteed responsive text containment
 */
export const StatCard = ({
  title,
  value,
  subtitle,
  icon: Icon,
  trend = null, // { value: '+12%', isPositive: true }
  iconColor = 'text-[#E76120]',
  iconBg = 'bg-[#FFF5EE]',
  badge = null,
  onClick,
}) => {
  return (
    <Card
      onClick={onClick}
      className={`
        p-3.5 sm:p-4 rounded-2xl border border-slate-200/80 bg-white select-none
        transition-all duration-150 flex flex-col justify-between overflow-hidden min-w-0
        ${onClick ? 'hover:border-slate-300 hover:shadow-xs cursor-pointer active:scale-[0.99]' : ''}
      `}
    >
      <div className="flex items-start justify-between gap-2 min-w-0">
        <div className="space-y-0.5 min-w-0 flex-1">
          <span className="text-[11px] sm:text-xs font-semibold text-slate-500 truncate block" title={title}>
            {title}
          </span>
          <div className="flex items-baseline gap-1.5 min-w-0 overflow-hidden">
            <h3 className="text-base sm:text-lg md:text-xl font-extrabold text-slate-900 tracking-tight truncate block" title={typeof value === 'string' || typeof value === 'number' ? String(value) : ''}>
              {value}
            </h3>
            {badge}
          </div>
        </div>

        {Icon && (
          <div className={`w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 rounded-xl ${iconBg} ${iconColor} flex items-center justify-center shrink-0`}>
            <Icon className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
          </div>
        )}
      </div>

      {(subtitle || trend) && (
        <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] min-w-0 overflow-hidden gap-1">
          {trend && (
            <div className={`flex items-center gap-1 font-semibold shrink-0 ${trend.isPositive ? 'text-emerald-600' : 'text-red-600'}`}>
              {trend.isPositive ? (
                <TrendingUp className="w-3 h-3" />
              ) : (
                <TrendingDown className="w-3 h-3" />
              )}
              <span className="text-[10px]">{trend.value}</span>
            </div>
          )}

          {subtitle && (
            <span className="text-slate-400 font-medium truncate block text-[10px] sm:text-[11px]" title={subtitle}>
              {subtitle}
            </span>
          )}
        </div>
      )}
    </Card>
  );
};

export default StatCard;
