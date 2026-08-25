import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '../../ui/button';

/**
 * Reusable Admin Error State component
 */
export const AdminErrorState = ({
  title = 'Failed to load data',
  message = 'An unexpected error occurred while fetching data from the server.',
  onRetry = null,
}) => {
  return (
    <div className="w-full py-10 px-4 flex flex-col items-center justify-center text-center select-none space-y-3 bg-red-50/50 border border-red-100 rounded-2xl">
      <div className="w-12 h-12 rounded-xl bg-red-100 flex items-center justify-center text-red-600 mb-1">
        <AlertCircle className="w-6 h-6" />
      </div>

      <div className="max-w-md space-y-1">
        <h4 className="text-sm sm:text-base font-bold text-red-900">
          {title}
        </h4>
        <p className="text-xs text-red-600/90 leading-relaxed">
          {message}
        </p>
      </div>

      {onRetry && (
        <div className="pt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onRetry}
            className="rounded-lg text-xs font-semibold px-4 border-red-200 text-red-700 hover:bg-red-100/50"
          >
            <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
            <span>Try Again</span>
          </Button>
        </div>
      )}
    </div>
  );
};

export default AdminErrorState;
