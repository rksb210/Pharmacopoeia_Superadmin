import React, { useState, useEffect, useCallback } from 'react';
import { Award, CheckCircle2, AlertCircle, RefreshCw, Plus, Edit2, Trash2 } from 'lucide-react';
import PageContainer from '../../components/admin/common/PageContainer';
import PageHeader from '../../components/admin/common/PageHeader';
import StatCard from '../../components/admin/common/StatCard';
import AdminTableWrapper from '../../components/admin/common/AdminTableWrapper';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../components/ui/table';
import designationService from '../../services/designation.service';
import departmentService from '../../services/department.service';
import PermissionGuard from '../../components/admin/common/PermissionGuard';
import CreateEditDesignationModal from '../../components/admin/designations/CreateEditDesignationModal';

export const DesignationsPage = () => {
  const [stats, setStats] = useState({ total: 0, active: 0, inactive: 0 });
  const [designations, setDesignations] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [feedback, setFeedback] = useState({ message: '', type: '' });
  const [searchQuery, setSearchQuery] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  const fetchStats = async () => { try{ const r=await designationService.getStats(); if(r?.stats) setStats(r.stats);}catch{} };
  const fetchDepartments = async () => { try{ const r=await departmentService.getActiveDepartments(); if(r?.departments) setDepartments(r.departments);}catch{} };
  const fetchDesignations = useCallback(async ()=>{
    setLoading(true); setError('');
    try{
      const res = await designationService.getDesignations({ page: currentPage, limit: 10, search: searchQuery, department: departmentFilter, status: statusFilter });
      if(res?.designations){ setDesignations(res.designations); setTotalPages(res.pagination?.totalPages||1); setTotalItems(res.pagination?.total||0);}
    }catch(err){ setError(err.message||'Failed to fetch designations'); } finally{ setLoading(false); }
  },[currentPage,searchQuery,departmentFilter,statusFilter]);

  useEffect(()=>{fetchStats(); fetchDepartments();},[]);
  useEffect(()=>{fetchDesignations();},[fetchDesignations]);

  const showFeedback=(m,t='success')=>{ setFeedback({message:m,type:t}); setTimeout(()=>setFeedback({message:'',type:''}),4000); };

  const handleSave=async(payload,editId)=>{
    if(editId) await designationService.updateDesignation(editId,payload);
    else await designationService.createDesignation(payload);
    showFeedback(editId?'Designation updated':'Designation created');
    fetchDesignations(); fetchStats();
  };
  const handleToggle=async(d)=>{
    try{ await designationService.toggleStatus(d._id,!d.isActive); showFeedback(`Designation ${!d.isActive?'activated':'deactivated'}`); fetchDesignations(); fetchStats(); }catch(e){ showFeedback(e.message,'error'); }
  };
  const handleDelete=async(d)=>{
    if(!confirm(`Delete designation "${d.name}"?`)) return;
    try{ await designationService.deleteDesignation(d._id); showFeedback('Designation deleted'); fetchDesignations(); fetchStats(); }catch(e){ showFeedback(e.message,'error'); }
  };

  return (
    <PageContainer>
      <PageHeader title="Designation Master" subtitle="Designations are scoped under a department. Select department when creating a designation.">
        <Button variant="outline" size="sm" onClick={()=>{fetchStats(); fetchDesignations(); fetchDepartments();}} className="rounded-xl text-xs font-semibold"><RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${loading?'animate-spin':''}`} /><span>Refresh</span></Button>
        <PermissionGuard module="SYSTEM" section="DESIGNATIONS" action="ADD">
          <Button variant="nfiYellow" size="sm" onClick={()=>setIsCreateOpen(true)} className="rounded-xl text-xs font-bold"><Plus className="w-4 h-4 mr-1" /><span>Add Designation</span></Button>
        </PermissionGuard>
      </PageHeader>

      {feedback.message && (<div className={`p-3.5 rounded-2xl border text-xs flex items-center gap-2 ${feedback.type==='error'?'bg-red-50 border-red-200 text-red-700':'bg-emerald-50 border-emerald-200 text-emerald-800'}`}>{feedback.type==='error'?<AlertCircle className="w-4 h-4 text-red-600"/>:<CheckCircle2 className="w-4 h-4 text-emerald-600"/>}<span className="font-semibold">{feedback.message}</span></div>)}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard title="Total Designations" value={stats.total} subtitle="Master records" icon={Award} iconColor="text-[#284661]" iconBg="bg-blue-50" />
        <StatCard title="Active" value={stats.active} subtitle="Available for assignment" icon={CheckCircle2} iconColor="text-emerald-600" iconBg="bg-emerald-50" />
        <StatCard title="Inactive" value={stats.inactive} subtitle="Disabled" icon={AlertCircle} iconColor="text-amber-600" iconBg="bg-amber-50" />
      </div>

      <AdminTableWrapper
        title="Designations Directory"
        subtitle={`Showing ${designations.length} of ${totalItems} designations.`}
        searchQuery={searchQuery}
        onSearchChange={(v)=>{setSearchQuery(v); setCurrentPage(1);}}
        searchPlaceholder="Search by name or code..."
        filters={<><select value={departmentFilter} onChange={(e)=>{setDepartmentFilter(e.target.value); setCurrentPage(1);}} className="h-9 px-3 bg-slate-50/80 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 outline-none focus:border-[#E76120] cursor-pointer"><option value="all">All Departments</option>{departments.map(d=><option key={d._id} value={d._id}>{d.name}</option>)}</select><select value={statusFilter} onChange={(e)=>{setStatusFilter(e.target.value); setCurrentPage(1);}} className="h-9 px-3 bg-slate-50/80 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 outline-none focus:border-[#E76120] cursor-pointer"><option value="all">All Statuses</option><option value="active">Active</option><option value="inactive">Inactive</option></select></>}
        loading={loading}
        error={error}
        onRetry={fetchDesignations}
        isEmpty={designations.length===0}
        emptyTitle="No designations found"
        emptyDescription="Create your first designation under a department."
        emptyActionLabel="Add Designation"
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
              <TableHead>Designation</TableHead>
              <TableHead>Code</TableHead>
              <TableHead>Department</TableHead>
              <TableHead>Users</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {designations.map((d)=>(
              <TableRow key={d._id}>
                <TableCell>
                  <div><span className="font-bold text-slate-900 text-xs block">{d.name}</span><span className="text-[11px] text-slate-400 line-clamp-1">{d.description || '—'}</span></div>
                </TableCell>
                <TableCell><Badge variant="outline" className="text-[10px] font-mono">{d.code}</Badge></TableCell>
                <TableCell><span className="text-xs font-semibold text-slate-700">{d.department?.name || '—'}</span><span className="text-[10px] text-slate-400 block">{d.department?.code || ''}</span></TableCell>
                <TableCell><span className="text-xs text-slate-600">{d.usersCount ?? 0}</span></TableCell>
                <TableCell>
                  <PermissionGuard module="SYSTEM" section="DESIGNATIONS" action="EDIT">
                    <button onClick={()=>handleToggle(d)} className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold cursor-pointer ${d.isActive?'bg-emerald-50 text-emerald-700':'bg-slate-200 text-slate-600'}`}><span className={`w-1.5 h-1.5 rounded-full ${d.isActive?'bg-emerald-500':'bg-slate-400'}`} /><span>{d.isActive?'Active':'Inactive'}</span></button>
                  </PermissionGuard>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    <PermissionGuard module="SYSTEM" section="DESIGNATIONS" action="EDIT">
                      <button onClick={()=>setEditing(d)} className="p-1.5 rounded-lg text-slate-400 hover:text-[#284661] hover:bg-slate-100 cursor-pointer" title="Edit"><Edit2 className="w-4 h-4" /></button>
                    </PermissionGuard>
                    <PermissionGuard module="SYSTEM" section="DESIGNATIONS" action="DELETE">
                      <button onClick={()=>handleDelete(d)} className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 cursor-pointer" title="Delete"><Trash2 className="w-4 h-4" /></button>
                    </PermissionGuard>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </AdminTableWrapper>

      <CreateEditDesignationModal isOpen={isCreateOpen || !!editing} onClose={()=>{setIsCreateOpen(false); setEditing(null);}} designation={editing} departments={departments} onSuccess={handleSave} preselectedDepartment={departmentFilter!=='all'?departmentFilter:''} />
    </PageContainer>
  );
};

export default DesignationsPage;
