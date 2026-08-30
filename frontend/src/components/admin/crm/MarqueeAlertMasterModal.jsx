import React, { useState, useEffect, useCallback } from 'react';
import AdminModal from '../common/AdminModal';
import { Badge } from '../../ui/badge';
import { Button } from '../../ui/button';
import {
  Megaphone,
  Plus,
  Edit2,
  Trash2,
  AlertTriangle,
  Flame,
  CheckCircle2,
  Info,
  ExternalLink,
  Users,
  Search,
  RefreshCw,
  Sparkles,
  RotateCw,
} from 'lucide-react';
import marqueeAlertService from '../../../services/marqueeAlert.service';
import CreateEditMarqueeModal from './CreateEditMarqueeModal';

const TYPE_ICONS = {
  info: Info,
  warning: AlertTriangle,
  critical: Flame,
  success: CheckCircle2,
};

const TYPE_COLORS = {
  info: 'bg-blue-50 text-blue-700 border-blue-200',
  warning: 'bg-amber-50 text-amber-700 border-amber-200',
  critical: 'bg-rose-50 text-rose-700 border-rose-200',
  success: 'bg-emerald-50 text-emerald-700 border-emerald-200',
};

export const MarqueeAlertMasterModal = ({
  isOpen,
  onClose,
}) => {
  const [alerts, setAlerts] = useState([]);
  const [stats, setStats] = useState({ totalAlerts: 0, activeAlerts: 0 });
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [userTypeFilter, setUserTypeFilter] = useState('all');
  const [feedback, setFeedback] = useState('');

  // Child Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingAlert, setEditingAlert] = useState(null);

  const fetchAlerts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await marqueeAlertService.getAlertsList({
        search: searchQuery,
        userType: userTypeFilter,
      });
      if (res) {
        setAlerts(res.alerts || []);
        setStats(res.stats || { totalAlerts: 0, activeAlerts: 0 });
      }
    } catch (err) {
      console.warn('Failed to load marquee alerts:', err.message);
    } finally {
      setLoading(false);
    }
  }, [searchQuery, userTypeFilter]);

  useEffect(() => {
    if (isOpen) {
      fetchAlerts();
    }
  }, [isOpen, fetchAlerts]);

  const showFeedback = (msg) => {
    setFeedback(msg);
    setTimeout(() => setFeedback(''), 3000);
  };

  const handleSaveAlert = async (formData, editId) => {
    if (editId) {
      await marqueeAlertService.updateAlert(editId, formData);
      showFeedback('Marquee alert updated successfully.');
    } else {
      await marqueeAlertService.createAlert(formData);
      showFeedback('New user-targeted marquee alert created.');
    }
    fetchAlerts();
  };

  const handleToggleStatus = async (alert) => {
    try {
      const newStatus = !alert.isActive;
      await marqueeAlertService.toggleStatus(alert._id, newStatus);
      showFeedback(`Marquee alert ${newStatus ? 'activated' : 'deactivated'}.`);
      fetchAlerts();
    } catch (err) {
      showFeedback(err.message || 'Failed to toggle status.');
    }
  };

  const handleDeleteAlert = async (alert) => {
    if (!window.confirm(`Are you sure you want to remove the marquee alert "${alert.title}"?`)) {
      return;
    }
    try {
      await marqueeAlertService.deleteAlert(alert._id);
      showFeedback('Marquee alert deleted successfully.');
      fetchAlerts();
    } catch (err) {
      showFeedback(err.message || 'Failed to delete alert.');
    }
  };

  return (
    <>
      <AdminModal
        isOpen={isOpen}
        onClose={onClose}
        title="CRM Marquee Broadcast Alerts Master"
        description="Configure dynamic running marquee tickers displayed on targeted subscriber dashboards by user cohort (Doctor, Student, etc.)."
        confirmLabel="Close"
        onConfirm={onClose}
        size="lg"
      >
        <div className="space-y-4 text-xs select-none font-sans">
          {/* Header Bar with Stats & Action */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-slate-50 border border-slate-200/80 rounded-2xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-500 text-white flex items-center justify-center shadow-xs">
                <Megaphone className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-slate-900 text-sm">Dashboard Marquee Alerts Master</h3>
                <p className="text-slate-500 text-[11px]">
                  {stats.activeAlerts} Active Tickers · {stats.totalAlerts} Total Configured
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={fetchAlerts}
                className="h-8 rounded-xl font-semibold text-xs"
              >
                <RefreshCw className={`w-3.5 h-3.5 mr-1 ${loading ? 'animate-spin' : ''}`} />
                <span>Refresh</span>
              </Button>

              <Button
                variant="nfiYellow"
                size="sm"
                onClick={() => setIsCreateModalOpen(true)}
                className="h-8 rounded-xl font-bold text-xs shadow-2xs"
              >
                <Plus className="w-3.5 h-3.5 mr-1" />
                <span>New Marquee Alert</span>
              </Button>
            </div>
          </div>

          {feedback && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl font-semibold flex items-center gap-2 animate-in fade-in-0 duration-150">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{feedback}</span>
            </div>
          )}

          {/* Search & Cohort Filter */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search marquee title, message body..."
                className="w-full h-9 pl-8 pr-3 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:border-[#E76120]"
              />
            </div>

            <select
              value={userTypeFilter}
              onChange={(e) => setUserTypeFilter(e.target.value)}
              className="h-9 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 outline-none focus:border-[#E76120]"
            >
              <option value="all">All Healthcare Cohorts</option>
              <option value="ALL">Universal (All Users)</option>
              <option value="STUDENT">Students Only</option>
              <option value="DOCTOR">Doctors Only</option>
              <option value="PHARMACIST">Pharmacists Only</option>
              <option value="NURSE">Nurses Only</option>
              <option value="INDUSTRY">Industry Only</option>
              <option value="OTHERS">Others Only</option>
            </select>
          </div>

          {/* Alerts List */}
          <div className="space-y-2.5 max-h-[50vh] overflow-y-auto pr-1">
            {loading ? (
              <div className="py-12 text-center text-slate-400 font-medium">
                <RefreshCw className="w-5 h-5 mx-auto mb-2 animate-spin text-[#284661]" />
                Loading marquee broadcast alerts...
              </div>
            ) : alerts.length === 0 ? (
              <div className="py-12 text-center text-slate-400 font-medium bg-slate-50 rounded-2xl border border-dashed border-slate-200 space-y-2">
                <Megaphone className="w-8 h-8 text-slate-300 mx-auto" />
                <p className="font-bold text-slate-600">No Marquee Broadcast Alerts Configured</p>
                <p className="text-[11px] text-slate-400">
                  Click "New Marquee Alert" above to create targeted alerts for specific user cohorts.
                </p>
              </div>
            ) : (
              alerts.map((al) => {
                const IconC = TYPE_ICONS[al.alertType] || Info;
                const colorCls = TYPE_COLORS[al.alertType] || TYPE_COLORS.info;

                return (
                  <div
                    key={al._id}
                    className={`p-3.5 bg-white border rounded-2xl shadow-2xs space-y-2.5 transition-all ${
                      al.isActive ? 'border-slate-200/90' : 'border-slate-200 bg-slate-50/70 opacity-75'
                    }`}
                  >
                    {/* Top Row: Tag, Cohorts, and Status Toggle */}
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className={`px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-wider border flex items-center gap-1 ${colorCls}`}>
                          <IconC className="w-2.5 h-2.5" />
                          <span>{al.title}</span>
                        </span>

                        <span className="text-[10px] text-slate-400 font-semibold">Target:</span>
                        {al.targetUserTypes?.map((ut) => (
                          <Badge key={ut} variant="outline" className="text-[9px] font-extrabold uppercase">
                            {ut}
                          </Badge>
                        ))}

                        <Badge variant="secondary" className="text-[9px] uppercase font-bold">
                          {al.speed} speed
                        </Badge>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleToggleStatus(al)}
                          className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold cursor-pointer transition-all ${
                            al.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-200 text-slate-600'
                          }`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${al.isActive ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                          <span>{al.isActive ? 'Active' : 'Disabled'}</span>
                        </button>
                      </div>
                    </div>

                    {/* Message Body */}
                    <p className="text-slate-800 text-xs font-medium leading-relaxed">
                      {al.message}
                    </p>

                    {/* Footer Row: Link info, author & action buttons */}
                    <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-[11px] text-slate-400">
                      <div>
                        {al.linkUrl ? (
                          <span className="flex items-center gap-1 text-[#284661] font-semibold">
                            <ExternalLink className="w-3 h-3" />
                            <span>Link: {al.linkLabel || al.linkUrl}</span>
                          </span>
                        ) : (
                          <span>Created by {al.authorName || 'Superadmin'}</span>
                        )}
                      </div>

                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setEditingAlert(al)}
                          className="h-7 px-2 text-slate-600 hover:text-slate-900 rounded-lg text-xs"
                          title="Edit alert"
                        >
                          <Edit2 className="w-3.5 h-3.5 mr-1" />
                          <span>Edit</span>
                        </Button>

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteAlert(al)}
                          className="h-7 px-2 text-red-600 hover:bg-red-50 rounded-lg text-xs"
                          title="Delete alert"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </AdminModal>

      {/* Create / Edit Modal */}
      <CreateEditMarqueeModal
        isOpen={isCreateModalOpen || !!editingAlert}
        onClose={() => {
          setIsCreateModalOpen(false);
          setEditingAlert(null);
        }}
        alert={editingAlert}
        onSuccess={handleSaveAlert}
      />
    </>
  );
};

export default MarqueeAlertMasterModal;
