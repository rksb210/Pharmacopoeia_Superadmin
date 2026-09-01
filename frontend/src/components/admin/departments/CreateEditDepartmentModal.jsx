import React, { useState, useEffect } from 'react';
import AdminModal from '../common/AdminModal';
import InputField from '../../common/InputField';
import { AlertCircle } from 'lucide-react';

export const CreateEditDepartmentModal = ({ isOpen, onClose, department = null, onSuccess }) => {
  const [formData, setFormData] = useState({ name: '', code: '', description: '' });
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isEditMode = !!department;

  useEffect(() => {
    if (department) {
      setFormData({ name: department.name || '', code: department.code || '', description: department.description || '' });
    } else {
      setFormData({ name: '', code: '', description: '' });
    }
    setErrors({});
    setApiError('');
  }, [department, isOpen]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
    if (apiError) setApiError('');
  };

  const validate = () => {
    const ne = {};
    if (!formData.name.trim()) ne.name = 'Department name is required';
    if (formData.code && !/^[A-Za-z0-9_-]+$/.test(formData.code.trim())) ne.code = 'Code: letters, numbers, hyphens, underscores only';
    if (formData.description && formData.description.length > 500) ne.description = 'Description too long';
    setErrors(ne);
    return Object.keys(ne).length === 0;
  };

  const handleSubmit = async (e) => {
    e?.preventDefault();
    if (!validate()) return;
    setIsSubmitting(true);
    setApiError('');
    try {
      const payload = { name: formData.name.trim(), code: formData.code.trim() || undefined, description: formData.description.trim() };
      if (onSuccess) await onSuccess(payload, isEditMode ? department._id : null);
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
      title={isEditMode ? `Edit Department: ${department?.name}` : 'Create New Department'}
      description={isEditMode ? 'Update department metadata.' : 'Add a new organisational department.'}
      confirmLabel={isEditMode ? 'Save Changes' : 'Create Department'}
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
        <InputField id="name" name="name" label="Department Name" placeholder="e.g. Pharmacology Division" value={formData.name} onChange={handleChange} error={errors.name} required />
        <InputField id="code" name="code" label="Department Code (auto-generated if blank)" placeholder="e.g. PHARMACOLOGY_DIVISION" value={formData.code} onChange={handleChange} error={errors.code} />
        <div className="flex flex-col gap-1.5 w-full">
          <label className="text-sm font-medium text-slate-700 select-none text-left">Description (Optional)</label>
          <textarea name="description" rows={2} value={formData.description} onChange={handleChange} placeholder="Brief purpose of this department..." className="w-full p-3 border border-slate-200 rounded-lg text-xs text-slate-800 outline-none focus:border-[#E76120] focus:ring-2 focus:ring-[#E76120]/15" />
          {errors.description && <span className="text-[11px] text-red-600">{errors.description}</span>}
        </div>
      </form>
    </AdminModal>
  );
};

export default CreateEditDepartmentModal;
