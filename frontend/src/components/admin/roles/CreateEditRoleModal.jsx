import React, { useState, useEffect } from 'react';
import AdminModal from '../common/AdminModal';
import InputField from '../../common/InputField';
import RolePermissionMatrix from './RolePermissionMatrix';
import { AlertCircle, ShieldAlert } from 'lucide-react';

export const CreateEditRoleModal = ({
  isOpen,
  onClose,
  role = null,
  onSuccess,
}) => {
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: '',
    permissionCodes: [],
  });

  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isEditMode = !!role;
  const isSystemDefault = role?.isSystemDefault;

  useEffect(() => {
    if (role) {
      setFormData({
        name: role.name || '',
        code: role.code || '',
        description: role.description || '',
        permissionCodes: role.permissionCodes || [],
      });
    } else {
      setFormData({
        name: '',
        code: '',
        description: '',
        permissionCodes: [],
      });
    }
    setErrors({});
    setApiError('');
  }, [role, isOpen]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
    if (apiError) setApiError('');
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = 'Role name is required';
    if (!isEditMode && !formData.code.trim()) {
      newErrors.code = 'Role identifier code is required';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e?.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    setApiError('');

    try {
      if (onSuccess) {
        await onSuccess(formData, isEditMode ? role._id : null);
      }
      onClose();
    } catch (err) {
      setApiError(err.message || 'Operation failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AdminModal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditMode ? `Edit Role: ${role?.name}` : 'Create Custom Role'}
      description={
        isEditMode
          ? `Modify permissions and description for the ${role?.name} role.`
          : 'Define a new custom administrative role and assign fine-grained permissions.'
      }
      confirmLabel={isEditMode ? 'Save Permissions' : 'Create Role'}
      isConfirming={isSubmitting}
      onConfirm={handleSubmit}
      size="xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {apiError && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
            <span>{apiError}</span>
          </div>
        )}

        {isSystemDefault && (
          <div className="p-3 bg-amber-50/80 border border-amber-200 text-amber-900 text-xs rounded-xl flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 shrink-0 text-amber-600" />
            <span>
              <strong>System Default Role:</strong> Name and core role identifier cannot be renamed to protect portal integrity.
            </span>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <InputField
            id="roleName"
            name="name"
            label="Role Display Name"
            placeholder="e.g. Drug Safety Auditor"
            value={formData.name}
            onChange={handleChange}
            error={errors.name}
            disabled={isSystemDefault}
            required
          />

          <InputField
            id="roleCode"
            name="code"
            label="Role Identifier Code"
            placeholder="e.g. safety_auditor"
            value={formData.code}
            onChange={handleChange}
            error={errors.code}
            disabled={isEditMode}
            required
          />
        </div>

        <div className="flex flex-col gap-1.5 w-full">
          <label className="text-sm font-medium text-slate-700 select-none text-left">
            Role Description &amp; Scope
          </label>
          <textarea
            name="description"
            rows={2}
            value={formData.description}
            onChange={handleChange}
            placeholder="Explain the purpose and intended access boundaries for this role..."
            className="w-full p-3 border border-slate-200 rounded-lg text-xs text-slate-800 outline-none focus:border-[#E76120] focus:ring-2 focus:ring-[#E76120]/15"
          />
        </div>

        {/* Dynamic Permission Matrix UI */}
        <div className="space-y-2 pt-2 border-t border-slate-100">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Permission Matrix Configuration
            </label>
            <span className="text-[11px] font-semibold text-slate-500">
              {formData.permissionCodes?.length || 0} permissions active
            </span>
          </div>

          <RolePermissionMatrix
            selectedPermissions={formData.permissionCodes}
            onChange={(codes) => setFormData((prev) => ({ ...prev, permissionCodes: codes }))}
          />
        </div>
      </form>
    </AdminModal>
  );
};

export default CreateEditRoleModal;
