import React, { useState, useEffect, useCallback } from 'react';
import {
  Users,
  Award,
  CheckCircle2,
  XCircle,
  Clock,
  Search,
  RefreshCw,
  Mail,
  Building,
} from 'lucide-react';
import { AdminModal } from '../common/AdminModal';
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
import dikshaService from '../../../services/diksha.service';
import AdminLoader from '../common/AdminLoader';

export const CourseEnrollmentsModal = ({
  isOpen,
  onClose,
  course,
}) => {
  const [enrollments, setEnrollments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');

  const fetchEnrollments = useCallback(async () => {
    if (!course) return;
    setLoading(true);
    try {
      const res = await dikshaService.getEnrollments({
        courseId: course._id,
        search,
      });
      if (res && res.enrollments) {
        setEnrollments(res.enrollments);
      }
    } catch (err) {
      console.warn('Failed to load course enrollments:', err);
    } finally {
      setLoading(false);
    }
  }, [course, search]);

  useEffect(() => {
    if (isOpen && course) {
      fetchEnrollments();
    }
  }, [isOpen, course, fetchEnrollments]);

  if (!course) return null;

  return (
    <AdminModal
      isOpen={isOpen}
      onClose={onClose}
      title={`Learners Enrolled: ${course.title}`}
      subtitle={`Course Code: ${course.code} · ${enrollments.length} candidate record(s)`}
      size="xl"
    >
      <div className="space-y-4 select-none font-sans">
        {/* Search Bar */}
        <div className="flex items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search candidate name, email..."
              className="w-full h-9 pl-8 pr-3 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:border-[#E76120]"
            />
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={fetchEnrollments}
            className="rounded-xl text-xs font-semibold cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 mr-1 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </Button>
        </div>

        {/* Table Container */}
        <div className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden text-xs max-h-[50vh] overflow-y-auto">
          {loading ? (
            <AdminLoader text="Loading candidate records..." />
          ) : enrollments.length === 0 ? (
            <div className="p-8 text-center text-slate-400">
              <Users className="w-8 h-8 mx-auto mb-2 text-slate-300" />
              <p className="font-semibold text-xs">No candidate enrollments recorded yet for this course.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Candidate Identity</TableHead>
                  <TableHead>Cohort</TableHead>
                  <TableHead>Progress</TableHead>
                  <TableHead>Assessment Score</TableHead>
                  <TableHead>Certificate</TableHead>
                  <TableHead>Enrolled Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {enrollments.map((enr) => (
                  <TableRow key={enr._id}>
                    <TableCell>
                      <div>
                        <span className="font-bold text-slate-900 block truncate">
                          {enr.subscriber?.name || 'Candidate User'}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {enr.subscriber?.email || 'user@example.com'}
                        </span>
                      </div>
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
                          {enr.assessmentScore}% {enr.passed ? '(PASS)' : '(FAIL)'}
                        </span>
                      ) : (
                        <span className="text-slate-400 text-[10px]">Pending</span>
                      )}
                    </TableCell>

                    <TableCell>
                      {enr.certificate?.issued ? (
                        <span className="inline-flex items-center gap-1 text-emerald-600 font-bold text-[11px]">
                          <Award className="w-3.5 h-3.5" />
                          <span>Issued</span>
                        </span>
                      ) : (
                        <span className="text-slate-400 text-[10px]">Not Issued</span>
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
    </AdminModal>
  );
};

export default CourseEnrollmentsModal;
