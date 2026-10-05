import React, { useState, useEffect } from 'react';
import AdminModal from '../common/AdminModal';
import InputField from '../../common/InputField';
import { AlertCircle, BookOpen, Layers, Hash, FileText } from 'lucide-react';
import appendixService from '../../../services/appendix.service';

export const CreateEditAppendixModal = ({
  isOpen,
  onClose,
  appendix = null,
  onSuccess,
}) => {
  const isEditMode = !!appendix;

  const [formData, setFormData] = useState({
    number: '',
    title: '',
    slug: '',
    order: 1,
    status: 'ACTIVE',
    pageRangeStart: '',
    pageRangeEnd: '',
    bookPageRangeStart: '',
    bookPageRangeEnd: '',
    sourceText: '',
  });

  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (appendix) {
      setFormData({
        number: appendix.number || '',
        title: appendix.title || '',
        slug: appendix.slug || '',
        order: appendix.order ?? 1,
        status: appendix.status || (appendix.isActive ? 'ACTIVE' : 'INACTIVE'),
        pageRangeStart: appendix.pageRange?.start ?? '',
        pageRangeEnd: appendix.pageRange?.end ?? '',
        bookPageRangeStart: appendix.bookPageRange?.start ?? '',
        bookPageRangeEnd: appendix.bookPageRange?.end ?? '',
        sourceText: appendix.sourceText || '',
      });
    } else {
      setFormData({
        number: '',
        title: '',
        slug: '',
        order: 1,
        status: 'ACTIVE',
        pageRangeStart: '',
        pageRangeEnd: '',
        bookPageRangeStart: '',
        bookPageRangeEnd: '',
        sourceText: '',
      });
    }
    setErrors({});
    setApiError('');
  }, [appendix, isOpen]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
    if (apiError) setApiError('');
  };

  const validate = () => {
    const errs = {};
    if (!formData.number.trim()) errs.number = 'Appendix number is required (e.g. "1", "2")';
    if (!formData.title.trim()) errs.title = 'Appendix title is required';
    if (formData.pageRangeStart && formData.pageRangeEnd) {
      if (Number(formData.pageRangeStart) > Number(formData.pageRangeEnd)) {
        errs.pageRangeEnd = 'End page must be greater than or equal to start page';
      }
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    setApiError('');

    try {
      const payload = {
        number: formData.number.trim(),
        title: formData.title.trim(),
        slug: formData.slug.trim() || undefined,
        order: Number(formData.order) || 1,
        status: formData.status,
        pageRange: {
          start: formData.pageRangeStart ? Number(formData.pageRangeStart) : null,
          end: formData.pageRangeEnd ? Number(formData.pageRangeEnd) : null,
        },
        bookPageRange: {
          start: formData.bookPageRangeStart ? Number(formData.bookPageRangeStart) : null,
          end: formData.bookPageRangeEnd ? Number(formData.bookPageRangeEnd) : null,
        },
        sourceText: formData.sourceText,
      };

      if (isEditMode) {
        await appendixService.updateAppendix(appendix._id, payload);
      } else {
        await appendixService.createAppendix(payload);
      }

      onSuccess(isEditMode ? 'Appendix updated successfully.' : 'Appendix created successfully.');
      onClose();
    } catch (err) {
      setApiError(err.response?.data?.message || err.message || 'Failed to save appendix');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AdminModal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditMode ? `Edit Appendix ${appendix.number}: ${appendix.title}` : 'Add New Appendix'}
      description="National Formulary of India (NFI) clinical guidelines, protocols, and reference appendix."
      size="2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {apiError && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2.5 text-xs text-red-700">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
            <span>{apiError}</span>
          </div>
        )}

        {/* Row 1: Number, Order, Status */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <InputField
            label="Appendix Number *"
            name="number"
            value={formData.number}
            onChange={handleChange}
            placeholder="e.g. 1, 2, 3"
            error={errors.number}
            required
          />

          <InputField
            label="Display Order"
            name="order"
            type="number"
            value={formData.order}
            onChange={handleChange}
            placeholder="1"
          />

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
              Status
            </label>
            <select
              name="status"
              value={formData.status}
              onChange={handleChange}
              className="w-full text-xs font-semibold px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
            >
              <option value="ACTIVE">ACTIVE (Published)</option>
              <option value="INACTIVE">INACTIVE (Hidden)</option>
            </select>
          </div>
        </div>

        {/* Row 2: Title and Slug */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="sm:col-span-2">
            <InputField
              label="Appendix Title *"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="e.g. Antimicrobial Resistance, Common Drug Reactions"
              error={errors.title}
              required
            />
          </div>

          <div>
            <InputField
              label="Custom URL Slug (Optional)"
              name="slug"
              value={formData.slug}
              onChange={handleChange}
              placeholder="auto-generated if empty"
            />
          </div>
        </div>

        {/* Row 3: Page Ranges */}
        <div className="p-3.5 bg-slate-50/70 border border-slate-200 rounded-2xl space-y-3">
          <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
            <BookOpen className="w-3.5 h-3.5 text-orange-600" />
            <span>Formulary Page Coverage</span>
          </h4>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <InputField
              label="NFI Page Start"
              name="pageRangeStart"
              type="number"
              value={formData.pageRangeStart}
              onChange={handleChange}
              placeholder="e.g. 914"
            />
            <InputField
              label="NFI Page End"
              name="pageRangeEnd"
              type="number"
              value={formData.pageRangeEnd}
              onChange={handleChange}
              placeholder="e.g. 919"
              error={errors.pageRangeEnd}
            />
            <InputField
              label="Book Page Start"
              name="bookPageRangeStart"
              type="number"
              value={formData.bookPageRangeStart}
              onChange={handleChange}
              placeholder="e.g. 832"
            />
            <InputField
              label="Book Page End"
              name="bookPageRangeEnd"
              type="number"
              value={formData.bookPageRangeEnd}
              onChange={handleChange}
              placeholder="e.g. 837"
            />
          </div>
        </div>

        {/* Row 4: Clinical Guidance / Source Text */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
              Clinical Text & Content Guidelines
            </label>
            <span className="text-[11px] text-slate-400 font-mono">
              {formData.sourceText.length.toLocaleString()} characters
            </span>
          </div>

          <textarea
            name="sourceText"
            value={formData.sourceText}
            onChange={handleChange}
            rows={10}
            placeholder="Paste or write the complete clinical guidance text for this appendix..."
            className="w-full text-xs font-normal leading-relaxed p-3.5 rounded-xl border border-slate-200 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 font-mono resize-y"
          />
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 rounded-xl hover:bg-slate-100 cursor-pointer transition-colors"
          >
            Cancel
          </button>

          <button
            type="submit"
            disabled={isSubmitting}
            className="px-5 py-2 text-xs font-bold text-white bg-orange-600 hover:bg-orange-700 disabled:opacity-50 rounded-xl shadow-xs cursor-pointer transition-colors"
          >
            {isSubmitting ? 'Saving...' : isEditMode ? 'Update Appendix' : 'Create Appendix'}
          </button>
        </div>
      </form>
    </AdminModal>
  );
};

export default CreateEditAppendixModal;
