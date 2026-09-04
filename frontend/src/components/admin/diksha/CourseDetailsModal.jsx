import React from 'react';
import {
  BookOpen,
  DollarSign,
  Video,
  FileQuestion,
  Award,
  Users,
  Clock,
  CheckCircle2,
  ExternalLink,
  ShieldCheck,
  Tag,
  BarChart3,
} from 'lucide-react';
import { AdminModal } from '../common/AdminModal';
import { Badge } from '../../ui/badge';
import { Button } from '../../ui/button';

export const CourseDetailsModal = ({
  isOpen,
  onClose,
  course,
  onEdit,
  onViewEnrollments,
}) => {
  if (!course) return null;

  const isPaid = course.pricing?.isPaid;

  const getStatusBadge = (status) => {
    switch (status) {
      case 'PUBLISHED':
        return (
          <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px] font-bold">
            PUBLISHED
          </Badge>
        );
      case 'DRAFT':
        return (
          <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 text-[10px] font-bold">
            DRAFT
          </Badge>
        );
      case 'ARCHIVED':
        return (
          <Badge variant="outline" className="bg-slate-100 text-slate-600 border-slate-200 text-[10px] font-bold">
            ARCHIVED
          </Badge>
        );
      default:
        return null;
    }
  };

  return (
    <AdminModal
      isOpen={isOpen}
      onClose={onClose}
      title={course.title}
      subtitle={`Course Code: ${course.code} · ${course.category?.replace(/_/g, ' ')}`}
      size="xl"
    >
      <div className="space-y-5 select-none font-sans max-h-[70vh] overflow-y-auto pr-1">
        {/* Top Summary Banner */}
        <div className="p-4 bg-slate-50 border border-slate-200/90 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-[#284661] text-white flex items-center justify-center font-bold shrink-0 shadow-2xs">
              <BookOpen className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-mono text-xs font-bold text-slate-900">{course.code}</span>
                {getStatusBadge(course.status)}
                {isPaid ? (
                  <Badge variant="nfiYellow" className="text-[10px] font-bold">
                    PAID (₹{course.pricing.priceINR})
                  </Badge>
                ) : (
                  <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px] font-bold">
                    100% FREE
                  </Badge>
                )}
              </div>
              <span className="text-xs text-slate-500 font-medium mt-0.5 block">
                Created: {new Date(course.createdAt || Date.now()).toLocaleDateString('en-IN')}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            {onViewEnrollments && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onViewEnrollments(course)}
                className="rounded-xl text-xs font-semibold cursor-pointer"
              >
                <Users className="w-3.5 h-3.5 mr-1 text-sky-600" />
                <span>Learner Roster ({course.stats?.enrolledCount || 0})</span>
              </Button>
            )}

            {onEdit && (
              <Button
                variant="nfiYellow"
                size="sm"
                onClick={() => onEdit(course)}
                className="rounded-xl text-xs font-bold shadow-2xs cursor-pointer"
              >
                <span>Edit Course</span>
              </Button>
            )}
          </div>
        </div>

        {/* 4 KPI Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          <div className="p-3 bg-white border border-slate-200 rounded-xl">
            <span className="text-[10px] font-bold text-slate-400 uppercase block">Enrolled Learners</span>
            <span className="text-base font-black text-slate-900">{course.stats?.enrolledCount || 0}</span>
          </div>
          <div className="p-3 bg-white border border-slate-200 rounded-xl">
            <span className="text-[10px] font-bold text-slate-400 uppercase block">Completed</span>
            <span className="text-base font-black text-emerald-600">{course.stats?.completedCount || 0}</span>
          </div>
          <div className="p-3 bg-white border border-slate-200 rounded-xl">
            <span className="text-[10px] font-bold text-slate-400 uppercase block">Average Score</span>
            <span className="text-base font-black text-[#284661]">{course.stats?.avgScorePercent || 0}%</span>
          </div>
          <div className="p-3 bg-white border border-slate-200 rounded-xl">
            <span className="text-[10px] font-bold text-slate-400 uppercase block">Realized Revenue</span>
            <span className="text-base font-black text-[#E76120]">₹{(course.stats?.totalRevenueINR || 0).toLocaleString('en-IN')}</span>
          </div>
        </div>

        {/* Course Description */}
        {course.description && (
          <div className="space-y-1">
            <span className="text-xs font-bold text-slate-900 block">Course Overview</span>
            <p className="text-xs text-slate-600 leading-relaxed bg-slate-50/70 p-3 rounded-xl border border-slate-100">
              {course.description}
            </p>
          </div>
        )}

        {/* Target Audience */}
        <div className="space-y-1.5">
          <span className="text-xs font-bold text-slate-900 block">Eligible Stakeholders</span>
          <div className="flex items-center gap-1.5 flex-wrap">
            {course.targetAudience?.map((aud) => (
              <Badge key={aud} variant="outline" className="bg-blue-50/80 text-[#284661] border-blue-200 text-[10px] font-bold">
                {aud}
              </Badge>
            ))}
          </div>
        </div>

        {/* Video Lectures */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
              <Video className="w-3.5 h-3.5 text-[#E76120]" />
              <span>Curriculum Videos ({course.videos?.length || 0})</span>
            </span>
          </div>

          <div className="space-y-2">
            {course.videos?.map((vid, idx) => (
              <div
                key={idx}
                className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl flex items-center justify-between gap-3 text-xs"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="w-6 h-6 rounded-lg bg-[#284661] text-white font-mono text-[10px] font-bold flex items-center justify-center shrink-0">
                    {idx + 1}
                  </span>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 truncate">{vid.title}</span>
                      {vid.isHelpVideo && (
                        <Badge variant="outline" className="bg-amber-50 text-amber-800 border-amber-200 text-[9px] font-bold">
                          Help Video
                        </Badge>
                      )}
                    </div>
                    <span className="text-[10px] text-slate-400 font-mono block truncate">
                      {vid.youtubeUrl || 'No YouTube URL configured'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-[11px] font-semibold text-slate-500 font-mono">
                    {vid.durationMinutes} mins
                  </span>
                  {vid.youtubeUrl && (
                    <a
                      href={vid.youtubeUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1 rounded-lg bg-white border border-slate-200 text-red-600 hover:bg-red-50 transition-colors"
                      title="Open YouTube video"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Assessment Preview */}
        {course.assessment?.enabled && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                <FileQuestion className="w-3.5 h-3.5 text-[#284661]" />
                <span>MCQ Assessment ({course.assessment.questions?.length || 0} Questions)</span>
              </span>
              <div className="flex items-center gap-3 text-[11px] text-slate-500">
                <span>Time Limit: <strong>{course.assessment.timeLimitMinutes} mins</strong></span>
                <span>Passing: <strong>{course.assessment.passingScorePercent}%</strong></span>
              </div>
            </div>

            <div className="space-y-2">
              {course.assessment.questions?.map((q, qIdx) => (
                <div
                  key={qIdx}
                  className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl space-y-2 text-xs"
                >
                  <span className="font-bold text-slate-900 block">
                    Q{qIdx + 1}: {q.questionText}
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                    {q.options?.map((opt, optIdx) => (
                      <div
                        key={optIdx}
                        className={`p-1.5 px-2.5 rounded-lg border text-[11px] flex items-center gap-1.5 ${
                          q.correctOptionIndex === optIdx
                            ? 'bg-emerald-50 border-emerald-300 text-emerald-900 font-bold'
                            : 'bg-white border-slate-200 text-slate-600'
                        }`}
                      >
                        <span className="font-mono">{String.fromCharCode(65 + optIdx)}.</span>
                        <span className="truncate">{opt}</span>
                        {q.correctOptionIndex === optIdx && (
                          <CheckCircle2 className="w-3 h-3 text-emerald-600 ml-auto shrink-0" />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Certificate Configuration */}
        {course.certificate?.enabled && (
          <div className="p-3.5 bg-amber-50/50 border border-amber-200/80 rounded-2xl flex items-start gap-3">
            <Award className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="space-y-0.5 text-xs">
              <span className="font-bold text-amber-950 block">{course.certificate.title}</span>
              <span className="text-[11px] text-amber-800 block">
                Validity: <strong>{course.certificate.validityMonths} Months</strong> · Signatory: <strong>{course.certificate.signatoryName} ({course.certificate.signatoryTitle})</strong>
              </span>
            </div>
          </div>
        )}
      </div>
    </AdminModal>
  );
};

export default CourseDetailsModal;
