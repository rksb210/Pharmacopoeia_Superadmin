import React, { useState, useEffect } from 'react';
import AdminModal from '../common/AdminModal';
import InputField from '../../common/InputField';
import { AlertCircle } from 'lucide-react';

export const CreateEditChapterModal = ({ isOpen, onClose, chapter = null, onSuccess }) => {
  const [formData, setFormData] = useState({
    title: '',
    code: '',
    chapterNumber: '',
    description: '',
    order: 0,
    status: 'in_review',
    isActive: true,
  });
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isEditMode = !!chapter;

  useEffect(() => {
    if (chapter) {
      setFormData({
        title: chapter.title || '',
        code: chapter.code || '',
        chapterNumber: chapter.chapterNumber || '',
        description: chapter.description || '',
        order: chapter.order ?? 0,
        status: chapter.status || 'in_review',
        isActive: chapter.isActive ?? true,
      });
    } else {
      setFormData({
        title: '',
        code: '',
        chapterNumber: '',
        description: '',
        order: 0,
        status: 'in_review',
        isActive: true,
      });
    }
    setErrors({});
    setApiError('');
  }, [chapter, isOpen]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
    if (apiError) setApiError('');
  };

  const validate = () => {
    const ne = {};
    if (!formData.title.trim()) ne.title = 'Chapter title is required';
    if (!formData.code.trim()) ne.code = 'Chapter unique code is required';
    setErrors(ne);
    return Object.keys(ne).length === 0;
  };

  const handleSubmit = async (e) => {
    e?.preventDefault();
    if (!validate()) return;
    setIsSubmitting(true);
    setApiError('');
    try {
      const payload = {
        title: formData.title.trim(),
        code: formData.code.trim().toUpperCase(),
        chapterNumber: formData.chapterNumber.trim(),
        description: formData.description.trim(),
        order: Number(formData.order) || 0,
        status: formData.status || 'in_review',
        isActive: formData.isActive,
      };
      if (onSuccess) await onSuccess(payload, isEditMode ? chapter._id : null);
      onClose();
    } catch (err) {
      setApiError(err.message || 'Operation failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AdminModal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditMode ? `Edit Chapter: ${chapter?.title}` : 'Create New Chapter'}
      description={isEditMode ? 'Update chapter details. Edits require reviewer approval before publication.' : 'Add a new formulary chapter for editorial review.'}
      confirmLabel={isEditMode ? 'Save & Submit for Review' : 'Create & Submit for Review'}
      isConfirming={isSubmitting}
      onConfirm={handleSubmit}
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {isEditMode && chapter?.status === 'published' && (
          <div className="p-2.5 bg-amber-50/80 border border-amber-200 text-amber-900 text-xs rounded-xl flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-amber-600" />
            <span>
              <strong>Review Workflow:</strong> Editing this chapter will move it to <em>In Review</em>. A reviewer must review and approve it before changes are published live.
            </span>
          </div>
        )}

        {apiError && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
            <span>{apiError}</span>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <InputField
            label="Chapter Number"
            name="chapterNumber"
            value={formData.chapterNumber}
            onChange={handleChange}
            placeholder="e.g. Chapter 1 or 01"
          />

          <InputField
            label="Unique Code"
            name="code"
            value={formData.code}
            onChange={handleChange}
            error={errors.code}
            placeholder="e.g. CNS, CVD, ANTI-INF"
            required
          />
        </div>

        <InputField
          label="Chapter Title"
          name="title"
          value={formData.title}
          onChange={handleChange}
          error={errors.title}
          placeholder="e.g. Central Nervous System Drugs"
          required
        />

        <div className="space-y-1">
          <label className="text-xs font-semibold text-slate-700">Description / Overview</label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows={3}
            placeholder="Brief clinical overview of this chapter..."
            className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-[#FFD243] bg-white resize-y"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
          <InputField
            label="Display Order"
            name="order"
            type="number"
            value={formData.order}
            onChange={handleChange}
            placeholder="0"
          />

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700">Workflow Status</label>
            <select
              name="status"
              value={formData.status}
              onChange={handleChange}
              className="w-full text-xs p-2 rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-[#FFD243] bg-white font-medium text-slate-800"
            >
              <option value="in_review">In Review (Submit to Reviewer)</option>
              <option value="draft">Draft (Private Authoring)</option>
              <option value="published">Published (Live in Formulary)</option>
            </select>
          </div>
        </div>

        <div className="flex items-center gap-2 pt-2">
          <input
            type="checkbox"
            id="chapterIsActive"
            name="isActive"
            checked={formData.isActive}
            onChange={handleChange}
            className="w-4 h-4 rounded text-orange-600 border-slate-300 focus:ring-orange-500"
          />
          <label htmlFor="chapterIsActive" className="text-xs font-semibold text-slate-700 cursor-pointer">
            Active in Formulary
          </label>
        </div>
      </form>
    </AdminModal>
  );
};

export default CreateEditChapterModal;
