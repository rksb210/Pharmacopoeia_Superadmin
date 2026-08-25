import React from 'react';
import Breadcrumb from './Breadcrumb';

/**
 * Reusable PageHeader with title, subtitle, breadcrumb, and action slots
 */
export const PageHeader = ({
  title,
  subtitle,
  children,
  customCrumbs = null,
  badge = null,
}) => {
  return (
    <div className="flex flex-col gap-2 pb-2 border-b border-slate-200/60 select-none">
      <Breadcrumb customCrumbs={customCrumbs} />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              {title}
            </h1>
            {badge}
          </div>
          {subtitle && (
            <p className="text-xs sm:text-sm text-slate-500 font-medium">
              {subtitle}
            </p>
          )}
        </div>

        {/* Action button slots (e.g. Add New, Export, Filter buttons) */}
        {children && (
          <div className="flex items-center gap-2.5 shrink-0">
            {children}
          </div>
        )}
      </div>
    </div>
  );
};

export default PageHeader;
