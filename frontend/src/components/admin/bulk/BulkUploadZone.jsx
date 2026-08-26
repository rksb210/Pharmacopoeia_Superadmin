import React, { useState, useRef } from 'react';
import { Button } from '../../ui/button';
import { Badge } from '../../ui/badge';
import InputField from '../../common/InputField';
import {
  UploadCloud,
  FileSpreadsheet,
  Download,
  AlertCircle,
  CheckCircle2,
  Building2,
  CreditCard,
} from 'lucide-react';
import bulkImportService from '../../../services/bulkImport.service';

const DEFAULT_PLANS = [
  { code: 'NFI-INDIVIDUAL', name: 'Individual Practitioner Pass (₹3,500)' },
  { code: 'NFI-INSTITUTIONAL', name: 'Institutional Campus License (₹45,000)' },
  { code: 'NFI-STUDENT-SPECIAL', name: 'Academic Scholar Pass (₹1,200)' },
  { code: 'NFI-DOCTOR-PRO', name: 'Clinical Specialist Edition (₹6,000)' },
  { code: 'NFI-CORPORATE', name: 'Corporate Enterprise License (₹85,000)' },
];

export const BulkUploadZone = ({
  onUploadSuccess,
  isProcessing,
}) => {
  const [file, setFile] = useState(null);
  const [institutionName, setInstitutionName] = useState('');
  const [billingContact, setBillingContact] = useState('');
  const [defaultPlanCode, setDefaultPlanCode] = useState('NFI-INSTITUTIONAL');
  const [error, setError] = useState('');
  const [isDownloadingTemplate, setIsDownloadingTemplate] = useState(false);
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    const selected = e.target.files?.[0];
    if (!selected) return;

    const validExtensions = ['.xlsx', '.xls', '.csv'];
    const hasValidExt = validExtensions.some((ext) => selected.name.toLowerCase().endsWith(ext));

    if (!hasValidExt) {
      setError('Please select a valid Excel file (.xlsx, .xls) or .csv');
      setFile(null);
      return;
    }

    setFile(selected);
    setError('');
  };

  const handleDownloadTemplate = async () => {
    setIsDownloadingTemplate(true);
    try {
      const blob = await bulkImportService.downloadTemplate();
      const url = window.URL.createObjectURL(new Blob([blob]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'NFI_Bulk_Subscribers_Import_Template.xlsx');
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
    } catch (err) {
      setError('Failed to download template. Please try again.');
    } finally {
      setIsDownloadingTemplate(false);
    }
  };

  const handleParseAndValidate = async () => {
    if (!file) {
      setError('Please upload an Excel or CSV subscriber file.');
      return;
    }
    if (!institutionName.trim()) {
      setError('Please enter the Institution or Corporate Name.');
      return;
    }

    setError('');
    const formData = new FormData();
    formData.append('file', file);
    formData.append('institutionName', institutionName.trim());
    formData.append('billingContact', billingContact.trim());
    formData.append('defaultPlanCode', defaultPlanCode);

    try {
      await onUploadSuccess(formData);
    } catch (err) {
      setError(err.message || 'File validation failed.');
    }
  };

  return (
    <div className="space-y-4 font-sans select-none text-xs">
      {/* Top Banner with Download Template Action */}
      <div className="p-4 bg-blue-50/70 border border-blue-100 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
        <div>
          <h4 className="font-bold text-[#284661] text-sm">Official Batch Import Template</h4>
          <p className="text-slate-500 text-xs mt-0.5">
            Use the official IPC spreadsheet layout with verified headers for Student, Doctor,
            Pharmacist, Nurse, and Industry subscriber categories.
          </p>
        </div>

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleDownloadTemplate}
          disabled={isDownloadingTemplate}
          className="rounded-xl text-xs font-bold shrink-0 bg-white border-blue-200 text-[#284661] hover:bg-blue-100/50 cursor-pointer"
        >
          <Download className="w-3.5 h-3.5 mr-1.5" />
          <span>{isDownloadingTemplate ? 'Generating...' : 'Download Sample Excel (.xlsx)'}</span>
        </Button>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
          <span>{error}</span>
        </div>
      )}

      {/* Inputs Form: Institution & Plan Selection */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 p-4 bg-white border border-slate-200/80 rounded-2xl shadow-2xs">
        <InputField
          id="institutionName"
          label="Institution / Organization Name"
          placeholder="e.g. AIIMS New Delhi / Medanta Health..."
          value={institutionName}
          onChange={(e) => setInstitutionName(e.target.value)}
          required
        />

        <InputField
          id="billingContact"
          label="Billing Coordinator Email / Phone"
          placeholder="e.g. dean.academics@aiims.edu"
          value={billingContact}
          onChange={(e) => setBillingContact(e.target.value)}
        />

        <div className="flex flex-col gap-1.5">
          <label className="font-semibold text-slate-700">Default Target Plan</label>
          <select
            value={defaultPlanCode}
            onChange={(e) => setDefaultPlanCode(e.target.value)}
            className="h-10 px-3 bg-white border border-slate-200 rounded-xl font-bold text-xs outline-none focus:border-[#E76120]"
          >
            {DEFAULT_PLANS.map((p) => (
              <option key={p.code} value={p.code}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Drag & Drop Upload Zone */}
      <div
        onClick={() => fileInputRef.current?.click()}
        className={`
          p-8 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center text-center cursor-pointer transition-all bg-slate-50/50 hover:bg-slate-50
          ${file ? 'border-emerald-500 bg-emerald-50/20' : 'border-slate-300 hover:border-[#284661]'}
        `}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".xlsx,.xls,.csv"
          onChange={handleFileChange}
          className="hidden"
        />

        <div className="w-12 h-12 rounded-2xl bg-white shadow-xs border border-slate-200 flex items-center justify-center mb-3">
          {file ? (
            <FileSpreadsheet className="w-6 h-6 text-emerald-600" />
          ) : (
            <UploadCloud className="w-6 h-6 text-[#284661]" />
          )}
        </div>

        {file ? (
          <div>
            <span className="font-bold text-slate-900 text-sm block">{file.name}</span>
            <span className="text-[11px] text-slate-500">
              {(file.size / 1024).toFixed(1)} KB · Click to change file
            </span>
          </div>
        ) : (
          <div>
            <span className="font-bold text-slate-800 text-sm block">
              Click to select or drag and drop subscriber spreadsheet
            </span>
            <span className="text-[11px] text-slate-400">
              Supports Microsoft Excel (.xlsx, .xls) and Comma-Separated Values (.csv) up to 15MB
            </span>
          </div>
        )}
      </div>

      {/* Validate & Preview Action Button */}
      <div className="flex justify-end pt-2">
        <Button
          type="button"
          variant="nfiYellow"
          size="lg"
          onClick={handleParseAndValidate}
          disabled={!file || isProcessing}
          className="rounded-xl font-bold px-6 shadow-2xs cursor-pointer text-xs"
        >
          <span>{isProcessing ? 'Validating Batch...' : 'Validate & Preview Subscriber Roster'}</span>
        </Button>
      </div>
    </div>
  );
};

export default BulkUploadZone;
