import React, { useState, useEffect } from 'react';
import AdminModal from '../common/AdminModal';
import { Badge } from '../../ui/badge';
import RolePermissionMatrix from './RolePermissionMatrix';
import api from '../../../services/api';
import { ShieldCheck, Users, Lock, User, Mail, Building } from 'lucide-react';

export const RoleDetailsModal = ({ isOpen, onClose, roleId, onEdit }) => {
  const [roleData, setRoleData] = useState(null);
  const [assignedUsers, setAssignedUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('matrix'); // 'matrix' | 'users'

  useEffect(() => {
    if (!isOpen || !roleId) return;

    const fetchRoleDetails = async () => {
      setLoading(true);
      try {
        const res = await api.get(`/rbac/roles/${roleId}`);
        if (res && res.role) {
          setRoleData(res.role);
          setAssignedUsers(res.assignedUsers || []);
        }
      } catch (err) {
        console.error('Failed to load role details:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchRoleDetails();
  }, [isOpen, roleId]);

  if (!isOpen) return null;

  return (
    <AdminModal
      isOpen={isOpen}
      onClose={onClose}
      title={roleData ? `Role: ${roleData.name}` : 'Role Inspector'}
      description="Review role permission matrix and inspected assigned administrative users."
      confirmLabel="Edit Role"
      onConfirm={() => {
        onClose();
        if (onEdit && roleData) onEdit(roleData);
      }}
      size="xl"
    >
      {loading ? (
        <div className="py-12 flex flex-col items-center justify-center gap-2">
          <div className="w-8 h-8 border-3 border-[#FFD243] border-t-[#E76120] rounded-full animate-spin" />
          <span className="text-xs text-slate-500 font-semibold">Loading role specifications...</span>
        </div>
      ) : (
        <div className="space-y-4 text-xs select-none">
          {/* Header Card */}
          <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-[#284661] text-white flex items-center justify-center font-bold text-lg shadow-xs">
                {roleData.name?.charAt(0).toUpperCase()}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="font-bold text-slate-900 text-sm sm:text-base">{roleData.name}</h4>
                  <Badge
                    variant={roleData.isSystemDefault ? 'nfiYellow' : 'secondary'}
                    className="text-[9px] font-black tracking-wider uppercase"
                  >
                    {roleData.isSystemDefault ? 'System Default' : 'Custom Role'}
                  </Badge>
                </div>
                <p className="text-slate-400 font-mono text-[11px]">code: {roleData.code}</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="bg-white px-3 py-1.5 rounded-xl border border-slate-200 text-center">
                <span className="text-[10px] text-slate-400 block font-semibold uppercase">Assigned Users</span>
                <span className="text-sm font-black text-slate-900">{assignedUsers.length}</span>
              </div>
              <div className="bg-white px-3 py-1.5 rounded-xl border border-slate-200 text-center">
                <span className="text-[10px] text-slate-400 block font-semibold uppercase">Permissions</span>
                <span className="text-sm font-black text-[#E76120]">
                  {roleData.code === 'superadmin' ? 'ALL (*)' : roleData.permissionCodes?.length || 0}
                </span>
              </div>
            </div>
          </div>

          {/* Description */}
          {roleData.description && (
            <div className="p-3 bg-white border border-slate-100 rounded-xl text-slate-600 text-xs">
              <strong>Scope:</strong> {roleData.description}
            </div>
          )}

          {/* Tab Switcher */}
          <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
            <button
              type="button"
              onClick={() => setActiveTab('matrix')}
              className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-colors cursor-pointer ${
                activeTab === 'matrix'
                  ? 'bg-[#284661] text-white shadow-2xs'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              Permission Matrix View
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('users')}
              className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-colors cursor-pointer ${
                activeTab === 'users'
                  ? 'bg-[#284661] text-white shadow-2xs'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              Assigned Staff ({assignedUsers.length})
            </button>
          </div>

          {/* Tab 1: Matrix */}
          {activeTab === 'matrix' && (
            <RolePermissionMatrix
              selectedPermissions={roleData.permissionCodes || []}
              readOnly={true}
            />
          )}

          {/* Tab 2: Users List */}
          {activeTab === 'users' && (
            <div className="space-y-2 max-h-[50vh] overflow-y-auto pr-1">
              {assignedUsers.length === 0 ? (
                <div className="p-8 text-center bg-slate-50 border border-slate-100 rounded-2xl text-slate-400">
                  <Users className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                  <p className="font-semibold text-xs">No active staff accounts currently assigned to this role.</p>
                </div>
              ) : (
                assignedUsers.map((user) => (
                  <div
                    key={user._id}
                    className="p-3 bg-white border border-slate-100 rounded-xl flex items-center justify-between gap-3 hover:border-slate-200 transition-colors shadow-2xs"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-[#284661] text-white font-bold flex items-center justify-center text-xs">
                        {user.name?.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-800">{user.name}</span>
                          <span className="text-[10px] text-slate-400">@{user.username}</span>
                        </div>
                        <div className="flex items-center gap-3 text-[11px] text-slate-500">
                          <span className="flex items-center gap-1">
                            <Mail className="w-3 h-3 text-slate-400" />
                            {user.email}
                          </span>
                          {user.department && (
                            <span className="flex items-center gap-1">
                              <Building className="w-3 h-3 text-slate-400" />
                              {user.department}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <span className={`text-[10px] font-bold ${user.isActive ? 'text-emerald-600' : 'text-red-500'}`}>
                      ● {user.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      )}
    </AdminModal>
  );
};

export default RoleDetailsModal;
