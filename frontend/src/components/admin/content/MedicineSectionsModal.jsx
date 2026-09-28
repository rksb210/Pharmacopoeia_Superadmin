import React, { useState, useEffect } from 'react';
import AdminModal from '../common/AdminModal';
import {
  Plus,
  Trash2,
  Edit2,
  AlertCircle,
  Table as TableIcon,
  Layers,
  ChevronRight,
  Eye,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';
import { Button } from '../../ui/button';
import { Badge } from '../../ui/badge';
import InputField from '../../common/InputField';
import contentService from '../../../services/content.service';

const STANDARD_HEADINGS = [
  'Indications & Clinical Uses',
  'Dosage & Administration',
  'Contraindications',
  'Adverse Reactions & Side Effects',
  'Precautions & Warnings',
  'Drug Interactions',
  'Renal / Hepatic Dosing Adjustments',
  'Pregnancy & Lactation',
  'Overdosage & Antidotes',
  'Storage & Stability',
  'Patient Counseling Advice',
];

export const MedicineSectionsModal = ({
  isOpen,
  onClose,
  medicine = null,
  onSectionsUpdated,
}) => {
  const [sections, setSections] = useState([]);
  const [activeTables, setActiveTables] = useState([]);
  const [editingSectionId, setEditingSectionId] = useState(null);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Form State for Active/Editing Section
  const [secForm, setSecForm] = useState({
    title: '',
    content: '',
    order: 1,
    includeTable: false,
    tableMode: 'custom', // 'link' or 'custom'
    tableId: '',
    customTable: {
      headers: ['Parameter / Stage', 'Dosage', 'Frequency'],
      rows: [
        ['Normal Renal Function (CrCl > 60)', '500 mg', 'Every 8 hours'],
        ['Mild to Moderate (CrCl 30-60)', '250 mg', 'Every 12 hours'],
      ],
      caption: '',
      footnotes: '',
    },
  });

  // Fetch sections and active tables on open
  useEffect(() => {
    if (!medicine || !isOpen) return;

    setSections(Array.isArray(medicine.sections) ? medicine.sections : []);
    setEditingSectionId(null);
    setIsAddingNew(false);
    setApiError('');
    setSuccessMsg('');

    // Fetch active tables for linking
    contentService
      .getActiveTables()
      .then((res) => {
        if (res?.tables) setActiveTables(res.tables);
      })
      .catch(() => {});
  }, [medicine, isOpen]);

  const showSuccess = (msg) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(''), 3500);
  };

  const handleStartAdd = () => {
    setEditingSectionId(null);
    setIsAddingNew(true);
    setSecForm({
      title: '',
      content: '',
      order: sections.length + 1,
      includeTable: false,
      tableMode: 'custom',
      tableId: '',
      customTable: {
        headers: ['Condition / Group', 'Dosage', 'Duration'],
        rows: [['Standard Adult', '1 tablet', '5-7 days']],
        caption: '',
        footnotes: '',
      },
    });
    setApiError('');
  };

  const handleStartEdit = (sec) => {
    setIsAddingNew(false);
    setEditingSectionId(sec._id);

    const hasLinkedTable = Boolean(sec.tableId);
    const hasCustomTable = Boolean(
      sec.customTable &&
        Array.isArray(sec.customTable.headers) &&
        sec.customTable.headers.length > 0
    );

    setSecForm({
      title: sec.title || '',
      content: sec.content || '',
      order: sec.order ?? sections.length + 1,
      includeTable: hasLinkedTable || hasCustomTable,
      tableMode: hasLinkedTable ? 'link' : 'custom',
      tableId: typeof sec.tableId === 'object' && sec.tableId ? sec.tableId._id : sec.tableId || '',
      customTable: {
        headers: hasCustomTable ? sec.customTable.headers : ['Column 1', 'Column 2'],
        rows: hasCustomTable && sec.customTable.rows?.length > 0 ? sec.customTable.rows : [['', '']],
        caption: sec.customTable?.caption || '',
        footnotes: sec.customTable?.footnotes || '',
      },
    });
    setApiError('');
  };

  const handleCancelForm = () => {
    setEditingSectionId(null);
    setIsAddingNew(false);
    setApiError('');
  };

  // In-section Custom Table Grid Handlers
  const handleAddCustomColumn = () => {
    const newHeader = `Col ${secForm.customTable.headers.length + 1}`;
    setSecForm((prev) => ({
      ...prev,
      customTable: {
        ...prev.customTable,
        headers: [...prev.customTable.headers, newHeader],
        rows: prev.customTable.rows.map((row) => [...row, '']),
      },
    }));
  };

  const handleRemoveCustomColumn = (cIdx) => {
    if (secForm.customTable.headers.length <= 1) return;
    setSecForm((prev) => ({
      ...prev,
      customTable: {
        ...prev.customTable,
        headers: prev.customTable.headers.filter((_, idx) => idx !== cIdx),
        rows: prev.customTable.rows.map((row) => row.filter((_, idx) => idx !== cIdx)),
      },
    }));
  };

  const handleAddCustomRow = () => {
    const emptyRow = new Array(secForm.customTable.headers.length).fill('');
    setSecForm((prev) => ({
      ...prev,
      customTable: {
        ...prev.customTable,
        rows: [...prev.customTable.rows, emptyRow],
      },
    }));
  };

  const handleRemoveCustomRow = (rIdx) => {
    if (secForm.customTable.rows.length <= 1) return;
    setSecForm((prev) => ({
      ...prev,
      customTable: {
        ...prev.customTable,
        rows: prev.customTable.rows.filter((_, idx) => idx !== rIdx),
      },
    }));
  };

  const handleCustomCellChange = (rIdx, cIdx, val) => {
    setSecForm((prev) => {
      const updatedRows = prev.customTable.rows.map((r, rowIndex) => {
        if (rowIndex === rIdx) {
          const newRow = [...r];
          newRow[cIdx] = val;
          return newRow;
        }
        return r;
      });
      return {
        ...prev,
        customTable: {
          ...prev.customTable,
          rows: updatedRows,
        },
      };
    });
  };

  const handleCustomHeaderChange = (cIdx, val) => {
    setSecForm((prev) => {
      const updated = [...prev.customTable.headers];
      updated[cIdx] = val;
      return {
        ...prev,
        customTable: {
          ...prev.customTable,
          headers: updated,
        },
      };
    });
  };

  // Save (Create or Update) Section
  const handleSaveSection = async (e) => {
    e?.preventDefault();
    if (!secForm.title.trim()) {
      setApiError('Section title is required');
      return;
    }

    setLoading(true);
    setApiError('');

    try {
      const payload = {
        title: secForm.title.trim(),
        content: secForm.content,
        order: Number(secForm.order) || 1,
        tableId: secForm.includeTable && secForm.tableMode === 'link' && secForm.tableId ? secForm.tableId : null,
        customTable:
          secForm.includeTable && secForm.tableMode === 'custom'
            ? {
                headers: secForm.customTable.headers.map((h) => h.trim() || 'Column'),
                rows: secForm.customTable.rows,
                caption: secForm.customTable.caption.trim(),
                footnotes: secForm.customTable.footnotes.trim(),
              }
            : { headers: [], rows: [], caption: '', footnotes: '' },
      };

      let updatedSections = [];
      if (isAddingNew) {
        const res = await contentService.addMedicineSection(medicine._id, payload);
        updatedSections = res.sections || [];
        showSuccess(`Section "${payload.title}" added successfully.`);
      } else if (editingSectionId) {
        const res = await contentService.updateMedicineSection(medicine._id, editingSectionId, payload);
        updatedSections = res.sections || [];
        showSuccess(`Section "${payload.title}" updated successfully.`);
      }

      setSections(updatedSections);
      setIsAddingNew(false);
      setEditingSectionId(null);
      if (onSectionsUpdated) onSectionsUpdated(updatedSections);
    } catch (err) {
      setApiError(err.message || 'Failed to save section');
    } finally {
      setLoading(false);
    }
  };

  // Delete Section
  const handleDeleteSection = async (sec) => {
    if (!confirm(`Delete section "${sec.title}" from this monograph?`)) return;
    setLoading(true);
    setApiError('');
    try {
      await contentService.deleteMedicineSection(medicine._id, sec._id);
      const remaining = sections.filter((s) => s._id !== sec._id);
      setSections(remaining);
      showSuccess(`Section "${sec.title}" deleted.`);
      if (editingSectionId === sec._id) {
        setEditingSectionId(null);
      }
      if (onSectionsUpdated) onSectionsUpdated(remaining);
    } catch (err) {
      setApiError(err.message || 'Failed to delete section');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminModal
      isOpen={isOpen}
      onClose={onClose}
      title={`Monograph Sections: ${medicine?.name || ''}`}
      description="Manage the comprehensive scientific sections array and embedded clinical tables for this medicine."
      showConfirm={false}
      cancelLabel="Done & Close"
      size="xl"
    >
      <div className="space-y-4">
        {/* Medicine Meta Sub-Bar */}
        <div className="flex flex-wrap items-center justify-between p-3 bg-amber-50/70 border border-amber-200/80 rounded-2xl gap-2 text-xs">
          <div className="flex items-center gap-2">
            <span className="font-bold text-amber-950 text-sm">{medicine?.name}</span>
            {medicine?.therapeuticClass && (
              <Badge variant="outline" className="bg-white text-slate-700 border-amber-200">
                {medicine.therapeuticClass}
              </Badge>
            )}
            <Badge variant="secondary" className="bg-amber-100 text-amber-900 border-none font-semibold">
              {sections.length} Section{sections.length === 1 ? '' : 's'}
            </Badge>
          </div>

          <Button
            type="button"
            variant="nfiYellow"
            size="sm"
            onClick={handleStartAdd}
            disabled={isAddingNew}
            className="rounded-xl text-xs font-bold"
          >
            <Plus className="w-3.5 h-3.5 mr-1" />
            Add New Section
          </Button>
        </div>

        {apiError && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
            <span>{apiError}</span>
          </div>
        )}

        {successMsg && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Section Form (Add or Edit) */}
        {(isAddingNew || editingSectionId) && (
          <div className="p-4 bg-white border-2 border-orange-300 rounded-2xl shadow-sm space-y-4 animate-in fade-in duration-200">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-orange-600" />
                {isAddingNew ? 'Create New Monograph Section' : 'Edit Monograph Section'}
              </h4>
              <button
                type="button"
                onClick={handleCancelForm}
                className="text-xs text-slate-400 hover:text-slate-600 font-semibold"
              >
                Cancel
              </button>
            </div>

            {/* Quick Suggest Headings */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Quick Heading Template
              </label>
              <div className="flex flex-wrap gap-1.5">
                {STANDARD_HEADINGS.map((heading) => (
                  <button
                    key={heading}
                    type="button"
                    onClick={() => setSecForm((prev) => ({ ...prev, title: heading }))}
                    className={`text-[11px] px-2 py-1 rounded-lg border transition-all ${
                      secForm.title === heading
                        ? 'bg-orange-500 text-white border-orange-600 font-semibold'
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {heading}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <InputField
                  label="Section Title *"
                  value={secForm.title}
                  onChange={(e) => setSecForm((prev) => ({ ...prev, title: e.target.value }))}
                  placeholder="e.g. Dosage & Administration"
                  required
                />
              </div>
              <InputField
                label="Display Order"
                type="number"
                value={secForm.order}
                onChange={(e) => setSecForm((prev) => ({ ...prev, order: e.target.value }))}
                placeholder="1"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">Clinical Narrative / Content</label>
              <textarea
                value={secForm.content}
                onChange={(e) => setSecForm((prev) => ({ ...prev, content: e.target.value }))}
                rows={4}
                placeholder="Enter clinical guidance, contraindications, dosage guidelines..."
                className="w-full text-xs p-3 rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-[#FFD243] bg-white resize-y"
              />
            </div>

            {/* In-Section Table Toggle & Builder */}
            <div className="border border-slate-200 rounded-xl p-3 bg-slate-50/70 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="secIncludeTable"
                    checked={secForm.includeTable}
                    onChange={(e) => setSecForm((prev) => ({ ...prev, includeTable: e.target.checked }))}
                    className="w-4 h-4 rounded text-orange-600 border-slate-300 focus:ring-orange-500"
                  />
                  <label htmlFor="secIncludeTable" className="text-xs font-bold text-slate-800 cursor-pointer flex items-center gap-1.5">
                    <TableIcon className="w-3.5 h-3.5 text-orange-600" />
                    Include Structured Table in this Section
                  </label>
                </div>

                {secForm.includeTable && (
                  <div className="flex items-center gap-1 bg-white p-0.5 rounded-lg border border-slate-200 text-xs">
                    <button
                      type="button"
                      onClick={() => setSecForm((prev) => ({ ...prev, tableMode: 'custom' }))}
                      className={`px-2.5 py-1 rounded-md font-semibold text-[11px] transition-all ${
                        secForm.tableMode === 'custom'
                          ? 'bg-amber-100 text-amber-900 shadow-2xs'
                          : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      Custom Grid
                    </button>
                    <button
                      type="button"
                      onClick={() => setSecForm((prev) => ({ ...prev, tableMode: 'link' }))}
                      className={`px-2.5 py-1 rounded-md font-semibold text-[11px] transition-all ${
                        secForm.tableMode === 'link'
                          ? 'bg-amber-100 text-amber-900 shadow-2xs'
                          : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      Link Existing Table
                    </button>
                  </div>
                )}
              </div>

              {secForm.includeTable && secForm.tableMode === 'link' && (
                <div className="space-y-2 pt-2">
                  <label className="text-xs font-semibold text-slate-700">Select Existing Table from Master</label>
                  <select
                    value={secForm.tableId}
                    onChange={(e) => setSecForm((prev) => ({ ...prev, tableId: e.target.value }))}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-[#FFD243] bg-white font-medium text-slate-800"
                  >
                    <option value="">-- Choose from Table Collection --</option>
                    {activeTables.map((tbl) => (
                      <option key={tbl._id} value={tbl._id}>
                        {tbl.title} ({tbl.tableCode})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {secForm.includeTable && secForm.tableMode === 'custom' && (
                <div className="space-y-3 pt-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-600 uppercase">
                      Inline Table Grid ({secForm.customTable.headers.length} Cols × {secForm.customTable.rows.length} Rows)
                    </span>
                    <div className="flex items-center gap-1.5">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleAddCustomColumn}
                        className="rounded-lg text-[11px] h-7 px-2 border-slate-200"
                      >
                        <Plus className="w-3 h-3 mr-1" />
                        Col
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleAddCustomRow}
                        className="rounded-lg text-[11px] h-7 px-2 border-slate-200"
                      >
                        <Plus className="w-3 h-3 mr-1" />
                        Row
                      </Button>
                    </div>
                  </div>

                  <div className="overflow-x-auto border border-slate-200 rounded-xl bg-white max-h-56">
                    <table className="w-full text-xs text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-100 border-b border-slate-200">
                          {secForm.customTable.headers.map((hdr, cIdx) => (
                            <th key={cIdx} className="p-1.5 min-w-[130px]">
                              <div className="flex items-center gap-1">
                                <input
                                  type="text"
                                  value={hdr}
                                  onChange={(e) => handleCustomHeaderChange(cIdx, e.target.value)}
                                  placeholder={`Header ${cIdx + 1}`}
                                  className="w-full text-[11px] font-bold text-slate-800 bg-white border border-slate-300 rounded px-1.5 py-0.5 focus:outline-hidden"
                                />
                                {secForm.customTable.headers.length > 1 && (
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveCustomColumn(cIdx)}
                                    className="text-slate-400 hover:text-red-500 p-0.5"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </button>
                                )}
                              </div>
                            </th>
                          ))}
                          <th className="p-1.5 w-8 text-center text-slate-400"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {secForm.customTable.rows.map((row, rIdx) => (
                          <tr key={rIdx}>
                            {secForm.customTable.headers.map((_, cIdx) => (
                              <td key={cIdx} className="p-1">
                                <input
                                  type="text"
                                  value={row[cIdx] ?? ''}
                                  onChange={(e) => handleCustomCellChange(rIdx, cIdx, e.target.value)}
                                  placeholder="Value..."
                                  className="w-full text-xs text-slate-700 bg-white border border-slate-200 rounded px-2 py-1 focus:outline-hidden"
                                />
                              </td>
                            ))}
                            <td className="p-1 text-center">
                              {secForm.customTable.rows.length > 1 && (
                                <button
                                  type="button"
                                  onClick={() => handleRemoveCustomRow(rIdx)}
                                  className="text-slate-400 hover:text-red-500"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <input
                      type="text"
                      placeholder="Table Caption (Optional)"
                      value={secForm.customTable.caption}
                      onChange={(e) =>
                        setSecForm((prev) => ({
                          ...prev,
                          customTable: { ...prev.customTable, caption: e.target.value },
                        }))
                      }
                      className="w-full text-xs p-2 rounded-lg border border-slate-200 bg-white"
                    />
                    <input
                      type="text"
                      placeholder="Table Footnotes (Optional)"
                      value={secForm.customTable.footnotes}
                      onChange={(e) =>
                        setSecForm((prev) => ({
                          ...prev,
                          customTable: { ...prev.customTable, footnotes: e.target.value },
                        }))
                      }
                      className="w-full text-xs p-2 rounded-lg border border-slate-200 bg-white"
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleCancelForm}
                className="rounded-xl text-xs"
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="nfiYellow"
                size="sm"
                onClick={handleSaveSection}
                disabled={loading}
                className="rounded-xl text-xs font-bold shadow-2xs"
              >
                {loading ? 'Saving...' : isAddingNew ? 'Add Section' : 'Save Changes'}
              </Button>
            </div>
          </div>
        )}

        {/* Existing Sections List */}
        <div className="space-y-3">
          <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
            Configured Monograph Sections ({sections.length})
          </h4>

          {sections.length === 0 ? (
            <div className="p-8 text-center bg-slate-50 border border-dashed border-slate-200 rounded-2xl text-slate-500 text-xs">
              <Layers className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="font-semibold">No sections configured yet.</p>
              <p className="text-[11px] text-slate-400 mt-1">
                Click &quot;Add New Section&quot; above to begin authoring this monograph.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100 border border-slate-200 rounded-2xl bg-white overflow-hidden shadow-2xs">
              {sections.map((sec, idx) => {
                const hasLinkedTable = Boolean(sec.tableId);
                const hasCustomTable = Boolean(
                  sec.customTable &&
                    Array.isArray(sec.customTable.headers) &&
                    sec.customTable.headers.length > 0
                );
                const isSelected = editingSectionId === sec._id;

                return (
                  <div
                    key={sec._id || idx}
                    className={`p-3.5 transition-colors ${
                      isSelected ? 'bg-amber-50/60' : 'hover:bg-slate-50/70'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1.5 flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-xs font-bold text-slate-800">
                            {sec.order ?? idx + 1}. {sec.title}
                          </span>

                          {hasLinkedTable && (
                            <Badge variant="outline" className="bg-amber-50 text-amber-800 border-amber-200 text-[10px] font-semibold gap-1">
                              <TableIcon className="w-3 h-3" />
                              Linked Table: {typeof sec.tableId === 'object' && sec.tableId ? sec.tableId.title : 'Attached'}
                            </Badge>
                          )}

                          {hasCustomTable && (
                            <Badge variant="outline" className="bg-blue-50 text-blue-800 border-blue-200 text-[10px] font-semibold gap-1">
                              <TableIcon className="w-3 h-3" />
                              Custom Table ({sec.customTable.headers.length} cols × {sec.customTable.rows?.length || 0} rows)
                            </Badge>
                          )}
                        </div>

                        {sec.content ? (
                          <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                            {sec.content}
                          </p>
                        ) : (
                          <p className="text-xs text-slate-400 italic">No text content entered.</p>
                        )}
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleStartEdit(sec)}
                          className="h-8 w-8 p-0 text-slate-500 hover:text-orange-600 rounded-lg"
                          title="Edit Section"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteSection(sec)}
                          className="h-8 w-8 p-0 text-slate-500 hover:text-red-600 rounded-lg"
                          title="Delete Section"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </AdminModal>
  );
};

export default MedicineSectionsModal;
