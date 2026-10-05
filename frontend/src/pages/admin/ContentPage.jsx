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
  ChevronRight,
  ChevronDown,
  ArrowLeft,
  ShieldCheck,
  Clock,
  Sparkles,
  FolderOpen,
  FileText,
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
import ReviewContentModal from '../../components/admin/content/ReviewContentModal';

export const ContentPage = () => {
  const { can, isSuperAdmin } = usePermission();
  const canAdd = can('ADD', 'CONTENT', 'MONOGRAPHS');
  const canEdit = can('EDIT', 'CONTENT', 'MONOGRAPHS');
  const canDelete = can('DELETE', 'CONTENT', 'MONOGRAPHS');
  const canApprove =
    can('APPROVE', 'CONTENT', 'MONOGRAPHS') ||
    can('APPROVE', 'CONTENT', 'WORKFLOW') ||
    isSuperAdmin;

  // Active Tab: Default to the requested hierarchical flow
  const [activeTab, setActiveTab] = useState('hierarchy'); // 'hierarchy', 'medicines', 'chapters', 'subchapters', 'tables'

  // Hierarchical Flow Drill-Down State
  const [hierarchyChapter, setHierarchyChapter] = useState(null); // Level 2: selected Chapter
  const [hierarchySubChapter, setHierarchySubChapter] = useState(null); // Level 3: selected Sub-Chapter

  // Stats
  const [stats, setStats] = useState({
    totalChapters: 0,
    activeChapters: 0,
    inReviewChapters: 0,
    totalSubChapters: 0,
    inReviewSubChapters: 0,
    totalMedicines: 0,
    publishedMedicines: 0,
    inReviewMedicines: 0,
    totalPendingReview: 0,
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
  const [sectionsModalInitialSectionId, setSectionsModalInitialSectionId] = useState(null);
  const [sectionsModalInitialAddMode, setSectionsModalInitialAddMode] = useState(false);
  const [expandedMedicineIds, setExpandedMedicineIds] = useState(new Set());
  const [viewDetailsMedicine, setViewDetailsMedicine] = useState(null);

  const toggleExpandMedicine = (medicineId) => {
    setExpandedMedicineIds((prev) => {
      const next = new Set(prev);
      if (next.has(medicineId)) {
        next.delete(medicineId);
      } else {
        next.add(medicineId);
      }
      return next;
    });
  };

  const handleOpenSectionsModal = (med, targetSectionId = null, addMode = false) => {
    setSectionsMedicine(med);
    setSectionsModalInitialSectionId(targetSectionId);
    setSectionsModalInitialAddMode(addMode);
  };

  const handleDeleteSectionDirect = async (medicine, section) => {
    const secTitle = section.title || section.label || 'this section';
    if (!confirm(`Delete section "${secTitle}" from "${medicine.name}"? This action cannot be undone.`)) return;

    try {
      const res = await contentService.deleteMedicineSection(medicine._id, section._id || section.key);
      showFeedback(`Section "${secTitle}" deleted successfully.`);
      const updatedSections = res?.sections || (medicine.sections || []).filter(
        (s) => (s._id || s.key) !== (section._id || section.key)
      );
      setMedicines((prev) =>
        prev.map((m) =>
          m._id === medicine._id
            ? {
                ...m,
                sections: updatedSections,
                sectionsCount: updatedSections.length,
              }
            : m
        )
      );
      if (sectionsMedicine && sectionsMedicine._id === medicine._id) {
        setSectionsMedicine((prev) => ({
          ...prev,
          sections: updatedSections,
          sectionsCount: updatedSections.length,
        }));
      }
    } catch (err) {
      showFeedback(err.message || 'Failed to delete section', 'error');
    }
  };

  // Review Modal State
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [reviewingItem, setReviewingItem] = useState(null);
  const [reviewingItemType, setReviewingItemType] = useState('chapter'); // 'chapter' | 'subchapter' | 'medicine'

  const showFeedback = (message, type = 'success') => {
    setFeedback({ message, type });
    setTimeout(() => setFeedback({ message: '', type: '' }), 4000);
  };

  const openReviewModal = (item, type) => {
    setReviewingItem(item);
    setReviewingItemType(type);
    setIsReviewModalOpen(true);
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

  // Main Data Fetcher based on Active Tab & Hierarchy Level
  const fetchData = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      if (activeTab === 'hierarchy') {
        if (!hierarchyChapter) {
          // Level 1: Root Chapters
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
        } else if (!hierarchySubChapter) {
          // Level 2: Sub-Chapters inside selected Chapter
          const res = await contentService.getSubChapters({
            page: currentPage,
            limit: 10,
            search: searchQuery,
            chapterId: hierarchyChapter._id,
            status: statusFilter,
          });
          if (res?.subChapters) {
            setSubChapters(res.subChapters);
            setTotalPages(res.pagination?.totalPages || 1);
            setTotalItems(res.pagination?.total || 0);
          }
        } else {
          // Level 3: Monographs inside selected Sub-Chapter
          const res = await contentService.getMedicines({
            page: currentPage,
            limit: 10,
            search: searchQuery,
            chapterId: hierarchyChapter._id,
            subChapterId: hierarchySubChapter._id,
            status: statusFilter,
          });
          if (res?.medicines) {
            setMedicines(res.medicines);
            setTotalPages(res.pagination?.totalPages || 1);
            setTotalItems(res.pagination?.total || 0);
          }
        }
      } else if (activeTab === 'chapters') {
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
    hierarchyChapter,
    hierarchySubChapter,
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
      showFeedback('Chapter updated and submitted for review.');
    } else {
      await contentService.createChapter(payload);
      showFeedback('Chapter created and submitted for review.');
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
      if (hierarchyChapter?._id === item._id) {
        setHierarchyChapter(null);
        setHierarchySubChapter(null);
      }
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
      showFeedback('Sub-Chapter updated and submitted for review.');
    } else {
      await contentService.createSubChapter(payload);
      showFeedback('Sub-Chapter created and submitted for review.');
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
      if (hierarchySubChapter?._id === item._id) {
        setHierarchySubChapter(null);
      }
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
      showFeedback('Medicine monograph updated and submitted for review.');
    } else {
      await contentService.createMedicine(payload);
      showFeedback('Medicine monograph created and submitted for review.');
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
      if (activeTab === 'hierarchy') {
        if (!hierarchyChapter) {
          const res = await contentService.getChapters({ limit: 2000, search: searchQuery });
          return res?.chapters || chapters;
        } else if (!hierarchySubChapter) {
          const res = await contentService.getSubChapters({
            limit: 2000,
            search: searchQuery,
            chapterId: hierarchyChapter._id,
          });
          return res?.subChapters || subChapters;
        } else {
          const res = await contentService.getMedicines({
            limit: 2000,
            search: searchQuery,
            chapterId: hierarchyChapter._id,
            subChapterId: hierarchySubChapter._id,
          });
          return res?.medicines || medicines;
        }
      }
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
    if (activeTab === 'chapters' || (activeTab === 'hierarchy' && !hierarchyChapter)) {
      return [
        { header: 'Order', key: 'order' },
        { header: 'Chapter No', key: 'chapterNumber' },
        { header: 'Chapter Title', key: 'title' },
        { header: 'Code', key: 'code' },
        { header: 'Sub-Chapters', key: 'subChaptersCount' },
        { header: 'Medicines', key: 'medicinesCount' },
        { header: 'Review Status', key: 'status' },
        { header: 'Status', key: 'isActive', format: (v) => (v ? 'Active' : 'Inactive') },
      ];
    }
    if (activeTab === 'subchapters' || (activeTab === 'hierarchy' && hierarchyChapter && !hierarchySubChapter)) {
      return [
        { header: 'Order', key: 'order' },
        { header: 'Sub-Chapter No', key: 'subChapterNumber' },
        { header: 'Title', key: 'title' },
        { header: 'Code', key: 'code' },
        { header: 'Parent Chapter', key: 'chapter', format: (c) => c?.title || '' },
        { header: 'Medicines', key: 'medicinesCount' },
        { header: 'Review Status', key: 'status' },
        { header: 'Status', key: 'isActive', format: (v) => (v ? 'Active' : 'Inactive') },
      ];
    }
    if (activeTab === 'medicines' || (activeTab === 'hierarchy' && hierarchyChapter && hierarchySubChapter)) {
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
        { header: 'Review Status', key: 'status' },
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

  // Reusable Workflow Status Badge with Reviewer Action Button
  const renderWorkflowStatusBadge = (item, type) => {
    const status = item.status || 'published';
    if (status === 'published') {
      return (
        <Badge
          variant="outline"
          className="text-[10px] font-bold uppercase gap-1 bg-emerald-50 text-emerald-800 border-emerald-300"
        >
          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
          Published
        </Badge>
      );
    }
    if (status === 'in_review') {
      return (
        <div className="inline-flex items-center gap-1.5">
          <Badge
            variant="outline"
            className="text-[10px] font-bold uppercase gap-1 border-amber-300 bg-amber-50 text-amber-800"
          >
            <Clock className="w-3 h-3 text-amber-600 animate-pulse" />
            In Review
          </Badge>
          {canApprove && (
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={(e) => {
                e.stopPropagation();
                openReviewModal(item, type);
              }}
              className="h-5 px-1.5 text-[10px] font-bold text-amber-900 border-amber-300 bg-amber-100/80 hover:bg-amber-200 rounded-md gap-0.5 cursor-pointer shadow-2xs"
              title="Review & Approve Content"
            >
              <ShieldCheck className="w-3 h-3 text-amber-700" />
              Review
            </Button>
          )}
        </div>
      );
    }
    if (status === 'draft') {
      return (
        <Badge
          variant="secondary"
          className="text-[10px] font-bold uppercase text-slate-600 bg-slate-100 border-slate-200"
        >
          Draft
        </Badge>
      );
    }
    return (
      <Badge variant="outline" className="text-[10px] uppercase text-slate-500">
        {status}
      </Badge>
    );
  };

  const renderMedicineSectionsRow = (med, colSpan = 7) => {
    if (!expandedMedicineIds.has(med._id)) return null;

    const medSections = Array.isArray(med.sections) ? med.sections : [];

    return (
      <TableRow key={`sections-${med._id}`} className="bg-amber-50/20 border-b-2 border-amber-200">
        <TableCell colSpan={colSpan} className="p-3.5 bg-slate-50/60">
          <div className="bg-white border border-amber-200/90 rounded-2xl p-4 shadow-2xs space-y-3.5">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-orange-100 text-orange-700 flex items-center justify-center font-bold shrink-0">
                  <Layers className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                    Sections of {med.name}
                    <Badge variant="outline" className="bg-amber-50 text-amber-900 border-amber-200 text-[10px] font-bold">
                      {medSections.length} Sections
                    </Badge>
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    Structured clinical monograph sections, headings, dosage tables, and indications.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {canEdit && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleOpenSectionsModal(med, null, true)}
                    className="h-7 text-xs px-2.5 rounded-xl border-orange-300 bg-orange-50 text-orange-800 hover:bg-orange-100 font-semibold gap-1.5 cursor-pointer shadow-2xs"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Section</span>
                  </Button>
                )}

                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => handleOpenSectionsModal(med)}
                  className="h-7 text-xs px-2.5 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 font-medium gap-1 cursor-pointer"
                >
                  <Layers className="w-3.5 h-3.5 text-slate-500" />
                  <span>Open Full Editor</span>
                </Button>
              </div>
            </div>

            {medSections.length === 0 ? (
              <div className="p-6 text-center bg-slate-50/70 rounded-xl border border-dashed border-slate-200 text-slate-500">
                <Layers className="w-8 h-8 text-slate-300 mx-auto mb-1.5" />
                <p className="text-xs font-semibold text-slate-700">No sections added to this monograph yet.</p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Add clinical sections like Indications, Dosage, Contraindications, Adverse Effects, etc.
                </p>
                {canEdit && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleOpenSectionsModal(med, null, true)}
                    className="mt-3 h-7 text-xs text-orange-700 border-orange-300 hover:bg-orange-50 font-semibold"
                  >
                    <Plus className="w-3.5 h-3.5 mr-1" /> Add First Section
                  </Button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                {medSections.map((sec, secIdx) => {
                  const hasLinkedTable = Boolean(sec.tableId);
                  const hasCustomTable = Boolean(
                    sec.customTable &&
                      Array.isArray(sec.customTable.headers) &&
                      sec.customTable.headers.length > 0
                  );

                  return (
                    <div
                      key={sec._id || sec.key || secIdx}
                      className="group p-3 rounded-xl border border-slate-200/90 bg-white hover:border-amber-300 hover:shadow-xs transition-all flex flex-col justify-between space-y-2.5"
                    >
                      <div className="space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <span className="w-5 h-5 rounded-md bg-amber-100 text-amber-900 text-[10px] font-bold flex items-center justify-center shrink-0">
                              {sec.order ?? secIdx + 1}
                            </span>
                            <span
                              className="text-xs font-bold text-slate-900 truncate"
                              title={sec.title || sec.label}
                            >
                              {sec.title || sec.label || 'Untitled Section'}
                            </span>
                          </div>

                          {canEdit && (
                            <div className="flex items-center gap-1 shrink-0 opacity-80 group-hover:opacity-100">
                              <button
                                type="button"
                                onClick={() => handleOpenSectionsModal(med, sec._id || sec.key, false)}
                                className="p-1 text-slate-400 hover:text-orange-600 rounded cursor-pointer transition-colors"
                                title="Edit Section"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteSectionDirect(med, sec)}
                                className="p-1 text-slate-400 hover:text-red-600 rounded cursor-pointer transition-colors"
                                title="Delete Section"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          )}
                        </div>

                        <div className="flex flex-wrap items-center gap-1.5">
                          {sec.pageNumber && (
                            <Badge
                              variant="outline"
                              className="text-[9px] font-medium px-1.5 py-0 bg-slate-50 text-slate-600 border-slate-200"
                            >
                              p. {sec.pageNumber}
                            </Badge>
                          )}
                          {sec.key && (
                            <Badge
                              variant="outline"
                              className="text-[9px] font-mono px-1.5 py-0 bg-purple-50 text-purple-700 border-purple-200"
                            >
                              {sec.key}
                            </Badge>
                          )}
                          {(hasLinkedTable || hasCustomTable) && (
                            <Badge
                              variant="outline"
                              className="text-[9px] font-semibold px-1.5 py-0 bg-blue-50 text-blue-700 border-blue-200 gap-0.5"
                            >
                              <TableIcon className="w-2.5 h-2.5" /> Table
                            </Badge>
                          )}
                        </div>

                        <p className="text-[11px] text-slate-600 line-clamp-3 leading-relaxed">
                          {sec.content || sec.text || (
                            <span className="italic text-slate-400">No content text entered.</span>
                          )}
                        </p>
                      </div>

                      {canEdit && (
                        <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
                          <button
                            type="button"
                            onClick={() => handleOpenSectionsModal(med, sec._id || sec.key, false)}
                            className="text-orange-700 hover:text-orange-800 font-semibold inline-flex items-center gap-1 cursor-pointer"
                          >
                            <Edit2 className="w-3 h-3" /> Edit Section
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteSectionDirect(med, sec)}
                            className="text-slate-400 hover:text-red-600 font-medium inline-flex items-center gap-1 cursor-pointer"
                          >
                            <Trash2 className="w-3 h-3" /> Delete
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </TableCell>
      </TableRow>
    );
  };

  return (
    <PageContainer>
      <PageHeader
        title="Content & Formulary"
        subtitle="Hierarchical Formulary management (Chapter → Sub-Chapter → Monograph) with reviewer workflow approval."
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

        {/* Dynamic Add Buttons */}
        {canAdd && (
          <>
            {activeTab === 'hierarchy' && !hierarchyChapter && (
              <Button
                variant="nfiYellow"
                size="sm"
                onClick={() => {
                  setEditingChapter(null);
                  setIsChapterModalOpen(true);
                }}
                className="rounded-xl text-xs font-bold shadow-2xs cursor-pointer"
              >
                <Plus className="w-4 h-4 mr-1.5" />
                Add Chapter
              </Button>
            )}

            {activeTab === 'hierarchy' && hierarchyChapter && !hierarchySubChapter && (
              <Button
                variant="nfiYellow"
                size="sm"
                onClick={() => {
                  setEditingSubChapter(null);
                  setIsSubChapterModalOpen(true);
                }}
                className="rounded-xl text-xs font-bold shadow-2xs cursor-pointer"
              >
                <Plus className="w-4 h-4 mr-1.5" />
                Add Sub-Chapter
              </Button>
            )}

            {activeTab === 'hierarchy' && hierarchyChapter && hierarchySubChapter && (
              <Button
                variant="nfiYellow"
                size="sm"
                onClick={() => {
                  setEditingMedicine(null);
                  setIsMedicineModalOpen(true);
                }}
                className="rounded-xl text-xs font-bold shadow-2xs cursor-pointer"
              >
                <Plus className="w-4 h-4 mr-1.5" />
                Add Monograph
              </Button>
            )}

            {activeTab === 'chapters' && (
              <Button
                variant="nfiYellow"
                size="sm"
                onClick={() => {
                  setEditingChapter(null);
                  setIsChapterModalOpen(true);
                }}
                className="rounded-xl text-xs font-bold shadow-2xs cursor-pointer"
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
                className="rounded-xl text-xs font-bold shadow-2xs cursor-pointer"
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
                className="rounded-xl text-xs font-bold shadow-2xs cursor-pointer"
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
                className="rounded-xl text-xs font-bold shadow-2xs cursor-pointer"
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

      {/* KPI Stats Row with Pending Review Counter */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <StatCard
          title="Chapters"
          value={stats.totalChapters}
          subtitle={`${stats.activeChapters} active (${stats.inReviewChapters || 0} in review)`}
          icon={BookOpen}
        />
        <StatCard
          title="Sub-Chapters"
          value={stats.totalSubChapters}
          subtitle={`Therapeutic classes (${stats.inReviewSubChapters || 0} in review)`}
          icon={FolderTree}
        />
        <StatCard
          title="Monographs"
          value={stats.totalMedicines}
          subtitle={`${stats.publishedMedicines} live (${stats.inReviewMedicines || 0} in review)`}
          icon={Pill}
        />
        <StatCard
          title="Pending Approval"
          value={stats.totalPendingReview || 0}
          subtitle="Awaiting reviewer sign-off"
          icon={Clock}
          className={stats.totalPendingReview > 0 ? 'border-amber-300 bg-amber-50/40' : ''}
        />
        <StatCard
          title="Clinical Tables"
          value={stats.totalTables}
          subtitle="Dosage grids & references"
          icon={TableIcon}
        />
      </div>

      {/* Navigation Tabs */}
      <div className="flex flex-wrap items-center gap-2 p-1 bg-slate-100/80 rounded-2xl border border-slate-200/80 w-fit text-xs font-bold">
        <button
          type="button"
          onClick={() => handleTabChange('hierarchy')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all cursor-pointer ${
            activeTab === 'hierarchy'
              ? 'bg-white text-orange-600 shadow-xs ring-1 ring-orange-200'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <FolderTree className="w-4 h-4 text-orange-600" />
          <span>Hierarchy Flow (Chapter → Sub-Chapter → Monograph)</span>
        </button>

        <button
          type="button"
          onClick={() => handleTabChange('medicines')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all cursor-pointer ${
            activeTab === 'medicines'
              ? 'bg-white text-orange-600 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Pill className="w-4 h-4" />
          <span>All Monographs ({stats.totalMedicines})</span>
        </button>

        <button
          type="button"
          onClick={() => handleTabChange('chapters')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all cursor-pointer ${
            activeTab === 'chapters'
              ? 'bg-white text-orange-600 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>All Chapters ({stats.totalChapters})</span>
        </button>

        <button
          type="button"
          onClick={() => handleTabChange('subchapters')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all cursor-pointer ${
            activeTab === 'subchapters'
              ? 'bg-white text-orange-600 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <FolderOpen className="w-4 h-4" />
          <span>All Sub-Chapters ({stats.totalSubChapters})</span>
        </button>

        <button
          type="button"
          onClick={() => handleTabChange('tables')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all cursor-pointer ${
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
              placeholder={
                activeTab === 'hierarchy'
                  ? hierarchySubChapter
                    ? 'Search monographs in sub-chapter...'
                    : hierarchyChapter
                    ? 'Search sub-chapters in chapter...'
                    : 'Search formulary chapters...'
                  : `Search ${activeTab}...`
              }
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 bg-slate-50/50 focus:outline-hidden focus:bg-white focus:ring-2 focus:ring-[#FFD243]"
            />
          </div>

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
            <option value="published">Published Live</option>
            <option value="in_review">In Review (Awaiting Approval)</option>
            <option value="draft">Draft Authoring</option>
            <option value="active">Active Only</option>
            <option value="inactive">Inactive Only</option>
          </select>

          {/* Flat Views Filters */}
          {activeTab === 'subchapters' && (
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

          {activeTab === 'medicines' && (
            <>
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

              {selectedChapterFilter !== 'all' && (
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
            </>
          )}
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={fetchData}
          className="rounded-xl text-xs h-8 text-slate-500 hover:text-slate-800 cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5 mr-1" />
          Refresh
        </Button>
      </div>

      {/* ========================================================================= */}
      {/* VIEW MODE: HIERARCHY FLOW (CHAPTER -> SUB-CHAPTER -> MONOGRAPH) */}
      {/* ========================================================================= */}
      {activeTab === 'hierarchy' && (
        <div className="space-y-4">
          {/* Breadcrumb Navigation Trail */}
          <div className="flex flex-wrap items-center gap-2 p-3 bg-amber-50/40 border border-amber-200/80 rounded-2xl text-xs font-semibold">
            <button
              type="button"
              onClick={() => {
                setHierarchyChapter(null);
                setHierarchySubChapter(null);
                setCurrentPage(1);
              }}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                !hierarchyChapter
                  ? 'bg-amber-400 text-amber-950 font-bold shadow-2xs'
                  : 'text-slate-600 hover:bg-amber-100 hover:text-slate-900'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5 text-amber-700" />
              <span>1. All Chapters</span>
            </button>

            <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />

            <button
              type="button"
              disabled={!hierarchyChapter}
              onClick={() => {
                if (hierarchyChapter) {
                  setHierarchySubChapter(null);
                  setCurrentPage(1);
                }
              }}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg transition-all ${
                !hierarchyChapter
                  ? 'text-slate-400 cursor-not-allowed'
                  : hierarchyChapter && !hierarchySubChapter
                  ? 'bg-amber-400 text-amber-950 font-bold shadow-2xs cursor-pointer'
                  : 'text-slate-600 hover:bg-amber-100 hover:text-slate-900 cursor-pointer'
              }`}
            >
              <FolderTree className="w-3.5 h-3.5 text-amber-700" />
              <span>
                2.{' '}
                {hierarchyChapter
                  ? `${hierarchyChapter.chapterNumber ? hierarchyChapter.chapterNumber + ': ' : ''}${hierarchyChapter.title}`
                  : 'Select Chapter'}
              </span>
            </button>

            <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />

            <div
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg ${
                hierarchySubChapter
                  ? 'bg-amber-400 text-amber-950 font-bold shadow-2xs'
                  : 'text-slate-400'
              }`}
            >
              <Pill className="w-3.5 h-3.5 text-orange-600" />
              <span>
                {hierarchySubChapter
                  ? hierarchySubChapter.isDirect
                    ? '3. Direct Monographs'
                    : `3. ${hierarchySubChapter.subChapterNumber ? hierarchySubChapter.subChapterNumber + ': ' : ''}${hierarchySubChapter.title}`
                  : '3. Select Sub-Chapter (Monographs)'}
              </span>
            </div>
          </div>

          {/* LEVEL 1: CHAPTERS LIST */}
          {!hierarchyChapter && (
            <AdminTableWrapper
              loading={loading}
              error={error}
              totalItems={totalItems}
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
              emptyMessage="No formulary chapters found."
            >
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12 text-center">Order</TableHead>
                    <TableHead>Chapter No / Code</TableHead>
                    <TableHead>Title & Overview</TableHead>
                    <TableHead className="text-center">Sub-Chapters</TableHead>
                    <TableHead className="text-center">Monographs</TableHead>
                    <TableHead className="text-center">Review Workflow</TableHead>
                    <TableHead className="text-center">Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {chapters.map((ch) => (
                    <TableRow key={ch._id} className="hover:bg-amber-50/30">
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
                        <Badge variant="secondary" className="font-semibold text-xs bg-slate-100">
                          {ch.subChaptersCount ?? 0} sub-chapters
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="secondary" className="font-semibold text-xs bg-amber-50 text-amber-900 border-amber-200">
                          {ch.medicinesCount ?? 0} monographs
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        {renderWorkflowStatusBadge(ch, 'chapter')}
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
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            type="button"
                            variant="default"
                            size="sm"
                            onClick={() => {
                              setHierarchyChapter(ch);
                              setHierarchySubChapter(null);
                              setCurrentPage(1);
                              setSearchQuery('');
                            }}
                            className="h-7 px-2 text-[11px] font-bold rounded-lg bg-orange-600 hover:bg-orange-700 text-white gap-1 cursor-pointer shadow-2xs"
                            title="Explore Sub-Chapters in this Chapter"
                          >
                            <span>Explore</span>
                            <ChevronRight className="w-3.5 h-3.5" />
                          </Button>

                          {canEdit && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setEditingChapter(ch);
                                setIsChapterModalOpen(true);
                              }}
                              className="h-7 w-7 p-0 text-slate-500 hover:text-orange-600 rounded-lg cursor-pointer"
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
                              className="h-7 w-7 p-0 text-slate-500 hover:text-red-600 rounded-lg cursor-pointer"
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

          {/* LEVEL 2: SUB-CHAPTERS INSIDE SELECTED CHAPTER */}
          {hierarchyChapter && !hierarchySubChapter && (
            <div className="space-y-4">
              {/* Selected Chapter Header Card */}
              <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-2xs flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setHierarchyChapter(null);
                      setHierarchySubChapter(null);
                      setCurrentPage(1);
                    }}
                    className="h-8 px-2.5 rounded-xl text-xs font-semibold gap-1.5 cursor-pointer"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    Back to Chapters
                  </Button>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 text-sm">
                        {hierarchyChapter.chapterNumber ? `${hierarchyChapter.chapterNumber}: ` : ''}
                        {hierarchyChapter.title}
                      </span>
                      <Badge variant="outline" className="font-mono text-[10px]">
                        {hierarchyChapter.code}
                      </Badge>
                      {renderWorkflowStatusBadge(hierarchyChapter, 'chapter')}
                    </div>
                    {hierarchyChapter.description && (
                      <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">
                        {hierarchyChapter.description}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {hierarchyChapter.medicinesCount > 0 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setHierarchySubChapter({
                          _id: '',
                          title: `All Monographs in ${hierarchyChapter.title}`,
                          subChapterNumber: hierarchyChapter.chapterNumber,
                          isDirect: true,
                        });
                        setCurrentPage(1);
                        setSearchQuery('');
                      }}
                      className="rounded-xl text-xs h-8 cursor-pointer border-amber-300 text-amber-900 bg-amber-50 hover:bg-amber-100 gap-1.5 font-semibold"
                    >
                      <Pill className="w-3.5 h-3.5 text-orange-600" />
                      <span>Chapter Monographs ({hierarchyChapter.medicinesCount})</span>
                    </Button>
                  )}
                  {canEdit && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setEditingChapter(hierarchyChapter);
                        setIsChapterModalOpen(true);
                      }}
                      className="rounded-xl text-xs h-8 cursor-pointer"
                    >
                      <Edit2 className="w-3.5 h-3.5 mr-1" />
                      Edit Chapter
                    </Button>
                  )}
                  {canAdd && (
                    <Button
                      variant="nfiYellow"
                      size="sm"
                      onClick={() => {
                        setEditingSubChapter(null);
                        setIsSubChapterModalOpen(true);
                      }}
                      className="rounded-xl text-xs font-bold shadow-2xs cursor-pointer"
                    >
                      <Plus className="w-4 h-4 mr-1.5" />
                      Add Sub-Chapter
                    </Button>
                  )}
                </div>
              </div>

              {/* Notice if chapter has 0 sub-chapters but direct monographs */}
              {subChapters.length === 0 && !loading && (
                <div className="p-4 bg-amber-50/80 border border-amber-200 rounded-2xl flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-amber-200/60 flex items-center justify-center shrink-0">
                      <Pill className="w-5 h-5 text-amber-800" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-800">
                        {hierarchyChapter.medicinesCount > 0
                          ? 'This Chapter Contains Direct Monographs'
                          : 'No Sub-Chapters Found'}
                      </p>
                      <p className="text-[11px] text-slate-600">
                        {hierarchyChapter.medicinesCount > 0
                          ? `This chapter contains ${hierarchyChapter.medicinesCount} drug monograph(s) directly assigned without sub-chapters.`
                          : 'You can create a sub-chapter or add monographs to this chapter directly.'}
                      </p>
                    </div>
                  </div>
                  {hierarchyChapter.medicinesCount > 0 && (
                    <Button
                      variant="nfiYellow"
                      size="sm"
                      onClick={() => {
                        setHierarchySubChapter({
                          _id: '',
                          title: `All Monographs in ${hierarchyChapter.title}`,
                          subChapterNumber: hierarchyChapter.chapterNumber,
                          isDirect: true,
                        });
                        setCurrentPage(1);
                        setSearchQuery('');
                      }}
                      className="rounded-xl text-xs font-bold h-8 cursor-pointer shadow-2xs gap-1.5"
                    >
                      <span>Explore {hierarchyChapter.medicinesCount} Direct Monographs</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </Button>
                  )}
                </div>
              )}

              {/* Sub-Chapters Table */}
              <AdminTableWrapper
                loading={loading}
                error={error}
                totalItems={totalItems}
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
                emptyMessage={`No sub-chapters found in chapter "${hierarchyChapter.title}". Click "Add Sub-Chapter" above to create one.`}
              >
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12 text-center">Order</TableHead>
                      <TableHead>Sub-Chapter No / Code</TableHead>
                      <TableHead>Title & Overview</TableHead>
                      <TableHead className="text-center">Monographs</TableHead>
                      <TableHead className="text-center">Review Workflow</TableHead>
                      <TableHead className="text-center">Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {subChapters.map((sub) => (
                      <TableRow key={sub._id} className="hover:bg-amber-50/30">
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
                        <TableCell className="text-center">
                          <Badge variant="secondary" className="font-semibold text-xs bg-amber-50 text-amber-900 border-amber-200">
                            {sub.medicinesCount ?? 0} monographs
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          {renderWorkflowStatusBadge(sub, 'subchapter')}
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
                          <div className="flex items-center justify-end gap-1.5">
                            <Button
                              type="button"
                              variant="default"
                              size="sm"
                              onClick={() => {
                                setHierarchySubChapter(sub);
                                setCurrentPage(1);
                                setSearchQuery('');
                              }}
                              className="h-7 px-2 text-[11px] font-bold rounded-lg bg-orange-600 hover:bg-orange-700 text-white gap-1 cursor-pointer shadow-2xs"
                              title="Explore Drug Monographs in this Sub-Chapter"
                            >
                              <span>Explore Monographs</span>
                              <ChevronRight className="w-3.5 h-3.5" />
                            </Button>

                            {canEdit && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setEditingSubChapter(sub);
                                  setIsSubChapterModalOpen(true);
                                }}
                                className="h-7 w-7 p-0 text-slate-500 hover:text-orange-600 rounded-lg cursor-pointer"
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
                                className="h-7 w-7 p-0 text-slate-500 hover:text-red-600 rounded-lg cursor-pointer"
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
            </div>
          )}

          {/* LEVEL 3: MONOGRAPHS INSIDE SELECTED SUB-CHAPTER */}
          {hierarchyChapter && hierarchySubChapter && (
            <div className="space-y-4">
              {/* Selected Sub-Chapter Header Card */}
              <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-2xs flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setHierarchySubChapter(null);
                      setCurrentPage(1);
                    }}
                    className="h-8 px-2.5 rounded-xl text-xs font-semibold gap-1.5 cursor-pointer"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    {hierarchySubChapter.isDirect ? 'Back to Chapter' : 'Back to Sub-Chapters'}
                  </Button>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 text-sm">
                        {hierarchySubChapter.subChapterNumber ? `${hierarchySubChapter.subChapterNumber}: ` : ''}
                        {hierarchySubChapter.title}
                      </span>
                      {hierarchySubChapter.code && (
                        <Badge variant="outline" className="font-mono text-[10px]">
                          {hierarchySubChapter.code}
                        </Badge>
                      )}
                      {!hierarchySubChapter.isDirect && renderWorkflowStatusBadge(hierarchySubChapter, 'subchapter')}
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Parent Chapter: <span className="font-semibold">{hierarchyChapter.title}</span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {canEdit && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setEditingSubChapter(hierarchySubChapter);
                        setIsSubChapterModalOpen(true);
                      }}
                      className="rounded-xl text-xs h-8 cursor-pointer"
                    >
                      <Edit2 className="w-3.5 h-3.5 mr-1" />
                      Edit Sub-Chapter
                    </Button>
                  )}
                  {canAdd && (
                    <Button
                      variant="nfiYellow"
                      size="sm"
                      onClick={() => {
                        setEditingMedicine(null);
                        setIsMedicineModalOpen(true);
                      }}
                      className="rounded-xl text-xs font-bold shadow-2xs cursor-pointer"
                    >
                      <Plus className="w-4 h-4 mr-1.5" />
                      Add Monograph
                    </Button>
                  )}
                </div>
              </div>

              {/* Monographs Table */}
              <AdminTableWrapper
                loading={loading}
                error={error}
                totalItems={totalItems}
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
                emptyMessage={`No drug monographs found inside "${hierarchySubChapter.title}". Click "Add Monograph" above to create one.`}
              >
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Generic / Monograph Name</TableHead>
                      <TableHead>Form & Strength</TableHead>
                      <TableHead>Schedule / ATC</TableHead>
                      <TableHead className="text-center">Sections & Tables</TableHead>
                      <TableHead className="text-center">Review Workflow</TableHead>
                      <TableHead className="text-center">Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {medicines.map((med) => (
                      <React.Fragment key={med._id}>
                        <TableRow
                          className={`hover:bg-amber-50/30 transition-colors ${
                            expandedMedicineIds.has(med._id) ? 'bg-amber-50/20' : ''
                          }`}
                        >
                          <TableCell>
                            <div className="flex items-start gap-2">
                              <button
                                type="button"
                                onClick={() => toggleExpandMedicine(med._id)}
                                className="p-1 rounded-md text-slate-400 hover:text-amber-800 hover:bg-amber-100/60 cursor-pointer transition-colors mt-0.5 shrink-0"
                                title={expandedMedicineIds.has(med._id) ? 'Collapse Sections' : 'Expand Sections'}
                              >
                                {expandedMedicineIds.has(med._id) ? (
                                  <ChevronDown className="w-4 h-4 text-orange-600" />
                                ) : (
                                  <ChevronRight className="w-4 h-4" />
                                )}
                              </button>
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
                                onClick={() => toggleExpandMedicine(med._id)}
                                className={`h-7 text-[11px] px-2.5 rounded-xl border-amber-300 font-bold gap-1 shadow-2xs cursor-pointer ${
                                  expandedMedicineIds.has(med._id)
                                    ? 'bg-amber-100 text-amber-950 border-orange-400'
                                    : 'bg-amber-50/60 text-amber-900 hover:bg-amber-100'
                                }`}
                                title={expandedMedicineIds.has(med._id) ? 'Hide sections' : 'Show sections inline'}
                              >
                                <Layers className="w-3.5 h-3.5 text-orange-600" />
                                <span>{med.sectionsCount ?? (med.sections?.length || 0)} Sections</span>
                                {expandedMedicineIds.has(med._id) ? (
                                  <ChevronDown className="w-3 h-3 ml-0.5 text-orange-600" />
                                ) : (
                                  <ChevronRight className="w-3 h-3 ml-0.5 text-slate-400" />
                                )}
                              </Button>

                              <button
                                type="button"
                                onClick={() => handleOpenSectionsModal(med)}
                                className="text-[10px] text-slate-500 hover:text-orange-700 underline font-medium cursor-pointer"
                                title="Open sections in modal"
                              >
                                Manage in Modal
                              </button>
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            {renderWorkflowStatusBadge(med, 'medicine')}
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
                                className="h-7 w-7 p-0 text-slate-500 hover:text-amber-700 rounded-lg cursor-pointer"
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
                                  className="h-7 w-7 p-0 text-slate-500 hover:text-orange-600 rounded-lg cursor-pointer"
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
                                  className="h-7 w-7 p-0 text-slate-500 hover:text-red-600 rounded-lg cursor-pointer"
                                  title="Delete Medicine"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                        {renderMedicineSectionsRow(med, 7)}
                      </React.Fragment>
                    ))}
                  </TableBody>
                </Table>
              </AdminTableWrapper>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* FLAT TAB: CHAPTERS TABLE */}
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
                <TableHead className="text-center">Review Workflow</TableHead>
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
                    {renderWorkflowStatusBadge(ch, 'chapter')}
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
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setActiveTab('hierarchy');
                          setHierarchyChapter(ch);
                          setHierarchySubChapter(null);
                        }}
                        className="h-7 px-2 text-[11px] text-orange-600 hover:text-orange-700 hover:bg-orange-50 font-bold gap-0.5 cursor-pointer"
                        title="Explore in Hierarchy"
                      >
                        <span>Explore</span>
                        <ChevronRight className="w-3 h-3" />
                      </Button>

                      {canEdit && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setEditingChapter(ch);
                            setIsChapterModalOpen(true);
                          }}
                          className="h-7 w-7 p-0 text-slate-500 hover:text-orange-600 rounded-lg cursor-pointer"
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
                          className="h-7 w-7 p-0 text-slate-500 hover:text-red-600 rounded-lg cursor-pointer"
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
      {/* FLAT TAB: SUB-CHAPTERS TABLE */}
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
                <TableHead className="text-center">Review Workflow</TableHead>
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
                    {renderWorkflowStatusBadge(sub, 'subchapter')}
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
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setActiveTab('hierarchy');
                          if (sub.chapter) {
                            setHierarchyChapter(sub.chapter);
                            setHierarchySubChapter(sub);
                          }
                        }}
                        className="h-7 px-2 text-[11px] text-orange-600 hover:text-orange-700 hover:bg-orange-50 font-bold gap-0.5 cursor-pointer"
                        title="Explore in Hierarchy"
                      >
                        <span>Explore</span>
                        <ChevronRight className="w-3 h-3" />
                      </Button>

                      {canEdit && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setEditingSubChapter(sub);
                            setIsSubChapterModalOpen(true);
                          }}
                          className="h-7 w-7 p-0 text-slate-500 hover:text-orange-600 rounded-lg cursor-pointer"
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
                          className="h-7 w-7 p-0 text-slate-500 hover:text-red-600 rounded-lg cursor-pointer"
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
      {/* FLAT TAB: MEDICINES / DRUG MONOGRAPHS TABLE */}
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
                <TableHead className="text-center">Review Workflow</TableHead>
                <TableHead className="text-center">Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {medicines.map((med) => (
                <React.Fragment key={med._id}>
                  <TableRow
                    className={`hover:bg-slate-50/70 transition-colors ${
                      expandedMedicineIds.has(med._id) ? 'bg-amber-50/20' : ''
                    }`}
                  >
                    <TableCell>
                      <div className="flex items-start gap-2">
                        <button
                          type="button"
                          onClick={() => toggleExpandMedicine(med._id)}
                          className="p-1 rounded-md text-slate-400 hover:text-amber-800 hover:bg-amber-100/60 cursor-pointer transition-colors mt-0.5 shrink-0"
                          title={expandedMedicineIds.has(med._id) ? 'Collapse Sections' : 'Expand Sections'}
                        >
                          {expandedMedicineIds.has(med._id) ? (
                            <ChevronDown className="w-4 h-4 text-orange-600" />
                          ) : (
                            <ChevronRight className="w-4 h-4" />
                          )}
                        </button>
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
                          onClick={() => toggleExpandMedicine(med._id)}
                          className={`h-7 text-[11px] px-2.5 rounded-xl border-amber-300 font-bold gap-1 shadow-2xs cursor-pointer ${
                            expandedMedicineIds.has(med._id)
                              ? 'bg-amber-100 text-amber-950 border-orange-400'
                              : 'bg-amber-50/60 text-amber-900 hover:bg-amber-100'
                          }`}
                          title={expandedMedicineIds.has(med._id) ? 'Hide sections' : 'Show sections inline'}
                        >
                          <Layers className="w-3.5 h-3.5 text-orange-600" />
                          <span>{med.sectionsCount ?? (med.sections?.length || 0)} Sections</span>
                          {expandedMedicineIds.has(med._id) ? (
                            <ChevronDown className="w-3 h-3 ml-0.5 text-orange-600" />
                          ) : (
                            <ChevronRight className="w-3 h-3 ml-0.5 text-slate-400" />
                          )}
                        </Button>

                        <button
                          type="button"
                          onClick={() => handleOpenSectionsModal(med)}
                          className="text-[10px] text-slate-500 hover:text-orange-700 underline font-medium cursor-pointer"
                          title="Open sections in modal"
                        >
                          Manage in Modal
                        </button>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      {renderWorkflowStatusBadge(med, 'medicine')}
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
                          className="h-7 w-7 p-0 text-slate-500 hover:text-amber-700 rounded-lg cursor-pointer"
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
                            className="h-7 w-7 p-0 text-slate-500 hover:text-orange-600 rounded-lg cursor-pointer"
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
                            className="h-7 w-7 p-0 text-slate-500 hover:text-red-600 rounded-lg cursor-pointer"
                            title="Delete Medicine"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                  {renderMedicineSectionsRow(med, 8)}
                </React.Fragment>
              ))}
            </TableBody>
          </Table>
        </AdminTableWrapper>
      )}

      {/* ========================================================================= */}
      {/* FLAT TAB: CLINICAL TABLES MASTER TABLE */}
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
                    <Badge variant="outline" className="font-mono text-xs border-slate-300">
                      {tbl.tableCode}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-0.5 max-w-md">
                      <span className="font-bold text-slate-900 text-xs block">{tbl.title}</span>
                      {tbl.caption && (
                        <p className="text-[11px] text-slate-500 line-clamp-1 italic">
                          {tbl.caption}
                        </p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant="secondary" className="font-semibold text-xs">
                      {tbl.rows?.length || 0} rows × {tbl.headers?.length || 0} cols
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="text-[11px] text-slate-600 max-w-xs truncate mx-auto">
                      {tbl.headers?.join(' | ') || '-'}
                    </div>
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
                        className="h-7 w-7 p-0 text-slate-500 hover:text-amber-700 rounded-lg cursor-pointer"
                        title="Preview Table"
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
                          className="h-7 w-7 p-0 text-slate-500 hover:text-orange-600 rounded-lg cursor-pointer"
                          title="Edit Table"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </Button>
                      )}
                      {canDelete && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteTable(tbl)}
                          className="h-7 w-7 p-0 text-slate-500 hover:text-red-600 rounded-lg cursor-pointer"
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
      {/* MODALS */}
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
          selectedChapterId={
            hierarchyChapter
              ? hierarchyChapter._id
              : selectedChapterFilter !== 'all'
              ? selectedChapterFilter
              : ''
          }
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
          selectedChapterId={
            hierarchyChapter
              ? hierarchyChapter._id
              : selectedChapterFilter !== 'all'
              ? selectedChapterFilter
              : ''
          }
          selectedSubChapterId={
            hierarchySubChapter
              ? hierarchySubChapter._id
              : selectedSubChapterFilter !== 'all'
              ? selectedSubChapterFilter
              : ''
          }
          onSuccess={handleSaveMedicine}
        />
      )}

      {sectionsMedicine && (
        <MedicineSectionsModal
          isOpen={!!sectionsMedicine}
          onClose={() => {
            setSectionsMedicine(null);
            setSectionsModalInitialSectionId(null);
            setSectionsModalInitialAddMode(false);
          }}
          medicine={sectionsMedicine}
          initialSectionId={sectionsModalInitialSectionId}
          initialAddMode={sectionsModalInitialAddMode}
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

      {isReviewModalOpen && (
        <ReviewContentModal
          isOpen={isReviewModalOpen}
          onClose={() => {
            setIsReviewModalOpen(false);
            setReviewingItem(null);
          }}
          item={reviewingItem}
          itemType={reviewingItemType}
          onSuccess={(msg) => {
            showFeedback(msg || 'Review decision recorded successfully.');
            fetchData();
            fetchStats();
            fetchDropdownChapters();
          }}
        />
      )}
    </PageContainer>
  );
};

export default ContentPage;
