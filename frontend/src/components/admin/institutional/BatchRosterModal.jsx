import React, { useState, useEffect } from 'react';
import AdminModal from '../common/AdminModal';
import { Badge } from '../../ui/badge';
import { Button } from '../../ui/button';
import {
  FileSpreadsheet,
  Download,
  Search,
  Users,
  CheckCircle2,
  XCircle,
  Building2,
  Mail,
  Phone,
  Layers,
  GraduationCap,
  Briefcase,
} from 'lucide-react';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '../../ui/table';
import institutionalSubscriptionService from '../../../services/institutionalSubscription.service';
import AdminLoader from '../common/AdminLoader';

export const BatchRosterModal = ({ isOpen, onClose, batchId }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    if (!batchId || !isOpen) return;

    const fetchDetails = async () => {
      setLoading(true);
      try {
        const res = await institutionalSubscriptionService.getBatchRoster(batchId);
        if (res && res.batchMetadata) {
          setData(res);
        }
      } catch (err) {
        console.error('Failed to load batch roster:', err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchDetails();
    setSearch('');
    setStatusFilter('ALL');
  }, [batchId, isOpen]);

  const handleExportCSV = async () => {
    if (!batchId) return;
    setIsExporting(true);
    try {
      await institutionalSubscriptionService.exportBatchRosterCSV(batchId);
    } catch (err) {
      console.error('Failed to export batch roster CSV:', err);
    } finally {
      setIsExporting(false);
    }
  };

  if (!batchId) return null;

  const metadata = data?.batchMetadata;
  const allMembers = data?.members || [];

  const filteredMembers = allMembers.filter((m) => {
    const matchesSearch =
      !search ||
      m.name.toLowerCase().includes(search.toLowerCase()) ||
      m.email.toLowerCase().includes(search.toLowerCase()) ||
      m.rollOrEmployeeId.toLowerCase().includes(search.toLowerCase()) ||
      m.department.toLowerCase().includes(search.toLowerCase());

    const matchesStatus =
      statusFilter === 'ALL' ||
      (statusFilter === 'ENROLLED' && (m.status === 'ENROLLED' || m.status === 'IMPORTED' || m.status === 'VALID')) ||
      (statusFilter === 'FAILED' && (m.status === 'FAILED' || m.status === 'INVALID'));

    return matchesSearch && matchesStatus;
  });

  return (
    <AdminModal
      isOpen={isOpen}
      onClose={onClose}
      title={`Batch Member Roster: ${metadata?.batchRef || batchId}`}
      description={`Enrolled subscriber cohort licenses under ${metadata?.institutionName || 'Institution'}.`}
      confirmLabel="Close"
      onConfirm={onClose}
      size="xl"
    >
      {loading ? (
        <AdminLoader text="Loading batch roster details..." />
      ) : !data ? (
        <div className="p-8 text-center text-slate-400">Batch details could not be found.</div>
      ) : (
        <div className="space-y-4 text-xs font-sans select-none">
          {/* Top Metadata Card */}
          <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-2xl grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Institution &amp; Stakeholder
              </span>
              <span className="text-sm font-black text-slate-900 block mt-0.5">
                {metadata.institutionName}
              </span>
              <div className="flex items-center gap-1.5 mt-1">
                <Badge
                  variant="outline"
                  className={`text-[9px] font-bold uppercase ${
                    metadata.userType === 'UNIVERSITIES_COLLEGES'
                      ? 'border-blue-200 text-blue-800 bg-blue-50/50'
                      : 'border-amber-200 text-amber-800 bg-amber-50/50'
                  }`}
                >
                  {metadata.userType === 'UNIVERSITIES_COLLEGES' ? (
                    <GraduationCap className="w-2.5 h-2.5 mr-1" />
                  ) : (
                    <Briefcase className="w-2.5 h-2.5 mr-1" />
                  )}
                  <span>{metadata.stakeholderLabel}</span>
                </Badge>
              </div>
            </div>

            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Coordinator Contact
              </span>
              <span className="text-xs font-bold text-slate-800 block mt-0.5">
                {metadata.coordinator.name}
              </span>
              <div className="text-[11px] text-slate-500 font-mono space-y-0.5 mt-0.5">
                <div className="flex items-center gap-1">
                  <Mail className="w-3 h-3 text-slate-400" />
                  <span>{metadata.coordinator.email}</span>
                </div>
                {metadata.coordinator.phone && (
                  <div className="flex items-center gap-1">
                    <Phone className="w-3 h-3 text-slate-400" />
                    <span>{metadata.coordinator.phone}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="flex flex-col justify-between items-start md:items-end">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block md:text-right">
                  Enrolled Seats &amp; Plan
                </span>
                <span className="text-base font-black text-emerald-700 block md:text-right">
                  {metadata.validSeats} / {metadata.totalRows} Seats Enrolled
                </span>
                <span className="text-[10px] text-slate-400 font-mono block md:text-right">
                  {metadata.plan.name}
                </span>
              </div>

              <Button
                variant="nfiNavy"
                size="sm"
                onClick={handleExportCSV}
                disabled={isExporting}
                className="rounded-xl text-xs font-bold shadow-2xs mt-2 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 mr-1.5" />
                <span>{isExporting ? 'Exporting...' : 'Export Batch Roster (.CSV)'}</span>
              </Button>
            </div>
          </div>

          {/* Search and Filters Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
            <div className="relative flex-1 max-w-sm">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search member, email, roll/emp ID, dept..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-[#284661]"
              />
            </div>

            <div className="flex items-center gap-1.5">
              {['ALL', 'ENROLLED', 'FAILED'].map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setStatusFilter(st)}
                  className={`px-2.5 py-1 rounded-xl text-[11px] font-bold transition-all cursor-pointer ${
                    statusFilter === st
                      ? 'bg-[#284661] text-white shadow-2xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200/70'
                  }`}
                >
                  {st === 'ALL' ? `All (${allMembers.length})` : st}
                </button>
              ))}
            </div>
          </div>

          {/* Members Table */}
          <div className="border border-slate-200/80 rounded-2xl overflow-hidden bg-white shadow-2xs max-h-[50vh] overflow-y-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">#</TableHead>
                  <TableHead>Full Name &amp; Contact</TableHead>
                  <TableHead>Role / Category</TableHead>
                  <TableHead>Roll No / Emp ID</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Pass ID</TableHead>
                  <TableHead className="text-right">Account Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredMembers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-slate-400">
                      No cohort members matching the criteria.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredMembers.map((m) => (
                    <TableRow key={m.rowNumber}>
                      <TableCell className="font-mono text-slate-400">
                        {m.rowNumber}
                      </TableCell>

                      <TableCell>
                        <span className="font-bold text-slate-900 block">{m.name}</span>
                        <div className="text-[11px] text-slate-500 font-mono flex items-center gap-2">
                          <span>{m.email}</span>
                          {m.phone && m.phone !== '—' && (
                            <span className="text-slate-400">· {m.phone}</span>
                          )}
                        </div>
                      </TableCell>

                      <TableCell>
                        <Badge variant="outline" className="text-[9px] uppercase font-bold">
                          {m.roleOrCategory}
                        </Badge>
                      </TableCell>

                      <TableCell className="font-mono font-semibold text-slate-700">
                        {m.rollOrEmployeeId}
                      </TableCell>

                      <TableCell className="text-slate-600 font-medium">
                        {m.department}
                      </TableCell>

                      <TableCell className="font-mono text-slate-500 text-[11px]">
                        {m.subscriptionId}
                      </TableCell>

                      <TableCell className="text-right">
                        <Badge
                          variant={
                            m.status === 'ENROLLED' || m.status === 'IMPORTED' || m.status === 'VALID'
                              ? 'nfiNavy'
                              : 'destructive'
                          }
                          className="text-[9px] uppercase font-bold"
                        >
                          {m.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      )}
    </AdminModal>
  );
};

export default BatchRosterModal;
