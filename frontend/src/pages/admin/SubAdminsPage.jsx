import React, { useState, useEffect, useCallback } from 'react';
import {
  UserCheck,
  Users,
  UserX,
  Plus,
  Eye,
  Edit2,
  KeyRound,
  Shield,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
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

import subadminService from '../../services/subadmin.service';
import { useAuth } from '../../context/AuthContext';
import PermissionGuard from '../../components/admin/common/PermissionGuard';

// Modals
import CreateEditAdminModal from '../../components/admin/admins/CreateEditAdminModal';
import AdminDetailsModal from '../../components/admin/admins/AdminDetailsModal';
import ResetPasswordDialog from '../../components/admin/admins/ResetPasswordDialog';
import PermissionAssignmentModal from '../../components/admin/admins/PermissionAssignmentModal';

export const SubAdminsPage = () => {
  const { user: currentUser } = useAuth();

  const [stats, setStats] = useState({
    totalSubAdmins: 0,
    activeSubAdmins: 0,
    inactiveSubAdmins: 0,
  });

  const [subAdmins, setSubAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [feedback, setFeedback] = useState({ message: '', type: '' });

  // Filters & Pagination State
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('subadmin');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingSubAdmin, setEditingSubAdmin] = useState(null);
  const [viewingSubAdmin, setViewingSubAdmin] = useState(null);
  const [resetPasswordSubAdmin, setResetPasswordSubAdmin] = useState(null);
  const [permissionsSubAdmin, setPermissionsSubAdmin] = useState(null);

  // Fetch KPI Stats
  const fetchStats = async () => {
    try {
      const res = await subadminService.getStats();
      if (res && res.stats) {
        setStats(res.stats);
      }
    } catch (err) {
      console.warn('Failed to load subadmin stats:', err.message);
    }
  };

  // Fetch Sub Admins List
  const fetchSubAdmins = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const res = await subadminService.getSubAdmins({
        page: currentPage,
        limit: 10,
        search: searchQuery,
        role: roleFilter,
        status: statusFilter,
      });

      if (res && res.admins) {
        setSubAdmins(res.admins);
        setTotalPages(res.pagination?.totalPages || 1);
        setTotalItems(res.pagination?.total || 0);
      }
    } catch (err) {
      setError(err.message || 'Failed to fetch sub-administrators list.');
    } finally {
      setLoading(false);
    }
  }, [currentPage, searchQuery, roleFilter, statusFilter]);

  useEffect(() => {
    fetchStats();
  }, []);

  useEffect(() => {
    fetchSubAdmins();
  }, [fetchSubAdmins]);

  const showFeedback = (message, type = 'success') => {
    setFeedback({ message, type });
    setTimeout(() => setFeedback({ message: '', type: '' }), 4000);
  };

  // Create / Update Handler
  const handleSaveSubAdmin = async (formData, editId) => {
    if (editId) {
      await subadminService.updateSubAdmin(editId, formData);
      showFeedback('Sub Administrator updated successfully.');
    } else {
      await subadminService.createSubAdmin({
        ...formData,
        role: formData.role || 'subadmin',
      });
      showFeedback('New Sub Administrator created successfully.');
    }
    fetchSubAdmins();
    fetchStats();
  };

  // Status Toggle
  const handleToggleStatus = async (subAdmin) => {
    try {
      const newStatus = !subAdmin.isActive;
      await subadminService.toggleStatus(subAdmin._id, newStatus);
      showFeedback(`Sub Administrator ${newStatus ? 'activated' : 'deactivated'} successfully.`);
      fetchSubAdmins();
      fetchStats();
    } catch (err) {
      showFeedback(err.message, 'error');
    }
  };

  // Reset Password
  const handleResetPassword = async (subAdminId, newPassword) => {
    await subadminService.resetPassword(subAdminId, newPassword);
    showFeedback('Sub Administrator password reset successfully.');
  };

  // Save Permissions
  const handleSavePermissions = async (subAdminId, customPermissions) => {
    await subadminService.updatePermissions(subAdminId, customPermissions);
    showFeedback('Custom module/section permissions updated successfully.');
    fetchSubAdmins();
  };

  return (
    <PageContainer>
      {/* Header */}
      <PageHeader
        title="Sub Administrator Management"
        subtitle="Manage departmental coordinators, content authors, reviewers, and fine-grained module permissions."
      >
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            fetchStats();
            fetchSubAdmins();
          }}
          className="rounded-xl text-xs font-semibold"
          title="Refresh table"
        >
          <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </Button>

        <PermissionGuard module="USERS" section="SUBADMINS" action="ADD">
          <Button
            variant="nfiYellow"
            size="sm"
            onClick={() => setIsCreateModalOpen(true)}
            className="rounded-xl text-xs font-bold shadow-2xs"
          >
            <Plus className="w-4 h-4 mr-1" />
            <span>Add Sub Admin</span>
          </Button>
        </PermissionGuard>
      </PageHeader>

      {/* Feedback Alert */}
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
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title="Total Sub Administrators"
          value={stats.totalSubAdmins}
          subtitle="Departmental staff & coordinators"
          icon={Users}
          iconColor="text-sky-600"
          iconBg="bg-sky-50"
        />

        <StatCard
          title="Active Accounts"
          value={stats.activeSubAdmins}
          subtitle="Active operational sessions"
          icon={UserCheck}
          iconColor="text-emerald-600"
          iconBg="bg-emerald-50"
        />

        <StatCard
          title="Deactivated Sub Admins"
          value={stats.inactiveSubAdmins}
          subtitle="Access temporarily restricted"
          icon={UserX}
          iconColor="text-red-500"
          iconBg="bg-red-50"
        />
      </div>

      {/* Sub Admins Table */}
      <AdminTableWrapper
        title="Sub Administrators Directory"
        subtitle={`Displaying ${subAdmins.length} of ${totalItems} registered sub-administrators.`}
        searchQuery={searchQuery}
        onSearchChange={(val) => {
          setSearchQuery(val);
          setCurrentPage(1);
        }}
        searchPlaceholder="Search sub-admins by name, email, or department..."
        filters={
          <>
            <select
              value={roleFilter}
              onChange={(e) => {
                setRoleFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="h-9 px-3 bg-slate-50/80 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 outline-none focus:border-[#E76120] cursor-pointer"
            >
              <option value="all">All Roles</option>
              <option value="subadmin">Sub Admin</option>
              <option value="maker">Maker</option>
              <option value="reviewer">Reviewer</option>
              <option value="approver">Approver</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="h-9 px-3 bg-slate-50/80 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 outline-none focus:border-[#E76120] cursor-pointer"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active</option>
              <option value="inactive">Deactivated</option>
            </select>
          </>
        }
        loading={loading}
        error={error}
        onRetry={fetchSubAdmins}
        isEmpty={subAdmins.length === 0}
        emptyTitle="No sub-administrators found"
        emptyDescription="No records match your filter criteria. Create your first Sub Admin above."
        emptyActionLabel="Register Sub Admin"
        onEmptyAction={() => setIsCreateModalOpen(true)}
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={totalItems}
        itemsPerPage={10}
        onPageChange={(p) => setCurrentPage(p)}
      >
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Sub Administrator</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Department &amp; Designation</TableHead>
              <TableHead>Custom Permissions</TableHead>
              <TableHead>Account Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {subAdmins.map((sub) => {
              const isSelf = sub._id === currentUser?.id;

              return (
                <TableRow key={sub._id}>
                  {/* Identity */}
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-[#284661] text-white font-bold flex items-center justify-center text-xs shadow-2xs shrink-0">
                        {sub.name?.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-slate-900 text-xs truncate max-w-[160px]">
                            {sub.name}
                          </span>
                          {isSelf && (
                            <span className="text-[9px] font-extrabold bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded-md">
                              YOU
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-400 truncate max-w-[180px]">
                          {sub.email} · @{sub.username}
                        </p>
                      </div>
                    </div>
                  </TableCell>

                  {/* Role */}
                  <TableCell>
                    <Badge variant="nfiNavy" className="text-[10px] font-bold">
                      {sub.role?.toUpperCase()}
                    </Badge>
                  </TableCell>

                  {/* Department */}
                  <TableCell>
                    <div className="text-xs">
                      <span className="font-semibold text-slate-800 block truncate max-w-[180px]">
                        {sub.designation || 'Coordinator'}
                      </span>
                      <span className="text-[11px] text-slate-400 truncate max-w-[180px] block">
                        {sub.department || 'IPC'}
                      </span>
                    </div>
                  </TableCell>

                  {/* Custom Permissions Count */}
                  <TableCell>
                    <button
                      type="button"
                      onClick={() => setPermissionsSubAdmin(sub)}
                      className="text-xs font-semibold text-[#E76120] hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <Shield className="w-3.5 h-3.5" />
                      <span>{sub.customPermissions?.length || 0} Permissions</span>
                    </button>
                  </TableCell>

                  {/* Status Toggle */}
                  <TableCell>
                    <button
                      type="button"
                      disabled={isSelf}
                      onClick={() => handleToggleStatus(sub)}
                      className={`
                        inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold transition-all cursor-pointer
                        ${
                          sub.isActive
                            ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                            : 'bg-red-50 text-red-600 hover:bg-red-100'
                        }
                        ${isSelf ? 'opacity-80 cursor-default hover:bg-transparent' : ''}
                      `}
                      title={isSelf ? 'Cannot deactivate self' : 'Toggle status'}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          sub.isActive ? 'bg-emerald-500' : 'bg-red-500'
                        }`}
                      />
                      <span>{sub.isActive ? 'Active' : 'Inactive'}</span>
                    </button>
                  </TableCell>

                  {/* Actions */}
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        type="button"
                        onClick={() => setViewingSubAdmin(sub)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                        title="View Profile"
                      >
                        <Eye className="w-4 h-4" />
                      </button>

                      <PermissionGuard module="USERS" section="SUBADMINS" action="EDIT">
                        <button
                          type="button"
                          onClick={() => setEditingSubAdmin(sub)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-[#284661] hover:bg-slate-100 transition-colors cursor-pointer"
                          title="Edit Sub Admin"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                      </PermissionGuard>

                      <PermissionGuard module="USERS" section="SUBADMINS" action="EDIT">
                        <button
                          type="button"
                          onClick={() => setPermissionsSubAdmin(sub)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-slate-100 transition-colors cursor-pointer"
                          title="Assign Permissions"
                        >
                          <Shield className="w-4 h-4" />
                        </button>
                      </PermissionGuard>

                      <PermissionGuard module="USERS" section="SUBADMINS" action="EDIT">
                        <button
                          type="button"
                          onClick={() => setResetPasswordSubAdmin(sub)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-[#E76120] hover:bg-slate-100 transition-colors cursor-pointer"
                          title="Reset Password"
                        >
                          <KeyRound className="w-4 h-4" />
                        </button>
                      </PermissionGuard>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </AdminTableWrapper>

      {/* Modals */}
      <CreateEditAdminModal
        isOpen={isCreateModalOpen || !!editingSubAdmin}
        onClose={() => {
          setIsCreateModalOpen(false);
          setEditingSubAdmin(null);
        }}
        admin={editingSubAdmin}
        onSuccess={handleSaveSubAdmin}
      />

      <AdminDetailsModal
        isOpen={!!viewingSubAdmin}
        onClose={() => setViewingSubAdmin(null)}
        admin={viewingSubAdmin}
        onEdit={(adm) => setEditingSubAdmin(adm)}
      />

      <ResetPasswordDialog
        isOpen={!!resetPasswordSubAdmin}
        onClose={() => setResetPasswordSubAdmin(null)}
        admin={resetPasswordSubAdmin}
        onResetConfirm={handleResetPassword}
      />

      <PermissionAssignmentModal
        isOpen={!!permissionsSubAdmin}
        onClose={() => setPermissionsSubAdmin(null)}
        admin={permissionsSubAdmin}
        onPermissionsSave={handleSavePermissions}
      />
    </PageContainer>
  );
};

export default SubAdminsPage;
