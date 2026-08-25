import React, { useState, useEffect } from 'react';
import AdminModal from '../common/AdminModal';
import api from '../../../services/api';
import { Search, CheckSquare, Square, Users, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Badge } from '../../ui/badge';

export const AssignRoleUsersModal = ({
  isOpen,
  onClose,
  role,
  onAssignSuccess,
}) => {
  const [allUsers, setAllUsers] = useState([]);
  const [selectedUserIds, setSelectedUserIds] = useState([]);
  const [searchFilter, setSearchFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    if (!isOpen || !role) return;

    const fetchUsers = async () => {
      setLoading(true);
      setError('');
      setSuccessMsg('');
      try {
        const res = await api.get('/admins?limit=100');
        if (res && res.admins) {
          setAllUsers(res.admins);
          // Pre-select users who already have this role
          const currentRoleUserIds = res.admins
            .filter((u) => u.role === role.code)
            .map((u) => u._id);
          setSelectedUserIds(currentRoleUserIds);
        }
      } catch (err) {
        setError(err.message || 'Failed to fetch user directory.');
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, [isOpen, role]);

  const toggleUser = (userId) => {
    setSelectedUserIds((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  const handleAssign = async () => {
    if (selectedUserIds.length === 0) {
      setError('Please select at least one administrator to assign.');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      if (onAssignSuccess) {
        await onAssignSuccess(role._id, selectedUserIds);
      }
      setSuccessMsg(`Successfully assigned ${selectedUserIds.length} user(s) to ${role.name}!`);
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err) {
      setError(err.message || 'Failed to assign role to users.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredUsers = allUsers.filter((u) => {
    if (!searchFilter) return true;
    const query = searchFilter.toLowerCase();
    return (
      u.name?.toLowerCase().includes(query) ||
      u.email?.toLowerCase().includes(query) ||
      u.username?.toLowerCase().includes(query) ||
      u.department?.toLowerCase().includes(query)
    );
  });

  return (
    <AdminModal
      isOpen={isOpen}
      onClose={onClose}
      title={`Assign Users: ${role?.name}`}
      description={`Select administrators to assign or transfer into the ${role?.name} role.`}
      confirmLabel="Apply Role Assignment"
      isConfirming={isSubmitting}
      onConfirm={handleAssign}
      size="lg"
    >
      <div className="space-y-4 text-xs select-none">
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
            <span className="font-semibold">{successMsg}</span>
          </div>
        )}

        {/* Search & Selected Counter */}
        <div className="flex items-center justify-between gap-3 p-3 bg-slate-50 border border-slate-200/80 rounded-xl">
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              placeholder="Search users by name, email, department..."
              className="w-full h-8 pl-8 pr-3 bg-white border border-slate-200 rounded-lg text-xs outline-none focus:border-[#E76120]"
            />
          </div>

          <Badge variant="nfiNavy" className="text-[10px] font-bold">
            {selectedUserIds.length} Users Selected
          </Badge>
        </div>

        {loading ? (
          <div className="py-12 flex justify-center">
            <div className="w-7 h-7 border-3 border-[#FFD243] border-t-[#E76120] rounded-full animate-spin" />
          </div>
        ) : (
          <div className="space-y-2 max-h-[50vh] overflow-y-auto pr-1">
            {filteredUsers.map((u) => {
              const isSelected = selectedUserIds.includes(u._id);
              const isCurrentRole = u.role === role?.code;

              return (
                <div
                  key={u._id}
                  onClick={() => toggleUser(u._id)}
                  className={`
                    p-3 rounded-xl border flex items-center justify-between gap-3 cursor-pointer transition-all
                    ${
                      isSelected
                        ? 'bg-blue-50/70 border-[#284661] shadow-2xs'
                        : 'bg-white border-slate-200 hover:border-slate-300'
                    }
                  `}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-5 h-5 flex items-center justify-center text-[#284661]">
                      {isSelected ? (
                        <CheckSquare className="w-4 h-4 text-[#284661]" />
                      ) : (
                        <Square className="w-4 h-4 text-slate-400" />
                      )}
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900">{u.name}</span>
                        <span className="text-slate-400 text-[11px]">@{u.username}</span>
                        {isCurrentRole && (
                          <span className="text-[9px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded-md font-bold">
                            Current Role
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-400">
                        {u.email} {u.department ? `· ${u.department}` : ''}
                      </p>
                    </div>
                  </div>

                  <Badge variant="outline" className="text-[10px] uppercase font-bold">
                    {u.role}
                  </Badge>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </AdminModal>
  );
};

export default AssignRoleUsersModal;
