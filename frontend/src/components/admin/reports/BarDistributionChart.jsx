import React from 'react';

export const BarDistributionChart = ({
  items = [], // [{ label: 'Doctor', count: 42, color: 'bg-emerald-500' }, ...]
  maxVal = null,
  unit = '',
}) => {
  if (!items || items.length === 0) {
    return (
      <div className="h-32 flex items-center justify-center text-slate-400 text-xs">
        No breakdown data available.
      </div>
    );
  }

  const highest = maxVal || Math.max(...items.map((i) => i.count || 0), 1);

  return (
    <div className="space-y-3 font-sans select-none text-xs">
      {items.map((item, idx) => {
        const percent = Math.min(100, Math.round(((item.count || 0) / highest) * 100));
        return (
          <div key={idx} className="space-y-1">
            <div className="flex items-center justify-between text-[11px]">
              <span className="font-bold text-slate-700">{item.label}</span>
              <span className="font-mono text-slate-900 font-bold">
                {item.count?.toLocaleString('en-IN')} {unit}
              </span>
            </div>

            {/* Progress Track */}
            <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  item.color || 'bg-[#284661]'
                }`}
                style={{ width: `${percent}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default BarDistributionChart;
