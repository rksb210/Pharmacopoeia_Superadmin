import React, { useState } from 'react';
import { Badge } from '../../ui/badge';
import { Button } from '../../ui/button';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '../../ui/table';
import {
  CheckCircle2,
  XCircle,
  Download,
  AlertTriangle,
  ArrowRight,
  RotateCcw,
} from 'lucide-react';
import bulkImportService from '../../../services/bulkImport.service';

export const BulkPreviewTable = ({
  previewData,
  onConfirmImport,
  onReset,
  isImporting,
}) => {
  const [activeFilter, setActiveFilter] = useState('all'); // 'all' | 'valid' | 'invalid'
  const [isDownloadingError, setIsDownloadingError] = useState(false);

  if (!previewData) return null;

  const { records = [], validCount = 0, invalidCount = 0, totalRows = 0, jobId } = previewData;

  const filteredRecords = records.filter((r) => {
    if (activeFilter === 'valid') return r.status === 'valid';
    if (activeFilter === 'invalid') return r.status === 'invalid';
    return true;
  });

  const handleDownloadErrors = async () => {
    setIsDownloadingError(true);
    try {
      const blob = await bulkImportService.downloadErrorReport(jobId || previewData._id);
      const url = window.URL.createObjectURL(new Blob([blob]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Error_Report_${jobId || 'Batch'}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
    } catch (err) {
      alert(err.message || 'Failed to generate error report.');
    } finally {
      setIsDownloadingError(false);
    }
  };

  return (
    <div className="space-y-4 font-sans select-none text-xs">
      {/* Metric Strip & Action Bar */}
      <div className="p-4 bg-white border border-slate-200/80 rounded-2xl shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Filter Tabs */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveFilter('all')}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeFilter === 'all'
                ? 'bg-[#284661] text-white shadow-2xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <span>All Rows</span>
            <span className="bg-white/20 text-white text-[10px] px-1.5 py-0.2 rounded-full">
              {totalRows}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveFilter('valid')}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeFilter === 'valid'
                ? 'bg-emerald-700 text-white shadow-2xs'
                : 'text-emerald-700 hover:bg-emerald-50'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Valid ({validCount})</span>
          </button>

          {invalidCount > 0 && (
            <button
              type="button"
              onClick={() => setActiveFilter('invalid')}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeFilter === 'invalid'
                  ? 'bg-red-700 text-white shadow-2xs'
                  : 'text-red-700 hover:bg-red-50'
              }`}
            >
              <XCircle className="w-3.5 h-3.5" />
              <span>Errors ({invalidCount})</span>
            </button>
          )}
        </div>

        {/* Download Errors & Reset */}
        <div className="flex items-center gap-2 self-end sm:self-auto">
          {invalidCount > 0 && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleDownloadErrors}
              disabled={isDownloadingError}
              className="rounded-xl text-xs font-bold text-red-700 border-red-200 hover:bg-red-50 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 mr-1" />
              <span>{isDownloadingError ? 'Downloading...' : 'Download Error Excel (.xlsx)'}</span>
            </Button>
          )}

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onReset}
            className="rounded-xl text-xs font-bold cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5 mr-1" />
            <span>Re-upload</span>
          </Button>
        </div>
      </div>

      {/* Preview Table */}
      <div className="bg-white border border-slate-200/80 rounded-2xl shadow-2xs overflow-hidden max-h-[55vh] overflow-y-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">#</TableHead>
              <TableHead>Subscriber Name</TableHead>
              <TableHead>Email Address</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Dynamic Credentials</TableHead>
              <TableHead>Status &amp; Verification</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredRecords.map((rec) => {
              const isValid = rec.status === 'valid' || rec.status === 'imported';

              return (
                <TableRow
                  key={rec.rowNumber}
                  className={isValid ? 'hover:bg-slate-50/70' : 'bg-red-50/40 hover:bg-red-50/70'}
                >
                  {/* Row Number */}
                  <TableCell className="font-mono text-slate-400 text-xs">
                    {rec.rowNumber}
                  </TableCell>

                  {/* Name */}
                  <TableCell>
                    <span className="font-bold text-slate-900 text-xs block">{rec.name || '—'}</span>
                    <span className="text-[10px] text-slate-400 font-mono">{rec.phoneNumber || ''}</span>
                  </TableCell>

                  {/* Email */}
                  <TableCell>
                    <span className="font-mono text-slate-700 text-xs">{rec.email || '—'}</span>
                  </TableCell>

                  {/* User Type */}
                  <TableCell>
                    <Badge variant="outline" className="text-[9px] uppercase font-bold">
                      {rec.userType}
                    </Badge>
                  </TableCell>

                  {/* Dynamic Fields */}
                  <TableCell>
                    <div className="text-[11px] text-slate-600">
                      {rec.userType === 'STUDENT' && (
                        <span>APAAR: {rec.dynamicFields?.apaarId || 'None'}</span>
                      )}
                      {['DOCTOR', 'PHARMACIST', 'NURSE'].includes(rec.userType) && (
                        <span>
                          {rec.dynamicFields?.registrationNo} ({rec.dynamicFields?.registrationState})
                        </span>
                      )}
                      {rec.userType === 'INDUSTRY' && (
                        <span>
                          GST: {rec.dynamicFields?.gstin || '—'} | PAN: {rec.dynamicFields?.pan || '—'}
                        </span>
                      )}
                      {rec.userType === 'OTHERS' && (
                        <span>{rec.dynamicFields?.designation || 'Professional'}</span>
                      )}
                    </div>
                  </TableCell>

                  {/* Status & Error Reason */}
                  <TableCell>
                    {isValid ? (
                      <Badge variant="nfiNavy" className="text-[9px] font-bold">
                        <CheckCircle2 className="w-2.5 h-2.5 mr-1" />
                        <span>Ready to Import</span>
                      </Badge>
                    ) : (
                      <div className="space-y-0.5">
                        <Badge
                          variant="destructive"
                          className="text-[9px] font-bold bg-red-100 text-red-700 border-red-200"
                        >
                          <XCircle className="w-2.5 h-2.5 mr-1" />
                          <span>Validation Failed</span>
                        </Badge>
                        <p className="text-[10px] text-red-600 font-medium">
                          {rec.errors?.join('; ')}
                        </p>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* Confirmation Bottom Bar */}
      <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
        <div>
          <span className="font-bold text-slate-900 text-sm block">
            Ready to Enroll {validCount} Verified Subscribers
          </span>
          <p className="text-slate-500 text-xs">
            Subscribers will be provisioned with valid formulary licenses through 31 Dec 2031 and a
            consolidated invoice will be generated.
          </p>
        </div>

        <Button
          type="button"
          variant="nfiYellow"
          size="lg"
          onClick={onConfirmImport}
          disabled={validCount === 0 || isImporting}
          className="rounded-xl font-bold px-8 shadow-2xs cursor-pointer text-xs shrink-0"
        >
          <span>{isImporting ? 'Provisioning Subscriptions...' : `Confirm & Import (${validCount})`}</span>
          <ArrowRight className="w-4 h-4 ml-1" />
        </Button>
      </div>
    </div>
  );
};

export default BulkPreviewTable;
