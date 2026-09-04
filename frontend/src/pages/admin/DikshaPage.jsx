import React, { useState, useEffect, useCallback } from 'react';
import {
  BookOpen,
  GraduationCap,
  Users,
  Award,
  TrendingUp,
  Plus,
  Search,
  Filter,
  RefreshCw,
  Eye,
  Edit,
  Trash2,
  Video,
  FileQuestion,
  DollarSign,
  Download,
  CheckCircle2,
  AlertCircle,
  PlayCircle,
  ExternalLink,
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

import dikshaService from '../../services/diksha.service';
import PermissionGuard from '../../components/admin/common/PermissionGuard';

// Modals
import CreateEditCourseModal from '../../components/admin/diksha/CreateEditCourseModal';
import CourseDetailsModal from '../../components/admin/diksha/CourseDetailsModal';
import CourseEnrollmentsModal from '../../components/admin/diksha/CourseEnrollmentsModal';

const CATEGORIES = [
  { id: 'all', label: 'All Categories' },
  { id: 'NFI_ORIENTATION', label: 'NFI Orientation & Basics' },
  { id: 'PHARMACOVIGILANCE', label: 'Pharmacovigilance (PvPI)' },
  { id: 'CLINICAL_PRACTICE', label: 'Clinical Pharmacology' },
  { id: 'MEDICATION_SAFETY', label: 'Medication Safety & LASA' },
  { id: 'DRUG_REGULATORY', label: 'Regulatory Standards' },
  { id: 'PATIENT_COUNSELING', label: 'Patient Counseling' },
  { id: 'OTHER', label: 'General / Special Topics' },
];

export const DikshaPage = () => {
  const [stats, setStats] = useState({
    totalCourses: 0,
    publishedCourses: 0,
    draftCourses: 0,
    totalEnrolled: 0,
    totalCompleted: 0,
    completionRate: 0,
    totalRevenue: 0,
    avgScore: 0,
  });

  const [activeTab, setActiveTab] = useState('catalogue'); // 'catalogue' | 'enrollments' | 'analytics'
  const [courses, setCourses] = useState([]);
  const [enrollments, setEnrollments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedPricing, setSelectedPricing] = useState('all');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  // Modals state
  const [isCreateEditOpen, setIsCreateEditOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState(null);
  const [viewingCourse, setViewingCourse] = useState(null);
  const [enrolledModalCourse, setEnrolledModalCourse] = useState(null);

  // Fetch KPI Stats
  const fetchStats = async () => {
    try {
      const res = await dikshaService.getStats();
      if (res && res.stats) setStats(res.stats);
    } catch (err) {
      console.warn('Failed to load DIKSHA stats:', err.message);
    }
  };

  // Fetch Courses
  const fetchCourses = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await dikshaService.getCourses({
        page: currentPage,
        limit: 10,
        search: searchQuery,
        category: selectedCategory,
        status: selectedStatus,
        pricing: selectedPricing,
      });

      if (res && res.courses) {
        setCourses(res.courses);
        setTotalPages(res.pagination?.totalPages || 1);
        setTotalItems(res.pagination?.total || 0);
      }
    } catch (err) {
      setError(err.message || 'Failed to load DIKSHA courses.');
    } finally {
      setLoading(false);
    }
  }, [currentPage, searchQuery, selectedCategory, selectedStatus, selectedPricing]);

  // Fetch Global Enrollments (for tab 2)
  const fetchEnrollments = useCallback(async () => {
    try {
      const res = await dikshaService.getEnrollments({ limit: 50 });
      if (res && res.enrollments) {
        setEnrollments(res.enrollments);
      }
    } catch (err) {
      console.warn('Failed to load global enrollments:', err);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, []);

  useEffect(() => {
    if (activeTab === 'catalogue') {
      fetchCourses();
    } else if (activeTab === 'enrollments') {
      fetchEnrollments();
    }
  }, [activeTab, fetchCourses, fetchEnrollments]);

  // Save Course Handler (Create or Update)
  const handleSaveCourse = async (formData) => {
    if (editingCourse) {
      await dikshaService.updateCourse(editingCourse._id, formData);
    } else {
      await dikshaService.createCourse(formData);
    }
    fetchStats();
    fetchCourses();
  };

  // Status Toggle Handler
  const handleToggleStatus = async (courseId, newStatus) => {
    try {
      await dikshaService.toggleStatus(courseId, newStatus);
      fetchStats();
      fetchCourses();
    } catch (err) {
      alert(err.message || 'Failed to update course status.');
    }
  };

  // Delete Course Handler
  const handleDeleteCourse = async (course) => {
    if (!window.confirm(`Are you sure you want to delete course "${course.title}" (${course.code})? This will also remove associated learner records.`)) {
      return;
    }

    try {
      await dikshaService.deleteCourse(course._id);
      fetchStats();
      fetchCourses();
    } catch (err) {
      alert(err.message || 'Failed to delete course.');
    }
  };

  return (
    <PageContainer>
      {/* Page Header */}
      <PageHeader
        title="DIKSHA Programme · Digital LMS & Certification"
        subtitle="Digital Initiative for Knowledge & Skill Enhancement of Healthcare Associates · IPC Clinical Learning Management System"
      >
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            fetchStats();
            if (activeTab === 'catalogue') fetchCourses();
            else fetchEnrollments();
          }}
          className="rounded-xl text-xs font-semibold cursor-pointer"
          title="Refresh data"
        >
          <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </Button>

        <PermissionGuard module="INTEGRATED" section="DIKSHA" action="CREATE">
          <Button
            variant="nfiYellow"
            size="sm"
            onClick={() => {
              setEditingCourse(null);
              setIsCreateEditOpen(true);
            }}
            className="rounded-xl text-xs font-bold shadow-2xs cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 mr-1" />
            <span>Create New Course</span>
          </Button>
        </PermissionGuard>
      </PageHeader>

      {/* 5 KPI Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
        <StatCard
          title="Total Courses"
          value={stats.totalCourses}
          subtitle={`${stats.publishedCourses} live on portal`}
          icon={BookOpen}
          iconColor="text-[#284661]"
          iconBg="bg-blue-50"
        />

        <StatCard
          title="Enrolled Learners"
          value={stats.totalEnrolled}
          subtitle="Healthcare professionals"
          icon={Users}
          iconColor="text-sky-600"
          iconBg="bg-sky-50"
        />

        <StatCard
          title="Certifications Issued"
          value={stats.totalCompleted}
          subtitle={`${stats.completionRate}% completion rate`}
          icon={Award}
          iconColor="text-emerald-600"
          iconBg="bg-emerald-50"
        />

        <StatCard
          title="Avg Assessment Score"
          value={`${stats.avgScore}%`}
          subtitle="Passing benchmark: 70%"
          icon={GraduationCap}
          iconColor="text-purple-600"
          iconBg="bg-purple-50"
        />

        <StatCard
          title="Commercial Revenue"
          value={`₹${(stats.totalRevenue || 0).toLocaleString('en-IN')}`}
          subtitle="Course enrollments"
          icon={TrendingUp}
          iconColor="text-[#E76120]"
          iconBg="bg-[#FFF5EE]"
        />
      </div>

      {/* Segmented Tab Navigation */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-1">
        <button
          type="button"
          onClick={() => setActiveTab('catalogue')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'catalogue'
              ? 'bg-[#284661] text-white shadow-2xs'
              : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200/80'
          }`}
        >
          <BookOpen className="w-3.5 h-3.5" />
          <span>Course Catalogue ({stats.totalCourses})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('enrollments')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'enrollments'
              ? 'bg-[#284661] text-white shadow-2xs'
              : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200/80'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>Learner Enrollments ({stats.totalEnrolled})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('analytics')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'analytics'
              ? 'bg-[#284661] text-white shadow-2xs'
              : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200/80'
          }`}
        >
          <TrendingUp className="w-3.5 h-3.5" />
          <span>Performance Analytics &amp; Revenue</span>
        </button>
      </div>

      {/* TAB 1: COURSE CATALOGUE */}
      {activeTab === 'catalogue' && (
        <AdminTableWrapper
          title="DIKSHA Course Management Ledger"
          subtitle={`Showing page ${currentPage} of ${totalPages} (${totalItems} total modules)`}
          searchQuery={searchQuery}
          onSearchChange={(val) => {
            setSearchQuery(val);
            setCurrentPage(1);
          }}
          searchPlaceholder="Search course code, title, topic..."
          filters={
            <div className="flex flex-wrap items-center gap-2">
              {/* Category Filter */}
              <select
                value={selectedCategory}
                onChange={(e) => {
                  setSelectedCategory(e.target.value);
                  setCurrentPage(1);
                }}
                className="h-9 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 outline-none focus:border-[#E76120] cursor-pointer"
              >
                {CATEGORIES.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.label}
                  </option>
                ))}
              </select>

              {/* Status Filter */}
              <select
                value={selectedStatus}
                onChange={(e) => {
                  setSelectedStatus(e.target.value);
                  setCurrentPage(1);
                }}
                className="h-9 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 outline-none focus:border-[#E76120] cursor-pointer"
              >
                <option value="all">All Statuses</option>
                <option value="PUBLISHED">Published Only</option>
                <option value="DRAFT">Draft Only</option>
                <option value="ARCHIVED">Archived</option>
              </select>

              {/* Pricing Filter */}
              <select
                value={selectedPricing}
                onChange={(e) => {
                  setSelectedPricing(e.target.value);
                  setCurrentPage(1);
                }}
                className="h-9 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 outline-none focus:border-[#E76120] cursor-pointer"
              >
                <option value="all">All Pricing</option>
                <option value="FREE">Free Courses Only</option>
                <option value="PAID">Commercial Paid Only</option>
              </select>
            </div>
          }
          loading={loading}
          error={error}
          onRetry={fetchCourses}
          isEmpty={courses.length === 0}
          emptyTitle="No DIKSHA courses found"
          emptyDescription="No learning modules match your current filter parameters."
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={totalItems}
          itemsPerPage={10}
          onPageChange={(p) => setCurrentPage(p)}
        >
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Course Code &amp; Title</TableHead>
                <TableHead>Category &amp; Cohort</TableHead>
                <TableHead>Video Curriculum</TableHead>
                <TableHead>Assessment &amp; Cert</TableHead>
                <TableHead>Pricing Model</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {courses.map((c) => (
                <TableRow key={c._id}>
                  {/* Title & Code */}
                  <TableCell>
                    <div className="space-y-0.5">
                      <span className="font-mono text-[10px] font-bold text-[#284661] block">
                        {c.code}
                      </span>
                      <span className="font-bold text-slate-900 text-xs block truncate max-w-[240px]" title={c.title}>
                        {c.title}
                      </span>
                    </div>
                  </TableCell>

                  {/* Category & Audience */}
                  <TableCell>
                    <div className="space-y-1">
                      <span className="text-xs font-semibold text-slate-700 block">
                        {c.category?.replace(/_/g, ' ')}
                      </span>
                      <div className="flex items-center gap-1 flex-wrap">
                        {c.targetAudience?.slice(0, 2).map((a) => (
                          <Badge key={a} variant="outline" className="text-[9px] px-1 py-0 font-bold text-slate-500">
                            {a}
                          </Badge>
                        ))}
                        {c.targetAudience?.length > 2 && (
                          <span className="text-[10px] text-slate-400 font-bold">
                            +{c.targetAudience.length - 2}
                          </span>
                        )}
                      </div>
                    </div>
                  </TableCell>

                  {/* Videos */}
                  <TableCell>
                    <div className="flex items-center gap-1.5 text-xs text-slate-700">
                      <Video className="w-3.5 h-3.5 text-[#E76120]" />
                      <span className="font-bold">{c.videos?.length || 0} Lecture(s)</span>
                    </div>
                    <span className="text-[10px] text-slate-400 block">
                      {c.videos?.reduce((acc, v) => acc + (v.durationMinutes || 0), 0)} mins total
                    </span>
                  </TableCell>

                  {/* Assessment & Certificate */}
                  <TableCell>
                    <div className="space-y-0.5 text-xs">
                      {c.assessment?.enabled ? (
                        <div className="flex items-center gap-1 text-emerald-700 font-bold text-[11px]">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          <span>MCQ ({c.assessment.questions?.length || 0} Qs)</span>
                        </div>
                      ) : (
                        <span className="text-slate-400 text-[10px]">No Quiz</span>
                      )}

                      {c.certificate?.enabled && (
                        <span className="text-[10px] text-amber-700 font-semibold block">
                          Cert: {c.certificate.validityMonths}m validity
                        </span>
                      )}
                    </div>
                  </TableCell>

                  {/* Pricing */}
                  <TableCell>
                    {c.pricing?.isPaid ? (
                      <div>
                        <span className="font-black text-slate-900 text-xs">
                          ₹{c.pricing.priceINR}
                        </span>
                        {c.pricing.discountPriceINR > 0 && (
                          <span className="text-[10px] text-emerald-600 block font-bold">
                            Offer: ₹{c.pricing.discountPriceINR}
                          </span>
                        )}
                      </div>
                    ) : (
                      <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px] font-bold">
                        FREE
                      </Badge>
                    )}
                  </TableCell>

                  {/* Status Toggle Dropdown */}
                  <TableCell>
                    <select
                      value={c.status}
                      onChange={(e) => handleToggleStatus(c._id, e.target.value)}
                      className={`h-7 px-2 rounded-lg text-[11px] font-bold border outline-none cursor-pointer transition-colors ${
                        c.status === 'PUBLISHED'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : c.status === 'DRAFT'
                          ? 'bg-amber-50 text-amber-700 border-amber-200'
                          : 'bg-slate-100 text-slate-600 border-slate-200'
                      }`}
                    >
                      <option value="DRAFT">DRAFT</option>
                      <option value="PUBLISHED">PUBLISHED</option>
                      <option value="ARCHIVED">ARCHIVED</option>
                    </select>
                  </TableCell>

                  {/* Action Buttons */}
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        type="button"
                        onClick={() => setViewingCourse(c)}
                        className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold text-xs border border-slate-200 cursor-pointer shadow-2xs transition-all"
                        title="View Course Details"
                      >
                        <Eye className="w-3.5 h-3.5 text-[#284661]" />
                        <span>Details</span>
                      </button>

                      <PermissionGuard module="INTEGRATED" section="DIKSHA" action="EDIT">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingCourse(c);
                            setIsCreateEditOpen(true);
                          }}
                          className="p-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200 cursor-pointer"
                          title="Edit Course"
                        >
                          <Edit className="w-3.5 h-3.5 text-[#E76120]" />
                        </button>
                      </PermissionGuard>

                      <PermissionGuard module="INTEGRATED" section="DIKSHA" action="DELETE">
                        <button
                          type="button"
                          onClick={() => handleDeleteCourse(c)}
                          className="p-1.5 rounded-lg bg-slate-50 hover:bg-red-50 text-slate-400 hover:text-red-600 border border-slate-200 cursor-pointer"
                          title="Delete Course"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </PermissionGuard>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </AdminTableWrapper>
      )}

      {/* TAB 2: GLOBAL LEARNER ENROLLMENTS */}
      {activeTab === 'enrollments' && (
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900">National Healthcare Learner Roster</h3>
              <p className="text-xs text-slate-500">Live tracker of stakeholder course progressions, exam scores, and certificate deliveries.</p>
            </div>
          </div>

          <div className="border border-slate-100 rounded-xl overflow-hidden">
            {enrollments.length === 0 ? (
              <div className="p-8 text-center text-slate-400">
                <Users className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                <p className="font-semibold text-xs">No active learner enrollments recorded yet.</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Candidate Identity</TableHead>
                    <TableHead>Course Code &amp; Title</TableHead>
                    <TableHead>Cohort</TableHead>
                    <TableHead>Progress</TableHead>
                    <TableHead>Assessment Result</TableHead>
                    <TableHead>Certificate</TableHead>
                    <TableHead>Enrolled At</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {enrollments.map((enr) => (
                    <TableRow key={enr._id}>
                      <TableCell>
                        <div>
                          <span className="font-bold text-slate-900 block truncate">
                            {enr.subscriber?.name || 'Healthcare Associate'}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {enr.subscriber?.email || 'associate@nfi.gov.in'}
                          </span>
                        </div>
                      </TableCell>

                      <TableCell>
                        <span className="font-mono text-[10px] font-bold text-[#284661] block">
                          {enr.course?.code}
                        </span>
                        <span className="font-bold text-slate-800 text-xs block truncate max-w-[200px]">
                          {enr.course?.title}
                        </span>
                      </TableCell>

                      <TableCell>
                        <Badge variant="outline" className="text-[9px] font-bold">
                          {enr.subscriber?.userType || 'DOCTOR'}
                        </Badge>
                      </TableCell>

                      <TableCell>
                        <div className="flex items-center gap-1.5">
                          <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div
                              style={{ width: `${enr.progressPercent || 0}%` }}
                              className="h-full bg-[#284661] rounded-full"
                            />
                          </div>
                          <span className="font-mono text-[10px] font-bold text-slate-600">
                            {enr.progressPercent || 0}%
                          </span>
                        </div>
                      </TableCell>

                      <TableCell>
                        {enr.assessmentScore !== null && enr.assessmentScore !== undefined ? (
                          <span
                            className={`font-mono font-bold text-xs ${
                              enr.passed ? 'text-emerald-600' : 'text-red-600'
                            }`}
                          >
                            {enr.assessmentScore}% {enr.passed ? '(PASSED)' : '(FAILED)'}
                          </span>
                        ) : (
                          <span className="text-slate-400 text-[10px]">In Progress</span>
                        )}
                      </TableCell>

                      <TableCell>
                        {enr.certificate?.issued ? (
                          <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[9px] font-bold flex items-center gap-1 w-fit">
                            <Award className="w-3 h-3" />
                            <span>DELIVERED</span>
                          </Badge>
                        ) : (
                          <span className="text-slate-400 text-[10px]">Pending Exam</span>
                        )}
                      </TableCell>

                      <TableCell>
                        <span className="text-slate-500 font-mono text-[10px]">
                          {new Date(enr.enrolledAt || enr.createdAt || Date.now()).toLocaleDateString('en-IN')}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: PERFORMANCE ANALYTICS & REVENUE */}
      {activeTab === 'analytics' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-5 bg-white border border-slate-200 rounded-2xl space-y-2">
              <span className="text-xs font-bold text-slate-500 block uppercase tracking-wider">
                Certification Pass Funnel
              </span>
              <div className="space-y-1.5 pt-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-600 font-medium">Total Enrolled:</span>
                  <span className="font-mono font-bold text-slate-900">{stats.totalEnrolled}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-600 font-medium">Passed Exam:</span>
                  <span className="font-mono font-bold text-emerald-600">{stats.totalCompleted}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-600 font-medium">Overall Pass Rate:</span>
                  <span className="font-mono font-bold text-[#284661]">{stats.completionRate}%</span>
                </div>
              </div>
            </div>

            <div className="p-5 bg-white border border-slate-200 rounded-2xl space-y-2">
              <span className="text-xs font-bold text-slate-500 block uppercase tracking-wider">
                Commercial Revenue Summary
              </span>
              <div className="space-y-1.5 pt-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-600 font-medium">Gross Realized Revenue:</span>
                  <span className="font-mono font-bold text-[#E76120]">₹{(stats.totalRevenue || 0).toLocaleString('en-IN')}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-600 font-medium">Paid Course Offerings:</span>
                  <span className="font-mono font-bold text-slate-900">
                    {courses.filter((c) => c.pricing?.isPaid).length} Course(s)
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-600 font-medium">Free Orientation Passes:</span>
                  <span className="font-mono font-bold text-emerald-600">
                    {courses.filter((c) => !c.pricing?.isPaid).length} Course(s)
                  </span>
                </div>
              </div>
            </div>

            <div className="p-5 bg-white border border-slate-200 rounded-2xl space-y-2">
              <span className="text-xs font-bold text-slate-500 block uppercase tracking-wider">
                Assessment Quality Benchmark
              </span>
              <div className="space-y-1.5 pt-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-600 font-medium">Average Test Score:</span>
                  <span className="font-mono font-bold text-purple-600">{stats.avgScore}%</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-600 font-medium">Time Limit Standard:</span>
                  <span className="font-mono font-bold text-slate-900">10 – 20 Mins</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-600 font-medium">Cert Validity Standard:</span>
                  <span className="font-mono font-bold text-slate-900">24 – 36 Months</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      <CreateEditCourseModal
        isOpen={isCreateEditOpen}
        onClose={() => {
          setIsCreateEditOpen(false);
          setEditingCourse(null);
        }}
        course={editingCourse}
        onSave={handleSaveCourse}
      />

      <CourseDetailsModal
        isOpen={!!viewingCourse}
        onClose={() => setViewingCourse(null)}
        course={viewingCourse}
        onEdit={(c) => {
          setViewingCourse(null);
          setEditingCourse(c);
          setIsCreateEditOpen(true);
        }}
        onViewEnrollments={(c) => {
          setViewingCourse(null);
          setEnrolledModalCourse(c);
        }}
      />

      <CourseEnrollmentsModal
        isOpen={!!enrolledModalCourse}
        onClose={() => setEnrolledModalCourse(null)}
        course={enrolledModalCourse}
      />
    </PageContainer>
  );
};

export default DikshaPage;
