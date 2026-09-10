import React, { useState, useEffect, useRef } from 'react';
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
  FileText,
  UploadCloud,
  Loader2,
  Paperclip,
  ExternalLink,
  Upload,
} from 'lucide-react';
import { AdminModal } from '../common/AdminModal';
import { Button } from '../../ui/button';
import InputField from '../../common/InputField';
import dikshaService from '../../../services/diksha.service';

const TABS = [
  { id: 'basic', label: '1. Basic Info', icon: BookOpen },
  { id: 'pricing', label: '2. Pricing & Access', icon: DollarSign },
  { id: 'videos', label: '3. Video Curriculum', icon: Video },
  { id: 'materials', label: '4. Study Materials', icon: FileText },
  { id: 'quiz', label: '5. MCQ Assessment', icon: FileQuestion },
  { id: 'certificate', label: '6. Certificate', icon: Award },
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
  'UNIVERSITIES_COLLEGES',
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
  const [uploadingIndex, setUploadingIndex] = useState(null);
  const [isBulkUploading, setIsBulkUploading] = useState(false);
  const batchFileInputRef = useRef(null);

  // Form State
  const [formData, setFormData] = useState({
    code: '',
    title: '',
    description: '',
    thumbnailUrl: '',
    category: 'NFI_ORIENTATION',
    targetAudience: ['DOCTOR', 'PHARMACIST', 'STUDENT', 'NURSE', 'INDUSTRY', 'UNIVERSITIES_COLLEGES', 'OTHERS'],
    status: 'DRAFT',
    pricing: {
      isPaid: false,
      priceINR: '',
      discountPriceINR: '',
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
          priceINR: course.pricing?.priceINR !== undefined && course.pricing?.priceINR !== null ? course.pricing.priceINR : '',
          discountPriceINR: course.pricing?.discountPriceINR !== undefined && course.pricing?.discountPriceINR !== null ? course.pricing.discountPriceINR : '',
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
          priceINR: '',
          discountPriceINR: '',
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

  // Materials Handler
  const handleAddMaterial = () => {
    setFormData({
      ...formData,
      materials: [
        ...(formData.materials || []),
        {
          title: `Study Material ${(formData.materials?.length || 0) + 1}`,
          fileUrl: '',
          type: 'PDF',
        },
      ],
    });
  };

  const handleRemoveMaterial = (index) => {
    setFormData({
      ...formData,
      materials: (formData.materials || []).filter((_, idx) => idx !== index),
    });
  };

  const handleMaterialChange = (index, field, value) => {
    const updated = [...(formData.materials || [])];
    updated[index][field] = value;
    setFormData({ ...formData, materials: updated });
  };

  // Direct File Upload from user's system for a specific material item
  const handleMaterialFileUpload = async (index, file) => {
    if (!file) return;
    try {
      setUploadingIndex(index);
      setError('');
      const res = await dikshaService.uploadMaterial(file);
      if (res.success && res.data) {
        const { fileUrl, fileName, fileSize } = res.data;
        const updated = [...(formData.materials || [])];

        let fileType = 'PDF';
        const lowerName = (fileName || file.name).toLowerCase();
        if (lowerName.endsWith('.pdf')) fileType = 'PDF';
        else if (lowerName.endsWith('.doc') || lowerName.endsWith('.docx')) fileType = 'DOC';
        else if (lowerName.endsWith('.ppt') || lowerName.endsWith('.pptx')) fileType = 'SLIDES';
        else if (lowerName.endsWith('.xls') || lowerName.endsWith('.xlsx')) fileType = 'GUIDELINE';
        else fileType = 'OTHER';

        let currentTitle = updated[index]?.title || '';
        if (!currentTitle.trim() || currentTitle.startsWith('Study Material')) {
          currentTitle = (fileName || file.name)
            .replace(/\.[^/.]+$/, '')
            .replace(/[_-]+/g, ' ')
            .replace(/\b\w/g, (c) => c.toUpperCase());
        }

        updated[index] = {
          ...updated[index],
          fileUrl,
          fileName: fileName || file.name,
          fileSize: fileSize || '',
          title: currentTitle,
          type: updated[index]?.type || fileType,
        };
        setFormData({ ...formData, materials: updated });
      }
    } catch (err) {
      setError(err.message || 'Failed to upload document from your system.');
    } finally {
      setUploadingIndex(null);
    }
  };

  // Upload multiple files directly from PC to append as new materials
  const handleBatchMaterialUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setIsBulkUploading(true);
    setError('');
    try {
      const newItems = [];
      for (const file of files) {
        const res = await dikshaService.uploadMaterial(file);
        if (res.success && res.data) {
          const { fileUrl, fileName, fileSize } = res.data;
          let fileType = 'PDF';
          const lowerName = (fileName || file.name).toLowerCase();
          if (lowerName.endsWith('.pdf')) fileType = 'PDF';
          else if (lowerName.endsWith('.doc') || lowerName.endsWith('.docx')) fileType = 'DOC';
          else if (lowerName.endsWith('.ppt') || lowerName.endsWith('.pptx')) fileType = 'SLIDES';
          else if (lowerName.endsWith('.xls') || lowerName.endsWith('.xlsx')) fileType = 'GUIDELINE';
          else fileType = 'OTHER';

          const title = (fileName || file.name)
            .replace(/\.[^/.]+$/, '')
            .replace(/[_-]+/g, ' ')
            .replace(/\b\w/g, (c) => c.toUpperCase());

          newItems.push({
            title,
            fileUrl,
            fileName: fileName || file.name,
            fileSize: fileSize || '',
            type: fileType,
          });
        }
      }
      setFormData((prev) => ({
        ...prev,
        materials: [...(prev.materials || []), ...newItems],
      }));
    } catch (err) {
      setError(err.message || 'Failed to upload some documents from your system.');
    } finally {
      setIsBulkUploading(false);
      if (batchFileInputRef.current) {
        batchFileInputRef.current.value = '';
      }
    }
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

    if (formData.pricing?.isPaid) {
      const price = Number(formData.pricing.priceINR) || 0;
      const discount = Number(formData.pricing.discountPriceINR) || 0;
      if (price <= 0) {
        setError('Standard enrollment fee must be greater than 0 for commercial paid courses.');
        setActiveTab('pricing');
        return;
      }
      if (discount > price) {
        setError(`Special Discounted Fee (₹${discount}) cannot be greater than Standard Enrollment Fee (₹${price}).`);
        setActiveTab('pricing');
        return;
      }
    }

    setLoading(true);
    setError('');

    const payload = {
      ...formData,
      pricing: {
        ...formData.pricing,
        priceINR: formData.pricing.isPaid ? (Number(formData.pricing.priceINR) || 0) : 0,
        discountPriceINR: formData.pricing.isPaid ? (Number(formData.pricing.discountPriceINR) || 0) : 0,
      },
      assessment: {
        ...formData.assessment,
        timeLimitMinutes: Number(formData.assessment.timeLimitMinutes) || 15,
        passingScorePercent: Number(formData.assessment.passingScorePercent) || 70,
      },
      videos: formData.videos.map((v) => ({
        ...v,
        durationMinutes: Number(v.durationMinutes) || 0,
      })),
      materials: (formData.materials || [])
        .filter((m) => m.title?.trim() || m.fileUrl?.trim())
        .map((m) => ({
          title: m.title.trim(),
          fileUrl: m.fileUrl.trim(),
          type: m.type || 'PDF',
          fileName: m.fileName || '',
          fileSize: m.fileSize || '',
        })),
    };

    try {
      await onSave(payload);
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
      footer={false}
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
                      <span>{type === 'UNIVERSITIES_COLLEGES' ? 'Universities / Colleges' : type}</span>
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
                    min="0"
                    placeholder="e.g. 499"
                    value={formData.pricing.priceINR !== undefined && formData.pricing.priceINR !== null ? formData.pricing.priceINR : ''}
                    onChange={(e) => {
                      const val = e.target.value;
                      setFormData({
                        ...formData,
                        pricing: {
                          ...formData.pricing,
                          priceINR: val === '' ? '' : Math.max(0, Number(val)),
                        },
                      });
                    }}
                    required
                  />

                  <InputField
                    id="discountPriceINR"
                    label="Special Discounted Fee (INR ₹)"
                    type="number"
                    min="0"
                    placeholder="0"
                    value={formData.pricing.discountPriceINR !== undefined && formData.pricing.discountPriceINR !== null ? formData.pricing.discountPriceINR : ''}
                    onChange={(e) => {
                      const val = e.target.value;
                      setFormData({
                        ...formData,
                        pricing: {
                          ...formData.pricing,
                          discountPriceINR: val === '' ? '' : Math.max(0, Number(val)),
                        },
                      });
                    }}
                    error={
                      Number(formData.pricing.discountPriceINR) > Number(formData.pricing.priceINR) &&
                      Number(formData.pricing.discountPriceINR) > 0
                        ? `Discount (₹${formData.pricing.discountPriceINR}) cannot exceed standard price (₹${formData.pricing.priceINR || 0})`
                        : ''
                    }
                    helperText={
                      !(
                        Number(formData.pricing.discountPriceINR) > Number(formData.pricing.priceINR) &&
                        Number(formData.pricing.discountPriceINR) > 0
                      )
                        ? 'Leave empty or 0 if no discounted offer is running'
                        : ''
                    }
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
                          min="0"
                          value={vid.durationMinutes !== undefined && vid.durationMinutes !== null ? vid.durationMinutes : ''}
                          onChange={(e) => {
                            const val = e.target.value;
                            handleVideoChange(idx, 'durationMinutes', val === '' ? '' : Math.max(0, Number(val)));
                          }}
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

        {/* TAB 4: STUDY MATERIALS & PDFS */}
        {activeTab === 'materials' && (
          <div className="space-y-4 max-h-[55vh] overflow-y-auto pr-1">
            {/* Top Info Banner */}
            <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-xl text-[11px] text-blue-900 leading-relaxed flex items-center gap-2">
              <FileText className="w-4 h-4 text-[#284661] shrink-0" />
              <span>
                Attach downloadable reference PDFs, clinical guidelines, monographs, or handbooks for enrolled candidates.
              </span>
            </div>

            <div className="space-y-3">
              {(!formData.materials || formData.materials.length === 0) ? (
                <div className="p-8 text-center border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50/50 space-y-3">
                  <FileText className="w-8 h-8 text-slate-300 mx-auto" />
                  <div>
                    <p className="text-xs font-bold text-slate-700">No Study Materials Added</p>
                    <p className="text-[11px] text-slate-400 max-w-sm mx-auto mt-0.5">
                      You can upload PDF files, monographs, or add document links below.
                    </p>
                  </div>
                  <div className="flex items-center justify-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => batchFileInputRef.current?.click()}
                      disabled={isBulkUploading}
                      className="px-4 py-2 rounded-xl bg-[#284661] text-white hover:bg-[#1e354a] text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-sm transition-all"
                    >
                      {isBulkUploading ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Uploading...</span>
                        </>
                      ) : (
                        <>
                          <Upload className="w-3.5 h-3.5" />
                          <span>Upload Files</span>
                        </>
                      )}
                    </button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleAddMaterial}
                      className="rounded-xl text-xs font-bold text-slate-700 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5 mr-1" />
                      <span>Add Manually</span>
                    </Button>
                  </div>
                </div>
              ) : (
                formData.materials.map((mat, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2.5 relative group"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-slate-800 flex items-center gap-1.5">
                        <span className="w-5 h-5 rounded-full bg-[#284661] text-white text-[10px] flex items-center justify-center font-mono font-bold">
                          {idx + 1}
                        </span>
                        <span>Study Material #{idx + 1}</span>
                      </span>

                      <button
                        type="button"
                        onClick={() => handleRemoveMaterial(idx)}
                        className="p-1 rounded text-slate-400 hover:text-red-600 hover:bg-slate-200 cursor-pointer transition-colors"
                        title="Remove material"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                      <div className="sm:col-span-2">
                        <input
                          type="text"
                          value={mat.title || ''}
                          onChange={(e) => handleMaterialChange(idx, 'title', e.target.value)}
                          placeholder="Document Title (e.g. NFI 9th Edition Handbook)..."
                          className="w-full h-9 px-3 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 outline-none focus:border-[#E76120]"
                        />
                      </div>

                      <div>
                        <select
                          value={mat.type || 'PDF'}
                          onChange={(e) => handleMaterialChange(idx, 'type', e.target.value)}
                          className="w-full h-9 px-3 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 outline-none focus:border-[#E76120] cursor-pointer"
                        >
                          <option value="PDF">PDF Document (.pdf)</option>
                          <option value="DOC">Word Document (.docx)</option>
                          <option value="SLIDES">Presentation Slides (.pptx)</option>
                          <option value="GUIDELINE">Official Guideline</option>
                          <option value="OTHER">Other Resource</option>
                        </select>
                      </div>
                    </div>

                    {/* Single unified file URL input + Upload File button */}
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={mat.fileUrl || ''}
                          onChange={(e) => handleMaterialChange(idx, 'fileUrl', e.target.value)}
                          placeholder="File URL (or click Upload File to select)..."
                          className="flex-1 h-9 px-3 bg-white border border-slate-200 rounded-xl text-xs font-mono text-slate-800 outline-none focus:border-[#E76120]"
                        />

                        <label className="h-9 px-3.5 bg-[#284661] hover:bg-[#1e354a] text-white text-xs font-bold rounded-xl flex items-center gap-1.5 cursor-pointer shrink-0 transition-colors shadow-sm">
                          {uploadingIndex === idx ? (
                            <>
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              <span>Uploading...</span>
                            </>
                          ) : (
                            <>
                              <Upload className="w-3.5 h-3.5" />
                              <span>Upload File</span>
                            </>
                          )}
                          <input
                            type="file"
                            accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt"
                            className="hidden"
                            disabled={uploadingIndex === idx}
                            onChange={(e) => {
                              if (e.target.files?.[0]) {
                                handleMaterialFileUpload(idx, e.target.files[0]);
                              }
                            }}
                          />
                        </label>

                        {mat.fileUrl && (
                          <a
                            href={mat.fileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="h-9 px-3 bg-white border border-slate-200 hover:bg-slate-100 text-[#284661] text-xs font-bold rounded-xl flex items-center gap-1 shrink-0 transition-colors"
                            title="Preview document"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                            <span>Preview</span>
                          </a>
                        )}
                      </div>

                      {/* File Info badge when attached */}
                      {(mat.fileName || mat.fileSize) && (
                        <div className="flex items-center gap-2 text-[11px] text-emerald-700 font-medium px-1">
                          <Paperclip className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span className="truncate">{mat.fileName}</span>
                          {mat.fileSize && (
                            <span className="px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800 text-[10px] font-mono font-bold">
                              {mat.fileSize}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}

              {/* Action Buttons */}
              <div className="flex items-center gap-2 pt-1">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAddMaterial}
                  className="flex-1 rounded-xl text-xs font-bold border-dashed border-slate-300 text-[#284661] cursor-pointer hover:bg-slate-100"
                >
                  <Plus className="w-3.5 h-3.5 mr-1" />
                  <span>Add Study Material</span>
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => batchFileInputRef.current?.click()}
                  disabled={isBulkUploading}
                  className="rounded-xl text-xs font-bold border-dashed border-blue-300 bg-blue-50/50 text-[#284661] cursor-pointer hover:bg-blue-100/60"
                >
                  {isBulkUploading ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin text-[#284661]" />
                      <span>Uploading...</span>
                    </>
                  ) : (
                    <>
                      <Upload className="w-3.5 h-3.5 mr-1 text-[#284661]" />
                      <span>Upload Files</span>
                    </>
                  )}
                </Button>
              </div>
            </div>

            {/* Hidden Input for batch uploads */}
            <input
              ref={batchFileInputRef}
              type="file"
              multiple
              accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt"
              className="hidden"
              onChange={handleBatchMaterialUpload}
            />
          </div>
        )}

        {/* TAB 5: MCQ ASSESSMENT BUILDER */}
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
                    min="1"
                    placeholder="e.g. 15"
                    value={formData.assessment.timeLimitMinutes !== undefined && formData.assessment.timeLimitMinutes !== null ? formData.assessment.timeLimitMinutes : ''}
                    onChange={(e) => {
                      const val = e.target.value;
                      setFormData({
                        ...formData,
                        assessment: {
                          ...formData.assessment,
                          timeLimitMinutes: val === '' ? '' : Math.max(1, Number(val)),
                        },
                      });
                    }}
                    required
                  />

                  <InputField
                    id="passingScorePercent"
                    label="Minimum Passing Score (%)"
                    type="number"
                    min="1"
                    max="100"
                    placeholder="e.g. 70"
                    value={formData.assessment.passingScorePercent !== undefined && formData.assessment.passingScorePercent !== null ? formData.assessment.passingScorePercent : ''}
                    onChange={(e) => {
                      const val = e.target.value;
                      setFormData({
                        ...formData,
                        assessment: {
                          ...formData.assessment,
                          passingScorePercent: val === '' ? '' : Math.min(100, Math.max(0, Number(val))),
                        },
                      });
                    }}
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
