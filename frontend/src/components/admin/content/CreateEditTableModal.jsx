import React, { useState, useEffect } from 'react';
import AdminModal from '../common/AdminModal';
import InputField from '../../common/InputField';
import { Plus, Trash2, AlertCircle, Eye, Table as TableIcon } from 'lucide-react';
import { Button } from '../../ui/button';

export const CreateEditTableModal = ({ isOpen, onClose, table = null, onSuccess }) => {
  const [formData, setFormData] = useState({
    title: '',
    tableCode: '',
    caption: '',
    footnotes: '',
    isActive: true,
  });

  const [headers, setHeaders] = useState(['Column 1', 'Column 2']);
  const [rows, setRows] = useState([['', '']]);
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  const isEditMode = !!table;

  useEffect(() => {
    if (table) {
      setFormData({
        title: table.title || '',
        tableCode: table.tableCode || '',
        caption: table.caption || '',
        footnotes: table.footnotes || '',
        isActive: table.isActive ?? true,
      });
      setHeaders(Array.isArray(table.headers) && table.headers.length > 0 ? table.headers : ['Column 1', 'Column 2']);
      setRows(
        Array.isArray(table.rows) && table.rows.length > 0
          ? table.rows
          : [['', '']]
      );
    } else {
      setFormData({
        title: '',
        tableCode: '',
        caption: '',
        footnotes: '',
        isActive: true,
      });
      setHeaders(['Parameter / Group', 'Standard Dosage', 'Remarks']);
      setRows([
        ['Adults (> 50 kg)', '500 mg every 6 hrs', 'Maximum 4 g/day'],
        ['Pediatric (10-15 mg/kg)', '150 mg every 6 hrs', 'Do not exceed 4 doses/24h'],
      ]);
    }
    setErrors({});
    setApiError('');
    setShowPreview(false);
  }, [table, isOpen]);

  // Handle header change
  const handleHeaderChange = (index, value) => {
    const updated = [...headers];
    updated[index] = value;
    setHeaders(updated);
  };

  // Add Column
  const handleAddColumn = () => {
    const newHeaderName = `Column ${headers.length + 1}`;
    setHeaders([...headers, newHeaderName]);
    setRows(rows.map((row) => [...row, '']));
  };

  // Remove Column
  const handleRemoveColumn = (colIndex) => {
    if (headers.length <= 1) return;
    setHeaders(headers.filter((_, idx) => idx !== colIndex));
    setRows(rows.map((row) => row.filter((_, idx) => idx !== colIndex)));
  };

  // Handle cell change
  const handleCellChange = (rowIndex, colIndex, value) => {
    const updated = rows.map((r, rIdx) => {
      if (rIdx === rowIndex) {
        const newRow = [...r];
        newRow[colIndex] = value;
        return newRow;
      }
      return r;
    });
    setRows(updated);
  };

  // Add Row
  const handleAddRow = () => {
    const emptyRow = new Array(headers.length).fill('');
    setRows([...rows, emptyRow]);
  };

  // Remove Row
  const handleRemoveRow = (rowIndex) => {
    if (rows.length <= 1) return;
    setRows(rows.filter((_, idx) => idx !== rowIndex));
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
    if (apiError) setApiError('');
  };

  const validate = () => {
    const ne = {};
    if (!formData.title.trim()) ne.title = 'Table title is required';
    if (!formData.tableCode.trim()) ne.tableCode = 'Table code is required';
    if (headers.length === 0) ne.headers = 'At least 1 column is required';
    setErrors(ne);
    return Object.keys(ne).length === 0;
  };

  const handleSubmit = async (e) => {
    e?.preventDefault();
    if (!validate()) return;
    setIsSubmitting(true);
    setApiError('');
    try {
      const payload = {
        title: formData.title.trim(),
        tableCode: formData.tableCode.trim().toUpperCase(),
        caption: formData.caption.trim(),
        footnotes: formData.footnotes.trim(),
        headers: headers.map((h) => h.trim() || 'Column'),
        rows,
        isActive: formData.isActive,
      };
      if (onSuccess) await onSuccess(payload, isEditMode ? table._id : null);
      onClose();
    } catch (err) {
      setApiError(err.message || 'Operation failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AdminModal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditMode ? `Edit Table: ${table?.title}` : 'Create Clinical Table'}
      description={isEditMode ? 'Modify tabular columns, rows, or metadata.' : 'Build a reusable structured clinical data table for monographs.'}
      confirmLabel={isEditMode ? 'Save Table' : 'Create Table'}
      isConfirming={isSubmitting}
      onConfirm={handleSubmit}
      size="xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {apiError && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
            <span>{apiError}</span>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <InputField
            label="Table Title"
            name="title"
            value={formData.title}
            onChange={handleChange}
            error={errors.title}
            placeholder="e.g. Dosage Adjustment in Renal Impairment"
            required
          />

          <InputField
            label="Table Code (Unique)"
            name="tableCode"
            value={formData.tableCode}
            onChange={handleChange}
            error={errors.tableCode}
            placeholder="e.g. TBL-RENAL-01"
            required
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <InputField
            label="Caption / Subtitle"
            name="caption"
            value={formData.caption}
            onChange={handleChange}
            placeholder="e.g. Table 1.1: Recommended dosing based on creatinine clearance"
          />

          <div className="flex items-center gap-2 pt-5">
            <input
              type="checkbox"
              id="tableIsActive"
              name="isActive"
              checked={formData.isActive}
              onChange={handleChange}
              className="w-4 h-4 rounded text-orange-600 border-slate-300 focus:ring-orange-500"
            />
            <label htmlFor="tableIsActive" className="text-xs font-semibold text-slate-700 cursor-pointer">
              Active Table
            </label>
          </div>
        </div>

        {/* Dynamic Table Grid Builder */}
        <div className="border border-slate-200 rounded-2xl p-4 bg-slate-50/50 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TableIcon className="w-4 h-4 text-orange-600" />
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Table Grid Editor ({headers.length} Cols × {rows.length} Rows)
              </h4>
            </div>

            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowPreview(!showPreview)}
                className="rounded-xl text-xs h-8 border-slate-200"
              >
                <Eye className="w-3.5 h-3.5 mr-1" />
                {showPreview ? 'Hide Preview' : 'Show Preview'}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddColumn}
                className="rounded-xl text-xs h-8 text-orange-700 border-orange-200 hover:bg-orange-50"
              >
                <Plus className="w-3.5 h-3.5 mr-1" />
                Add Column
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddRow}
                className="rounded-xl text-xs h-8 text-orange-700 border-orange-200 hover:bg-orange-50"
              >
                <Plus className="w-3.5 h-3.5 mr-1" />
                Add Row
              </Button>
            </div>
          </div>

          {/* Grid Inputs Table */}
          <div className="overflow-x-auto border border-slate-200 rounded-xl bg-white shadow-2xs max-h-72">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="bg-slate-100/90 border-b border-slate-200">
                  <th className="p-2 w-10 text-center font-bold text-slate-500">#</th>
                  {headers.map((header, colIdx) => (
                    <th key={colIdx} className="p-2 min-w-[150px]">
                      <div className="flex items-center gap-1">
                        <input
                          type="text"
                          value={header}
                          onChange={(e) => handleHeaderChange(colIdx, e.target.value)}
                          placeholder={`Column ${colIdx + 1}`}
                          className="w-full text-xs font-bold text-slate-800 bg-white border border-slate-300 rounded-lg px-2 py-1 focus:outline-hidden focus:ring-1 focus:ring-orange-500"
                        />
                        {headers.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveColumn(colIdx)}
                            title="Delete Column"
                            className="p-1 text-slate-400 hover:text-red-500 rounded transition-colors"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </th>
                  ))}
                  <th className="p-2 w-12 text-center text-slate-400">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rows.map((row, rowIdx) => (
                  <tr key={rowIdx} className="hover:bg-slate-50/70 transition-colors">
                    <td className="p-2 text-center text-slate-400 font-semibold">{rowIdx + 1}</td>
                    {headers.map((_, colIdx) => (
                      <td key={colIdx} className="p-1.5">
                        <input
                          type="text"
                          value={row[colIdx] ?? ''}
                          onChange={(e) => handleCellChange(rowIdx, colIdx, e.target.value)}
                          placeholder="Cell value..."
                          className="w-full text-xs text-slate-700 bg-white border border-slate-200 rounded-lg px-2 py-1.5 focus:outline-hidden focus:ring-1 focus:ring-orange-500"
                        />
                      </td>
                    ))}
                    <td className="p-2 text-center">
                      {rows.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveRow(rowIdx)}
                          title="Delete Row"
                          className="p-1 text-slate-400 hover:text-red-500 rounded transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Live Preview If Toggled */}
          {showPreview && (
            <div className="p-3 bg-white border border-slate-200 rounded-xl space-y-2">
              <h5 className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Rendered Preview
              </h5>
              <div className="overflow-x-auto">
                <table className="w-full text-xs border border-slate-200 rounded-lg overflow-hidden">
                  <thead className="bg-[#FFF8E7] text-slate-800">
                    <tr>
                      {headers.map((h, i) => (
                        <th key={i} className="p-2 text-left font-semibold border-b border-slate-200">
                          {h || `Column ${i + 1}`}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {rows.map((r, rIdx) => (
                      <tr key={rIdx} className={rIdx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}>
                        {headers.map((_, cIdx) => (
                          <td key={cIdx} className="p-2 text-slate-700">
                            {r[cIdx] || '-'}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        <div className="space-y-1">
          <label className="text-xs font-semibold text-slate-700">Footnotes / Reference Notes</label>
          <textarea
            name="footnotes"
            value={formData.footnotes}
            onChange={handleChange}
            rows={2}
            placeholder="e.g. * eGFR calculated using CKD-EPI formula. Dose adjustment applies to moderate to severe impairment."
            className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-[#FFD243] bg-white resize-y"
          />
        </div>
      </form>
    </AdminModal>
  );
};

export default CreateEditTableModal;
