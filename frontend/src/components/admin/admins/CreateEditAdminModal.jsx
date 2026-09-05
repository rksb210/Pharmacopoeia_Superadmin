import React, { useState, useEffect } from 'react';
import AdminModal from '../common/AdminModal';
import InputField from '../../common/InputField';
import { useAuth } from '../../../context/AuthContext';
import { AlertCircle } from 'lucide-react';
import departmentService from '../../../services/department.service';
import designationService from '../../../services/designation.service';
import api from '../../../services/api';

const DEFAULT_ADMIN_ROLES = [
  { value: 'admin', label: 'Admin' },
  { value: 'subadmin', label: 'Sub Admin' },
  { value: 'maker', label: 'Maker' },
  { value: 'reviewer', label: 'Reviewer' },
  { value: 'approver', label: 'Approver' },
  { value: 'superadmin', label: 'Super Admin' },
];

export const CreateEditAdminModal = ({
  isOpen,
  onClose,
  admin = null, // if present -> Edit mode, else Create mode
  onSuccess,
}) => {
  const { isSuperAdmin } = useAuth();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    username: '',
    password: '',
    role: 'admin',
    departmentRef: '',
    designationRef: '',
    phoneNumber: '',
    notes: '',
  });

  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [departments, setDepartments] = useState([]);
  const [designations, setDesignations] = useState([]);
  const [deptLoading, setDeptLoading] = useState(false);
  const [dbRoles, setDbRoles] = useState([]);

  const isEditMode = !!admin;

  useEffect(() => {
    const loadRoles = async () => {
      try {
        const res = await api.get('/rbac/roles');
        if (res?.roles && res.roles.length > 0) {
          setDbRoles(res.roles);
        }
      } catch {
        // Fallback to static roles if offline or error
      }
    };

    const loadDepts = async () => {
      setDeptLoading(true);
      try {
        const res = await departmentService.getActiveDepartments();
        if (res?.departments) setDepartments(res.departments);
      } catch {}
      setDeptLoading(false);
    };

    if (isOpen) {
      loadDepts();
      loadRoles();
    }
  }, [isOpen]);

  useEffect(() => {
    const deptId = formData.departmentRef;
    if (!deptId) { setDesignations([]); return; }
    const loadDes = async () => {
      try {
        const res = await designationService.getByDepartment(deptId);
        if (res?.designations) setDesignations(res.designations);
      } catch { setDesignations([]); }
    };
    loadDes();
  }, [formData.departmentRef]);

  // Preload designations for edit mode initial department
  useEffect(() => {
    if (admin && admin.departmentRef && isOpen) {
      const deptId = admin.departmentRef?._id || admin.departmentRef;
      if (deptId) {
        designationService.getByDepartment(deptId).then((res) => { if (res?.designations) setDesignations(res.designations); }).catch(() => {});
      }
    }
  }, [admin, isOpen]);

  useEffect(() => {
    if (admin) {
      setFormData({
        name: admin.name || '',
        email: admin.email || '',
        username: admin.username || '',
        password: '',
        role: admin.role || 'admin',
        departmentRef: admin.departmentRef?._id || admin.departmentRef || '',
        designationRef: admin.designationRef?._id || admin.designationRef || '',
        phoneNumber: admin.phoneNumber || '',
        notes: admin.notes || '',
      });
    } else {
      setFormData({
        name: '',
        email: '',
        username: '',
        password: '',
        role: 'admin',
        departmentRef: '',
        designationRef: '',
        phoneNumber: '',
        notes: '',
      });
    }
    setErrors({});
    setApiError('');
  }, [admin, isOpen]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'departmentRef') {
      setFormData((prev) => ({ ...prev, departmentRef: value, designationRef: '' }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
    if (apiError) setApiError('');
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = 'Full name is required';
    if (!formData.email.trim()) {
      newErrors.email = 'Email address is required';
    } else if (!/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/.test(formData.email.trim())) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!formData.username.trim()) {
      newErrors.username = 'Username is required';
    } else if (formData.username.trim().length < 3) {
      newErrors.username = 'Username must be at least 3 characters';
    }

    if (!isEditMode && (!formData.password || formData.password.length < 6)) {
      newErrors.password = 'Password must be at least 6 characters long';
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
        await onSuccess(formData, isEditMode ? admin._id : null);
      }
      onClose();
    } catch (err) {
      setApiError(err.message || 'Operation failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Populate active roles from database (fallback to DEFAULT_ADMIN_ROLES)
  const roleOptions =
    dbRoles.length > 0
      ? dbRoles
          .filter((r) => r.isActive !== false)
          .map((r) => ({
            value: r.code,
            label: r.name,
          }))
      : DEFAULT_ADMIN_ROLES;

  // Only superadmin can assign superadmin role
  const availableRoles = isSuperAdmin
    ? roleOptions
    : roleOptions.filter((r) => r.value !== 'superadmin');

  return (
    <AdminModal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditMode ? `Edit Administrator: ${admin?.name}` : 'Register New Administrator'}
      description={
        isEditMode
          ? 'Update administrator profile, department, and role assignment.'
          : 'Provision a new internal administrator account on the NFI platform.'
      }
      confirmLabel={isEditMode ? 'Save Changes' : 'Create Administrator'}
      isConfirming={isSubmitting}
      onConfirm={handleSubmit}
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {apiError && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
            <span>{apiError}</span>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <InputField
            id="name"
            name="name"
            label="Full Name"
            placeholder="e.g. Dr. Rajesh Verma"
            value={formData.name}
            onChange={handleChange}
            error={errors.name}
            required
          />

          <InputField
            id="email"
            name="email"
            label="Official Email Address"
            type="email"
            placeholder="e.g. rajesh.v@nfi.gov.in"
            value={formData.email}
            onChange={handleChange}
            error={errors.email}
            required
          />

          <InputField
            id="username"
            name="username"
            label="Username"
            placeholder="e.g. rajesh_v"
            value={formData.username}
            onChange={handleChange}
            error={errors.username}
            required
          />

          {/* Role Dropdown */}
          <div className="flex flex-col gap-1.5 w-full">
            <label className="text-sm font-medium text-slate-700 select-none text-left">
              Assigned Role
            </label>
            <select
              name="role"
              value={formData.role}
              onChange={handleChange}
              className="w-full h-11 px-3 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 bg-white outline-none focus:border-[#E76120] focus:ring-2 focus:ring-[#E76120]/15 cursor-pointer"
            >
              {availableRoles.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1.5 w-full">
            <label className="text-sm font-medium text-slate-700 select-none text-left">Department / Committee</label>
            <select name="departmentRef" value={formData.departmentRef} onChange={handleChange} className="w-full h-11 px-3 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 bg-white outline-none focus:border-[#E76120] focus:ring-2 focus:ring-[#E76120]/15 cursor-pointer">
              <option value="">{deptLoading ? 'Loading...' : 'Select department'}</option>
              {departments.map((d) => (<option key={d._id} value={d._id}>{d.name} ({d.code})</option>))}
            </select>
            {errors.departmentRef && <span className="text-[11px] text-red-600">{errors.departmentRef}</span>}
          </div>

          <div className="flex flex-col gap-1.5 w-full">
            <label className="text-sm font-medium text-slate-700 select-none text-left">Designation / Title</label>
            <select name="designationRef" value={formData.designationRef} onChange={handleChange} disabled={!formData.departmentRef} className="w-full h-11 px-3 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 bg-white outline-none focus:border-[#E76120] focus:ring-2 focus:ring-[#E76120]/15 cursor-pointer disabled:bg-slate-100 disabled:cursor-not-allowed">
              <option value="">{!formData.departmentRef ? 'Select department first' : designations.length ? 'Select designation' : 'No designations in this department'}</option>
              {designations.map((d) => (<option key={d._id} value={d._id}>{d.name} ({d.code})</option>))}
            </select>
            {errors.designationRef && <span className="text-[11px] text-red-600">{errors.designationRef}</span>}
          </div>

          <InputField
            id="phoneNumber"
            name="phoneNumber"
            label="Contact Number"
            placeholder="e.g. +91 98765 43210"
            value={formData.phoneNumber}
            onChange={handleChange}
          />

          {!isEditMode && (
            <InputField
              id="password"
              name="password"
              label="Temporary Password"
              type="password"
              placeholder="Min. 6 characters"
              value={formData.password}
              onChange={handleChange}
              error={errors.password}
              required
            />
          )}
        </div>

        <div className="flex flex-col gap-1.5 w-full">
          <label className="text-sm font-medium text-slate-700 select-none text-left">
            Administrative Notes (Optional)
          </label>
          <textarea
            name="notes"
            rows={2}
            value={formData.notes}
            onChange={handleChange}
            placeholder="Additional internal notes regarding this administrator..."
            className="w-full p-3 border border-slate-200 rounded-lg text-xs text-slate-800 outline-none focus:border-[#E76120] focus:ring-2 focus:ring-[#E76120]/15"
          />
        </div>
      </form>
    </AdminModal>
  );
};

export default CreateEditAdminModal;
