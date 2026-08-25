import React from 'react';
import AdminModal from '../common/AdminModal';
import { Badge } from '../../ui/badge';
import { ShieldCheck, Mail, User, Building, Phone, Calendar, Monitor, Globe } from 'lucide-react';

export const AdminDetailsModal = ({ isOpen, onClose, admin, onEdit }) => {
  if (!admin) return null;

  const roleName = (admin.role || 'admin').toUpperCase();
  const formattedLastLogin = admin.lastLogin
    ? new Date(admin.lastLogin).toLocaleString('en-IN', {
        dateStyle: 'medium',
        timeStyle: 'short',
      })
    : 'Never logged in';

  return (
    <AdminModal
      isOpen={isOpen}
      onClose={onClose}
      title="Administrator Profile &amp; Metadata"
      description={`System identification details and activity summary for ${admin.name}.`}
      confirmLabel="Edit Profile"
      onConfirm={() => {
        onClose();
        if (onEdit) onEdit(admin);
      }}
      size="md"
    >
      <div className="space-y-5 text-xs select-none">
        {/* Top Header Card */}
        <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-[#284661] text-white font-black flex items-center justify-center text-lg shadow-xs">
              {admin.name?.charAt(0).toUpperCase()}
            </div>
            <div>
              <h4 className="font-bold text-slate-900 text-sm sm:text-base">{admin.name}</h4>
              <p className="text-slate-400 text-xs">@{admin.username}</p>
            </div>
          </div>

          <div className="flex flex-col items-end gap-1">
            <Badge
              variant={admin.role === 'superadmin' ? 'nfiYellow' : 'nfiNavy'}
              className="text-[10px] font-black tracking-wider"
            >
              {roleName}
            </Badge>
            <span className={`text-[11px] font-bold ${admin.isActive ? 'text-emerald-600' : 'text-red-500'}`}>
              ● {admin.isActive ? 'Active Account' : 'Deactivated'}
            </span>
          </div>
        </div>

        {/* Detailed Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 bg-white border border-slate-100 p-4 rounded-2xl shadow-2xs">
          <div className="flex items-start gap-2.5">
            <Mail className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
            <div>
              <span className="text-slate-400 font-medium">Email Address</span>
              <p className="font-bold text-slate-800 break-all">{admin.email}</p>
            </div>
          </div>

          <div className="flex items-start gap-2.5">
            <Building className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
            <div>
              <span className="text-slate-400 font-medium">Department</span>
              <p className="font-bold text-slate-800">{admin.department || 'IPC'}</p>
            </div>
          </div>

          <div className="flex items-start gap-2.5">
            <User className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
            <div>
              <span className="text-slate-400 font-medium">Designation</span>
              <p className="font-bold text-slate-800">{admin.designation || 'Officer'}</p>
            </div>
          </div>

          <div className="flex items-start gap-2.5">
            <Phone className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
            <div>
              <span className="text-slate-400 font-medium">Phone</span>
              <p className="font-bold text-slate-800">{admin.phoneNumber || 'Not provided'}</p>
            </div>
          </div>
        </div>

        {/* Security & Audit Tracking */}
        <div className="bg-slate-50 border border-slate-100 p-4 rounded-2xl space-y-2.5">
          <div className="flex items-center gap-1.5 text-slate-700 font-bold">
            <ShieldCheck className="w-4 h-4 text-[#E76120]" />
            <span>Security &amp; Audit Trail</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-[11px] pt-1">
            <div className="bg-white p-2.5 rounded-xl border border-slate-100">
              <span className="text-slate-400 block mb-0.5">Last Login Time</span>
              <span className="font-bold text-slate-800">{formattedLastLogin}</span>
            </div>

            <div className="bg-white p-2.5 rounded-xl border border-slate-100">
              <span className="text-slate-400 block mb-0.5">Last IP Address</span>
              <span className="font-mono font-bold text-slate-800">{admin.lastLoginIP || 'None'}</span>
            </div>

            <div className="bg-white p-2.5 rounded-xl border border-slate-100">
              <span className="text-slate-400 block mb-0.5">Device / OS</span>
              <span className="font-bold text-slate-800 truncate block">{admin.lastLoginDevice || 'None'}</span>
            </div>
          </div>
        </div>

        {admin.notes && (
          <div className="p-3 bg-amber-50/60 border border-amber-100 rounded-xl text-amber-900">
            <span className="font-bold block mb-0.5">Administrative Notes:</span>
            <p className="text-slate-700 text-xs">{admin.notes}</p>
          </div>
        )}
      </div>
    </AdminModal>
  );
};

export default AdminDetailsModal;
