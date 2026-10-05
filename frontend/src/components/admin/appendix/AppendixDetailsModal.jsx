import React, { useState } from 'react';
import AdminModal from '../common/AdminModal';
import { Badge } from '../../ui/badge';
import { Button } from '../../ui/button';
import {
  BookOpen,
  FileText,
  Table as TableIcon,
  Layers,
  Hash,
  ExternalLink,
  Copy,
  Check,
} from 'lucide-react';

export const AppendixDetailsModal = ({ isOpen, onClose, appendix = null }) => {
  const [activeTab, setActiveTab] = useState('text'); // 'text' | 'sections' | 'tables'
  const [copied, setCopied] = useState(false);

  if (!appendix) return null;

  const handleCopyText = () => {
    if (appendix.sourceText) {
      navigator.clipboard.writeText(appendix.sourceText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const structuredSections = appendix.structuredSections || [];
  const structuredTables = appendix.structuredTables || [];
  const subSections = appendix.subSections || [];

  return (
    <AdminModal
      isOpen={isOpen}
      onClose={onClose}
      title={`Appendix ${appendix.number}: ${appendix.title}`}
      description="Full clinical reference details, page ranges, structured sections, and tables."
      size="3xl"
    >
      <div className="space-y-4">
        {/* Header Metadata Chips */}
        <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 bg-slate-50/80 border border-slate-200 rounded-2xl">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline" className="bg-amber-50 text-amber-900 border-amber-300 font-bold text-xs">
              Appendix {appendix.number}
            </Badge>

            {appendix.pageRange?.start && (
              <Badge variant="outline" className="bg-white text-slate-700 border-slate-300 text-xs font-medium">
                NFI pp. {appendix.pageRange.start}–{appendix.pageRange.end || appendix.pageRange.start}
              </Badge>
            )}

            {appendix.bookPageRange?.start && (
              <Badge variant="outline" className="bg-white text-slate-600 border-slate-200 text-xs font-normal">
                Book pp. {appendix.bookPageRange.start}–{appendix.bookPageRange.end || appendix.bookPageRange.start}
              </Badge>
            )}

            <Badge
              variant={appendix.status === 'ACTIVE' || appendix.isActive ? 'success' : 'secondary'}
              className="text-[10px] uppercase font-bold"
            >
              {appendix.status || (appendix.isActive ? 'ACTIVE' : 'INACTIVE')}
            </Badge>
          </div>

          <div className="text-[11px] font-mono text-slate-500">
            slug: {appendix.slug}
          </div>
        </div>

        {/* Tab Selector */}
        <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
          <button
            type="button"
            onClick={() => setActiveTab('text')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors ${
              activeTab === 'text'
                ? 'bg-amber-100 text-amber-950 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <FileText className="w-3.5 h-3.5 text-orange-600" />
            <span>Clinical Text</span>
          </button>

          {structuredSections.length > 0 && (
            <button
              type="button"
              onClick={() => setActiveTab('sections')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors ${
                activeTab === 'sections'
                  ? 'bg-amber-100 text-amber-950 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Layers className="w-3.5 h-3.5 text-orange-600" />
              <span>Structured Sections ({structuredSections.length})</span>
            </button>
          )}

          {structuredTables.length > 0 && (
            <button
              type="button"
              onClick={() => setActiveTab('tables')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors ${
                activeTab === 'tables'
                  ? 'bg-amber-100 text-amber-950 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <TableIcon className="w-3.5 h-3.5 text-blue-600" />
              <span>Tables ({structuredTables.length})</span>
            </button>
          )}

          {activeTab === 'text' && appendix.sourceText && (
            <div className="ml-auto">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleCopyText}
                className="h-7 text-xs text-slate-500 hover:text-slate-900 gap-1"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied' : 'Copy Text'}</span>
              </Button>
            </div>
          )}
        </div>

        {/* Tab 1: Clinical Text */}
        {activeTab === 'text' && (
          <div className="p-4 bg-slate-50/50 rounded-2xl border border-slate-200 max-h-[500px] overflow-y-auto space-y-3">
            {appendix.sourceText ? (
              <div className="text-xs text-slate-800 leading-relaxed whitespace-pre-wrap font-sans">
                {appendix.sourceText}
              </div>
            ) : (
              <p className="text-xs text-slate-400 italic text-center py-8">
                No clinical guidance text recorded for this appendix.
              </p>
            )}
          </div>
        )}

        {/* Tab 2: Structured Sections */}
        {activeTab === 'sections' && (
          <div className="space-y-3 max-h-[500px] overflow-y-auto">
            {structuredSections.map((sec, idx) => (
              <div
                key={sec._id || sec.sectionId || idx}
                className="p-3.5 bg-white border border-slate-200 rounded-xl space-y-1.5"
              >
                <h5 className="text-xs font-bold text-slate-900 border-l-2 border-orange-500 pl-2">
                  {sec.heading || `Section ${idx + 1}`}
                </h5>
                <p className="text-xs text-slate-700 whitespace-pre-wrap leading-relaxed pl-2 font-normal">
                  {sec.content}
                </p>
              </div>
            ))}
          </div>
        )}

        {/* Tab 3: Tables */}
        {activeTab === 'tables' && (
          <div className="space-y-4 max-h-[500px] overflow-y-auto">
            {structuredTables.map((tbl, tblIdx) => (
              <div
                key={tbl._id || tbl.tableId || tblIdx}
                className="p-3.5 bg-white border border-slate-200 rounded-2xl space-y-2 shadow-2xs"
              >
                <div className="flex items-center justify-between gap-2">
                  <h5 className="text-xs font-bold text-slate-900">
                    {tbl.title || tbl.label || `Table ${tblIdx + 1}`}
                  </h5>
                  {tbl.pageNumber && (
                    <Badge variant="outline" className="text-[10px]">
                      p. {tbl.pageNumber}
                    </Badge>
                  )}
                </div>

                <div className="overflow-x-auto border border-slate-200 rounded-xl bg-white">
                  <table className="w-full text-xs text-left border-collapse">
                    {Array.isArray(tbl.headers) && tbl.headers.length > 0 && (
                      <thead className="bg-slate-100 text-slate-800 uppercase tracking-wider text-[10px] font-bold">
                        <tr>
                          {tbl.headers.map((h, hIdx) => (
                            <th key={hIdx} className="px-3 py-2 border-b border-slate-200">
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                    )}
                    <tbody className="divide-y divide-slate-100">
                      {Array.isArray(tbl.rows) &&
                        tbl.rows.map((row, rIdx) => (
                          <tr key={rIdx} className="hover:bg-slate-50/70">
                            {Array.isArray(row) ? (
                              row.map((cell, cIdx) => (
                                <td key={cIdx} className="px-3 py-2 text-slate-700">
                                  {typeof cell === 'object' ? JSON.stringify(cell) : String(cell || '')}
                                </td>
                              ))
                            ) : (
                              <td className="px-3 py-2 text-slate-700">{String(row)}</td>
                            )}
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-end pt-3 border-t border-slate-100">
          <Button type="button" variant="outline" size="sm" onClick={onClose} className="rounded-xl px-4">
            Close
          </Button>
        </div>
      </div>
    </AdminModal>
  );
};

export default AppendixDetailsModal;
