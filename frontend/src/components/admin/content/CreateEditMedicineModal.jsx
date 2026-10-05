import React, { useState, useEffect } from 'react';
import AdminModal from '../common/AdminModal';
import InputField from '../../common/InputField';
import { AlertCircle } from 'lucide-react';
import contentService from '../../../services/content.service';

export const CreateEditMedicineModal = ({
  isOpen,
  onClose,
  medicine = null,
  chapters = [],
  selectedChapterId = '',
  selectedSubChapterId = '',
  onSuccess,
}) => {
  const [formData, setFormData] = useState({
    name: '',
    brandNames: '',
    chapterId: '',
    subChapterId: '',
    therapeuticClass: '',
    dosageForm: '',
    strength: '',
    atcCode: '',
    schedule: 'Schedule H',
    status: 'published',
    isActive: true,
  });

  const [availableSubChapters, setAvailableSubChapters] = useState([]);
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isEditMode = !!medicine;

  // Load subchapters for selected chapter
  const loadSubChapters = async (chapId) => {
    if (!chapId) {
      setAvailableSubChapters([]);
      return;
    }
    try {
      const res = await contentService.getActiveSubChapters(chapId);
      if (res?.subChapters) setAvailableSubChapters(res.subChapters);
    } catch {
      setAvailableSubChapters([]);
    }
  };

  useEffect(() => {
    if (medicine) {
      const chapId = medicine.chapterId?._id || medicine.chapterId || '';
      const subId = medicine.subChapterId?._id || medicine.subChapterId || '';
      setFormData({
        name: medicine.name || '',
        brandNames: Array.isArray(medicine.brandNames) ? medicine.brandNames.join(', ') : '',
        chapterId: chapId,
        subChapterId: subId,
        therapeuticClass: medicine.therapeuticClass || '',
        dosageForm: medicine.dosageForm || '',
        strength: medicine.strength || '',
        atcCode: medicine.atcCode || '',
        schedule: medicine.schedule || 'Schedule H',
        status: medicine.status || 'published',
        isActive: medicine.isActive ?? true,
      });
      loadSubChapters(chapId);
    } else {
      const defaultChap = selectedChapterId || (chapters.length > 0 ? chapters[0]._id : '');
      setFormData({
        name: '',
        brandNames: '',
        chapterId: defaultChap,
        subChapterId: selectedSubChapterId || '',
        therapeuticClass: '',
        dosageForm: '',
        strength: '',
        atcCode: '',
        schedule: 'Schedule H',
        status: 'in_review',
        isActive: true,
      });
      loadSubChapters(defaultChap);
    }
    setErrors({});
    setApiError('');
  }, [medicine, selectedChapterId, selectedSubChapterId, chapters, isOpen]);

  const handleChapterChange = async (e) => {
    const chapId = e.target.value;
    setFormData((prev) => ({ ...prev, chapterId: chapId, subChapterId: '' }));
    if (errors.chapterId) setErrors((prev) => ({ ...prev, chapterId: '' }));
    loadSubChapters(chapId);
  };

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
    if (!formData.name.trim()) ne.name = 'Medicine generic name is required';
    if (!formData.chapterId) ne.chapterId = 'Parent Chapter is required';
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
        name: formData.name.trim(),
        brandNames: formData.brandNames
          ? formData.brandNames.split(',').map((b) => b.trim()).filter(Boolean)
          : [],
        chapterId: formData.chapterId,
        subChapterId: formData.subChapterId || null,
        therapeuticClass: formData.therapeuticClass.trim(),
        dosageForm: formData.dosageForm.trim(),
        strength: formData.strength.trim(),
        atcCode: formData.atcCode.trim().toUpperCase(),
        schedule: formData.schedule,
        status: formData.status || 'in_review',
        isActive: formData.isActive,
      };
      if (onSuccess) await onSuccess(payload, isEditMode ? medicine._id : null);
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
      title={isEditMode ? `Edit Medicine: ${medicine?.name}` : 'Add New Medicine Monograph'}
      description={isEditMode ? 'Update drug monograph metadata. Edits require reviewer approval before publication.' : 'Create a new drug monograph in the National Formulary for editorial review.'}
      confirmLabel={isEditMode ? 'Save & Submit for Review' : 'Create & Submit for Review'}
      isConfirming={isSubmitting}
      onConfirm={handleSubmit}
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {isEditMode && medicine?.status === 'published' && (
          <div className="p-2.5 bg-amber-50/80 border border-amber-200 text-amber-900 text-xs rounded-xl flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-amber-600" />
            <span>
              <strong>Review Workflow:</strong> Updating this published monograph will transition it to <em>In Committee Review</em>. Reviewer approval is required before changes go live.
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
            label="Generic / Monograph Name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            error={errors.name}
            placeholder="e.g. Metformin Hydrochloride"
            required
          />

          <InputField
            label="Brand / Proprietary Names"
            name="brandNames"
            value={formData.brandNames}
            onChange={handleChange}
            placeholder="Comma separated: Glucophage, Glycomet, Fortamet"
          />
        </div>

        {/* Chapter and Sub-Chapter Hierarchy */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700">Chapter *</label>
            <select
              name="chapterId"
              value={formData.chapterId}
              onChange={handleChapterChange}
              className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-[#FFD243] bg-white font-medium text-slate-800"
            >
              <option value="">-- Select Chapter --</option>
              {chapters.map((ch) => (
                <option key={ch._id} value={ch._id}>
                  {ch.chapterNumber ? `${ch.chapterNumber}: ` : ''}{ch.title} ({ch.code})
                </option>
              ))}
            </select>
            {errors.chapterId && <p className="text-xs text-red-500 font-medium">{errors.chapterId}</p>}
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700">Sub-Chapter (Classification)</label>
            <select
              name="subChapterId"
              value={formData.subChapterId}
              onChange={handleChange}
              disabled={!formData.chapterId}
              className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-[#FFD243] bg-white font-medium text-slate-800 disabled:bg-slate-100 disabled:text-slate-400"
            >
              <option value="">-- Optional: Select Sub-Chapter --</option>
              {availableSubChapters.map((sub) => (
                <option key={sub._id} value={sub._id}>
                  {sub.subChapterNumber ? `${sub.subChapterNumber}: ` : ''}{sub.title} ({sub.code})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Clinical Class & Dosage Form */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <InputField
            label="Therapeutic Class"
            name="therapeuticClass"
            value={formData.therapeuticClass}
            onChange={handleChange}
            placeholder="e.g. Biguanide Antihyperglycemic"
          />

          <InputField
            label="Dosage Form"
            name="dosageForm"
            value={formData.dosageForm}
            onChange={handleChange}
            placeholder="e.g. Tablet, Injection, Syrup"
          />

          <InputField
            label="Available Strengths"
            name="strength"
            value={formData.strength}
            onChange={handleChange}
            placeholder="e.g. 500 mg, 850 mg, 1000 mg"
          />
        </div>

        {/* Regulatory & Coding */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <InputField
            label="ATC Code"
            name="atcCode"
            value={formData.atcCode}
            onChange={handleChange}
            placeholder="e.g. A10BA02"
          />

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700">Prescription Schedule</label>
            <select
              name="schedule"
              value={formData.schedule}
              onChange={handleChange}
              className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-[#FFD243] bg-white font-medium text-slate-800"
            >
              <option value="Schedule H">Schedule H (Prescription Only)</option>
              <option value="Schedule H1">Schedule H1 (High Risk / Antibiotic)</option>
              <option value="Schedule X">Schedule X (Controlled Substance)</option>
              <option value="Schedule G">Schedule G (Medical Supervision)</option>
              <option value="OTC">Over The Counter (OTC)</option>
              <option value="General">General Sale</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700">Publication Status</label>
            <select
              name="status"
              value={formData.status}
              onChange={handleChange}
              className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-[#FFD243] bg-white font-medium text-slate-800"
            >
              <option value="published">Published (Live in Formulary)</option>
              <option value="in_review">In Committee Review</option>
              <option value="draft">Draft (Authoring)</option>
              <option value="archived">Archived</option>
            </select>
          </div>
        </div>

        <div className="flex items-center gap-2 pt-2">
          <input
            type="checkbox"
            id="medicineIsActive"
            name="isActive"
            checked={formData.isActive}
            onChange={handleChange}
            className="w-4 h-4 rounded text-orange-600 border-slate-300 focus:ring-orange-500"
          />
          <label htmlFor="medicineIsActive" className="text-xs font-semibold text-slate-700 cursor-pointer">
            Active in National Formulary
          </label>
        </div>
      </form>
    </AdminModal>
  );
};

export default CreateEditMedicineModal;
