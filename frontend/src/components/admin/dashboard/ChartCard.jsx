import React, { useState } from 'react';
import { TrendingUp, BarChart2, ArrowUpRight } from 'lucide-react';
import { Badge } from '../../ui/badge';

export const ChartCard = ({
  title = 'Monograph Traffic & Utilization',
  subtitle = '7-day trend analysis',
  trendData = {
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    monographViews: [1240, 1580, 1890, 2100, 2450, 1720, 1450],
    revenueINR: [25000, 42000, 38000, 65000, 89000, 31000, 28000],
  },
}) => {
  const [metric, setMetric] = useState('views'); // 'views' | 'revenue'

  const dataValues =
    metric === 'views' ? trendData.monographViews : trendData.revenueINR;
  const maxValue = Math.max(...dataValues, 1);

  return (
    <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-2xs space-y-4 select-none font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-slate-900 text-sm">{title}</h3>
            <Badge variant="nfiNavy" className="text-[9px] px-1.5 py-0 font-bold uppercase">
              Live Trend
            </Badge>
          </div>
          <p className="text-slate-400 text-xs">{subtitle}</p>
        </div>

        {/* Metric Switcher */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setMetric('views')}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
              metric === 'views'
                ? 'bg-white text-[#284661] shadow-2xs'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            Views (Traffic)
          </button>
          <button
            type="button"
            onClick={() => setMetric('revenue')}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
              metric === 'revenue'
                ? 'bg-white text-[#284661] shadow-2xs'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            Revenue (₹)
          </button>
        </div>
      </div>

      {/* Chart Canvas / Bar Visualization */}
      <div className="pt-2">
        <div className="h-44 flex items-end justify-between gap-2 sm:gap-4 px-2 border-b border-slate-100 pb-2">
          {dataValues.map((val, idx) => {
            const heightPercent = Math.round((val / maxValue) * 100);
            const label = trendData.labels[idx];

            return (
              <div
                key={label}
                className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end group"
              >
                {/* Tooltip on Hover */}
                <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900 text-white text-[10px] font-mono px-1.5 py-0.5 rounded shadow-xs mb-1 pointer-events-none whitespace-nowrap">
                  {metric === 'revenue' ? `₹${val.toLocaleString('en-IN')}` : `${val} views`}
                </div>

                {/* Animated Bar */}
                <div
                  style={{ height: `${Math.max(12, heightPercent)}%` }}
                  className={`w-full rounded-t-lg transition-all duration-300 group-hover:brightness-95 ${
                    metric === 'views'
                      ? 'bg-gradient-to-t from-[#284661] to-[#3b678e]'
                      : 'bg-gradient-to-t from-[#E76120] to-[#FFD243]'
                  }`}
                />

                {/* Day Label */}
                <span className="text-[10px] font-bold text-slate-400 group-hover:text-slate-700">
                  {label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Footer Insight */}
      <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
        <div className="flex items-center gap-1.5">
          <TrendingUp className="w-4 h-4 text-emerald-600" />
          <span className="font-semibold text-slate-700">
            {metric === 'views' ? '+18.4% weekly monograph access' : '+12.6% weekly license subscriptions'}
          </span>
        </div>
        <span className="text-[11px] text-slate-400">Updated Real-Time</span>
      </div>
    </div>
  );
};

export default ChartCard;
