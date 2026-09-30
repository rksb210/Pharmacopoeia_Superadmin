import React, { useState, useEffect, useCallback } from 'react';
import {
  CheckCircle2,
  History,
  Eye,
  Plus,
} from 'lucide-react';
import PageContainer from '../../components/admin/common/PageContainer';
import PageHeader from '../../components/admin/common/PageHeader';
import AdminLoader from '../../components/admin/common/AdminLoader';
import AdminEmptyState from '../../components/admin/common/AdminEmptyState';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '../../components/ui/table';

import bulkImportService from '../../services/bulkImport.service';
import { usePermission } from '../../context/PermissionContext';

// Components & Modals
import BulkUploadZone from '../../components/admin/bulk/BulkUploadZone';
import BulkPreviewTable from '../../components/admin/bulk/BulkPreviewTable';
import ConsolidatedInvoiceCard from '../../components/admin/bulk/ConsolidatedInvoiceCard';
import BulkImportDetailsModal from '../../components/admin/bulk/BulkImportDetailsModal';
import ExportDropdown from '../../components/admin/common/ExportDropdown';

export const BulkSubscriptionsPage = () => {
  const { can, isSuperAdmin } = usePermission();
  const canAdd = isSuperAdmin || can('ADD', 'COMMERCIAL', 'BULK_SUBSCRIPTION');

  const [activeMainTab, setActiveMainTab] = useState(canAdd ? 'wizard' : 'history');

  useEffect(() => {
    if (!canAdd && activeMainTab === 'wizard') {
      setActiveMainTab('history');
    }
  }, [canAdd, activeMainTab]);

  // Wizard States: 1: upload, 2: preview, 3: success
  const [wizardStep, setWizardStep] = useState(1);
  const [previewData, setPreviewData] = useState(null);
  const [completedJob, setCompletedJob] = useState(null);

  const [isProcessing, setIsProcessing] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [error, setError] = useState('');
  const [feedback, setFeedback] = useState({ message: '', type: '' });

  // History State
  const [historyJobs, setHistoryJobs] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyTotal, setHistoryTotal] = useState(0);
  const [viewingJobId, setViewingJobId] = useState(null);

  const fetchHistory = useCallback(async () => {
    setHistoryLoading(true);
    try {
      const res = await bulkImportService.getHistory({ limit: 25 });
      if (res && res.jobs) {
        setHistoryJobs(res.jobs);
        setHistoryTotal(res.pagination?.total || 0);
      }
    } catch (err) {
      console.warn('Failed to load bulk history:', err.message);
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const showFeedback = (message, type = 'success') => {
    setFeedback({ message, type });
    setTimeout(() => setFeedback({ message: '', type: '' }), 4000);
  };

  // Step 1 -> Step 2 (Excel / CSV Upload)
  const handleUploadAndValidate = async (formData) => {
    setIsProcessing(true);
    setError('');

    try {
      const res = await bulkImportService.uploadAndValidate(formData);
      if (res && res.preview) {
        setPreviewData(res.preview);
        setWizardStep(2);
        showFeedback(res.message || 'Spreadsheet validated successfully.');
      }
    } catch (err) {
      setError(err.message || 'Failed to parse and validate spreadsheet.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Step 1 -> Step 2 (Direct Manual Roster Entry)
  const handleDirectValidate = async (payload) => {
    setIsProcessing(true);
    setError('');

    try {
      const res = await bulkImportService.validateDirectRows(payload);
      if (res && res.preview) {
        setPreviewData(res.preview);
        setWizardStep(2);
        showFeedback(res.message || 'Direct roster validated successfully.');
      }
    } catch (err) {
      setError(err.message || 'Failed to validate direct roster rows.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Step 2 -> Step 3
  const handleConfirmImport = async (confirmOptions = {}) => {
    if (!previewData) return;

    setIsImporting(true);
    setError('');

    try {
      const res = await bulkImportService.confirmImport(
        previewData.jobId || previewData._id,
        confirmOptions
      );
      if (res && res.job) {
        setCompletedJob(res.job);
        setWizardStep(3);
        fetchHistory();
        showFeedback(res.message || 'Bulk subscribers successfully imported!');
      }
    } catch (err) {
      setError(err.message || 'Import execution failed.');
    } finally {
      setIsImporting(false);
    }
  };

  const handleResetWizard = () => {
    setWizardStep(1);
    setPreviewData(null);
    setCompletedJob(null);
    setError('');
  };

  const bulkExportColumns = [
    { header: 'Batch Job ID', key: 'jobId' },
    { header: 'Institution Name', key: 'institutionName' },
    { header: 'Stakeholder Type', key: 'userType' },
    { header: 'Source File / Entry', key: 'fileName' },
    { header: 'Target Plan', key: 'planCode' },
    {
      header: 'Enrolled Count',
      key: 'validCount',
      format: (val, item) => `${val || 0} / ${item.totalRows || 0}`,
    },
    {
      header: 'Invoice Number',
      key: 'consolidatedInvoice',
      format: (val) => val?.invoiceNumber || '—',
    },
    {
      header: 'Invoice Amount (INR)',
      key: 'consolidatedInvoice',
      format: (val) =>
        val?.finalAmountINR !== undefined
          ? `₹${val.finalAmountINR.toLocaleString('en-IN')}`
          : '—',
    },
    {
      header: 'Transaction / Ref ID',
      key: 'consolidatedInvoice',
      format: (val) => val?.paymentReference || val?.transactionId || '—',
    },
    {
      header: 'Created Date',
      key: 'createdAt',
      format: (val) => (val ? new Date(val).toLocaleDateString('en-GB') : '—'),
    },
    { header: 'Status', key: 'status' },
  ];

  const fetchAllBulkHistoryForExport = async () => {
    try {
      const res = await bulkImportService.getHistory({ limit: 5000 });
      return res?.jobs || historyJobs;
    } catch {
      return historyJobs;
    }
  };

  return (
    <PageContainer>
      {/* Header */}
      <PageHeader
        title="Bulk Subscriptions & Institutional Onboarding"
        subtitle="Batch enroll institutional rosters, university student cohorts, hospital clinical staff, and corporate teams via Excel or Direct Table with volume slab discounts and consolidated billing."
      >
        <div className="flex items-center gap-2">
          <ExportDropdown
            filename="bulk_subscriptions_history_export"
            title="Bulk Subscriptions History"
            metadata={[
              { label: 'Export Date', value: new Date().toLocaleString() },
              { label: 'Total Batch Records', value: historyTotal || historyJobs.length },
            ]}
            columns={bulkExportColumns}
            data={historyJobs}
            onFetchData={fetchAllBulkHistoryForExport}
            onFeedback={showFeedback}
            permission={{ module: 'COMMERCIAL', section: 'BULK_SUBSCRIPTION', action: 'VIEW' }}
          />

          {canAdd && (
            <Button
              variant={activeMainTab === 'wizard' ? 'nfiYellow' : 'outline'}
              size="sm"
              onClick={() => setActiveMainTab('wizard')}
              className="rounded-xl text-xs font-bold shadow-2xs cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 mr-1" />
              <span>New Bulk Import</span>
            </Button>
          )}

          <Button
            variant={activeMainTab === 'history' ? 'nfiNavy' : 'outline'}
            size="sm"
            onClick={() => setActiveMainTab('history')}
            className="rounded-xl text-xs font-bold cursor-pointer"
          >
            <History className="w-3.5 h-3.5 mr-1" />
            <span>Import History ({historyTotal})</span>
          </Button>
        </div>
      </PageHeader>

      {/* Global Feedback Banner */}
      {feedback.message && (
        <div
          className={`p-3.5 rounded-2xl border text-xs flex items-center gap-2 select-none shadow-xs animate-in fade-in-0 duration-150 ${
            feedback.type === 'error'
              ? 'bg-red-50 border-red-200 text-red-700'
              : 'bg-emerald-50 border-emerald-200 text-emerald-800'
          }`}
        >
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
          <span className="font-semibold">{feedback.message}</span>
        </div>
      )}

      {error && (
        <div className="p-3.5 bg-red-50 border border-red-200 text-red-700 rounded-2xl text-xs flex items-center gap-2">
          <span>{error}</span>
        </div>
      )}

      {/* MAIN TAB 1: BULK IMPORT WIZARD */}
      {activeMainTab === 'wizard' && canAdd && (
        <div className="space-y-5">
          {/* Wizard Progress Steps Indicator */}
          <div className="p-4 bg-white border border-slate-200/80 rounded-2xl shadow-2xs flex items-center justify-between font-sans select-none text-xs">
            {[
              {
                num: 1,
                label: 'Configure & Input Roster',
                desc: 'Stakeholder, Plan & Excel / Direct Table',
              },
              {
                num: 2,
                label: 'Validate, Slabs & Coupon',
                desc: 'Row Verification & Discount Calculation',
              },
              {
                num: 3,
                label: 'Consolidated Billing',
                desc: 'Passes, Credentials & Invoice Generated',
              },
            ].map((step, idx) => {
              const isDone = wizardStep > step.num || (step.num === 3 && Boolean(completedJob));
              const isCurrent = wizardStep === step.num && !isDone;

              return (
                <div key={step.num} className="flex items-center gap-3 flex-1">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-xs shrink-0 transition-all ${
                      isDone
                        ? 'bg-emerald-600 text-white'
                        : isCurrent
                        ? 'bg-[#284661] text-white shadow-xs'
                        : 'bg-slate-100 text-slate-400'
                    }`}
                  >
                    {isDone ? <CheckCircle2 className="w-4 h-4" /> : step.num}
                  </div>

                  <div className="hidden sm:block">
                    <span
                      className={`font-bold block text-xs ${
                        isCurrent || isDone ? 'text-slate-900' : 'text-slate-400'
                      }`}
                    >
                      {step.label}
                    </span>
                    <span className="text-[10px] text-slate-400">{step.desc}</span>
                  </div>

                  {idx < 2 && <div className="flex-1 h-0.5 bg-slate-100 mx-2 hidden md:block" />}
                </div>
              );
            })}
          </div>

          {/* STEP 1: UPLOAD OR DIRECT TABLE */}
          {wizardStep === 1 && (
            <BulkUploadZone
              onUploadSuccess={handleUploadAndValidate}
              onDirectValidateSuccess={handleDirectValidate}
              isProcessing={isProcessing}
            />
          )}

          {/* STEP 2: PREVIEW & BILLING */}
          {wizardStep === 2 && previewData && (
            <BulkPreviewTable
              previewData={previewData}
              onConfirmImport={handleConfirmImport}
              onReset={handleResetWizard}
              isImporting={isImporting}
            />
          )}

          {/* STEP 3: SUCCESS & INVOICE */}
          {wizardStep === 3 && completedJob && (
            <div className="space-y-5 animate-in fade-in-0 duration-150">
              {/* Success Notification Banner */}
              <div className="p-5 bg-gradient-to-r from-emerald-700 to-teal-800 rounded-2xl text-white shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 select-none">
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-2xl bg-white/15 flex items-center justify-center">
                    <CheckCircle2 className="w-6 h-6 text-[#FFD243]" />
                  </div>
                  <div>
                    <h3 className="text-base font-black">
                      Batch #{completedJob.jobId} Successfully Enrolled!
                    </h3>
                    <p className="text-emerald-100 text-xs mt-0.5">
                      {completedJob.validCount} accounts provisioned with default password{' '}
                      <span className="font-mono font-bold text-[#FFD243]">Nfi@2026!</span> and
                      linked to {completedJob.institutionName}.
                    </p>
                  </div>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleResetWizard}
                  className="rounded-xl text-xs font-bold bg-white text-emerald-900 border-none hover:bg-emerald-50 cursor-pointer self-start sm:self-auto"
                >
                  Import Another Batch
                </Button>
              </div>

              {/* Consolidated Institutional Invoice */}
              <ConsolidatedInvoiceCard
                invoice={completedJob.consolidatedInvoice}
                job={completedJob}
              />
            </div>
          )}
        </div>
      )}

      {/* MAIN TAB 2: IMPORT HISTORY LOG */}
      {activeMainTab === 'history' && (
        <div className="space-y-4">
          <div className="bg-white border border-slate-200/80 rounded-2xl shadow-2xs overflow-hidden font-sans select-none text-xs">
            {historyLoading ? (
              <AdminLoader text="Loading past bulk import batches..." />
            ) : historyJobs.length === 0 ? (
              <AdminEmptyState
                title="No bulk import history"
                description="You have not executed any bulk subscriber imports yet."
                actionLabel={canAdd ? 'New Bulk Import' : undefined}
                onAction={canAdd ? () => setActiveMainTab('wizard') : undefined}
              />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Batch Job ID</TableHead>
                    <TableHead>Institution &amp; Source</TableHead>
                    <TableHead>Target Plan</TableHead>
                    <TableHead>Enrolled Count</TableHead>
                    <TableHead>Invoice Ref &amp; Amount</TableHead>
                    <TableHead>Execution Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {historyJobs.map((job) => (
                    <TableRow key={job._id}>
                      <TableCell>
                        <span className="font-mono font-bold text-slate-900">{job.jobId}</span>
                      </TableCell>

                      <TableCell>
                        <span className="font-bold text-slate-800 block">
                          {job.institutionName}
                        </span>
                        <span className="text-[10px] text-slate-400">{job.fileName}</span>
                      </TableCell>

                      <TableCell>
                        <Badge variant="outline" className="text-[9px] uppercase font-bold">
                          {job.planCode}
                        </Badge>
                      </TableCell>

                      <TableCell>
                        <span className="font-black text-emerald-700">
                          {job.validCount} / {job.totalRows}
                        </span>
                      </TableCell>

                      <TableCell>
                        <div>
                          <span className="font-mono font-bold text-slate-900 text-xs block">
                            {job.consolidatedInvoice?.finalAmountINR !== undefined
                              ? `₹${job.consolidatedInvoice.finalAmountINR.toLocaleString('en-IN')}`
                              : '—'}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {job.consolidatedInvoice?.invoiceNumber || 'No Invoice'}
                          </span>
                        </div>
                      </TableCell>

                      <TableCell>
                        <span className="text-slate-600">
                          {new Date(job.createdAt).toLocaleDateString('en-IN')}
                        </span>
                      </TableCell>

                      <TableCell>
                        <Badge
                          variant={job.status === 'completed' ? 'nfiNavy' : 'secondary'}
                          className="text-[9px] uppercase font-bold"
                        >
                          {job.status}
                        </Badge>
                      </TableCell>

                      <TableCell className="text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setViewingJobId(job._id)}
                          className="rounded-lg text-xs font-semibold h-8 cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5 mr-1" />
                          <span>View Details</span>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </div>
      )}

      {/* Details Modal */}
      <BulkImportDetailsModal
        isOpen={!!viewingJobId}
        onClose={() => setViewingJobId(null)}
        jobId={viewingJobId}
      />
    </PageContainer>
  );
};

export default BulkSubscriptionsPage;
