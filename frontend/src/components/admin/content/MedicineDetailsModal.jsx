import React, { useState } from 'react';
import AdminModal from '../common/AdminModal';
import { Badge } from '../../ui/badge';
import { Pill, Table as TableIcon, FileText, CheckCircle2, AlertCircle, FileEdit, Eye } from 'lucide-react';
import ContentDiffViewer from './ContentDiffViewer';

export const MedicineDetailsModal = ({ isOpen, onClose, medicine = null }) => {
  if (!medicine) return null;

  const [activeTab, setActiveTab] = useState(
    medicine.status === 'in_review' && medicine.lastPublishedSnapshot ? 'diff' : 'standard'
  );

  const sections = Array.isArray(medicine.sections) ? medicine.sections : [];
  const hasSnapshot = Boolean(medicine.lastPublishedSnapshot);

  return (
    <AdminModal
      isOpen={isOpen}
      onClose={onClose}
      title={medicine.name}
      description={medicine.therapeuticClass || 'National Formulary of India Monograph'}
      showConfirm={false}
      cancelLabel="Close Monograph"
      size="xl"
    >
      <div className="space-y-6">
        {/* Monograph Header Card */}
        <div className="p-4 bg-linear-to-r from-amber-50 to-orange-50/50 border border-amber-200/80 rounded-2xl space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h3 className="text-base font-bold text-amber-950 flex items-center gap-2">
                <Pill className="w-5 h-5 text-orange-600" />
                {medicine.name}
              </h3>
              {medicine.brandNames && medicine.brandNames.length > 0 && (
                <p className="text-xs text-slate-600 font-medium mt-0.5">
                  <span className="font-semibold text-slate-700">Proprietary / Brand Names:</span>{' '}
                  {Array.isArray(medicine.brandNames)
                    ? medicine.brandNames.join(', ')
                    : medicine.brandNames}
                </p>
              )}
            </div>

            <div className="flex items-center gap-2">
              <Badge
                variant={medicine.status === 'published' ? 'success' : 'outline'}
                className="text-[10px] font-bold uppercase tracking-wider"
              >
                {medicine.status || 'Published'}
              </Badge>
              <Badge
                variant={medicine.isActive ? 'success' : 'secondary'}
                className="text-[10px] font-bold uppercase tracking-wider"
              >
                {medicine.isActive ? 'Active' : 'Inactive'}
              </Badge>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-amber-200/60 text-xs">
            <div>
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                Chapter
              </span>
              <span className="font-semibold text-slate-800">
                {medicine.chapterId?.title || medicine.chapter?.title || 'Unassigned'}
              </span>
            </div>

            <div>
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                Sub-Chapter
              </span>
              <span className="font-semibold text-slate-800">
                {medicine.subChapterId?.title || medicine.subChapter?.title || 'General'}
              </span>
            </div>

            <div>
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                Dosage Form & Strength
              </span>
              <span className="font-semibold text-slate-800">
                {medicine.dosageForm || '-'} {medicine.strength ? `(${medicine.strength})` : ''}
              </span>
            </div>

            <div>
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                Schedule & ATC
              </span>
              <span className="font-semibold text-slate-800">
                {medicine.schedule || 'Schedule H'}{' '}
                {medicine.atcCode ? `• ATC: ${medicine.atcCode}` : ''}
              </span>
            </div>
          </div>
        </div>

        {/* Navigation Tabs (Standard vs Visual Diff) */}
        {hasSnapshot && (
          <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
            <button
              type="button"
              onClick={() => setActiveTab('standard')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'standard'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              Standard Monograph View
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('diff')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'diff'
                  ? 'bg-amber-500 text-slate-950 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <FileEdit className="w-3.5 h-3.5" />
              Review Visual Diff (+ Added / - Removed)
              <Badge variant="outline" className="ml-1 bg-amber-100 text-amber-900 border-amber-300 text-[9px]">
                In Review
              </Badge>
            </button>
          </div>
        )}

        {activeTab === 'diff' && hasSnapshot ? (
          <ContentDiffViewer item={medicine} itemType="medicine" defaultShowUnchanged={false} />
        ) : (
          /* Monograph Sections & Embedded Tables */
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                <FileText className="w-4 h-4 text-orange-600" />
                Monograph Sections ({sections.length})
              </h4>
            </div>

            {sections.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-400 italic bg-slate-50 rounded-xl">
                No clinical sections authored for this drug monograph yet.
              </div>
            ) : (
            <div className="space-y-4">
              {sections.map((sec, idx) => {
                const linkedTable =
                  typeof sec.tableId === 'object' && sec.tableId ? sec.tableId : null;
                const customTable =
                  sec.customTable &&
                  Array.isArray(sec.customTable.headers) &&
                  sec.customTable.headers.length > 0
                    ? sec.customTable
                    : null;

                const activeTable = linkedTable || customTable;

                return (
                  <div
                    key={sec._id || idx}
                    className="p-4 bg-white border border-slate-200 rounded-2xl shadow-2xs space-y-3"
                  >
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-2">
                        <h5 className="text-xs font-bold text-amber-950 uppercase tracking-wider border-l-3 border-orange-500 pl-2">
                          {sec.order ? `${sec.order}. ` : ''}{sec.title || sec.label || 'Section'}
                        </h5>
                        {sec.pageNumber && (
                          <Badge variant="outline" className="bg-slate-100 text-slate-600 border-slate-200 text-[10px] font-medium">
                            p. {sec.pageNumber}
                          </Badge>
                        )}
                        {sec.key && (
                          <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200 text-[10px] font-mono">
                            {sec.key}
                          </Badge>
                        )}
                      </div>

                      {activeTable && (
                        <Badge
                          variant="outline"
                          className="bg-amber-50 text-amber-900 border-amber-200 text-[10px] font-semibold gap-1"
                        >
                          <TableIcon className="w-3 h-3" />
                          Contains Table
                        </Badge>
                      )}
                    </div>

                    {(sec.content || sec.text) && (
                      <div className="text-xs text-slate-700 leading-relaxed whitespace-pre-wrap pl-2 font-normal">
                        {sec.content || sec.text}
                      </div>
                    )}

                    {/* Render Embedded or Linked Table */}
                    {activeTable && (
                      <div className="mt-3 pt-3 border-t border-slate-100 space-y-2">
                        {activeTable.caption && (
                          <p className="text-xs font-semibold text-slate-700 italic">
                            {activeTable.caption}
                          </p>
                        )}

                        <div className="overflow-x-auto border border-slate-200 rounded-xl bg-white">
                          <table className="w-full text-xs text-left border-collapse">
                            <thead>
                              <tr className="bg-[#FFF8E7] border-b border-amber-200">
                                <th className="p-2 w-10 text-center font-bold text-amber-900 border-r border-amber-200/60">
                                  #
                                </th>
                                {(activeTable.headers || []).map((h, hIdx) => (
                                  <th
                                    key={hIdx}
                                    className="p-2 font-bold text-amber-950 border-r border-amber-200/60 last:border-r-0"
                                  >
                                    {h}
                                  </th>
                                ))}
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                              {(activeTable.rows || []).map((row, rIdx) => (
                                <tr
                                  key={rIdx}
                                  className={rIdx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}
                                >
                                  <td className="p-2 text-center text-slate-400 font-semibold border-r border-slate-100">
                                    {rIdx + 1}
                                  </td>
                                  {(activeTable.headers || []).map((_, cIdx) => (
                                    <td
                                      key={cIdx}
                                      className="p-2 text-slate-700 font-medium border-r border-slate-100 last:border-r-0"
                                    >
                                      {row[cIdx] || <span className="text-slate-300">-</span>}
                                    </td>
                                  ))}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>

                        {activeTable.footnotes && (
                          <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-[11px] text-slate-600">
                            <span className="font-semibold text-slate-700">Note: </span>
                            {activeTable.footnotes}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
      </div>
    </AdminModal>
  );
};

export default MedicineDetailsModal;
