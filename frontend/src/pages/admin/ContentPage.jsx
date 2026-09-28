import React, { useState, useEffect, useCallback } from 'react';
import {
  BookOpen,
  FolderTree,
  Pill,
  Table as TableIcon,
  Plus,
  Edit2,
  Trash2,
  Eye,
  CheckCircle2,
  Layers,
  Search,
  Filter,
  RefreshCw,
  SlidersHorizontal,
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
import contentService from '../../services/content.service';

// Modals
import CreateEditChapterModal from '../../components/admin/content/CreateEditChapterModal';
import CreateEditSubChapterModal from '../../components/admin/content/CreateEditSubChapterModal';
import CreateEditTableModal from '../../components/admin/content/CreateEditTableModal';
import TablePreviewModal from '../../components/admin/content/TablePreviewModal';
import CreateEditMedicineModal from '../../components/admin/content/CreateEditMedicineModal';
import MedicineSectionsModal from '../../components/admin/content/MedicineSectionsModal';
import MedicineDetailsModal from '../../components/admin/content/MedicineDetailsModal';

export const ContentPage = () => {
  const { can } = usePermission();
  const canAdd = can('ADD', 'CONTENT', 'MONOGRAPHS');
  const canEdit = can('EDIT', 'CONTENT', 'MONOGRAPHS');
  const canDelete = can('DELETE', 'CONTENT', 'MONOGRAPHS');

  // Active Tab
  const [activeTab, setActiveTab] = useState('medicines'); // 'chapters', 'subchapters', 'medicines', 'tables'

  // Stats
  const [stats, setStats] = useState({
    totalChapters: 0,
    activeChapters: 0,
    totalSubChapters: 0,
    totalMedicines: 0,
    publishedMedicines: 0,
    totalTables: 0,
  });

  // Shared Filter Data
  const [allChapters, setAllChapters] = useState([]);
  const [activeSubChaptersForFilter, setActiveSubChaptersForFilter] = useState([]);

  // Data States
  const [chapters, setChapters] = useState([]);
  const [subChapters, setSubChapters] = useState([]);
  const [medicines, setMedicines] = useState([]);
  const [tables, setTables] = useState([]);

  // Loading & Feedback
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [feedback, setFeedback] = useState({ message: '', type: '' });

  // Filtering & Pagination
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedChapterFilter, setSelectedChapterFilter] = useState('all');
  const [selectedSubChapterFilter, setSelectedSubChapterFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  // Modal Open States
  const [isChapterModalOpen, setIsChapterModalOpen] = useState(false);
  const [editingChapter, setEditingChapter] = useState(null);

  const [isSubChapterModalOpen, setIsSubChapterModalOpen] = useState(false);
  const [editingSubChapter, setEditingSubChapter] = useState(null);

  const [isTableModalOpen, setIsTableModalOpen] = useState(false);
  const [editingTable, setEditingTable] = useState(null);
  const [previewTable, setPreviewTable] = useState(null);

  const [isMedicineModalOpen, setIsMedicineModalOpen] = useState(false);
  const [editingMedicine, setEditingMedicine] = useState(null);

  const [sectionsMedicine, setSectionsMedicine] = useState(null);
  const [viewDetailsMedicine, setViewDetailsMedicine] = useState(null);

  const showFeedback = (message, type = 'success') => {
    setFeedback({ message, type });
    setTimeout(() => setFeedback({ message: '', type: '' }), 4000);
  };

  // Fetch Stats & Chapter list for dropdowns
  const fetchStats = async () => {
    try {
      const res = await contentService.getStats();
      if (res?.stats) setStats(res.stats);
    } catch {}
  };

  const fetchDropdownChapters = async () => {
    try {
      const res = await contentService.getActiveChapters();
      if (res?.chapters) setAllChapters(res.chapters);
    } catch {}
  };

  useEffect(() => {
    fetchStats();
    fetchDropdownChapters();
  }, []);

  // When chapter filter changes in medicines tab, refresh available subchapters
  useEffect(() => {
    if (selectedChapterFilter && selectedChapterFilter !== 'all') {
      contentService
        .getActiveSubChapters(selectedChapterFilter)
        .then((res) => {
          if (res?.subChapters) setActiveSubChaptersForFilter(res.subChapters);
        })
        .catch(() => setActiveSubChaptersForFilter([]));
    } else {
      setActiveSubChaptersForFilter([]);
      setSelectedSubChapterFilter('all');
    }
  }, [selectedChapterFilter]);

  // Reset pagination on tab change
  const handleTabChange = (tabKey) => {
    setActiveTab(tabKey);
    setCurrentPage(1);
    setSearchQuery('');
    setStatusFilter('all');
  };

  // Main Data Fetcher based on Active Tab
  const fetchData = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      if (activeTab === 'chapters') {
        const res = await contentService.getChapters({
          page: currentPage,
          limit: 10,
          search: searchQuery,
          status: statusFilter,
        });
        if (res?.chapters) {
          setChapters(res.chapters);
          setTotalPages(res.pagination?.totalPages || 1);
          setTotalItems(res.pagination?.total || 0);
        }
      } else if (activeTab === 'subchapters') {
        const res = await contentService.getSubChapters({
          page: currentPage,
          limit: 10,
          search: searchQuery,
          chapterId: selectedChapterFilter,
          status: statusFilter,
        });
        if (res?.subChapters) {
          setSubChapters(res.subChapters);
          setTotalPages(res.pagination?.totalPages || 1);
          setTotalItems(res.pagination?.total || 0);
        }
      } else if (activeTab === 'medicines') {
        const res = await contentService.getMedicines({
          page: currentPage,
          limit: 10,
          search: searchQuery,
          chapterId: selectedChapterFilter,
          subChapterId: selectedSubChapterFilter,
          status: statusFilter,
        });
        if (res?.medicines) {
          setMedicines(res.medicines);
          setTotalPages(res.pagination?.totalPages || 1);
          setTotalItems(res.pagination?.total || 0);
        }
      } else if (activeTab === 'tables') {
        const res = await contentService.getTables({
          page: currentPage,
          limit: 10,
          search: searchQuery,
          status: statusFilter,
        });
        if (res?.tables) {
          setTables(res.tables);
          setTotalPages(res.pagination?.totalPages || 1);
          setTotalItems(res.pagination?.total || 0);
        }
      }
    } catch (err) {
      setError(err.message || 'Failed to load content records.');
    } finally {
      setLoading(false);
    }
  }, [
    activeTab,
    currentPage,
    searchQuery,
    statusFilter,
    selectedChapterFilter,
    selectedSubChapterFilter,
  ]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ==========================================
  // CHAPTERS ACTIONS
  // ==========================================
  const handleSaveChapter = async (payload, editId) => {
    if (editId) {
      await contentService.updateChapter(editId, payload);
      showFeedback('Chapter updated successfully.');
    } else {
      await contentService.createChapter(payload);
      showFeedback('Chapter created successfully.');
    }
    fetchData();
    fetchStats();
    fetchDropdownChapters();
  };

  const handleToggleChapter = async (item) => {
    try {
      await contentService.toggleChapterStatus(item._id, !item.isActive);
      showFeedback(`Chapter ${!item.isActive ? 'activated' : 'deactivated'}.`);
      fetchData();
      fetchStats();
    } catch (e) {
      showFeedback(e.message, 'error');
    }
  };

  const handleDeleteChapter = async (item) => {
    if (!confirm(`Delete chapter "${item.title}"? This cannot be undone.`)) return;
    try {
      await contentService.deleteChapter(item._id);
      showFeedback('Chapter deleted successfully.');
      fetchData();
      fetchStats();
      fetchDropdownChapters();
    } catch (e) {
      showFeedback(e.message, 'error');
    }
  };

  // ==========================================
  // SUB-CHAPTERS ACTIONS
  // ==========================================
  const handleSaveSubChapter = async (payload, editId) => {
    if (editId) {
      await contentService.updateSubChapter(editId, payload);
      showFeedback('Sub-Chapter updated successfully.');
    } else {
      await contentService.createSubChapter(payload);
      showFeedback('Sub-Chapter created successfully.');
    }
    fetchData();
    fetchStats();
  };

  const handleToggleSubChapter = async (item) => {
    try {
      await contentService.toggleSubChapterStatus(item._id, !item.isActive);
      showFeedback(`Sub-Chapter ${!item.isActive ? 'activated' : 'deactivated'}.`);
      fetchData();
      fetchStats();
    } catch (e) {
      showFeedback(e.message, 'error');
    }
  };

  const handleDeleteSubChapter = async (item) => {
    if (!confirm(`Delete sub-chapter "${item.title}"? This cannot be undone.`)) return;
    try {
      await contentService.deleteSubChapter(item._id);
      showFeedback('Sub-Chapter deleted successfully.');
      fetchData();
      fetchStats();
    } catch (e) {
      showFeedback(e.message, 'error');
    }
  };

  // ==========================================
  // TABLES ACTIONS
  // ==========================================
  const handleSaveTable = async (payload, editId) => {
    if (editId) {
      await contentService.updateTable(editId, payload);
      showFeedback('Table updated successfully.');
    } else {
      await contentService.createTable(payload);
      showFeedback('Clinical Table created successfully.');
    }
    fetchData();
    fetchStats();
  };

  const handleToggleTable = async (item) => {
    try {
      await contentService.toggleTableStatus(item._id, !item.isActive);
      showFeedback(`Table ${!item.isActive ? 'activated' : 'deactivated'}.`);
      fetchData();
      fetchStats();
    } catch (e) {
      showFeedback(e.message, 'error');
    }
  };

  const handleDeleteTable = async (item) => {
    if (!confirm(`Delete table "${item.title}"? This cannot be undone.`)) return;
    try {
      await contentService.deleteTable(item._id);
      showFeedback('Table deleted successfully.');
      fetchData();
      fetchStats();
    } catch (e) {
      showFeedback(e.message, 'error');
    }
  };

  // ==========================================
  // MEDICINES ACTIONS
  // ==========================================
  const handleSaveMedicine = async (payload, editId) => {
    if (editId) {
      await contentService.updateMedicine(editId, payload);
      showFeedback('Medicine monograph updated successfully.');
    } else {
      await contentService.createMedicine(payload);
      showFeedback('Medicine monograph created successfully.');
    }
    fetchData();
    fetchStats();
  };

  const handleToggleMedicine = async (item) => {
    try {
      await contentService.toggleMedicineStatus(item._id, !item.isActive);
      showFeedback(`Medicine ${!item.isActive ? 'activated' : 'deactivated'}.`);
      fetchData();
      fetchStats();
    } catch (e) {
      showFeedback(e.message, 'error');
    }
  };

  const handleDeleteMedicine = async (item) => {
    if (!confirm(`Delete medicine monograph "${item.name}"? This cannot be undone.`)) return;
    try {
      await contentService.deleteMedicine(item._id);
      showFeedback('Medicine monograph deleted successfully.');
      fetchData();
      fetchStats();
    } catch (e) {
      showFeedback(e.message, 'error');
    }
  };

  // Handle section update callback from MedicineSectionsModal
  const handleSectionsUpdated = (updatedSections) => {
    setMedicines((prev) =>
      prev.map((m) =>
        m._id === sectionsMedicine?._id
          ? {
              ...m,
              sections: updatedSections,
              sectionsCount: updatedSections.length,
            }
          : m
      )
    );
    if (sectionsMedicine) {
      setSectionsMedicine((prev) => ({
        ...prev,
        sections: updatedSections,
      }));
    }
  };

  // Export Data Fetcher
  const fetchExportData = async () => {
    try {
      if (activeTab === 'chapters') {
        const res = await contentService.getChapters({ limit: 2000, search: searchQuery });
        return res?.chapters || chapters;
      }
      if (activeTab === 'subchapters') {
        const res = await contentService.getSubChapters({ limit: 2000, search: searchQuery });
        return res?.subChapters || subChapters;
      }
      if (activeTab === 'medicines') {
        const res = await contentService.getMedicines({ limit: 2000, search: searchQuery });
        return res?.medicines || medicines;
      }
      if (activeTab === 'tables') {
        const res = await contentService.getTables({ limit: 2000, search: searchQuery });
        return res?.tables || tables;
      }
    } catch {
      return [];
    }
  };

  const getExportColumns = () => {
    if (activeTab === 'chapters') {
      return [
        { header: 'Order', key: 'order' },
        { header: 'Chapter No', key: 'chapterNumber' },
        { header: 'Chapter Title', key: 'title' },
        { header: 'Code', key: 'code' },
        { header: 'Sub-Chapters', key: 'subChaptersCount' },
        { header: 'Medicines', key: 'medicinesCount' },
        { header: 'Status', key: 'isActive', format: (v) => (v ? 'Active' : 'Inactive') },
      ];
    }
    if (activeTab === 'subchapters') {
      return [
        { header: 'Order', key: 'order' },
        { header: 'Sub-Chapter No', key: 'subChapterNumber' },
        { header: 'Title', key: 'title' },
        { header: 'Code', key: 'code' },
        { header: 'Parent Chapter', key: 'chapter', format: (c) => c?.title || '' },
        { header: 'Medicines', key: 'medicinesCount' },
        { header: 'Status', key: 'isActive', format: (v) => (v ? 'Active' : 'Inactive') },
      ];
    }
    if (activeTab === 'medicines') {
      return [
        { header: 'Generic Name', key: 'name' },
        { header: 'Brand Names', key: 'brandNames', format: (b) => (Array.isArray(b) ? b.join(', ') : b || '') },
        { header: 'Chapter', key: 'chapter', format: (c) => c?.title || '' },
        { header: 'Sub-Chapter', key: 'subChapter', format: (s) => s?.title || '' },
        { header: 'Therapeutic Class', key: 'therapeuticClass' },
        { header: 'Dosage Form', key: 'dosageForm' },
        { header: 'Strength', key: 'strength' },
        { header: 'ATC Code', key: 'atcCode' },
        { header: 'Schedule', key: 'schedule' },
        { header: 'Status', key: 'status' },
      ];
    }
    return [
      { header: 'Table Code', key: 'tableCode' },
      { header: 'Title', key: 'title' },
      { header: 'Caption', key: 'caption' },
      { header: 'Columns', key: 'headers', format: (h) => (Array.isArray(h) ? h.length : 0) },
      { header: 'Rows', key: 'rows', format: (r) => (Array.isArray(r) ? r.length : 0) },
      { header: 'Status', key: 'isActive', format: (v) => (v ? 'Active' : 'Inactive') },
    ];
  };

  return (
    <PageContainer>
      <PageHeader
        title="Content & Formulary"
        subtitle="Manage Chapters, Sub-Chapters, Drug Monographs, and Clinical Tables for the National Formulary of India (NFI)."
      >
        <ExportDropdown
          filename={`${activeTab}_export`}
          title={`${activeTab.toUpperCase()} Directory`}
          metadata={[
            { label: 'Total Records', value: totalItems },
            { label: 'Filter', value: statusFilter },
          ]}
          columns={getExportColumns()}
          fetchData={fetchExportData}
        />

        {/* Dynamic Add Button based on Active Tab */}
        {canAdd && (
          <>
            {activeTab === 'chapters' && (
              <Button
                variant="nfiYellow"
                size="sm"
                onClick={() => {
                  setEditingChapter(null);
                  setIsChapterModalOpen(true);
                }}
                className="rounded-xl text-xs font-bold shadow-2xs"
              >
                <Plus className="w-4 h-4 mr-1.5" />
                Add Chapter
              </Button>
            )}

            {activeTab === 'subchapters' && (
              <Button
                variant="nfiYellow"
                size="sm"
                onClick={() => {
                  setEditingSubChapter(null);
                  setIsSubChapterModalOpen(true);
                }}
                className="rounded-xl text-xs font-bold shadow-2xs"
              >
                <Plus className="w-4 h-4 mr-1.5" />
                Add Sub-Chapter
              </Button>
            )}

            {activeTab === 'medicines' && (
              <Button
                variant="nfiYellow"
                size="sm"
                onClick={() => {
                  setEditingMedicine(null);
                  setIsMedicineModalOpen(true);
                }}
                className="rounded-xl text-xs font-bold shadow-2xs"
              >
                <Plus className="w-4 h-4 mr-1.5" />
                Add Medicine Monograph
              </Button>
            )}

            {activeTab === 'tables' && (
              <Button
                variant="nfiYellow"
                size="sm"
                onClick={() => {
                  setEditingTable(null);
                  setIsTableModalOpen(true);
                }}
                className="rounded-xl text-xs font-bold shadow-2xs"
              >
                <Plus className="w-4 h-4 mr-1.5" />
                Add Clinical Table
              </Button>
            )}
          </>
        )}
      </PageHeader>

      {feedback.message && (
        <div
          className={`p-3 rounded-xl text-xs font-medium border flex items-center justify-between animate-in fade-in duration-200 ${
            feedback.type === 'error'
              ? 'bg-red-50 text-red-700 border-red-200'
              : 'bg-emerald-50 text-emerald-800 border-emerald-200'
          }`}
        >
          <span>{feedback.message}</span>
          <button onClick={() => setFeedback({ message: '', type: '' })} className="font-bold">
            ×
          </button>
        </div>
      )}

      {/* KPI Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Chapters"
          value={stats.totalChapters}
          subtitle={`${stats.activeChapters} active in formulary`}
          icon={BookOpen}
        />
        <StatCard
          title="Sub-Chapters"
          value={stats.totalSubChapters}
          subtitle="Therapeutic classes & groups"
          icon={FolderTree}
        />
        <StatCard
          title="Medicines / Monographs"
          value={stats.totalMedicines}
          subtitle={`${stats.publishedMedicines} published live`}
          icon={Pill}
        />
        <StatCard
          title="Clinical Tables"
          value={stats.totalTables}
          subtitle="Dosage grids & references"
          icon={TableIcon}
        />
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 p-1 bg-slate-100/80 rounded-2xl border border-slate-200/80 w-fit text-xs font-bold">
        <button
          type="button"
          onClick={() => handleTabChange('medicines')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all ${
            activeTab === 'medicines'
              ? 'bg-white text-orange-600 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Pill className="w-4 h-4" />
          <span>Medicines & Monographs ({stats.totalMedicines})</span>
        </button>

        <button
          type="button"
          onClick={() => handleTabChange('chapters')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all ${
            activeTab === 'chapters'
              ? 'bg-white text-orange-600 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>Chapters ({stats.totalChapters})</span>
        </button>

        <button
          type="button"
          onClick={() => handleTabChange('subchapters')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all ${
            activeTab === 'subchapters'
              ? 'bg-white text-orange-600 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <FolderTree className="w-4 h-4" />
          <span>Sub-Chapters ({stats.totalSubChapters})</span>
        </button>

        <button
          type="button"
          onClick={() => handleTabChange('tables')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all ${
            activeTab === 'tables'
              ? 'bg-white text-orange-600 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <TableIcon className="w-4 h-4" />
          <span>Clinical Tables ({stats.totalTables})</span>
        </button>
      </div>

      {/* Filter Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-white border border-slate-200 rounded-2xl shadow-2xs">
        <div className="flex flex-wrap items-center gap-2.5 flex-1 min-w-[280px]">
          {/* Search Box */}
          <div className="relative flex-1 min-w-[200px] max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder={`Search ${activeTab}...`}
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 bg-slate-50/50 focus:outline-hidden focus:bg-white focus:ring-2 focus:ring-[#FFD243]"
            />
          </div>

          {/* Chapter Filter (for Sub-Chapters and Medicines) */}
          {(activeTab === 'subchapters' || activeTab === 'medicines') && (
            <select
              value={selectedChapterFilter}
              onChange={(e) => {
                setSelectedChapterFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="text-xs p-1.5 rounded-xl border border-slate-200 bg-white font-medium text-slate-700 min-w-[170px]"
            >
              <option value="all">All Chapters</option>
              {allChapters.map((ch) => (
                <option key={ch._id} value={ch._id}>
                  {ch.chapterNumber ? `${ch.chapterNumber}: ` : ''}{ch.title}
                </option>
              ))}
            </select>
          )}

          {/* Sub-Chapter Filter (for Medicines) */}
          {activeTab === 'medicines' && selectedChapterFilter !== 'all' && (
            <select
              value={selectedSubChapterFilter}
              onChange={(e) => {
                setSelectedSubChapterFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="text-xs p-1.5 rounded-xl border border-slate-200 bg-white font-medium text-slate-700 min-w-[170px]"
            >
              <option value="all">All Sub-Chapters</option>
              {activeSubChaptersForFilter.map((sub) => (
                <option key={sub._id} value={sub._id}>
                  {sub.subChapterNumber ? `${sub.subChapterNumber}: ` : ''}{sub.title}
                </option>
              ))}
            </select>
          )}

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="text-xs p-1.5 rounded-xl border border-slate-200 bg-white font-medium text-slate-700"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            {activeTab === 'medicines' && (
              <>
                <option value="published">Published</option>
                <option value="in_review">In Review</option>
                <option value="draft">Draft</option>
                <option value="archived">Archived</option>
              </>
            )}
          </select>
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={fetchData}
          className="rounded-xl text-xs h-8 text-slate-500 hover:text-slate-800"
        >
          <RefreshCw className="w-3.5 h-3.5 mr-1" />
          Refresh
        </Button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: CHAPTERS TABLE */}
      {/* ========================================================================= */}
      {activeTab === 'chapters' && (
        <AdminTableWrapper
          loading={loading}
          error={error}
          totalItems={totalItems}
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
          emptyMessage="No chapters found matching criteria."
        >
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12 text-center">Order</TableHead>
                <TableHead>Chapter No / Code</TableHead>
                <TableHead>Title & Overview</TableHead>
                <TableHead className="text-center">Sub-Chapters</TableHead>
                <TableHead className="text-center">Medicines</TableHead>
                <TableHead className="text-center">Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {chapters.map((ch) => (
                <TableRow key={ch._id} className="hover:bg-slate-50/70">
                  <TableCell className="text-center font-bold text-slate-400">
                    {ch.order ?? 0}
                  </TableCell>
                  <TableCell>
                    <div className="space-y-0.5">
                      <span className="font-bold text-slate-800 text-xs block">
                        {ch.chapterNumber || 'Chapter'}
                      </span>
                      <Badge variant="outline" className="text-[10px] font-mono border-slate-300">
                        {ch.code}
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-0.5 max-w-md">
                      <span className="font-bold text-slate-900 text-xs block">{ch.title}</span>
                      {ch.description && (
                        <p className="text-[11px] text-slate-500 line-clamp-1 leading-normal">
                          {ch.description}
                        </p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant="secondary" className="font-semibold text-xs">
                      {ch.subChaptersCount ?? 0}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant="secondary" className="font-semibold text-xs bg-amber-50 text-amber-900 border-amber-200">
                      {ch.medicinesCount ?? 0}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    <button
                      type="button"
                      onClick={() => handleToggleChapter(ch)}
                      className="cursor-pointer"
                      title="Click to toggle status"
                    >
                      <Badge
                        variant={ch.isActive ? 'success' : 'secondary'}
                        className="text-[10px] uppercase font-bold"
                      >
                        {ch.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </button>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      {canEdit && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setEditingChapter(ch);
                            setIsChapterModalOpen(true);
                          }}
                          className="h-7 w-7 p-0 text-slate-500 hover:text-orange-600 rounded-lg"
                          title="Edit Chapter"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </Button>
                      )}
                      {canDelete && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteChapter(ch)}
                          className="h-7 w-7 p-0 text-slate-500 hover:text-red-600 rounded-lg"
                          title="Delete Chapter"
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
      )}

      {/* ========================================================================= */}
      {/* TAB 2: SUB-CHAPTERS TABLE */}
      {/* ========================================================================= */}
      {activeTab === 'subchapters' && (
        <AdminTableWrapper
          loading={loading}
          error={error}
          totalItems={totalItems}
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
          emptyMessage="No sub-chapters found matching criteria."
        >
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12 text-center">Order</TableHead>
                <TableHead>Sub-Chapter No / Code</TableHead>
                <TableHead>Title & Overview</TableHead>
                <TableHead>Parent Chapter</TableHead>
                <TableHead className="text-center">Medicines</TableHead>
                <TableHead className="text-center">Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {subChapters.map((sub) => (
                <TableRow key={sub._id} className="hover:bg-slate-50/70">
                  <TableCell className="text-center font-bold text-slate-400">
                    {sub.order ?? 0}
                  </TableCell>
                  <TableCell>
                    <div className="space-y-0.5">
                      <span className="font-bold text-slate-800 text-xs block">
                        {sub.subChapterNumber || 'Sub-Chapter'}
                      </span>
                      <Badge variant="outline" className="text-[10px] font-mono border-slate-300">
                        {sub.code}
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-0.5 max-w-md">
                      <span className="font-bold text-slate-900 text-xs block">{sub.title}</span>
                      {sub.description && (
                        <p className="text-[11px] text-slate-500 line-clamp-1 leading-normal">
                          {sub.description}
                        </p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="bg-slate-50 text-slate-700 text-xs">
                      {sub.chapter?.title || 'Unassigned'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant="secondary" className="font-semibold text-xs bg-amber-50 text-amber-900 border-amber-200">
                      {sub.medicinesCount ?? 0}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    <button
                      type="button"
                      onClick={() => handleToggleSubChapter(sub)}
                      className="cursor-pointer"
                      title="Click to toggle status"
                    >
                      <Badge
                        variant={sub.isActive ? 'success' : 'secondary'}
                        className="text-[10px] uppercase font-bold"
                      >
                        {sub.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </button>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      {canEdit && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setEditingSubChapter(sub);
                            setIsSubChapterModalOpen(true);
                          }}
                          className="h-7 w-7 p-0 text-slate-500 hover:text-orange-600 rounded-lg"
                          title="Edit Sub-Chapter"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </Button>
                      )}
                      {canDelete && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteSubChapter(sub)}
                          className="h-7 w-7 p-0 text-slate-500 hover:text-red-600 rounded-lg"
                          title="Delete Sub-Chapter"
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
      )}

      {/* ========================================================================= */}
      {/* TAB 3: MEDICINES / DRUG MONOGRAPHS TABLE */}
      {/* ========================================================================= */}
      {activeTab === 'medicines' && (
        <AdminTableWrapper
          loading={loading}
          error={error}
          totalItems={totalItems}
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
          emptyMessage="No medicines or drug monographs found."
        >
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Generic / Monograph Name</TableHead>
                <TableHead>Chapter / Class</TableHead>
                <TableHead>Form & Strength</TableHead>
                <TableHead>Schedule / ATC</TableHead>
                <TableHead className="text-center">Sections & Tables</TableHead>
                <TableHead className="text-center">Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {medicines.map((med) => (
                <TableRow key={med._id} className="hover:bg-slate-50/70">
                  <TableCell>
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5">
                        <Pill className="w-3.5 h-3.5 text-orange-600 shrink-0" />
                        <span className="font-bold text-slate-900 text-xs">{med.name}</span>
                      </div>
                      {med.brandNames && med.brandNames.length > 0 && (
                        <p className="text-[11px] text-slate-500 line-clamp-1">
                          <span className="font-medium text-slate-600">Brands:</span>{' '}
                          {Array.isArray(med.brandNames)
                            ? med.brandNames.join(', ')
                            : med.brandNames}
                        </p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-0.5 text-xs">
                      <span className="font-semibold text-slate-800 block">
                        {med.chapter?.title || 'No Chapter'}
                      </span>
                      {med.subChapter?.title && (
                        <span className="text-[11px] text-slate-500 block">
                          ↳ {med.subChapter.title}
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-0.5 text-xs">
                      <span className="font-semibold text-slate-800">{med.dosageForm || '-'}</span>
                      {med.strength && (
                        <span className="text-[11px] text-slate-500 block font-mono">
                          {med.strength}
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <Badge variant="outline" className="text-[10px] font-semibold border-slate-300">
                        {med.schedule || 'Schedule H'}
                      </Badge>
                      {med.atcCode && (
                        <span className="text-[10px] font-mono text-slate-500 block">
                          {med.atcCode}
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex flex-col items-center gap-1">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setSectionsMedicine(med)}
                        className="h-7 text-[11px] px-2.5 rounded-xl border-amber-300 bg-amber-50/60 text-amber-900 hover:bg-amber-100 font-bold gap-1 shadow-2xs"
                      >
                        <Layers className="w-3.5 h-3.5 text-orange-600" />
                        <span>{med.sectionsCount ?? (med.sections?.length || 0)} Sections</span>
                      </Button>

                      {med.tablesCount > 0 && (
                        <span className="text-[10px] font-bold text-emerald-700 flex items-center gap-0.5">
                          <TableIcon className="w-2.5 h-2.5" />
                          {med.tablesCount} table{med.tablesCount === 1 ? '' : 's'}
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <button
                      type="button"
                      onClick={() => handleToggleMedicine(med)}
                      className="cursor-pointer"
                      title="Click to toggle status"
                    >
                      <Badge
                        variant={med.isActive ? 'success' : 'secondary'}
                        className="text-[10px] uppercase font-bold"
                      >
                        {med.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </button>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setViewDetailsMedicine(med)}
                        className="h-7 w-7 p-0 text-slate-500 hover:text-amber-700 rounded-lg"
                        title="View Full Monograph"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </Button>
                      {canEdit && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setEditingMedicine(med);
                            setIsMedicineModalOpen(true);
                          }}
                          className="h-7 w-7 p-0 text-slate-500 hover:text-orange-600 rounded-lg"
                          title="Edit Medicine"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </Button>
                      )}
                      {canDelete && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteMedicine(med)}
                          className="h-7 w-7 p-0 text-slate-500 hover:text-red-600 rounded-lg"
                          title="Delete Medicine"
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
      )}

      {/* ========================================================================= */}
      {/* TAB 4: CLINICAL TABLES MASTER TABLE */}
      {/* ========================================================================= */}
      {activeTab === 'tables' && (
        <AdminTableWrapper
          loading={loading}
          error={error}
          totalItems={totalItems}
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
          emptyMessage="No clinical tables found."
        >
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Table Code</TableHead>
                <TableHead>Title & Caption</TableHead>
                <TableHead className="text-center">Grid Dimensions</TableHead>
                <TableHead className="text-center">Columns Summary</TableHead>
                <TableHead className="text-center">Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tables.map((tbl) => (
                <TableRow key={tbl._id} className="hover:bg-slate-50/70">
                  <TableCell>
                    <Badge variant="outline" className="text-xs font-mono font-bold border-amber-300 bg-amber-50/50 text-amber-950">
                      {tbl.tableCode}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-0.5 max-w-md">
                      <span className="font-bold text-slate-900 text-xs block">{tbl.title}</span>
                      {tbl.caption && (
                        <p className="text-[11px] text-slate-500 italic line-clamp-1">
                          {tbl.caption}
                        </p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant="secondary" className="font-semibold text-xs">
                      {tbl.headers?.length || 0} Cols × {tbl.rows?.length || 0} Rows
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    <span className="text-[11px] text-slate-600 font-medium">
                      {(tbl.headers || []).slice(0, 3).join(', ')}
                      {(tbl.headers || []).length > 3 ? '...' : ''}
                    </span>
                  </TableCell>
                  <TableCell className="text-center">
                    <button
                      type="button"
                      onClick={() => handleToggleTable(tbl)}
                      className="cursor-pointer"
                      title="Click to toggle status"
                    >
                      <Badge
                        variant={tbl.isActive ? 'success' : 'secondary'}
                        className="text-[10px] uppercase font-bold"
                      >
                        {tbl.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </button>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setPreviewTable(tbl)}
                        className="h-7 w-7 p-0 text-slate-500 hover:text-amber-700 rounded-lg"
                        title="Preview Table Grid"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </Button>
                      {canEdit && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setEditingTable(tbl);
                            setIsTableModalOpen(true);
                          }}
                          className="h-7 w-7 p-0 text-slate-500 hover:text-orange-600 rounded-lg"
                          title="Edit Table Grid"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </Button>
                      )}
                      {canDelete && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteTable(tbl)}
                          className="h-7 w-7 p-0 text-slate-500 hover:text-red-600 rounded-lg"
                          title="Delete Table"
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
      )}

      {/* ========================================================================= */}
      {/* DIALOG MODALS */}
      {/* ========================================================================= */}
      {isChapterModalOpen && (
        <CreateEditChapterModal
          isOpen={isChapterModalOpen}
          onClose={() => {
            setIsChapterModalOpen(false);
            setEditingChapter(null);
          }}
          chapter={editingChapter}
          onSuccess={handleSaveChapter}
        />
      )}

      {isSubChapterModalOpen && (
        <CreateEditSubChapterModal
          isOpen={isSubChapterModalOpen}
          onClose={() => {
            setIsSubChapterModalOpen(false);
            setEditingSubChapter(null);
          }}
          subChapter={editingSubChapter}
          chapters={allChapters}
          selectedChapterId={selectedChapterFilter !== 'all' ? selectedChapterFilter : ''}
          onSuccess={handleSaveSubChapter}
        />
      )}

      {isTableModalOpen && (
        <CreateEditTableModal
          isOpen={isTableModalOpen}
          onClose={() => {
            setIsTableModalOpen(false);
            setEditingTable(null);
          }}
          table={editingTable}
          onSuccess={handleSaveTable}
        />
      )}

      {previewTable && (
        <TablePreviewModal
          isOpen={!!previewTable}
          onClose={() => setPreviewTable(null)}
          table={previewTable}
        />
      )}

      {isMedicineModalOpen && (
        <CreateEditMedicineModal
          isOpen={isMedicineModalOpen}
          onClose={() => {
            setIsMedicineModalOpen(false);
            setEditingMedicine(null);
          }}
          medicine={editingMedicine}
          chapters={allChapters}
          selectedChapterId={selectedChapterFilter !== 'all' ? selectedChapterFilter : ''}
          selectedSubChapterId={selectedSubChapterFilter !== 'all' ? selectedSubChapterFilter : ''}
          onSuccess={handleSaveMedicine}
        />
      )}

      {sectionsMedicine && (
        <MedicineSectionsModal
          isOpen={!!sectionsMedicine}
          onClose={() => setSectionsMedicine(null)}
          medicine={sectionsMedicine}
          onSectionsUpdated={handleSectionsUpdated}
        />
      )}

      {viewDetailsMedicine && (
        <MedicineDetailsModal
          isOpen={!!viewDetailsMedicine}
          onClose={() => setViewDetailsMedicine(null)}
          medicine={viewDetailsMedicine}
        />
      )}
    </PageContainer>
  );
};

export default ContentPage;
