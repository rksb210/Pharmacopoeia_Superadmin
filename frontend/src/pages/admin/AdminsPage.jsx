import React, { useState, useEffect, useCallback } from 'react';
import {
  Users,
  ShieldCheck,
  UserCheck,
  UserX,
  Plus,
  Eye,
  Edit2,
  KeyRound,
  Shield,
  MoreVertical,
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

import adminService from '../../services/admin.service';
import { useAuth } from '../../context/AuthContext';
import { usePermission } from '../../context/PermissionContext';
import PermissionGuard from '../../components/admin/common/PermissionGuard';

// Modals
import CreateEditAdminModal from '../../components/admin/admins/CreateEditAdminModal';
import AdminDetailsModal from '../../components/admin/admins/AdminDetailsModal';
import ResetPasswordDialog from '../../components/admin/admins/ResetPasswordDialog';
import PermissionAssignmentModal from '../../components/admin/admins/PermissionAssignmentModal';

export const AdminsPage = () => {
  const { user: currentUser } = useAuth();
  const { can } = usePermission();

  const [stats, setStats] = useState({
    totalAdmins: 0,
    activeAdmins: 0,
    superAdmins: 0,
    inactiveAdmins: 0,
  });

  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [feedback, setFeedback] = useState({ message: '', type: '' });

  // Filter & Pagination State
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  // Modal States
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState(null);
  const [viewingAdmin, setViewingAdmin] = useState(null);
  const [resetPasswordAdmin, setResetPasswordAdmin] = useState(null);
  const [permissionsAdmin, setPermissionsAdmin] = useState(null);
  const [activeMenuAdminId, setActiveMenuAdminId] = useState(null);

  // Fetch KPI Stats
  const fetchStats = async () => {
    try {
      const res = await adminService.getStats();
      if (res && res.stats) {
        setStats(res.stats);
      }
    } catch (err) {
      console.warn('Failed to load stats:', err.message);
    }
  };

  // Fetch Admins List
  const fetchAdmins = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const res = await adminService.getAdmins({
        page: currentPage,
        limit: 10,
        search: searchQuery,
        role: roleFilter,
        status: statusFilter,
      });

      if (res && res.admins) {
        setAdmins(res.admins);
        setTotalPages(res.pagination?.totalPages || 1);
        setTotalItems(res.pagination?.total || 0);
      }
    } catch (err) {
      setError(err.message || 'Failed to fetch administrators list.');
    } finally {
      setLoading(false);
    }
  }, [currentPage, searchQuery, roleFilter, statusFilter]);

  useEffect(() => {
    fetchStats();
  }, []);

  useEffect(() => {
    fetchAdmins();
  }, [fetchAdmins]);

  // Flash Feedback Helper
  const showFeedback = (message, type = 'success') => {
    setFeedback({ message, type });
    setTimeout(() => setFeedback({ message: '', type: '' }), 4000);
  };

  // Create / Update Admin Handler
  const handleSaveAdmin = async (formData, editId) => {
    if (editId) {
      await adminService.updateAdmin(editId, formData);
      showFeedback('Administrator updated successfully.');
    } else {
      await adminService.createAdmin(formData);
      showFeedback('New administrator provisioned successfully.');
    }
    fetchAdmins();
    fetchStats();
  };

  // Status Toggle Handler
  const handleToggleStatus = async (admin) => {
    try {
      const newStatus = !admin.isActive;
      await adminService.toggleStatus(admin._id, newStatus);
      showFeedback(`Administrator ${newStatus ? 'activated' : 'deactivated'} successfully.`);
      fetchAdmins();
      fetchStats();
    } catch (err) {
      showFeedback(err.message, 'error');
    }
  };

  // Reset Password Handler
  const handleResetPassword = async (adminId, newPassword) => {
    await adminService.resetPassword(adminId, newPassword);
    showFeedback('Administrator password has been reset successfully.');
  };

  // Save Custom Permissions Handler
  const handleSavePermissions = async (adminId, customPermissions) => {
    await adminService.updatePermissions(adminId, customPermissions);
    showFeedback('Custom permissions updated successfully.');
    fetchAdmins();
  };

  return (
    <PageContainer>
      {/* Page Header */}
      <PageHeader
        title="Administrator Management"
        subtitle="Manage official Indian Pharmacopoeia Commission administrative staff, roles, and fine-grained security policies."
      >
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            fetchStats();
            fetchAdmins();
          }}
          className="rounded-xl text-xs font-semibold"
          title="Refresh table"
        >
          <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </Button>

        <PermissionGuard module="USERS" section="ADMINS" action="ADD">
          <Button
            variant="nfiYellow"
            size="sm"
            onClick={() => setIsCreateModalOpen(true)}
            className="rounded-xl text-xs font-bold shadow-2xs"
          >
            <Plus className="w-4 h-4 mr-1" />
            <span>Add Administrator</span>
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

      {/* KPI Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title="Total Administrators"
          value={stats.totalAdmins}
          subtitle="Registered staff accounts"
          icon={Users}
          iconColor="text-sky-600"
          iconBg="bg-sky-50"
        />

        <StatCard
          title="Active Administrators"
          value={stats.activeAdmins}
          subtitle="Operating with valid sessions"
          icon={UserCheck}
          iconColor="text-emerald-600"
          iconBg="bg-emerald-50"
        />

        {/* <StatCard
          title="Super Administrators"
          value={stats.superAdmins}
          subtitle="Governance & core security"
          icon={ShieldCheck}
          iconColor="text-[#E76120]"
          iconBg="bg-[#FFF5EE]"
        /> */}

        <StatCard
          title="Deactivated Accounts"
          value={stats.inactiveAdmins}
          subtitle="Access currently restricted"
          icon={UserX}
          iconColor="text-red-500"
          iconBg="bg-red-50"
        />
      </div>

      {/* Admins Table with Filters & Pagination */}
      <AdminTableWrapper
        title="IPC Administrators Directory"
        subtitle={`Displaying ${admins.length} of ${totalItems} registered administrators.`}
        searchQuery={searchQuery}
        onSearchChange={(val) => {
          setSearchQuery(val);
          setCurrentPage(1);
        }}
        searchPlaceholder="Search by name, email, username or department..."
        filters={
          <>
            {/* Role Filter */}
            <select
              value={roleFilter}
              onChange={(e) => {
                setRoleFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="h-9 px-3 bg-slate-50/80 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 outline-none focus:border-[#E76120] cursor-pointer"
            >
              <option value="all">All Roles</option>
              <option value="superadmin">Super Admin</option>
              <option value="admin">Admin</option>
              <option value="subadmin">Sub Admin</option>
              <option value="maker">Maker</option>
              <option value="reviewer">Reviewer</option>
              <option value="approver">Approver</option>
            </select>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="h-9 px-3 bg-slate-50/80 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 outline-none focus:border-[#E76120] cursor-pointer"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active Accounts</option>
              <option value="inactive">Deactivated</option>
            </select>
          </>
        }
        loading={loading}
        error={error}
        onRetry={fetchAdmins}
        isEmpty={admins.length === 0}
        emptyTitle="No administrators found"
        emptyDescription="No administrator records match your search filter criteria."
        emptyActionLabel="Register Administrator"
        onEmptyAction={() => setIsCreateModalOpen(true)}
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={totalItems}
        itemsPerPage={10}
        onPageChange={(page) => setCurrentPage(page)}
      >
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Administrator</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Department &amp; Designation</TableHead>
              <TableHead>Account Status</TableHead>
              <TableHead>Last Activity</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {admins.map((adm) => {
              const isSelf = adm._id === currentUser?.id;
              const isSuper = adm.role === 'superadmin';
              const canModify = currentUser?.role === 'superadmin' || !isSuper;

              return (
                <TableRow key={adm._id}>
                  {/* Administrator Identity */}
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-[#284661] text-white font-bold flex items-center justify-center text-xs shadow-2xs shrink-0">
                        {adm.name?.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-slate-900 text-xs truncate max-w-[160px]">
                            {adm.name}
                          </span>
                          {isSelf && (
                            <span className="text-[9px] font-extrabold bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded-md">
                              YOU
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-400 truncate max-w-[180px]">
                          {adm.email} · @{adm.username}
                        </p>
                      </div>
                    </div>
                  </TableCell>

                  {/* Role Badge */}
                  <TableCell>
                    <Badge
                      variant={isSuper ? 'nfiYellow' : 'nfiNavy'}
                      className="text-[10px] font-bold"
                    >
                      {adm.role?.toUpperCase()}
                    </Badge>
                  </TableCell>

                  {/* Department & Designation */}
                  <TableCell>
                    <div className="text-xs">
                      <span className="font-semibold text-slate-800 block truncate max-w-[180px]">
                        {adm.designation || 'Officer'}
                      </span>
                      <span className="text-[11px] text-slate-400 truncate max-w-[180px] block">
                        {adm.department || 'IPC'}
                      </span>
                    </div>
                  </TableCell>

                  {/* Status Toggle */}
                  <TableCell>
                    <button
                      type="button"
                      disabled={!canModify || isSelf}
                      onClick={() => handleToggleStatus(adm)}
                      className={`
                        inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold transition-all cursor-pointer
                        ${
                          adm.isActive
                            ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                            : 'bg-red-50 text-red-600 hover:bg-red-100'
                        }
                        ${!canModify || isSelf ? 'opacity-80 cursor-default hover:bg-transparent' : ''}
                      `}
                      title={
                        isSelf
                          ? 'You cannot deactivate your own account'
                          : canModify
                          ? 'Click to toggle status'
                          : 'Superadmin accounts can only be modified by Superadmin'
                      }
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          adm.isActive ? 'bg-emerald-500' : 'bg-red-500'
                        }`}
                      />
                      <span>{adm.isActive ? 'Active' : 'Inactive'}</span>
                    </button>
                  </TableCell>

                  {/* Last Activity */}
                  <TableCell>
                    <div className="text-xs text-slate-600">
                      <span className="font-medium block">
                        {adm.lastLogin
                          ? new Date(adm.lastLogin).toLocaleDateString('en-IN', {
                              day: '2-digit',
                              month: 'short',
                            })
                          : 'Never'}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {adm.lastLoginIP || 'No IP record'}
                      </span>
                    </div>
                  </TableCell>

                  {/* Actions Dropdown */}
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      {/* View Details */}
                      <button
                        type="button"
                        onClick={() => setViewingAdmin(adm)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                        title="View Profile Details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>

                      {/* Edit Profile */}
                      {canModify && (
                        <PermissionGuard module="USERS" section="ADMINS" action="EDIT">
                          <button
                            type="button"
                            onClick={() => setEditingAdmin(adm)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-[#284661] hover:bg-slate-100 transition-colors cursor-pointer"
                            title="Edit Profile"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                        </PermissionGuard>
                      )}

                      {/* Reset Password */}
                      {canModify && (
                        <PermissionGuard module="USERS" section="ADMINS" action="EDIT">
                          <button
                            type="button"
                            onClick={() => setResetPasswordAdmin(adm)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-[#E76120] hover:bg-slate-100 transition-colors cursor-pointer"
                            title="Reset Password"
                          >
                            <KeyRound className="w-4 h-4" />
                          </button>
                        </PermissionGuard>
                      )}

                      {/* Custom Permissions */}
                      {currentUser?.role === 'superadmin' && (
                        <button
                          type="button"
                          onClick={() => setPermissionsAdmin(adm)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-slate-100 transition-colors cursor-pointer"
                          title="Assign Permissions"
                        >
                          <Shield className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </AdminTableWrapper>

      {/* Create / Edit Admin Modal */}
      <CreateEditAdminModal
        isOpen={isCreateModalOpen || !!editingAdmin}
        onClose={() => {
          setIsCreateModalOpen(false);
          setEditingAdmin(null);
        }}
        admin={editingAdmin}
        onSuccess={handleSaveAdmin}
      />

      {/* Admin Details Inspector Modal */}
      <AdminDetailsModal
        isOpen={!!viewingAdmin}
        onClose={() => setViewingAdmin(null)}
        admin={viewingAdmin}
        onEdit={(adm) => setEditingAdmin(adm)}
      />

      {/* Password Reset Dialog */}
      <ResetPasswordDialog
        isOpen={!!resetPasswordAdmin}
        onClose={() => setResetPasswordAdmin(null)}
        admin={resetPasswordAdmin}
        onResetConfirm={handleResetPassword}
      />

      {/* Fine-grained Permissions Assignment Modal */}
      <PermissionAssignmentModal
        isOpen={!!permissionsAdmin}
        onClose={() => setPermissionsAdmin(null)}
        admin={permissionsAdmin}
        onPermissionsSave={handleSavePermissions}
      />
    </PageContainer>
  );
};

export default AdminsPage;
