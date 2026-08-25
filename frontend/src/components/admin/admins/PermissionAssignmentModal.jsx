import React, { useState, useEffect } from 'react';
import AdminModal from '../common/AdminModal';
import DynamicPermissionMatrix from '../common/DynamicPermissionMatrix';
import { ShieldCheck, AlertCircle } from 'lucide-react';

export const PermissionAssignmentModal = ({
  isOpen,
  onClose,
  admin,
  onPermissionsSave,
}) => {
  const [selectedPermissions, setSelectedPermissions] = useState([]);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (admin) {
      setSelectedPermissions(admin.customPermissions || []);
      setError('');
    }
  }, [admin, isOpen]);

  const handleSave = async () => {
    setIsSaving(true);
    setError('');

    try {
      if (onPermissionsSave) {
        await onPermissionsSave(admin._id, selectedPermissions);
      }
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to update permissions.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <AdminModal
      isOpen={isOpen}
      onClose={onClose}
      title={`Permissions: ${admin?.name}`}
      description={`Assign or modify module and section permissions for ${admin?.name} (${admin?.role?.toUpperCase()}).`}
      confirmLabel="Save Permissions"
      isConfirming={isSaving}
      onConfirm={handleSave}
      size="lg"
    >
      <div className="space-y-4 text-xs select-none">
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
            <span>{error}</span>
          </div>
        )}

        <div className="flex items-center justify-between p-3 bg-slate-50 border border-slate-100 rounded-xl">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-[#E76120]" />
            <span className="font-bold text-slate-800">
              Role: <span className="text-[#284661]">{admin?.role?.toUpperCase()}</span>
            </span>
          </div>
          <span className="text-[11px] text-slate-500 font-semibold">
            {selectedPermissions.length} Custom Permissions Selected
          </span>
        </div>

        {/* Dynamic Database Matrix */}
        <DynamicPermissionMatrix
          selectedPermissions={selectedPermissions}
          onChange={setSelectedPermissions}
          roleBaseline={admin?.role}
        />
      </div>
    </AdminModal>
  );
};

export default PermissionAssignmentModal;
