import React, { useState, useEffect, useCallback } from 'react';
import { Building2, CheckCircle2, AlertCircle, RefreshCw, Plus, Edit2, Trash2, Eye } from 'lucide-react';
import PageContainer from '../../components/admin/common/PageContainer';
import PageHeader from '../../components/admin/common/PageHeader';
import StatCard from '../../components/admin/common/StatCard';
import AdminTableWrapper from '../../components/admin/common/AdminTableWrapper';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../components/ui/table';
import departmentService from '../../services/department.service';
import PermissionGuard from '../../components/admin/common/PermissionGuard';
import CreateEditDepartmentModal from '../../components/admin/departments/CreateEditDepartmentModal';

export const DepartmentsPage = () => {
  const [stats, setStats] = useState({ total: 0, active: 0, inactive: 0, totalDesignations: 0 });
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [feedback, setFeedback] = useState({ message: '', type: '' });
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  const fetchStats = async () => {
    try { const res = await departmentService.getStats(); if (res?.stats) setStats(res.stats); } catch {}
  };
  const fetchDepartments = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const res = await departmentService.getDepartments({ page: currentPage, limit: 10, search: searchQuery, status: statusFilter });
      if (res?.departments) { setDepartments(res.departments); setTotalPages(res.pagination?.totalPages || 1); setTotalItems(res.pagination?.total || 0); }
    } catch (err) { setError(err.message || 'Failed to fetch departments'); } finally { setLoading(false); }
  }, [currentPage, searchQuery, statusFilter]);

  useEffect(() => { fetchStats(); }, []);
  useEffect(() => { fetchDepartments(); }, [fetchDepartments]);

  const showFeedback = (message, type='success') => { setFeedback({message,type}); setTimeout(()=>setFeedback({message:'',type:''}),4000); };

  const handleSave = async (payload, editId) => {
    if (editId) { await departmentService.updateDepartment(editId, payload); showFeedback('Department updated'); }
    else { await departmentService.createDepartment(payload); showFeedback('Department created'); }
    fetchDepartments(); fetchStats();
  };
  const handleToggle = async (d) => {
    try { await departmentService.toggleStatus(d._id, !d.isActive); showFeedback(`Department ${!d.isActive?'activated':'deactivated'}`); fetchDepartments(); fetchStats(); } catch(e){ showFeedback(e.message,'error'); }
  };
  const handleDelete = async (d) => {
    if (!confirm(`Delete department "${d.name}"? This cannot be undone.`)) return;
    try { await departmentService.deleteDepartment(d._id); showFeedback('Department deleted'); fetchDepartments(); fetchStats(); } catch(e){ showFeedback(e.message,'error'); }
  };

  return (
    <PageContainer>
      <PageHeader title="Department Master" subtitle="Manage organisational departments. Designations are grouped under each department.">
        <Button variant="outline" size="sm" onClick={()=>{fetchStats(); fetchDepartments();}} className="rounded-xl text-xs font-semibold"><RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${loading?'animate-spin':''}`} /><span>Refresh</span></Button>
        <PermissionGuard module="SYSTEM" section="DEPARTMENTS" action="ADD">
          <Button variant="nfiYellow" size="sm" onClick={()=>setIsCreateOpen(true)} className="rounded-xl text-xs font-bold"><Plus className="w-4 h-4 mr-1" /><span>Add Department</span></Button>
        </PermissionGuard>
      </PageHeader>

      {feedback.message && (
        <div className={`p-3.5 rounded-2xl border text-xs flex items-center gap-2 ${feedback.type==='error'?'bg-red-50 border-red-200 text-red-700':'bg-emerald-50 border-emerald-200 text-emerald-800'}`}>
          {feedback.type==='error'?<AlertCircle className="w-4 h-4 text-red-600"/>:<CheckCircle2 className="w-4 h-4 text-emerald-600"/>}
          <span className="font-semibold">{feedback.message}</span>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Departments" value={stats.total} subtitle="Master records" icon={Building2} iconColor="text-[#284661]" iconBg="bg-blue-50" />
        <StatCard title="Active" value={stats.active} subtitle="Enabled for assignment" icon={CheckCircle2} iconColor="text-emerald-600" iconBg="bg-emerald-50" />
        <StatCard title="Inactive" value={stats.inactive} subtitle="Disabled" icon={AlertCircle} iconColor="text-amber-600" iconBg="bg-amber-50" />
        <StatCard title="Total Designations" value={stats.totalDesignations} subtitle="Across all departments" icon={Building2} iconColor="text-indigo-600" iconBg="bg-indigo-50" />
      </div>

      <AdminTableWrapper
        title="Departments Directory"
        subtitle={`Showing ${departments.length} of ${totalItems} departments.`}
        searchQuery={searchQuery}
        onSearchChange={(v)=>{setSearchQuery(v); setCurrentPage(1);}}
        searchPlaceholder="Search by name or code..."
        filters={<select value={statusFilter} onChange={(e)=>{setStatusFilter(e.target.value); setCurrentPage(1);}} className="h-9 px-3 bg-slate-50/80 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 outline-none focus:border-[#E76120] cursor-pointer"><option value="all">All Statuses</option><option value="active">Active</option><option value="inactive">Inactive</option></select>}
        loading={loading}
        error={error}
        onRetry={fetchDepartments}
        isEmpty={departments.length===0}
        emptyTitle="No departments found"
        emptyDescription="Create your first department to group designations."
        emptyActionLabel="Add Department"
        onEmptyAction={()=>setIsCreateOpen(true)}
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={totalItems}
        itemsPerPage={10}
        onPageChange={(p)=>setCurrentPage(p)}
      >
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Department</TableHead>
              <TableHead>Code</TableHead>
              <TableHead>Designations</TableHead>
              <TableHead>Users</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {departments.map((d)=>(
              <TableRow key={d._id}>
                <TableCell>
                  <div><span className="font-bold text-slate-900 text-xs block">{d.name}</span><span className="text-[11px] text-slate-400 line-clamp-1">{d.description || '—'}</span></div>
                </TableCell>
                <TableCell><Badge variant="outline" className="text-[10px] font-mono">{d.code}</Badge></TableCell>
                <TableCell><span className="text-xs font-semibold text-slate-700">{d.designationsCount ?? 0}</span></TableCell>
                <TableCell><span className="text-xs text-slate-600">{d.usersCount ?? 0}</span></TableCell>
                <TableCell>
                  <PermissionGuard module="SYSTEM" section="DEPARTMENTS" action="EDIT">
                    <button onClick={()=>handleToggle(d)} className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold cursor-pointer ${d.isActive?'bg-emerald-50 text-emerald-700':'bg-slate-200 text-slate-600'}`}><span className={`w-1.5 h-1.5 rounded-full ${d.isActive?'bg-emerald-500':'bg-slate-400'}`} /><span>{d.isActive?'Active':'Inactive'}</span></button>
                  </PermissionGuard>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    <PermissionGuard module="SYSTEM" section="DEPARTMENTS" action="EDIT">
                      <button onClick={()=>setEditing(d)} className="p-1.5 rounded-lg text-slate-400 hover:text-[#284661] hover:bg-slate-100 cursor-pointer" title="Edit"><Edit2 className="w-4 h-4" /></button>
                    </PermissionGuard>
                    <PermissionGuard module="SYSTEM" section="DEPARTMENTS" action="DELETE">
                      <button onClick={()=>handleDelete(d)} className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 cursor-pointer" title="Delete"><Trash2 className="w-4 h-4" /></button>
                    </PermissionGuard>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </AdminTableWrapper>

      <CreateEditDepartmentModal isOpen={isCreateOpen || !!editing} onClose={()=>{setIsCreateOpen(false); setEditing(null);}} department={editing} onSuccess={handleSave} />
    </PageContainer>
  );
};

export default DepartmentsPage;
