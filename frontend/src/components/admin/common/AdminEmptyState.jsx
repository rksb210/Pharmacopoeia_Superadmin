import React from 'react';
import { FolderOpen } from 'lucide-react';
import { Button } from '../../ui/button';

/**
 * Reusable Empty State component
 */
export const AdminEmptyState = ({
  icon: Icon = FolderOpen,
  title = 'No records found',
  description = 'There are no items matching your criteria at this moment.',
  actionLabel = null,
  onAction = null,
  actionIcon = null,
}) => {
  return (
    <div className="w-full py-12 px-4 flex flex-col items-center justify-center text-center select-none space-y-3">
      <div className="w-14 h-14 rounded-2xl bg-slate-100/80 flex items-center justify-center text-slate-400 mb-1">
        <Icon className="w-7 h-7" />
      </div>

      <div className="max-w-sm space-y-1">
        <h4 className="text-sm sm:text-base font-bold text-slate-800 tracking-tight">
          {title}
        </h4>
        <p className="text-xs text-slate-500 font-normal leading-relaxed">
          {description}
        </p>
      </div>

      {actionLabel && onAction && (
        <div className="pt-2">
          <Button
            variant="nfiYellow"
            size="sm"
            onClick={onAction}
            className="rounded-lg text-xs font-semibold px-4 shadow-2xs"
          >
            {actionIcon && <span className="mr-1">{actionIcon}</span>}
            <span>{actionLabel}</span>
          </Button>
        </div>
      )}
    </div>
  );
};

export default AdminEmptyState;
