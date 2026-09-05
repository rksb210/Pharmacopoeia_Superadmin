import React, { useState, useEffect } from 'react';
import {
  BookOpen,
  DollarSign,
  Video,
  FileQuestion,
  Award,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Save,
  PlayCircle,
  Clock,
  Check,
} from 'lucide-react';
import { AdminModal } from '../common/AdminModal';
import { Button } from '../../ui/button';
import InputField from '../../common/InputField';

const TABS = [
  { id: 'basic', label: '1. Basic Info', icon: BookOpen },
  { id: 'pricing', label: '2. Pricing & Access', icon: DollarSign },
  { id: 'videos', label: '3. Video Curriculum', icon: Video },
  { id: 'quiz', label: '4. MCQ Assessment', icon: FileQuestion },
  { id: 'certificate', label: '5. Certificate', icon: Award },
];

const CATEGORIES = [
  { id: 'NFI_ORIENTATION', label: 'NFI Orientation & Basics' },
  { id: 'PHARMACOVIGILANCE', label: 'Pharmacovigilance (PvPI)' },
  { id: 'CLINICAL_PRACTICE', label: 'Clinical Pharmacology' },
  { id: 'MEDICATION_SAFETY', label: 'Medication Safety & LASA' },
  { id: 'DRUG_REGULATORY', label: 'Regulatory Standards' },
  { id: 'PATIENT_COUNSELING', label: 'Patient Counseling' },
  { id: 'OTHER', label: 'General / Special Topics' },
];

const AUDIENCE_TYPES = [
  'DOCTOR',
  'PHARMACIST',
  'STUDENT',
  'NURSE',
  'INDUSTRY',
  'OTHERS',
];

export const CreateEditCourseModal = ({
  isOpen,
  onClose,
  course = null,
  onSave,
}) => {
  const isEdit = !!course;
  const [activeTab, setActiveTab] = useState('basic');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Form State
  const [formData, setFormData] = useState({
    code: '',
    title: '',
    description: '',
    thumbnailUrl: '',
    category: 'NFI_ORIENTATION',
    targetAudience: ['DOCTOR', 'PHARMACIST', 'STUDENT', 'NURSE', 'INDUSTRY', 'OTHERS'],
    status: 'DRAFT',
    pricing: {
      isPaid: false,
      priceINR: 0,
      discountPriceINR: 0,
    },
    videos: [
      {
        title: 'Introduction & Course Objectives',
        youtubeUrl: '',
        durationMinutes: 10,
        isHelpVideo: false,
        order: 1,
      },
    ],
    materials: [],
    assessment: {
      enabled: true,
      title: 'Course Completion MCQ Assessment',
      timeLimitMinutes: 15,
      passingScorePercent: 70,
      questions: [
        {
          questionText: '',
          options: ['', '', '', ''],
          correctOptionIndex: 0,
          explanation: '',
          points: 1,
        },
      ],
    },
    certificate: {
      enabled: true,
      title: 'Certificate of Competency in National Formulary of India (NFI)',
      validityMonths: 24,
      signatoryName: 'Secretary-cum-Scientific Director',
      signatoryTitle: 'Indian Pharmacopoeia Commission (IPC)',
    },
  });

  useEffect(() => {
    if (course) {
      setFormData({
        code: course.code || '',
        title: course.title || '',
        description: course.description || '',
        thumbnailUrl: course.thumbnailUrl || '',
        category: course.category || 'NFI_ORIENTATION',
        targetAudience: course.targetAudience || AUDIENCE_TYPES,
        status: course.status || 'DRAFT',
        pricing: {
          isPaid: course.pricing?.isPaid ?? false,
          priceINR: course.pricing?.priceINR ?? 0,
          discountPriceINR: course.pricing?.discountPriceINR ?? 0,
        },
        videos: course.videos?.length
          ? course.videos
          : [
              {
                title: 'Introduction & Course Objectives',
                youtubeUrl: '',
                durationMinutes: 10,
                isHelpVideo: false,
                order: 1,
              },
            ],
        materials: course.materials || [],
        assessment: {
          enabled: course.assessment?.enabled ?? true,
          title: course.assessment?.title || 'Course Completion MCQ Assessment',
          timeLimitMinutes: course.assessment?.timeLimitMinutes ?? 15,
          passingScorePercent: course.assessment?.passingScorePercent ?? 70,
          questions: course.assessment?.questions?.length
            ? course.assessment.questions
            : [
                {
                  questionText: '',
                  options: ['', '', '', ''],
                  correctOptionIndex: 0,
                  explanation: '',
                  points: 1,
                },
              ],
        },
        certificate: {
          enabled: course.certificate?.enabled ?? true,
          title: course.certificate?.title || 'Certificate of Competency in National Formulary of India (NFI)',
          validityMonths: course.certificate?.validityMonths ?? 24,
          signatoryName: course.certificate?.signatoryName || 'Secretary-cum-Scientific Director',
          signatoryTitle: course.certificate?.signatoryTitle || 'Indian Pharmacopoeia Commission (IPC)',
        },
      });
    } else {
      setFormData({
        code: `DIKSHA-${Math.floor(100 + Math.random() * 900)}`,
        title: '',
        description: '',
        thumbnailUrl: '',
        category: 'NFI_ORIENTATION',
        targetAudience: AUDIENCE_TYPES,
        status: 'DRAFT',
        pricing: {
          isPaid: false,
          priceINR: 0,
          discountPriceINR: 0,
        },
        videos: [
          {
            title: 'Welcome & Course Introduction',
            youtubeUrl: '',
            durationMinutes: 10,
            isHelpVideo: false,
            order: 1,
          },
        ],
        materials: [],
        assessment: {
          enabled: true,
          title: 'End-of-Course MCQ Assessment',
          timeLimitMinutes: 15,
          passingScorePercent: 70,
          questions: [
            {
              questionText: '',
              options: ['', '', '', ''],
              correctOptionIndex: 0,
              explanation: '',
              points: 1,
            },
          ],
        },
        certificate: {
          enabled: true,
          title: 'Certificate of Competency in National Formulary of India (NFI)',
          validityMonths: 24,
          signatoryName: 'Secretary-cum-Scientific Director',
          signatoryTitle: 'Indian Pharmacopoeia Commission (IPC)',
        },
      });
    }
    setActiveTab('basic');
    setError('');
  }, [course, isOpen]);

  // Audience Toggler
  const toggleAudience = (type) => {
    const current = formData.targetAudience || [];
    if (current.includes(type)) {
      if (current.length === 1) return;
      setFormData({ ...formData, targetAudience: current.filter((t) => t !== type) });
    } else {
      setFormData({ ...formData, targetAudience: [...current, type] });
    }
  };

  // Videos Handler
  const handleAddVideo = () => {
    setFormData({
      ...formData,
      videos: [
        ...formData.videos,
        {
          title: `Curriculum Module ${formData.videos.length + 1}`,
          youtubeUrl: '',
          durationMinutes: 15,
          isHelpVideo: false,
          order: formData.videos.length + 1,
        },
      ],
    });
  };

  const handleRemoveVideo = (index) => {
    if (formData.videos.length === 1) return;
    setFormData({
      ...formData,
      videos: formData.videos.filter((_, idx) => idx !== index),
    });
  };

  const handleVideoChange = (index, field, value) => {
    const updated = [...formData.videos];
    updated[index][field] = value;
    setFormData({ ...formData, videos: updated });
  };

  // Assessment Questions Handler
  const handleAddQuestion = () => {
    setFormData({
      ...formData,
      assessment: {
        ...formData.assessment,
        questions: [
          ...formData.assessment.questions,
          {
            questionText: '',
            options: ['', '', '', ''],
            correctOptionIndex: 0,
            explanation: '',
            points: 1,
          },
        ],
      },
    });
  };

  const handleRemoveQuestion = (qIndex) => {
    if (formData.assessment.questions.length === 1) return;
    setFormData({
      ...formData,
      assessment: {
        ...formData.assessment,
        questions: formData.assessment.questions.filter((_, idx) => idx !== qIndex),
      },
    });
  };

  const handleQuestionChange = (qIndex, field, value) => {
    const updated = [...formData.assessment.questions];
    updated[qIndex][field] = value;
    setFormData({
      ...formData,
      assessment: { ...formData.assessment, questions: updated },
    });
  };

  const handleOptionChange = (qIndex, optIndex, value) => {
    const updated = [...formData.assessment.questions];
    updated[qIndex].options[optIndex] = value;
    setFormData({
      ...formData,
      assessment: { ...formData.assessment, questions: updated },
    });
  };

  // Submit Handler
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.code.trim() || !formData.title.trim()) {
      setError('Course code and course title are required.');
      setActiveTab('basic');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await onSave(formData);
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to save DIKSHA Course.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminModal
      isOpen={isOpen}
      onClose={onClose}
      title={isEdit ? `Edit Course: ${course.title}` : 'Create New DIKSHA Course'}
      subtitle="Digital Initiative for Knowledge & Skill Enhancement · IPC Learning Management System"
      size="xl"
    >
      <form onSubmit={handleSubmit} className="space-y-5 select-none font-sans">
        {error && (
          <div className="p-3.5 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
            <span>{error}</span>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-slate-200">
          {TABS.map((t) => {
            const Icon = t.icon;
            const isActive = activeTab === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setActiveTab(t.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                  isActive
                    ? 'bg-[#284661] text-white shadow-2xs'
                    : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/80'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{t.label}</span>
              </button>
            );
          })}
        </div>

        {/* TAB 1: BASIC INFORMATION */}
        {activeTab === 'basic' && (
          <div className="space-y-4 max-h-[55vh] overflow-y-auto pr-1">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <InputField
                id="code"
                label="Course Code"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                placeholder="e.g. DIKSHA-NFI-01"
                required
              />

              <div className="sm:col-span-2">
                <InputField
                  id="title"
                  label="Course Title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g. Orientation to National Formulary of India"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 block">Category</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 outline-none focus:border-[#E76120]"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 block">Workflow Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 outline-none focus:border-[#E76120]"
                >
                  <option value="DRAFT">Draft (Under Preparation)</option>
                  <option value="UNDER_REVIEW">Under Review (In Reviewer Queue)</option>
                  <option value="NEEDS_REVISION">Needs Revision (Changes Requested)</option>
                  <option value="REVIEWED">Reviewed (Pending Final Approval)</option>
                  <option value="PUBLISHED">Published (Live to Subscribers)</option>
                  <option value="ARCHIVED">Archived (Inactive)</option>
                </select>
              </div>
            </div>

            <InputField
              id="thumbnailUrl"
              label="Course Thumbnail Image URL (Optional)"
              value={formData.thumbnailUrl}
              onChange={(e) => setFormData({ ...formData, thumbnailUrl: e.target.value })}
              placeholder="https://images.unsplash.com/..."
              helperText="Displays on public course catalogue cards"
            />

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 block">Course Description & Overview</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                placeholder="Comprehensive overview of topics covered in this module..."
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 outline-none focus:border-[#E76120]"
              />
            </div>

            {/* Target Audience */}
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <span className="text-xs font-bold text-slate-800 block">Eligible Stakeholder Cohorts</span>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {AUDIENCE_TYPES.map((type) => {
                  const isSelected = (formData.targetAudience || []).includes(type);
                  return (
                    <button
                      key={type}
                      type="button"
                      onClick={() => toggleAudience(type)}
                      className={`p-2 rounded-xl border text-xs font-bold flex items-center justify-between transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-blue-50 border-[#284661] text-[#284661]'
                          : 'bg-slate-50 border-slate-200 text-slate-400'
                      }`}
                    >
                      <span>{type}</span>
                      {isSelected && <Check className="w-3.5 h-3.5 text-[#284661]" />}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: PRICING & ACCESS */}
        {activeTab === 'pricing' && (
          <div className="space-y-4 max-h-[55vh] overflow-y-auto pr-1">
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-bold text-slate-900 text-sm block">Course Commercial Pricing Model</span>
                  <p className="text-[11px] text-slate-500">
                    Specify whether this module is complimentary (Free) or requires commercial pass enrollment.
                  </p>
                </div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.pricing.isPaid}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        pricing: { ...formData.pricing, isPaid: e.target.checked },
                      })
                    }
                    className="w-4 h-4 rounded border-slate-300 text-[#E76120] accent-[#E76120] cursor-pointer"
                  />
                  <span className="font-bold text-xs text-slate-800">
                    {formData.pricing.isPaid ? 'Commercial Paid Course' : 'Free Public Course'}
                  </span>
                </label>
              </div>

              {formData.pricing.isPaid ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-200">
                  <InputField
                    id="priceINR"
                    label="Standard Enrollment Fee (INR ₹)"
                    type="number"
                    value={formData.pricing.priceINR}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        pricing: { ...formData.pricing, priceINR: Number(e.target.value) },
                      })
                    }
                    required
                  />

                  <InputField
                    id="discountPriceINR"
                    label="Special Discounted Fee (INR ₹)"
                    type="number"
                    value={formData.pricing.discountPriceINR}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        pricing: { ...formData.pricing, discountPriceINR: Number(e.target.value) },
                      })
                    }
                    helperText="Leave 0 if no discounted offer is running"
                  />
                </div>
              ) : (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>This course is 100% Free for all verified NFI portal users.</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 3: VIDEOS & CURRICULUM */}
        {activeTab === 'videos' && (
          <div className="space-y-4 max-h-[55vh] overflow-y-auto pr-1">
            <div className="p-3.5 bg-blue-50/70 border border-blue-200 rounded-xl text-[11px] text-blue-900 leading-relaxed flex items-center gap-2">
              <PlayCircle className="w-4 h-4 text-red-600 shrink-0" />
              <span>
                As per NFI guidelines, curriculum videos are streamed via YouTube links. You can also flag 2-3 videos as <strong>Portal Help Videos</strong> for onboarding.
              </span>
            </div>

            <div className="space-y-3">
              {formData.videos.map((vid, idx) => (
                <div
                  key={idx}
                  className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-3 relative group"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-slate-800 flex items-center gap-1.5">
                      <span className="w-5 h-5 rounded-full bg-[#284661] text-white text-[10px] flex items-center justify-center font-mono">
                        {idx + 1}
                      </span>
                      <span>Lecture / Video #{idx + 1}</span>
                    </span>

                    <button
                      type="button"
                      onClick={() => handleRemoveVideo(idx)}
                      disabled={formData.videos.length === 1}
                      className="p-1 rounded text-slate-400 hover:text-red-600 hover:bg-slate-200 disabled:opacity-30 cursor-pointer"
                      title="Remove video"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="sm:col-span-2">
                      <input
                        type="text"
                        value={vid.title}
                        onChange={(e) => handleVideoChange(idx, 'title', e.target.value)}
                        placeholder="Video Title / Topic..."
                        className="w-full h-9 px-3 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 outline-none focus:border-[#E76120]"
                      />
                    </div>

                    <div>
                      <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-xl px-2.5 h-9">
                        <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <input
                          type="number"
                          value={vid.durationMinutes}
                          onChange={(e) => handleVideoChange(idx, 'durationMinutes', Number(e.target.value))}
                          placeholder="Mins"
                          className="w-full text-xs font-semibold outline-none"
                        />
                        <span className="text-[10px] text-slate-400 font-bold">mins</span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-center">
                    <div className="sm:col-span-2">
                      <input
                        type="text"
                        value={vid.youtubeUrl}
                        onChange={(e) => handleVideoChange(idx, 'youtubeUrl', e.target.value)}
                        placeholder="YouTube URL: e.g. https://www.youtube.com/watch?v=..."
                        className="w-full h-9 px-3 bg-white border border-slate-200 rounded-xl text-xs font-mono text-slate-800 outline-none focus:border-[#E76120]"
                      />
                    </div>

                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={vid.isHelpVideo}
                        onChange={(e) => handleVideoChange(idx, 'isHelpVideo', e.target.checked)}
                        className="w-4 h-4 rounded border-slate-300 text-[#E76120] accent-[#E76120] cursor-pointer"
                      />
                      <span className="text-xs font-bold text-slate-700">Portal Help Video</span>
                    </label>
                  </div>
                </div>
              ))}

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddVideo}
                className="w-full rounded-xl text-xs font-bold border-dashed border-slate-300 text-[#284661] cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5 mr-1" />
                <span>Add Another Video Lecture</span>
              </Button>
            </div>
          </div>
        )}

        {/* TAB 4: MCQ ASSESSMENT BUILDER */}
        {activeTab === 'quiz' && (
          <div className="space-y-4 max-h-[55vh] overflow-y-auto pr-1">
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-bold text-slate-900 text-sm block">Time-Bound MCQ Assessment Engine</span>
                  <p className="text-[11px] text-slate-500">
                    Subscribers must pass this quiz to generate an official completion certificate.
                  </p>
                </div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.assessment.enabled}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        assessment: { ...formData.assessment, enabled: e.target.checked },
                      })
                    }
                    className="w-4 h-4 rounded border-slate-300 text-[#E76120] accent-[#E76120] cursor-pointer"
                  />
                  <span className="font-bold text-xs text-slate-800">Enable Assessment</span>
                </label>
              </div>

              {formData.assessment.enabled && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-200">
                  <InputField
                    id="timeLimitMinutes"
                    label="Assessment Time Limit (Minutes)"
                    type="number"
                    value={formData.assessment.timeLimitMinutes}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        assessment: {
                          ...formData.assessment,
                          timeLimitMinutes: Number(e.target.value),
                        },
                      })
                    }
                    required
                  />

                  <InputField
                    id="passingScorePercent"
                    label="Minimum Passing Score (%)"
                    type="number"
                    value={formData.assessment.passingScorePercent}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        assessment: {
                          ...formData.assessment,
                          passingScorePercent: Number(e.target.value),
                        },
                      })
                    }
                    required
                  />
                </div>
              )}
            </div>

            {/* Questions List */}
            {formData.assessment.enabled && (
              <div className="space-y-3">
                <span className="text-xs font-bold text-slate-900 block">
                  Questions Pool ({formData.assessment.questions.length} Total)
                </span>

                {formData.assessment.questions.map((q, qIdx) => (
                  <div
                    key={qIdx}
                    className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-slate-800">
                        Question #{qIdx + 1}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRemoveQuestion(qIdx)}
                        disabled={formData.assessment.questions.length === 1}
                        className="p-1 rounded text-slate-400 hover:text-red-600 hover:bg-slate-200 disabled:opacity-30 cursor-pointer"
                        title="Remove question"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <input
                      type="text"
                      value={q.questionText}
                      onChange={(e) => handleQuestionChange(qIdx, 'questionText', e.target.value)}
                      placeholder="Enter question statement..."
                      className="w-full h-9 px-3 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 outline-none focus:border-[#E76120]"
                    />

                    {/* 4 Multiple Choice Options */}
                    <div className="space-y-2">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                        Options &amp; Correct Answer Key
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {['A', 'B', 'C', 'D'].map((letter, optIdx) => (
                          <div
                            key={optIdx}
                            className={`flex items-center gap-2 p-2 rounded-xl border ${
                              q.correctOptionIndex === optIdx
                                ? 'bg-emerald-50 border-emerald-300'
                                : 'bg-white border-slate-200'
                            }`}
                          >
                            <input
                              type="radio"
                              name={`correct_${qIdx}`}
                              checked={q.correctOptionIndex === optIdx}
                              onChange={() => handleQuestionChange(qIdx, 'correctOptionIndex', optIdx)}
                              className="accent-emerald-600 cursor-pointer"
                              title="Mark as correct option"
                            />
                            <span className="font-bold text-xs text-slate-600">{letter}.</span>
                            <input
                              type="text"
                              value={q.options[optIdx] || ''}
                              onChange={(e) => handleOptionChange(qIdx, optIdx, e.target.value)}
                              placeholder={`Option ${letter}...`}
                              className="flex-1 bg-transparent text-xs outline-none text-slate-800"
                            />
                          </div>
                        ))}
                      </div>
                    </div>

                    <input
                      type="text"
                      value={q.explanation || ''}
                      onChange={(e) => handleQuestionChange(qIdx, 'explanation', e.target.value)}
                      placeholder="Optional explanation / clinical rationale shown after quiz..."
                      className="w-full h-8 px-3 bg-white/70 border border-slate-200 rounded-xl text-[11px] text-slate-600 outline-none focus:border-[#E76120]"
                    />
                  </div>
                ))}

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAddQuestion}
                  className="w-full rounded-xl text-xs font-bold border-dashed border-slate-300 text-[#284661] cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5 mr-1" />
                  <span>Add Another MCQ Question</span>
                </Button>
              </div>
            )}
          </div>
        )}

        {/* TAB 5: CERTIFICATE CONFIGURATION */}
        {activeTab === 'certificate' && (
          <div className="space-y-4 max-h-[55vh] overflow-y-auto pr-1">
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-bold text-slate-900 text-sm block">IPC Course Completion Certificate</span>
                  <p className="text-[11px] text-slate-500">
                    Automatically issued and emailed to the learner upon passing the assessment.
                  </p>
                </div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.certificate.enabled}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        certificate: { ...formData.certificate, enabled: e.target.checked },
                      })
                    }
                    className="w-4 h-4 rounded border-slate-300 text-[#E76120] accent-[#E76120] cursor-pointer"
                  />
                  <span className="font-bold text-xs text-slate-800">Enable Certificate</span>
                </label>
              </div>

              {formData.certificate.enabled && (
                <div className="space-y-3 pt-2 border-t border-slate-200">
                  <InputField
                    id="certTitle"
                    label="Certificate Header Title"
                    value={formData.certificate.title}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        certificate: { ...formData.certificate, title: e.target.value },
                      })
                    }
                    required
                  />

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <InputField
                      id="validityMonths"
                      label="Validity (Months)"
                      type="number"
                      value={formData.certificate.validityMonths}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          certificate: {
                            ...formData.certificate,
                            validityMonths: Number(e.target.value),
                          },
                        })
                      }
                      helperText="e.g. 24 months"
                      required
                    />

                    <div className="sm:col-span-2">
                      <InputField
                        id="signatoryTitle"
                        label="Issuing Authority Title"
                        value={formData.certificate.signatoryTitle}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            certificate: {
                              ...formData.certificate,
                              signatoryTitle: e.target.value,
                            },
                          })
                        }
                        placeholder="Indian Pharmacopoeia Commission (IPC)"
                        required
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Modal Footer Actions */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-200">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onClose}
            className="rounded-xl text-xs font-semibold cursor-pointer"
          >
            Cancel
          </Button>

          <Button
            type="submit"
            variant="nfiYellow"
            size="sm"
            loading={loading}
            className="rounded-xl text-xs font-bold shadow-2xs cursor-pointer"
          >
            <Save className="w-3.5 h-3.5 mr-1" />
            <span>{isEdit ? 'Save Changes' : 'Create DIKSHA Course'}</span>
          </Button>
        </div>
      </form>
    </AdminModal>
  );
};

export default CreateEditCourseModal;
