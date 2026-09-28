import React from 'react';
import AdminModal from '../common/AdminModal';
import { Table as TableIcon, CheckCircle2, XCircle } from 'lucide-react';
import { Badge } from '../../ui/badge';

export const TablePreviewModal = ({ isOpen, onClose, table = null }) => {
  if (!table) return null;

  const headers = Array.isArray(table.headers) ? table.headers : [];
  const rows = Array.isArray(table.rows) ? table.rows : [];

  return (
    <AdminModal
      isOpen={isOpen}
      onClose={onClose}
      title={table.title}
      description={`Table Code: ${table.tableCode}`}
      showConfirm={false}
      cancelLabel="Close Preview"
      size="lg"
    >
      <div className="space-y-4">
        {/* Caption and Status Header */}
        <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-100">
          <div>
            {table.caption && (
              <p className="text-xs font-semibold text-slate-700 italic">{table.caption}</p>
            )}
          </div>
          <Badge
            variant={table.isActive ? 'success' : 'secondary'}
            className="text-[10px] font-bold uppercase tracking-wider"
          >
            {table.isActive ? 'Active' : 'Inactive'}
          </Badge>
        </div>

        {/* Tabular Grid View */}
        <div className="overflow-x-auto border border-slate-200 rounded-xl bg-white shadow-2xs">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="bg-[#FFF8E7] border-b border-amber-200">
                <th className="p-2.5 w-10 text-center font-bold text-amber-900 border-r border-amber-200/60">#</th>
                {headers.map((h, i) => (
                  <th
                    key={i}
                    className="p-2.5 font-bold text-amber-950 border-r border-amber-200/60 last:border-r-0"
                  >
                    {h || `Col ${i + 1}`}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map((row, rIdx) => (
                <tr key={rIdx} className={rIdx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}>
                  <td className="p-2 text-center text-slate-400 font-semibold border-r border-slate-100">
                    {rIdx + 1}
                  </td>
                  {headers.map((_, cIdx) => (
                    <td
                      key={cIdx}
                      className="p-2.5 text-slate-700 font-medium border-r border-slate-100 last:border-r-0"
                    >
                      {row[cIdx] || <span className="text-slate-300">-</span>}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Footnotes */}
        {table.footnotes && (
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600 space-y-1">
            <span className="font-bold text-slate-700 block">Footnotes:</span>
            <p className="leading-relaxed whitespace-pre-wrap">{table.footnotes}</p>
          </div>
        )}
      </div>
    </AdminModal>
  );
};

export default TablePreviewModal;
