import React from 'react';

export const DonutDistributionChart = ({
  items = [], // [{ label: 'Individual', count: 24, color: '#284661' }, ...]
  centerLabel = 'Total',
}) => {
  if (!items || items.length === 0) {
    return (
      <div className="h-40 flex items-center justify-center text-slate-400 text-xs">
        No distribution data.
      </div>
    );
  }

  const total = items.reduce((sum, item) => sum + (item.count || 0), 0);
  const size = 160;
  const strokeWidth = 24;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  let accumulatedPercent = 0;

  return (
    <div className="flex flex-col sm:flex-row items-center justify-center gap-6 font-sans select-none">
      {/* SVG Donut */}
      <div className="relative w-40 h-40 shrink-0">
        <svg viewBox={`0 0 ${size} ${size}`} className="w-full h-full -rotate-90">
          {/* Background circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="transparent"
            stroke="#f1f5f9"
            strokeWidth={strokeWidth}
          />

          {/* Segment strokes */}
          {items.map((item, idx) => {
            if (total === 0 || !item.count) return null;
            const percent = item.count / total;
            const strokeDasharray = `${circumference * percent} ${circumference * (1 - percent)}`;
            const strokeDashoffset = -circumference * accumulatedPercent;
            accumulatedPercent += percent;

            return (
              <circle
                key={idx}
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="transparent"
                stroke={item.color || '#284661'}
                strokeWidth={strokeWidth}
                strokeDasharray={strokeDasharray}
                strokeDashoffset={strokeDashoffset}
                className="transition-all duration-500"
              />
            );
          })}
        </svg>

        {/* Center Label */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-[10px] font-bold text-slate-400 uppercase">{centerLabel}</span>
          <span className="text-base font-black text-slate-900 font-mono">
            {total.toLocaleString('en-IN')}
          </span>
        </div>
      </div>

      {/* Legend list */}
      <div className="space-y-1.5 min-w-[140px] text-xs">
        {items.map((item, idx) => {
          const pct = total > 0 ? Math.round(((item.count || 0) / total) * 100) : 0;
          return (
            <div key={idx} className="flex items-center justify-between gap-3 text-[11px]">
              <div className="flex items-center gap-1.5 truncate">
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: item.color || '#284661' }}
                />
                <span className="text-slate-700 font-semibold truncate">{item.label}</span>
              </div>
              <span className="font-mono text-slate-900 font-bold shrink-0">
                {item.count} ({pct}%)
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default DonutDistributionChart;
