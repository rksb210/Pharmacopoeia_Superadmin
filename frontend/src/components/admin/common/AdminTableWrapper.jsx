import React from 'react';
import { Search, ChevronLeft, ChevronRight, Filter } from 'lucide-react';
import { TableSkeleton } from './AdminLoader';
import { AdminEmptyState } from './AdminEmptyState';
import { AdminErrorState } from './AdminErrorState';
import { Button } from '../../ui/button';

/**
 * Reusable Admin Table Wrapper with search, filter actions, loading/empty states & pagination
 */
export const AdminTableWrapper = ({
  title,
  subtitle,
  searchQuery = '',
  onSearchChange = null,
  searchPlaceholder = 'Search records...',
  headerActions = null,
  filters = null,
  loading = false,
  error = null,
  onRetry = null,
  isEmpty = false,
  emptyTitle = 'No records found',
  emptyDescription = 'There are no items matching your criteria at this moment.',
  emptyActionLabel = null,
  onEmptyAction = null,
  children,
  // Pagination Props
  currentPage = 1,
  totalPages = 1,
  totalItems = 0,
  itemsPerPage = 10,
  onPageChange = null,
}) => {
  const startItem = totalItems === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  return (
    <div className="w-full bg-white border border-slate-200/80 rounded-2xl shadow-2xs overflow-hidden select-none">
      {/* Top Toolbar: Title / Search / Filter Actions */}
      <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col lg:flex-row lg:items-center justify-between gap-3.5">
        {(title || subtitle) && (
          <div className="space-y-0.5">
            {title && <h3 className="text-base font-bold text-slate-900">{title}</h3>}
            {subtitle && <p className="text-xs text-slate-500 font-medium">{subtitle}</p>}
          </div>
        )}

        <div className="flex flex-wrap items-center gap-2.5 sm:gap-3 flex-1 justify-end">
          {/* Search Input */}
          {onSearchChange && (
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder={searchPlaceholder}
                className="w-full h-9 pl-9 pr-3 bg-slate-50/70 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-[#E76120] focus:bg-white focus:ring-2 focus:ring-[#E76120]/15 transition-all"
              />
            </div>
          )}

          {/* Filter Slots */}
          {filters}

          {/* Action Buttons Slot */}
          {headerActions}
        </div>
      </div>

      {/* Main Table Content Container */}
      <div className="relative w-full overflow-x-auto">
        {loading ? (
          <TableSkeleton rows={5} cols={5} />
        ) : error ? (
          <div className="p-6">
            <AdminErrorState message={error} onRetry={onRetry} />
          </div>
        ) : isEmpty ? (
          <AdminEmptyState
            title={emptyTitle}
            description={emptyDescription}
            actionLabel={emptyActionLabel}
            onAction={onEmptyAction}
          />
        ) : (
          children
        )}
      </div>

      {/* Pagination Footer */}
      {!loading && !error && !isEmpty && onPageChange && totalPages > 1 && (
        <div className="px-4 sm:px-6 py-3.5 border-t border-slate-100 bg-slate-50/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-500">
          <div>
            <span>
              Showing <span className="font-semibold text-slate-700">{startItem}</span> to{' '}
              <span className="font-semibold text-slate-700">{endItem}</span> of{' '}
              <span className="font-semibold text-slate-700">{totalItems}</span> entries
            </span>
          </div>

          <div className="flex items-center gap-1.5 self-end sm:self-auto">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage <= 1}
              className="h-8 px-2.5 rounded-lg text-xs"
              title="Previous page"
            >
              <ChevronLeft className="w-3.5 h-3.5 mr-1" />
              <span>Previous</span>
            </Button>

            <span className="px-3 py-1 bg-white border border-slate-200 rounded-lg font-bold text-slate-800 text-xs shadow-2xs">
              {currentPage} / {totalPages}
            </span>

            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage >= totalPages}
              className="h-8 px-2.5 rounded-lg text-xs"
              title="Next page"
            >
              <span>Next</span>
              <ChevronRight className="w-3.5 h-3.5 ml-1" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminTableWrapper;
