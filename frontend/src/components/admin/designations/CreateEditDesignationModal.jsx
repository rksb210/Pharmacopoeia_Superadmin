import React, { useState, useEffect } from 'react';
import AdminModal from '../common/AdminModal';
import InputField from '../../common/InputField';
import { AlertCircle } from 'lucide-react';

export const CreateEditDesignationModal = ({ isOpen, onClose, designation = null, departments = [], onSuccess, preselectedDepartment = '' }) => {
  const [formData, setFormData] = useState({ name: '', code: '', department: '', description: '' });
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isEditMode = !!designation;

  useEffect(() => {
    if (designation) {
      setFormData({
        name: designation.name || '',
        code: designation.code || '',
        department: designation.department?._id || designation.department || '',
        description: designation.description || '',
      });
    } else {
      setFormData({ name: '', code: '', department: preselectedDepartment || '', description: '' });
    }
    setErrors({});
    setApiError('');
  }, [designation, isOpen, preselectedDepartment]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
    if (apiError) setApiError('');
  };

  const validate = () => {
    const ne = {};
    if (!formData.name.trim()) ne.name = 'Designation name is required';
    if (!formData.department) ne.department = 'Department is required';
    if (formData.code && !/^[A-Za-z0-9_-]+$/.test(formData.code.trim())) ne.code = 'Code: letters, numbers, hyphens, underscores only';
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
        code: formData.code.trim() || undefined,
        department: formData.department,
        description: formData.description.trim(),
      };
      if (onSuccess) await onSuccess(payload, isEditMode ? designation._id : null);
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
      title={isEditMode ? `Edit Designation: ${designation?.name}` : 'Create New Designation'}
      description={isEditMode ? 'Update designation and its department mapping.' : 'Add a designation under the selected department.'}
      confirmLabel={isEditMode ? 'Save Changes' : 'Create Designation'}
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
        <div className="flex flex-col gap-1.5 w-full">
          <label className="text-sm font-medium text-slate-700 select-none text-left">Department *</label>
          <select name="department" value={formData.department} onChange={handleChange} className="w-full h-11 px-3 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 bg-white outline-none focus:border-[#E76120] focus:ring-2 focus:ring-[#E76120]/15 cursor-pointer">
            <option value="">Select department</option>
            {departments.map((d) => (
              <option key={d._id} value={d._id}>{d.name} ({d.code})</option>
            ))}
          </select>
          {errors.department && <span className="text-[11px] text-red-600">{errors.department}</span>}
        </div>
        <InputField id="name" name="name" label="Designation Name" placeholder="e.g. Senior Scientific Officer" value={formData.name} onChange={handleChange} error={errors.name} required />
        <InputField id="code" name="code" label="Designation Code (auto-generated if blank)" placeholder="e.g. SR_SCI_OFFICER" value={formData.code} onChange={handleChange} error={errors.code} />
        <div className="flex flex-col gap-1.5 w-full">
          <label className="text-sm font-medium text-slate-700 select-none text-left">Description (Optional)</label>
          <textarea name="description" rows={2} value={formData.description} onChange={handleChange} placeholder="Role scope..." className="w-full p-3 border border-slate-200 rounded-lg text-xs text-slate-800 outline-none focus:border-[#E76120] focus:ring-2 focus:ring-[#E76120]/15" />
        </div>
      </form>
    </AdminModal>
  );
};

export default CreateEditDesignationModal;
