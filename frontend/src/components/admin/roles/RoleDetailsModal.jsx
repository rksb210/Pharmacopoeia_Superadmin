import React, { useState, useEffect, useCallback } from 'react';
import AdminModal from '../common/AdminModal';
import { Badge } from '../../ui/badge';
import RolePermissionMatrix from './RolePermissionMatrix';
import api from '../../../services/api';
import rbacService from '../../../services/rbac.service';
import {
  ShieldCheck,
  Users,
  Lock,
  User,
  Mail,
  Building,
  UserMinus,
  ArrowRightLeft,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  X,
} from 'lucide-react';

export const RoleDetailsModal = ({
  isOpen,
  onClose,
  roleId,
  onEdit,
  onRoleUpdated,
}) => {
  const [roleData, setRoleData] = useState(null);
  const [assignedUsers, setAssignedUsers] = useState([]);
  const [allRoles, setAllRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('matrix'); // 'matrix' | 'users'

  // Reassign / Unassign State
  const [reassigningUser, setReassigningUser] = useState(null);
  const [targetRoleId, setTargetRoleId] = useState('');
  const [isSubmittingReassign, setIsSubmittingReassign] = useState(false);
  const [reassignError, setReassignError] = useState('');
  const [reassignSuccess, setReassignSuccess] = useState('');

  const fetchRoleDetails = useCallback(async () => {
    setLoading(true);
    try {
      const [roleRes, rolesRes] = await Promise.all([
        api.get(`/rbac/roles/${roleId}`),
        rbacService.getRoles(),
      ]);

      if (roleRes && roleRes.role) {
        setRoleData(roleRes.role);
        setAssignedUsers(roleRes.assignedUsers || []);
      }

      if (rolesRes && rolesRes.roles) {
        setAllRoles(rolesRes.roles);
      }
    } catch (err) {
      console.error('Failed to load role details:', err);
    } finally {
      setLoading(false);
    }
  }, [roleId]);

  useEffect(() => {
    if (!isOpen || !roleId) return;
    fetchRoleDetails();
    setReassigningUser(null);
    setReassignError('');
    setReassignSuccess('');
  }, [isOpen, roleId, fetchRoleDetails]);

  const handleOpenReassign = (user) => {
    setReassigningUser(user);
    setReassignError('');
    setReassignSuccess('');

    // Default to 'subadmin' role if available, otherwise first non-current role
    const defaultRole =
      allRoles.find((r) => r.code === 'subadmin' && r._id !== roleId) ||
      allRoles.find((r) => r._id !== roleId);

    setTargetRoleId(defaultRole?._id || '');
  };

  const handleConfirmReassign = async () => {
    if (!targetRoleId) {
      setReassignError('Please select a destination role.');
      return;
    }

    setIsSubmittingReassign(true);
    setReassignError('');

    try {
      await rbacService.assignUsers(targetRoleId, [reassigningUser._id]);

      const targetRoleObj = allRoles.find((r) => r._id === targetRoleId);
      setReassignSuccess(
        `Staff member "${reassigningUser.name}" unassigned from ${roleData.name} and reassigned to ${targetRoleObj?.name || 'new role'} successfully.`
      );

      // Refresh data
      await fetchRoleDetails();
      if (onRoleUpdated) onRoleUpdated();

      setTimeout(() => {
        setReassigningUser(null);
        setReassignSuccess('');
      }, 2000);
    } catch (err) {
      setReassignError(err.message || 'Failed to reassign staff role.');
    } finally {
      setIsSubmittingReassign(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AdminModal
      isOpen={isOpen}
      onClose={onClose}
      title={roleData ? `Role: ${roleData.name}` : 'Role Inspector'}
      description="Review role permission matrix and manage assigned administrative staff."
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
        <div className="space-y-4 text-xs select-none font-sans">
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
              onClick={() => {
                setActiveTab('matrix');
                setReassigningUser(null);
              }}
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

          {/* Tab 2: Users List & Reassignment */}
          {activeTab === 'users' && (
            <div className="space-y-3">
              {/* Active Reassign / Unassign Prompt Box */}
              {reassigningUser && (
                <div className="p-3.5 bg-blue-50 border border-blue-200 rounded-2xl space-y-2.5 animate-in fade-in-0 duration-150">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <ArrowRightLeft className="w-4 h-4 text-[#284661]" />
                      <span className="font-bold text-slate-900 text-xs">
                        Reassign & Unassign Staff: <span className="text-[#284661]">{reassigningUser.name}</span>
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setReassigningUser(null)}
                      className="text-slate-400 hover:text-slate-600 cursor-pointer p-0.5"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {reassignError && (
                    <div className="p-2 bg-red-50 border border-red-200 text-red-700 rounded-lg flex items-center gap-1.5 text-[11px]">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0 text-red-600" />
                      <span>{reassignError}</span>
                    </div>
                  )}

                  {reassignSuccess && (
                    <div className="p-2 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg flex items-center gap-1.5 text-[11px]">
                      <CheckCircle2 className="w-3.5 h-3.5 shrink-0 text-emerald-600" />
                      <span>{reassignSuccess}</span>
                    </div>
                  )}

                  {!reassignSuccess && (
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-1">
                      <div className="flex-1">
                        <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                          Select Destination Role (Default: Sub Administrator):
                        </label>
                        <select
                          value={targetRoleId}
                          onChange={(e) => setTargetRoleId(e.target.value)}
                          className="w-full h-9 px-3 bg-white border border-slate-200 rounded-xl font-bold text-xs outline-none focus:border-[#E76120] cursor-pointer"
                        >
                          {allRoles
                            .filter((r) => r._id !== roleId)
                            .map((r) => (
                              <option key={r._id} value={r._id}>
                                {r.name} {r.code === 'subadmin' ? '— (Default Sub Admin Role)' : ''}
                              </option>
                            ))}
                        </select>
                      </div>

                      <div className="flex items-center gap-2 sm:self-end">
                        <button
                          type="button"
                          onClick={() => setReassigningUser(null)}
                          disabled={isSubmittingReassign}
                          className="h-9 px-3 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 font-bold rounded-xl text-xs transition-all cursor-pointer"
                        >
                          Cancel
                        </button>

                        <button
                          type="button"
                          onClick={handleConfirmReassign}
                          disabled={isSubmittingReassign}
                          className="h-9 px-3.5 bg-[#284661] hover:bg-[#1B3145] text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer disabled:opacity-50"
                        >
                          {isSubmittingReassign ? (
                            <>
                              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                              <span>Transferring...</span>
                            </>
                          ) : (
                            <>
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Confirm & Reassign</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="space-y-2 max-h-[45vh] overflow-y-auto pr-1">
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
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className="w-8 h-8 rounded-lg bg-[#284661] text-white font-bold flex items-center justify-center text-xs shrink-0">
                          {user.name?.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-800 truncate">{user.name}</span>
                            <span className="text-[10px] text-slate-400 font-mono shrink-0">@{user.username}</span>
                          </div>
                          <div className="flex items-center gap-3 text-[11px] text-slate-500 truncate">
                            <span className="flex items-center gap-1 truncate">
                              <Mail className="w-3 h-3 text-slate-400 shrink-0" />
                              <span className="truncate">{user.email}</span>
                            </span>
                            {user.department && (
                              <span className="flex items-center gap-1 truncate hidden sm:flex">
                                <Building className="w-3 h-3 text-slate-400 shrink-0" />
                                <span className="truncate">{user.department}</span>
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span className={`text-[10px] font-bold ${user.isActive ? 'text-emerald-600' : 'text-red-500'}`}>
                          ● {user.isActive ? 'Active' : 'Inactive'}
                        </span>

                        <button
                          type="button"
                          onClick={() => handleOpenReassign(user)}
                          className="px-2.5 py-1.5 bg-slate-50 hover:bg-blue-50 text-slate-700 hover:text-[#284661] border border-slate-200 hover:border-blue-300 rounded-lg text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1.5"
                          title={`Unassign or reassign ${user.name} to another role`}
                        >
                          <ArrowRightLeft className="w-3 h-3 text-[#284661]" />
                          <span>Reassign / Unassign</span>
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </AdminModal>
  );
};

export default RoleDetailsModal;
