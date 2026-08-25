import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { Card } from '../../ui/card';

/**
 * Metric KPI Stat Card component
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
        p-5 rounded-2xl border border-slate-200/80 bg-white select-none
        transition-all duration-150 flex flex-col justify-between
        ${onClick ? 'hover:border-slate-300 hover:shadow-xs cursor-pointer active:scale-[0.99]' : ''}
      `}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <span className="text-xs font-semibold text-slate-500">{title}</span>
          <div className="flex items-baseline gap-2">
            <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              {value}
            </h3>
            {badge}
          </div>
        </div>

        {Icon && (
          <div className={`w-11 h-11 rounded-xl ${iconBg} ${iconColor} flex items-center justify-center shrink-0`}>
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>

      {(subtitle || trend) && (
        <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
          {trend && (
            <div className={`flex items-center gap-1 font-semibold ${trend.isPositive ? 'text-emerald-600' : 'text-red-600'}`}>
              {trend.isPositive ? (
                <TrendingUp className="w-3.5 h-3.5" />
              ) : (
                <TrendingDown className="w-3.5 h-3.5" />
              )}
              <span>{trend.value}</span>
            </div>
          )}

          {subtitle && (
            <span className="text-slate-400 font-medium">{subtitle}</span>
          )}
        </div>
      )}
    </Card>
  );
};

export default StatCard;
