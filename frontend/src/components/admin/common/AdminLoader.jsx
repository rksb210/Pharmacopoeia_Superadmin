import React from 'react';

/**
 * Reusable Admin Spinner & Skeleton Loader Components
 */
export const AdminSpinner = ({ size = 'md', message = 'Loading data...' }) => {
  const sizeMap = {
    sm: 'w-5 h-5 border-2',
    md: 'w-8 h-8 border-3',
    lg: 'w-12 h-12 border-4',
  };

  return (
    <div className="w-full py-12 flex flex-col items-center justify-center gap-3 select-none">
      <div
        className={`${sizeMap[size] || sizeMap.md} border-[#FFD243] border-t-[#E76120] rounded-full animate-spin`}
      />
      {message && <p className="text-xs font-semibold text-slate-500">{message}</p>}
    </div>
  );
};

export const TableSkeleton = ({ rows = 5, cols = 4 }) => {
  return (
    <div className="w-full space-y-3 p-4 animate-pulse">
      <div className="h-9 bg-slate-100 rounded-lg w-full" />
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-4 items-center">
          {Array.from({ length: cols }).map((_, j) => (
            <div
              key={j}
              className="h-7 bg-slate-50 rounded-md flex-1"
            />
          ))}
        </div>
      ))}
    </div>
  );
};

export const CardSkeleton = ({ count = 4 }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-pulse">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="h-28 bg-white border border-slate-100 rounded-2xl p-5 space-y-3">
          <div className="h-4 bg-slate-100 rounded w-1/2" />
          <div className="h-7 bg-slate-100 rounded w-3/4" />
        </div>
      ))}
    </div>
  );
};

export default {
  AdminSpinner,
  TableSkeleton,
  CardSkeleton,
};
