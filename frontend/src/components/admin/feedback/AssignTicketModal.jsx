import React, { useState, useEffect } from 'react';
import AdminModal from '../common/AdminModal';
import { UserCheck, AlertCircle, Shield } from 'lucide-react';
import adminService from '../../../services/admin.service';

export const AssignTicketModal = ({
  isOpen,
  onClose,
  ticket,
  onAssign,
}) => {
  const [admins, setAdmins] = useState([]);
  const [selectedAdminId, setSelectedAdminId] = useState('');
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isOpen) return;

    const fetchStaff = async () => {
      setLoading(true);
      try {
        const res = await adminService.getAdmins({ limit: 50 });
        if (res && res.admins) {
          setAdmins(res.admins);
          if (ticket?.assignedTo?._id) {
            setSelectedAdminId(ticket.assignedTo._id);
          } else if (res.admins.length > 0) {
            setSelectedAdminId(res.admins[0]._id);
          }
        }
      } catch (err) {
        console.warn('Failed to load admins for delegation:', err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchStaff();
    setNote('');
    setError('');
  }, [isOpen, ticket]);

  const handleConfirm = async () => {
    if (!selectedAdminId) {
      setError('Please select an administrative reviewer');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      await onAssign(ticket._id, selectedAdminId, note);
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to assign feedback ticket.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!ticket) return null;

  return (
    <AdminModal
      isOpen={isOpen}
      onClose={onClose}
      title="Delegate Feedback Ticket"
      description={`Assign Ticket ${ticket.ticketId} to an editorial reviewer or scientific officer.`}
      confirmLabel="Confirm Assignment"
      isConfirming={submitting}
      onConfirm={handleConfirm}
      size="md"
    >
      <div className="space-y-4 text-xs select-none font-sans">
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
            <span>{error}</span>
          </div>
        )}

        <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-2xl space-y-1">
          <span className="font-bold text-slate-900 block truncate">{ticket.subject}</span>
          <span className="text-slate-500 text-[11px] block truncate">
            Monograph: <strong>{ticket.content?.monographTitle || 'General'}</strong>
          </span>
        </div>

        <div className="space-y-1.5">
          <label className="font-semibold text-slate-700 block">Select Staff Assignee</label>
          <select
            value={selectedAdminId}
            onChange={(e) => setSelectedAdminId(e.target.value)}
            disabled={loading}
            className="w-full h-10 px-3 bg-white border border-slate-200 rounded-xl font-bold text-xs outline-none focus:border-[#E76120] cursor-pointer"
          >
            {admins.map((adm) => (
              <option key={adm._id} value={adm._id}>
                {adm.name} — {adm.role?.toUpperCase()} ({adm.email})
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1.5">
          <label className="font-semibold text-slate-700 block">
            Delegation Note / Instructions (Optional)
          </label>
          <textarea
            rows={3}
            placeholder="e.g. Please verify neonate dosage guidance against 2026 addendum standards..."
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="w-full p-3 bg-white border border-slate-200 rounded-xl text-xs outline-none focus:border-[#E76120]"
          />
        </div>
      </div>
    </AdminModal>
  );
};

export default AssignTicketModal;
