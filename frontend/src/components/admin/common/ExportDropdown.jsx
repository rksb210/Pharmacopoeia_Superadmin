import React, { useState, useRef, useEffect } from 'react';
import { Download, ChevronDown, FileSpreadsheet, FileText } from 'lucide-react';
import { Button } from '../../ui/button';
import { exportToExcel, exportToPDF } from '../../../utils/exportUtils';
import PermissionGuard from './PermissionGuard';

/**
 * Reusable ExportDropdown Component
 * Provides instant Excel (.xlsx) and PDF (.pdf) exports across all modules.
 *
 * @param {Object} props
 * @param {string} props.filename - Base filename prefix e.g. "NFI_Users_Directory"
 * @param {string} props.title - Document title printed on top of export
 * @param {string} [props.subtitle] - Document subtitle or active filter description
 * @param {Array<string>} [props.metadata] - Array of summary KPI strings e.g. ["Total: 50", "Active: 45"]
 * @param {Array<{ header: string, key: string, format?: Function }>} props.columns - Column specifications
 * @param {Function} [props.onFetchData] - Async function returning Array<Object> of filtered data
 * @param {Array<Object>} [props.data] - Direct array of data if static / already loaded
 * @param {'landscape'|'portrait'} [props.orientation='landscape'] - PDF layout orientation
 * @param {Function} [props.onFeedback] - Callback for notifications: onFeedback(message, type)
 * @param {boolean} [props.disabled=false] - Disable button
 * @param {Object} [props.permission] - Optional permission check { module, section, action: 'EXPORT' }
 * @param {string} [props.size='sm'] - Button size
 * @param {string} [props.className] - Additional CSS classes
 */
export const ExportDropdown = ({
  filename = 'Export',
  title = 'Indian Pharmacopoeia Commission - Official Export Ledger',
  subtitle = '',
  metadata = [],
  columns = [],
  onFetchData,
  data = null,
  orientation = 'landscape',
  onFeedback,
  disabled = false,
  permission = null,
  size = 'sm',
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportType, setExportType] = useState(''); // 'excel' | 'pdf'
  const menuRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [isOpen]);

  const notify = (msg, type = 'success') => {
    if (onFeedback && typeof onFeedback === 'function') {
      onFeedback(msg, type);
    }
  };

  const getExportData = async () => {
    if (onFetchData && typeof onFetchData === 'function') {
      const result = await onFetchData();
      return Array.isArray(result) ? result : [];
    }
    if (Array.isArray(data)) {
      return data;
    }
    return [];
  };

  const handleExportExcel = async () => {
    setIsExporting(true);
    setExportType('excel');
    setIsOpen(false);

    try {
      const records = await getExportData();
      if (!records || records.length === 0) {
        notify('No records available to export.', 'error');
        return;
      }

      exportToExcel({
        filename,
        title,
        subtitle,
        metadata,
        columns,
        data: records,
        sheetName: filename.slice(0, 30),
      });

      notify(`Exported ${records.length} records to Excel (.xlsx) successfully.`);
    } catch (err) {
      console.error('[Export to Excel Error]:', err);
      notify(err.message || 'Excel export failed. Please try again.', 'error');
    } finally {
      setIsExporting(false);
      setExportType('');
    }
  };

  const handleExportPDF = async () => {
    setIsExporting(true);
    setExportType('pdf');
    setIsOpen(false);

    try {
      const records = await getExportData();
      if (!records || records.length === 0) {
        notify('No records available to export.', 'error');
        return;
      }

      exportToPDF({
        filename,
        title,
        subtitle,
        metadata,
        columns,
        data: records,
        orientation,
      });

      notify(`Exported ${records.length} records to PDF document successfully.`);
    } catch (err) {
      console.error('[Export to PDF Error]:', err);
      notify(err.message || 'PDF export failed. Please try again.', 'error');
    } finally {
      setIsExporting(false);
      setExportType('');
    }
  };

  const content = (
    <div className="relative inline-block text-left" ref={menuRef}>
      <Button
        type="button"
        variant="outline"
        size={size}
        onClick={() => setIsOpen(!isOpen)}
        disabled={disabled || isExporting}
        className={`rounded-xl text-xs font-semibold border-slate-200 hover:border-slate-300 text-slate-700 cursor-pointer shadow-2xs transition-all ${className}`}
        title="Export records to Excel or PDF"
      >
        <Download
          className={`w-3.5 h-3.5 mr-1.5 text-[#E76120] ${
            isExporting ? 'animate-bounce' : ''
          }`}
        />
        <span>
          {isExporting
            ? exportType === 'excel'
              ? 'Exporting Excel...'
              : 'Generating PDF...'
            : 'Export'}
        </span>
        <ChevronDown
          className={`w-3.5 h-3.5 ml-1 text-slate-400 transition-transform ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </Button>

      {isOpen && (
        <div className="absolute right-0 mt-1.5 w-52 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 py-1.5 animate-in fade-in-0 zoom-in-95 duration-100 font-sans select-none">
          <div className="px-3 py-1.5 border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            Export Format
          </div>

          <button
            type="button"
            onClick={handleExportExcel}
            className="w-full px-3.5 py-2.5 text-left text-xs font-semibold text-slate-700 hover:bg-emerald-50 hover:text-emerald-800 flex items-center gap-2.5 transition-colors cursor-pointer group"
          >
            <div className="w-6 h-6 rounded-lg bg-emerald-100/70 text-emerald-700 flex items-center justify-center shrink-0 group-hover:bg-emerald-200">
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
            </div>
            <div>
              <span className="block font-bold text-slate-800 group-hover:text-emerald-900">
                Excel Spreadsheet
              </span>
              <span className="text-[10px] text-slate-400 font-mono">.xlsx workbook</span>
            </div>
          </button>

          <button
            type="button"
            onClick={handleExportPDF}
            className="w-full px-3.5 py-2.5 text-left text-xs font-semibold text-slate-700 hover:bg-red-50 hover:text-red-800 flex items-center gap-2.5 transition-colors cursor-pointer group"
          >
            <div className="w-6 h-6 rounded-lg bg-red-100/70 text-red-700 flex items-center justify-center shrink-0 group-hover:bg-red-200">
              <FileText className="w-3.5 h-3.5 text-red-600" />
            </div>
            <div>
              <span className="block font-bold text-slate-800 group-hover:text-red-900">
                PDF Document
              </span>
              <span className="text-[10px] text-slate-400 font-mono">.pdf printable report</span>
            </div>
          </button>
        </div>
      )}
    </div>
  );

  if (permission && permission.module && permission.section) {
    return (
      <PermissionGuard
        module={permission.module}
        section={permission.section}
        action={permission.action || 'EXPORT'}
      >
        {content}
      </PermissionGuard>
    );
  }

  return content;
};

export default ExportDropdown;
