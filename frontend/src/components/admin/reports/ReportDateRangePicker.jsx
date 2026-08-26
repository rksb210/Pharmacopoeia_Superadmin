import React from 'react';
import { Calendar } from 'lucide-react';

const PRESETS = [
  { id: '7d', label: 'Last 7 Days' },
  { id: '30d', label: 'Last 30 Days' },
  { id: '90d', label: 'Last 90 Days' },
  { id: 'this_year', label: 'This Year' },
  { id: 'all_time', label: 'All Time' },
];

export const ReportDateRangePicker = ({
  activePreset,
  onSelectPreset,
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
}) => {
  return (
    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 p-3 bg-white border border-slate-200/80 rounded-2xl shadow-2xs">
      {/* Preset Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0">
        {PRESETS.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => onSelectPreset(p.id)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              activePreset === p.id
                ? 'bg-[#284661] text-white shadow-2xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Custom Date Inputs */}
      <div className="flex items-center gap-2 self-start lg:self-auto">
        <div className="flex items-center gap-1 text-slate-400">
          <Calendar className="w-3.5 h-3.5" />
          <span className="text-[11px] font-semibold text-slate-500">Custom:</span>
        </div>
        <input
          type="date"
          value={startDate || ''}
          onChange={(e) => onStartDateChange(e.target.value)}
          className="h-8 px-2.5 bg-slate-50/80 border border-slate-200 rounded-xl text-xs outline-none focus:border-[#E76120]"
          title="Start Date"
        />
        <span className="text-slate-400 text-xs">to</span>
        <input
          type="date"
          value={endDate || ''}
          onChange={(e) => onEndDateChange(e.target.value)}
          className="h-8 px-2.5 bg-slate-50/80 border border-slate-200 rounded-xl text-xs outline-none focus:border-[#E76120]"
          title="End Date"
        />
      </div>
    </div>
  );
};

export default ReportDateRangePicker;
