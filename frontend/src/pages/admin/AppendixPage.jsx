import React, { useState, useEffect, useCallback } from 'react';
import {
  BookOpen,
  Plus,
  Edit2,
  Trash2,
  Eye,
  Search,
  Filter,
  RefreshCw,
  Table as TableIcon,
  Layers,
  FileText,
  CheckCircle2,
  AlertCircle,
  Hash,
} from 'lucide-react';
import PageContainer from '../../components/admin/common/PageContainer';
import PageHeader from '../../components/admin/common/PageHeader';
import StatCard from '../../components/admin/common/StatCard';
import AdminTableWrapper from '../../components/admin/common/AdminTableWrapper';
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
import ExportDropdown from '../../components/admin/common/ExportDropdown';
import { usePermission } from '../../context/PermissionContext';
import appendixService from '../../services/appendix.service';
import CreateEditAppendixModal from '../../components/admin/appendix/CreateEditAppendixModal';
import AppendixDetailsModal from '../../components/admin/appendix/AppendixDetailsModal';

export const AppendixPage = () => {
  const { can, isSuperAdmin } = usePermission();
  const canAdd = isSuperAdmin || can('ADD', 'CONTENT', 'APPENDICES') || can('ADD', 'CONTENT', 'MONOGRAPHS');
  const canEdit = isSuperAdmin || can('EDIT', 'CONTENT', 'APPENDICES') || can('EDIT', 'CONTENT', 'MONOGRAPHS');
  const canDelete = isSuperAdmin || can('DELETE', 'CONTENT', 'APPENDICES') || can('DELETE', 'CONTENT', 'MONOGRAPHS');

  const [appendices, setAppendices] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    inactive: 0,
    withTables: 0,
    withSections: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [feedback, setFeedback] = useState({ message: '', type: '' });

  // Filters & Pagination
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  // Modals State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAppendix, setEditingAppendix] = useState(null);
  const [viewDetailsAppendix, setViewDetailsAppendix] = useState(null);

  const showFeedback = (message, type = 'success') => {
    setFeedback({ message, type });
    setTimeout(() => setFeedback({ message: '', type: '' }), 4000);
  };

  const fetchStats = async () => {
    try {
      const res = await appendixService.getStats();
      if (res?.stats) setStats(res.stats);
    } catch {
      // Ignore stats error
    }
  };

  const fetchAppendices = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await appendixService.getAppendices({
        page: currentPage,
        limit: 25,
        search: searchQuery,
        status: statusFilter,
        sortBy: 'order',
        sortOrder: 'asc',
      });
      setAppendices(res?.appendices || []);
      setTotalPages(res?.pagination?.totalPages || 1);
      setTotalItems(res?.pagination?.total || 0);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to load appendices');
    } finally {
      setLoading(false);
    }
  }, [currentPage, searchQuery, statusFilter]);

  useEffect(() => {
    fetchStats();
  }, []);

  useEffect(() => {
    fetchAppendices();
  }, [fetchAppendices]);

  const handleToggleStatus = async (app) => {
    if (!canEdit) return;
    const newStatus = !app.isActive;
    try {
      await appendixService.toggleAppendixStatus(app._id, newStatus);
      showFeedback(`Appendix ${app.number} is now ${newStatus ? 'ACTIVE' : 'INACTIVE'}.`);
      setAppendices((prev) =>
        prev.map((item) =>
          item._id === app._id
            ? { ...item, isActive: newStatus, status: newStatus ? 'ACTIVE' : 'INACTIVE' }
            : item
        )
      );
      fetchStats();
    } catch (err) {
      showFeedback(err.message || 'Failed to toggle status', 'error');
    }
  };

  const handleDelete = async (app) => {
    if (!canDelete) return;
    if (!confirm(`Delete Appendix ${app.number}: "${app.title}"? This action cannot be undone.`)) return;

    try {
      await appendixService.deleteAppendix(app._id);
      showFeedback(`Appendix ${app.number} deleted successfully.`);
      fetchAppendices();
      fetchStats();
    } catch (err) {
      showFeedback(err.message || 'Failed to delete appendix', 'error');
    }
  };

  return (
    <PageContainer>
      <PageHeader
        title="Formulary Appendices"
        subtitle="Manage National Formulary of India (NFI) official clinical guidelines, reference protocols, and statutory appendices."
      >
        <ExportDropdown
          filename="nfi_appendices_export"
          title="NFI Appendices"
          data={appendices}
        />
        {canAdd && (
          <Button
            onClick={() => {
              setEditingAppendix(null);
              setIsModalOpen(true);
            }}
            className="bg-orange-600 hover:bg-orange-700 text-white font-bold gap-1.5 rounded-xl shadow-xs cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Appendix</span>
          </Button>
        )}
      </PageHeader>

      {/* Feedback Alert Toast */}
      {feedback.message && (
        <div
          className={`p-3.5 rounded-xl border flex items-center justify-between text-xs font-semibold shadow-xs transition-all ${
            feedback.type === 'error'
              ? 'bg-red-50 text-red-800 border-red-200'
              : 'bg-emerald-50 text-emerald-800 border-emerald-200'
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.type === 'error' ? (
              <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
            ) : (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            )}
            <span>{feedback.message}</span>
          </div>
          <button
            type="button"
            onClick={() => setFeedback({ message: '', type: '' })}
            className="text-slate-400 hover:text-slate-600 text-xs cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* KPI Stats Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Appendices"
          value={stats.total}
          subtitle="All NFI clinical appendices"
          icon={BookOpen}
          variant="primary"
        />
        <StatCard
          title="Active & Published"
          value={stats.active}
          subtitle="Available in public formulary"
          icon={CheckCircle2}
          variant="success"
        />
        <StatCard
          title="With Clinical Tables"
          value={stats.withTables}
          subtitle="Structured comparison grids"
          icon={TableIcon}
          variant="warning"
        />
        <StatCard
          title="With Structured Sections"
          value={stats.withSections}
          subtitle="Parsed guidance headings"
          icon={Layers}
          variant="default"
        />
      </div>

      {/* Search & Filter Toolbar */}
      <div className="p-4 bg-white border border-slate-200/80 rounded-2xl shadow-2xs space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search by appendix number, title, or clinical text..."
              className="w-full text-xs pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <div className="flex items-center gap-1.5">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">Status:</span>
            </div>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="text-xs font-semibold px-3 py-2 rounded-xl border border-slate-200 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
            >
              <option value="all">All Statuses</option>
              <option value="ACTIVE">ACTIVE Only</option>
              <option value="INACTIVE">INACTIVE Only</option>
            </select>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                fetchAppendices();
                fetchStats();
              }}
              className="h-8 text-xs px-2.5 rounded-xl text-slate-600 hover:text-slate-900 gap-1"
              title="Refresh"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Main Appendices Data Table */}
      <AdminTableWrapper
        loading={loading}
        error={error}
        totalItems={totalItems}
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
        emptyMessage="No formulary appendices found matching your search criteria."
      >
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-28">Appendix #</TableHead>
              <TableHead>Title & Overview</TableHead>
              <TableHead>Page Coverage</TableHead>
              <TableHead className="text-center">Structured Content</TableHead>
              <TableHead className="text-center">Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {appendices.map((app) => (
              <TableRow key={app._id} className="hover:bg-slate-50/70 transition-colors">
                <TableCell>
                  <div className="flex items-center gap-2">
                    <span className="w-8 h-8 rounded-xl bg-orange-50 border border-orange-200 text-orange-800 text-xs font-bold flex items-center justify-center shrink-0">
                      {app.number}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono block">
                      Ord: {app.order}
                    </span>
                  </div>
                </TableCell>

                <TableCell>
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5">
                      <BookOpen className="w-3.5 h-3.5 text-orange-600 shrink-0" />
                      <span className="font-bold text-slate-900 text-xs">{app.title}</span>
                    </div>
                    {app.sourceText && (
                      <p className="text-[11px] text-slate-500 line-clamp-1 leading-relaxed">
                        {app.sourceText}
                      </p>
                    )}
                    <span className="text-[10px] font-mono text-slate-400 block">
                      slug: {app.slug}
                    </span>
                  </div>
                </TableCell>

                <TableCell>
                  <div className="space-y-1 text-xs">
                    {app.pageRange?.start ? (
                      <Badge variant="outline" className="bg-amber-50/60 text-amber-900 border-amber-200 text-[10px] font-semibold">
                        NFI pp. {app.pageRange.start}–{app.pageRange.end || app.pageRange.start}
                      </Badge>
                    ) : (
                      <span className="text-slate-400 text-[11px] italic">-</span>
                    )}

                    {app.bookPageRange?.start && (
                      <span className="text-[10px] text-slate-500 block font-mono">
                        Book: pp. {app.bookPageRange.start}–{app.bookPageRange.end || app.bookPageRange.start}
                      </span>
                    )}
                  </div>
                </TableCell>

                <TableCell className="text-center">
                  <div className="flex flex-col items-center gap-1">
                    {app.tablesCount > 0 ? (
                      <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 text-[10px] font-semibold gap-1">
                        <TableIcon className="w-3 h-3" />
                        {app.tablesCount} table{app.tablesCount === 1 ? '' : 's'}
                      </Badge>
                    ) : (
                      <span className="text-[10px] text-slate-400 font-normal">Text only</span>
                    )}

                    {app.sectionsCount > 0 && (
                      <span className="text-[10px] text-slate-500 font-medium">
                        {app.sectionsCount} sections
                      </span>
                    )}
                  </div>
                </TableCell>

                <TableCell className="text-center">
                  <button
                    type="button"
                    onClick={() => handleToggleStatus(app)}
                    disabled={!canEdit}
                    className={`${canEdit ? 'cursor-pointer' : 'cursor-default'}`}
                    title={canEdit ? 'Click to toggle status' : undefined}
                  >
                    <Badge
                      variant={app.isActive ? 'success' : 'secondary'}
                      className="text-[10px] uppercase font-bold"
                    >
                      {app.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </button>
                </TableCell>

                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setViewDetailsAppendix(app)}
                      className="h-7 w-7 p-0 text-slate-500 hover:text-amber-700 rounded-lg cursor-pointer"
                      title="View Details"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </Button>

                    {canEdit && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setEditingAppendix(app);
                          setIsModalOpen(true);
                        }}
                        className="h-7 w-7 p-0 text-slate-500 hover:text-orange-600 rounded-lg cursor-pointer"
                        title="Edit Appendix"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </Button>
                    )}

                    {canDelete && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(app)}
                        className="h-7 w-7 p-0 text-slate-500 hover:text-red-600 rounded-lg cursor-pointer"
                        title="Delete Appendix"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </AdminTableWrapper>

      {/* Modals */}
      {isModalOpen && (
        <CreateEditAppendixModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setEditingAppendix(null);
          }}
          appendix={editingAppendix}
          onSuccess={(msg) => {
            showFeedback(msg);
            fetchAppendices();
            fetchStats();
          }}
        />
      )}

      {viewDetailsAppendix && (
        <AppendixDetailsModal
          isOpen={!!viewDetailsAppendix}
          onClose={() => setViewDetailsAppendix(null)}
          appendix={viewDetailsAppendix}
        />
      )}
    </PageContainer>
  );
};

export default AppendixPage;
