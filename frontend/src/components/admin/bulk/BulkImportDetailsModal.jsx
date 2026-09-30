import React, { useState, useEffect } from 'react';
import AdminModal from '../common/AdminModal';
import ConsolidatedInvoiceCard from './ConsolidatedInvoiceCard';
import { Badge } from '../../ui/badge';
import { Button } from '../../ui/button';
import { Download } from 'lucide-react';
import bulkImportService from '../../../services/bulkImport.service';

export const BulkImportDetailsModal = ({
  isOpen,
  onClose,
  jobId,
}) => {
  const [activeTab, setActiveTab] = useState('roster'); // 'roster' | 'invoice'
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!jobId || !isOpen) return;

    const fetchDetails = async () => {
      setLoading(true);
      try {
        const res = await bulkImportService.getJobById(jobId);
        if (res && res.job) setJob(res.job);
      } catch (err) {
        console.warn('Failed to load bulk job details:', err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchDetails();
    setActiveTab('roster');
  }, [jobId, isOpen]);

  if (!jobId) return null;

  const handleDownloadRosterCSV = () => {
    const records = job?.records || [];
    if (records.length === 0) return;

    const headers = [
      'Row #',
      'Full Name',
      'Email Address (Login ID)',
      'Temporary Password',
      'Mobile Number',
      'Role / Category',
      'Roll / Employee ID',
      'Department',
      'Subscription Pass ID',
      'Status',
    ];

    const csvRows = [
      headers.join(','),
      ...records.map((r) =>
        [
          r.rowNumber || '',
          `"${(r.name || '').replace(/"/g, '""')}"`,
          `"${(r.email || '').replace(/"/g, '""')}"`,
          '"Nfi@2026!"',
          `"${(r.phoneNumber || r.phone || '').replace(/"/g, '""')}"`,
          `"${(r.roleCategory || r.userType || '').replace(/"/g, '""')}"`,
          `"${(r.rollOrEmployeeId || '').replace(/"/g, '""')}"`,
          `"${(r.department || '').replace(/"/g, '""')}"`,
          `"${r.subscriptionId || 'ACTIVE'}"`,
          `"${r.status || 'imported'}"`,
        ].join(',')
      ),
    ];

    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Roster_Credentials_${job?.jobId || 'Batch'}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <AdminModal
      isOpen={isOpen}
      onClose={onClose}
      title={`Bulk Batch Details: ${job?.jobId || jobId}`}
      description={`Subscriber enrollment roster and institutional billing records for ${job?.institutionName || 'Batch'}.`}
      confirmLabel="Close"
      onConfirm={onClose}
      size="lg"
    >
      <div className="space-y-4 text-xs select-none font-sans">
        {/* Top Metric Strip */}
        <div className="grid grid-cols-3 gap-2.5">
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-center">
            <span className="text-[10px] font-bold text-slate-400 uppercase block">Total Rows</span>
            <span className="text-lg font-black text-slate-900">{job?.totalRows || 0}</span>
          </div>

          <div className="p-3 bg-emerald-50/70 border border-emerald-100 rounded-xl text-center">
            <span className="text-[10px] font-bold text-emerald-700 uppercase block">
              Enrolled Valid
            </span>
            <span className="text-lg font-black text-emerald-900">{job?.validCount || 0}</span>
          </div>

          <div className="p-3 bg-red-50/70 border border-red-100 rounded-xl text-center">
            <span className="text-[10px] font-bold text-red-700 uppercase block">Failed Rows</span>
            <span className="text-lg font-black text-red-900">{job?.invalidCount || 0}</span>
          </div>
        </div>

        {/* Tab Switcher & Export Credentials */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveTab('roster')}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
                activeTab === 'roster'
                  ? 'bg-[#284661] text-white shadow-2xs'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              Enrolled Subscriber Roster ({job?.records?.length || 0})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('invoice')}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
                activeTab === 'invoice'
                  ? 'bg-[#284661] text-white shadow-2xs'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              Consolidated Invoice
            </button>
          </div>

          {job?.records?.length > 0 && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleDownloadRosterCSV}
              className="rounded-xl text-xs font-bold text-[#284661] border-slate-200 hover:bg-slate-50 cursor-pointer h-8"
            >
              <Download className="w-3.5 h-3.5 mr-1" />
              <span>Export Credentials (.CSV)</span>
            </Button>
          )}
        </div>

        {/* Tab 1: Roster */}
        {activeTab === 'roster' && (
          <div className="max-h-[50vh] overflow-y-auto divide-y divide-slate-100 border border-slate-200 rounded-2xl bg-white shadow-2xs">
            {loading ? (
              <p className="p-8 text-center text-slate-400">Loading batch details...</p>
            ) : !job?.records || job.records.length === 0 ? (
              <p className="p-8 text-center text-slate-400">No records found.</p>
            ) : (
              job.records.map((rec) => (
                <div
                  key={rec.rowNumber}
                  className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 hover:bg-slate-50/80 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-[#284661] text-white flex items-center justify-center font-bold text-xs shrink-0">
                      {rec.name?.charAt(0).toUpperCase() || 'U'}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-bold text-slate-900">{rec.name}</span>
                        <Badge variant="outline" className="text-[8px] uppercase font-bold px-1.5 py-0">
                          {rec.roleCategory || rec.userType}
                        </Badge>
                        {rec.rollOrEmployeeId && rec.rollOrEmployeeId !== '—' && (
                          <span className="text-[10px] font-mono text-slate-500">
                            ID: {rec.rollOrEmployeeId}
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-400 font-mono">
                        <span>{rec.email}</span>
                        {rec.phoneNumber && <span> · {rec.phoneNumber}</span>}
                        {rec.department && rec.department !== '—' && (
                          <span> · {rec.department}</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 self-end sm:self-auto text-right">
                    <div>
                      <span className="font-mono text-slate-400 text-[10px] block">
                        {rec.subscriptionId || 'Active Pass'}
                      </span>
                      <span className="text-[11px] font-bold text-slate-700">
                        Row #{rec.rowNumber}
                      </span>
                    </div>

                    <Badge
                      variant={
                        rec.status === 'imported' || rec.status === 'valid'
                          ? 'nfiNavy'
                          : 'destructive'
                      }
                      className="text-[9px] uppercase font-bold"
                    >
                      {rec.status}
                    </Badge>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Tab 2: Consolidated Invoice */}
        {activeTab === 'invoice' && (
          <ConsolidatedInvoiceCard invoice={job?.consolidatedInvoice} job={job} />
        )}
      </div>
    </AdminModal>
  );
};

export default BulkImportDetailsModal;
