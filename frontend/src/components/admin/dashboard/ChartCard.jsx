import React, { useState } from 'react';
import { Users, TrendingUp, DollarSign, Calendar, Sparkles } from 'lucide-react';
import { Badge } from '../../ui/badge';

export const ChartCard = ({
  title = 'Formulary Registrations & Revenue Velocity',
  subtitle = 'Financial Year Performance (April – March)',
  trendData = {
    labels: ['Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar'],
    monographViews: [0, 0, 0, 0, 11, 0, 0, 0, 0, 0, 0, 0],
    revenueINR: [0, 0, 0, 0, 14004, 0, 0, 0, 0, 0, 0, 0],
    fiscalYearLabel: 'FY 2026-27 (April – March)',
  },
}) => {
  const [metric, setMetric] = useState('registrations'); // 'registrations' | 'revenue'
  const [hoveredIdx, setHoveredIdx] = useState(null);

  const labels = trendData.labels || ['Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar'];
  const dataValues =
    metric === 'registrations'
      ? trendData.monographViews || []
      : trendData.revenueINR || [];

  const totalSum = dataValues.reduce((acc, v) => acc + (Number(v) || 0), 0);
  const maxVal = Math.max(...dataValues, metric === 'registrations' ? 5 : 5000);

  const isRevenue = metric === 'revenue';
  const themeColor = isRevenue ? '#E76120' : '#284661';
  const themeGradient = isRevenue
    ? 'from-[#E76120] to-[#f97316]'
    : 'from-[#284661] to-[#3b678e]';

  return (
    <div className="bg-white border border-slate-200/80 rounded-2xl p-5 sm:p-6 shadow-2xs space-y-5 select-none font-sans">
      {/* Header with Title & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-bold text-slate-900 text-sm tracking-tight">{title}</h3>
            <Badge variant="nfiNavy" className="text-[9px] px-2 py-0.5 font-bold uppercase tracking-wider">
              {trendData.fiscalYearLabel || 'April – March'}
            </Badge>
          </div>
          <p className="text-slate-400 text-xs">
            {isRevenue ? 'Monthly commercial revenue realization' : 'Monthly public & institutional subscriber enrollments'}
          </p>
        </div>

        {/* Metric Selector Tabs */}
        <div className="flex items-center gap-1 bg-slate-100/90 p-1 rounded-xl self-start sm:self-auto border border-slate-200/60">
          <button
            type="button"
            onClick={() => {
              setMetric('registrations');
              setHoveredIdx(null);
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              !isRevenue
                ? 'bg-white text-[#284661] shadow-2xs'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <Users className="w-3.5 h-3.5 text-sky-600" />
            <span>Registrations</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setMetric('revenue');
              setHoveredIdx(null);
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              isRevenue
                ? 'bg-white text-[#E76120] shadow-2xs'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <DollarSign className="w-3.5 h-3.5 text-[#E76120]" />
            <span>Revenue (₹)</span>
          </button>
        </div>
      </div>

      {/* Summary Highlight Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 bg-slate-50/80 rounded-xl border border-slate-100">
        <div className="flex items-center gap-3">
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold shadow-2xs shrink-0 ${
              isRevenue ? 'bg-[#FFF5EE] text-[#E76120]' : 'bg-blue-50 text-[#284661]'
            }`}
          >
            {isRevenue ? <TrendingUp className="w-5 h-5" /> : <Users className="w-5 h-5" />}
          </div>
          <div>
            <span className="text-[11px] font-semibold text-slate-400 block uppercase tracking-wider">
              {isRevenue ? 'Total FY Realized Revenue' : 'Total FY Registrations'}
            </span>
            <span className="text-lg font-black text-slate-900 tracking-tight">
              {isRevenue ? `₹${totalSum.toLocaleString('en-IN')}` : `${totalSum} Subscribers`}
            </span>
          </div>
        </div>

        <div className="flex items-center justify-end sm:border-l sm:border-slate-200/60 sm:pl-4 text-right">
          <div>
            <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider">
              Selected Horizon
            </span>
            <span className="text-xs font-bold text-[#284661] flex items-center gap-1 justify-end">
              <Calendar className="w-3 h-3 text-[#E76120]" />
              <span>12 Months (April – March)</span>
            </span>
          </div>
        </div>
      </div>

      {/* Bar Chart Container */}
      <div className="pt-2">
        <div className="h-48 flex items-end justify-between gap-1.5 sm:gap-3 px-1 sm:px-2 border-b border-slate-100 pb-3">
          {labels.map((monthLabel, idx) => {
            const rawVal = Number(dataValues[idx]) || 0;
            const heightPercent = maxVal > 0 ? (rawVal / maxVal) * 100 : 0;
            const isHovered = hoveredIdx === idx;
            const hasData = rawVal > 0;

            return (
              <div
                key={monthLabel}
                onMouseEnter={() => setHoveredIdx(idx)}
                onMouseLeave={() => setHoveredIdx(null)}
                className="flex-1 flex flex-col items-center h-full justify-end relative group cursor-pointer"
              >
                {/* Floating Tooltip */}
                {isHovered && (
                  <div className="absolute -top-12 z-20 transition-all transform -translate-x-1/2 left-1/2 bg-slate-900 text-white text-[11px] font-mono px-2.5 py-1 rounded-lg shadow-lg pointer-events-none whitespace-nowrap animate-in fade-in-0 duration-150">
                    <span className="font-bold text-white block">
                      {monthLabel}: {isRevenue ? `₹${rawVal.toLocaleString('en-IN')}` : `${rawVal} user(s)`}
                    </span>
                    <div className="w-2 h-2 bg-slate-900 rotate-45 mx-auto -mb-2 mt-0.5" />
                  </div>
                )}

                {/* Track (Background Column) */}
                <div className="w-full max-w-[28px] h-full flex items-end justify-center bg-slate-100/50 rounded-t-lg p-0.5">
                  {/* Active Bar Fill */}
                  <div
                    style={{
                      height: hasData ? `${Math.max(8, heightPercent)}%` : '4px',
                    }}
                    className={`w-full rounded-t-md transition-all duration-300 ${
                      hasData
                        ? `bg-gradient-to-t ${themeGradient} shadow-xs`
                        : 'bg-slate-200'
                    } ${isHovered ? 'brightness-110 scale-x-105' : ''}`}
                  />
                </div>

                {/* Month Label */}
                <span
                  className={`text-[10px] font-bold mt-2 transition-colors ${
                    isHovered
                      ? 'text-slate-900 scale-105 font-black'
                      : hasData
                      ? 'text-[#284661] font-bold'
                      : 'text-slate-400'
                  }`}
                >
                  {monthLabel}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Footer Legend / Real-Time Telemetry */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-500 pt-1">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-[#284661]" />
          <span className="font-medium text-slate-600">Active Financial Year Aggregation</span>
        </div>
        <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
          <Sparkles className="w-3.5 h-3.5 text-[#E76120]" />
          <span>Real-time database sync</span>
        </div>
      </div>
    </div>
  );
};

export default ChartCard;
