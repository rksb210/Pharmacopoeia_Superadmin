import React, { useState, useEffect } from 'react';
import AdminModal from '../common/AdminModal';
import InputField from '../../common/InputField';
import { AlertCircle } from 'lucide-react';

export const CreateEditSubChapterModal = ({
  isOpen,
  onClose,
  subChapter = null,
  chapters = [],
  selectedChapterId = '',
  onSuccess,
}) => {
  const [formData, setFormData] = useState({
    chapterId: '',
    title: '',
    code: '',
    subChapterNumber: '',
    description: '',
    order: 0,
    isActive: true,
  });
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isEditMode = !!subChapter;

  useEffect(() => {
    if (subChapter) {
      setFormData({
        chapterId: subChapter.chapterId?._id || subChapter.chapterId || selectedChapterId || '',
        title: subChapter.title || '',
        code: subChapter.code || '',
        subChapterNumber: subChapter.subChapterNumber || '',
        description: subChapter.description || '',
        order: subChapter.order ?? 0,
        isActive: subChapter.isActive ?? true,
      });
    } else {
      setFormData({
        chapterId: selectedChapterId || (chapters.length > 0 ? chapters[0]._id : ''),
        title: '',
        code: '',
        subChapterNumber: '',
        description: '',
        order: 0,
        isActive: true,
      });
    }
    setErrors({});
    setApiError('');
  }, [subChapter, selectedChapterId, chapters, isOpen]);

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
    if (!formData.chapterId) ne.chapterId = 'Parent chapter is required';
    if (!formData.title.trim()) ne.title = 'Sub-Chapter title is required';
    if (!formData.code.trim()) ne.code = 'Sub-Chapter code is required';
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
        chapterId: formData.chapterId,
        title: formData.title.trim(),
        code: formData.code.trim().toUpperCase(),
        subChapterNumber: formData.subChapterNumber.trim(),
        description: formData.description.trim(),
        order: Number(formData.order) || 0,
        isActive: formData.isActive,
      };
      if (onSuccess) await onSuccess(payload, isEditMode ? subChapter._id : null);
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
      title={isEditMode ? `Edit Sub-Chapter: ${subChapter?.title}` : 'Create New Sub-Chapter'}
      description={isEditMode ? 'Update sub-chapter details and classification.' : 'Add a new sub-chapter under a parent chapter.'}
      confirmLabel={isEditMode ? 'Save Changes' : 'Create Sub-Chapter'}
      isConfirming={isSubmitting}
      onConfirm={handleSubmit}
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {apiError && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
            <span>{apiError}</span>
          </div>
        )}

        <div className="space-y-1">
          <label className="text-xs font-semibold text-slate-700">Parent Chapter *</label>
          <select
            name="chapterId"
            value={formData.chapterId}
            onChange={handleChange}
            className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-[#FFD243] bg-white font-medium text-slate-800"
          >
            <option value="">-- Select Parent Chapter --</option>
            {chapters.map((ch) => (
              <option key={ch._id} value={ch._id}>
                {ch.chapterNumber ? `${ch.chapterNumber}: ` : ''}{ch.title} ({ch.code})
              </option>
            ))}
          </select>
          {errors.chapterId && <p className="text-xs text-red-500 font-medium">{errors.chapterId}</p>}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <InputField
            label="Sub-Chapter Number"
            name="subChapterNumber"
            value={formData.subChapterNumber}
            onChange={handleChange}
            placeholder="e.g. 1.1 or Section A"
          />

          <InputField
            label="Sub-Chapter Code"
            name="code"
            value={formData.code}
            onChange={handleChange}
            error={errors.code}
            placeholder="e.g. CNS-ANALGESIC"
            required
          />
        </div>

        <InputField
          label="Sub-Chapter Title"
          name="title"
          value={formData.title}
          onChange={handleChange}
          error={errors.title}
          placeholder="e.g. Non-Opioid Analgesics and Antipyretics"
          required
        />

        <div className="space-y-1">
          <label className="text-xs font-semibold text-slate-700">Description</label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows={3}
            placeholder="Overview of this therapeutic class or group..."
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

          <div className="flex items-center gap-2 pt-5">
            <input
              type="checkbox"
              id="subChapterIsActive"
              name="isActive"
              checked={formData.isActive}
              onChange={handleChange}
              className="w-4 h-4 rounded text-orange-600 border-slate-300 focus:ring-orange-500"
            />
            <label htmlFor="subChapterIsActive" className="text-xs font-semibold text-slate-700 cursor-pointer">
              Active in Formulary
            </label>
          </div>
        </div>
      </form>
    </AdminModal>
  );
};

export default CreateEditSubChapterModal;
