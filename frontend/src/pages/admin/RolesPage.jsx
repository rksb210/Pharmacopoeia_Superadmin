import React, { useState, useEffect, useCallback } from 'react';
import {
  KeyRound,
  ShieldCheck,
  Layers,
  Shield,
  Plus,
  Eye,
  Edit2,
  Users,
  Trash2,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Lock,
} from 'lucide-react';
import PageContainer from '../../components/admin/common/PageContainer';
import PageHeader from '../../components/admin/common/PageHeader';
import StatCard from '../../components/admin/common/StatCard';
import AdminTableWrapper from '../../components/admin/common/AdminTableWrapper';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '../../components/ui/table';

import rbacService from '../../services/rbac.service';
import { useAuth } from '../../context/AuthContext';
import { usePermission } from '../../context/PermissionContext';
import PermissionGuard from '../../components/admin/common/PermissionGuard';

// Modals
import CreateEditRoleModal from '../../components/admin/roles/CreateEditRoleModal';
import RoleDetailsModal from '../../components/admin/roles/RoleDetailsModal';
import AssignRoleUsersModal from '../../components/admin/roles/AssignRoleUsersModal';

export const RolesPage = () => {
  const { user: currentUser } = useAuth();
  const { refreshPermissions } = usePermission();

  const [roles, setRoles] = useState([]);
  const [stats, setStats] = useState({
    totalRoles: 0,
    systemRoles: 0,
    customRoles: 0,
  });

  const [permissionsCount, setPermissionsCount] = useState(95);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [feedback, setFeedback] = useState({ message: '', type: '' });

  // Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('all'); // 'all' | 'system' | 'custom'

  // Modals State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingRole, setEditingRole] = useState(null);
  const [viewingRoleId, setViewingRoleId] = useState(null);
  const [assigningRole, setAssigningRole] = useState(null);

  // Fetch Roles and Permissions
  const fetchRolesData = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const [rolesRes, permsRes] = await Promise.all([
        rbacService.getRoles(),
        rbacService.getPermissions(),
      ]);

      if (rolesRes && rolesRes.roles) {
        setRoles(rolesRes.roles);
        setStats(rolesRes.stats || { totalRoles: 0, systemRoles: 0, customRoles: 0 });
      }

      if (permsRes && permsRes.total) {
        setPermissionsCount(permsRes.total);
      }
    } catch (err) {
      setError(err.message || 'Failed to load roles and permissions matrix.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRolesData();
  }, [fetchRolesData]);

  const showFeedback = (message, type = 'success') => {
    setFeedback({ message, type });
    setTimeout(() => setFeedback({ message: '', type: '' }), 4500);
  };

  // Create / Update Role Handler
  const handleSaveRole = async (formData, roleId) => {
    if (roleId) {
      await rbacService.updateRole(roleId, formData);
      showFeedback('Role specifications and permission matrix updated successfully.');
    } else {
      await rbacService.createRole(formData);
      showFeedback('New custom role created successfully.');
    }
    fetchRolesData();
    refreshPermissions();
  };

  // Toggle Role Status
  const handleToggleStatus = async (role) => {
    if (role.isSystemDefault) return;
    try {
      const newStatus = !role.isActive;
      await rbacService.toggleStatus(role._id, newStatus);
      showFeedback(`Role '${role.name}' ${newStatus ? 'activated' : 'deactivated'} successfully.`);
      fetchRolesData();
    } catch (err) {
      showFeedback(err.message, 'error');
    }
  };

  // Delete Role Handler
  const handleDeleteRole = async (role) => {
    if (role.isSystemDefault) {
      showFeedback('System-critical roles cannot be deleted.', 'error');
      return;
    }

    if (role.assignedUsersCount > 0) {
      showFeedback(`Cannot delete role '${role.name}' with ${role.assignedUsersCount} active users assigned.`, 'error');
      return;
    }

    if (!window.confirm(`Are you sure you want to permanently delete role "${role.name}"?`)) {
      return;
    }

    try {
      await rbacService.deleteRole(role._id);
      showFeedback(`Role '${role.name}' deleted successfully.`);
      fetchRolesData();
      refreshPermissions();
    } catch (err) {
      showFeedback(err.message, 'error');
    }
  };

  // Assign Users Handler
  const handleAssignUsersSuccess = async (roleId, userIds) => {
    await rbacService.assignUsers(roleId, userIds);
    showFeedback('Users successfully reassigned to target role.');
    fetchRolesData();
    refreshPermissions();
  };

  // Filtered Roles
  const filteredRoles = roles.filter((role) => {
    const matchesSearch =
      !searchQuery ||
      role.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      role.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      role.description?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesType =
      typeFilter === 'all' ||
      (typeFilter === 'system' && role.isSystemDefault) ||
      (typeFilter === 'custom' && !role.isSystemDefault);

    return matchesSearch && matchesType;
  });

  return (
    <PageContainer>
      {/* Header */}
      <PageHeader
        title="Role &amp; Permission Management"
        subtitle="Configure RBAC security policies, fine-grained Module/Section matrix actions, and user role assignments."
      >
        <Button
          variant="outline"
          size="sm"
          onClick={fetchRolesData}
          className="rounded-xl text-xs font-semibold"
          title="Refresh roles"
        >
          <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </Button>

        <PermissionGuard module="USERS" section="ROLES" action="ADD">
          <Button
            variant="nfiYellow"
            size="sm"
            onClick={() => setIsCreateModalOpen(true)}
            className="rounded-xl text-xs font-bold shadow-2xs"
          >
            <Plus className="w-4 h-4 mr-1" />
            <span>Create Custom Role</span>
          </Button>
        </PermissionGuard>
      </PageHeader>

      {/* Global Feedback Banner */}
      {feedback.message && (
        <div
          className={`p-3.5 rounded-2xl border text-xs flex items-center gap-2 select-none shadow-xs animate-in fade-in-0 duration-150 ${
            feedback.type === 'error'
              ? 'bg-red-50 border-red-200 text-red-700'
              : 'bg-emerald-50 border-emerald-200 text-emerald-800'
          }`}
        >
          {feedback.type === 'error' ? (
            <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
          ) : (
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
          )}
          <span className="font-semibold">{feedback.message}</span>
        </div>
      )}

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Roles"
          value={stats.totalRoles}
          subtitle="Defined authorization tiers"
          icon={KeyRound}
          iconColor="text-sky-600"
          iconBg="bg-sky-50"
        />

        <StatCard
          title="Default Roles"
          value={stats.systemRoles}
          subtitle="Protected governance roles"
          icon={Lock}
          iconColor="text-[#E76120]"
          iconBg="bg-[#FFF5EE]"
        />

        <StatCard
          title="Custom Roles"
          value={stats.customRoles}
          subtitle="Custom tailored policies"
          icon={Layers}
          iconColor="text-indigo-600"
          iconBg="bg-indigo-50"
        />

        <StatCard
          title="Permissions Matrix"
          value={permissionsCount}
          subtitle="Granular database action rules"
          icon={ShieldCheck}
          iconColor="text-emerald-600"
          iconBg="bg-emerald-50"
        />
      </div>

      {/* Roles Table */}
      <AdminTableWrapper
        title="Access Control Roles Directory"
        subtitle={`Displaying ${filteredRoles.length} of ${roles.length} system roles.`}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Search roles by name or description..."
        filters={
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="h-9 px-3 bg-slate-50/80 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 outline-none focus:border-[#E76120] cursor-pointer"
          >
            <option value="all">All Roles</option>
            <option value="system">System Default</option>
            <option value="custom">Custom Roles</option>
          </select>
        }
        loading={loading}
        error={error}
        onRetry={fetchRolesData}
        isEmpty={filteredRoles.length === 0}
        emptyTitle="No roles found"
        emptyDescription="No roles match your filter criteria."
        emptyActionLabel="Create Custom Role"
        onEmptyAction={() => setIsCreateModalOpen(true)}
      >
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Role Title &amp; Code</TableHead>
              {/* <TableHead>Type</TableHead> */}
              <TableHead>Assigned Users</TableHead>
              <TableHead>Permissions Scope</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredRoles.map((role) => {
              const isSuper = role.code === 'superadmin';

              return (
                <TableRow key={role._id}>
                  {/* Title & Code */}
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-xs shrink-0 shadow-2xs ${
                          role.isSystemDefault ? 'bg-[#284661] text-white' : 'bg-indigo-100 text-indigo-700'
                        }`}
                      >
                        {role.name?.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <span className="font-bold text-slate-900 text-xs truncate block max-w-[200px]">
                          {role.name}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">code: {role.code}</span>
                      </div>
                    </div>
                  </TableCell>

                  {/* Type Badge (Commented out for now) */}
                  {/* <TableCell>
                    <Badge
                      variant={role.isSystemDefault ? 'nfiYellow' : 'secondary'}
                      className="text-[10px] font-bold"
                    >
                      {role.isSystemDefault ? 'System Default' : 'Custom'}
                    </Badge>
                  </TableCell> */}

                  {/* Assigned Users Link */}
                  <TableCell>
                    <button
                      type="button"
                      onClick={() => setViewingRoleId(role._id)}
                      className="text-xs font-bold text-[#284661] hover:underline flex items-center gap-1.5 cursor-pointer"
                    >
                      <Users className="w-3.5 h-3.5 text-slate-400" />
                      <span>{role.assignedUsersCount || 0} Staff</span>
                    </button>
                  </TableCell>

                  {/* Permissions Scope */}
                  <TableCell>
                    <button
                      type="button"
                      onClick={() => setViewingRoleId(role._id)}
                      className="text-xs font-semibold text-[#E76120] hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <Shield className="w-3.5 h-3.5" />
                      <span>{isSuper ? 'Global Wildcard (*)' : `${role.permissionCodes?.length || 0} Permissions`}</span>
                    </button>
                  </TableCell>

                  {/* Status */}
                  <TableCell>
                    <button
                      type="button"
                      disabled={role.isSystemDefault}
                      onClick={() => handleToggleStatus(role)}
                      className={`
                        inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold transition-all
                        ${
                          role.isActive
                            ? 'bg-emerald-50 text-emerald-700'
                            : 'bg-red-50 text-red-600'
                        }
                        ${role.isSystemDefault ? 'cursor-default' : 'cursor-pointer hover:opacity-80'}
                      `}
                      title={role.isSystemDefault ? 'System default role cannot be disabled' : 'Click to toggle status'}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          role.isActive ? 'bg-emerald-500' : 'bg-red-500'
                        }`}
                      />
                      <span>{role.isActive ? 'Active' : 'Inactive'}</span>
                    </button>
                  </TableCell>

                  {/* Actions */}
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      {/* View Details & Matrix */}
                      <button
                        type="button"
                        onClick={() => setViewingRoleId(role._id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                        title="View Role & Matrix"
                      >
                        <Eye className="w-4 h-4" />
                      </button>

                      {/* Edit Role Matrix */}
                      {!isSuper && (
                        <PermissionGuard module="USERS" section="ROLES" action="EDIT">
                          <button
                            type="button"
                            onClick={() => setEditingRole(role)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-[#284661] hover:bg-slate-100 transition-colors cursor-pointer"
                            title="Edit Role Matrix"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                        </PermissionGuard>
                      )}

                      {/* Assign Users */}
                      <PermissionGuard module="USERS" section="ROLES" action="EDIT">
                        <button
                          type="button"
                          onClick={() => setAssigningRole(role)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-[#E76120] hover:bg-slate-100 transition-colors cursor-pointer"
                          title="Assign Staff Users"
                        >
                          <Users className="w-4 h-4" />
                        </button>
                      </PermissionGuard>

                      {/* Delete Custom Role */}
                      {!role.isSystemDefault && (
                        <PermissionGuard module="USERS" section="ROLES" action="DELETE">
                          <button
                            type="button"
                            onClick={() => handleDeleteRole(role)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                            title="Delete Role"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </PermissionGuard>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </AdminTableWrapper>

      {/* Create / Edit Role Modal */}
      <CreateEditRoleModal
        isOpen={isCreateModalOpen || !!editingRole}
        onClose={() => {
          setIsCreateModalOpen(false);
          setEditingRole(null);
        }}
        role={editingRole}
        onSuccess={handleSaveRole}
      />

      {/* Role Details Inspector Modal */}
      <RoleDetailsModal
        isOpen={!!viewingRoleId}
        onClose={() => setViewingRoleId(null)}
        roleId={viewingRoleId}
        onEdit={(r) => setEditingRole(r)}
        onRoleUpdated={fetchRolesData}
      />

      {/* Assign Users Modal */}
      <AssignRoleUsersModal
        isOpen={!!assigningRole}
        onClose={() => setAssigningRole(null)}
        role={assigningRole}
        onAssignSuccess={handleAssignUsersSuccess}
      />
    </PageContainer>
  );
};

export default RolesPage;
