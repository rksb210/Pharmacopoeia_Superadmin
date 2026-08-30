import React, { useState, useEffect } from 'react';
import AdminModal from '../common/AdminModal';
import InputField from '../../common/InputField';
import { Badge } from '../../ui/badge';
import { Button } from '../../ui/button';
import {
  Megaphone,
  AlertTriangle,
  Flame,
  CheckCircle2,
  Sparkles,
  Info,
  ExternalLink,
  Users,
  Clock,
  Gauge,
  Link,
  ShieldCheck,
  AlertCircle,
} from 'lucide-react';

const USER_TYPES = [
  { id: 'ALL', label: 'All Users (Universal)' },
  { id: 'STUDENT', label: 'Students' },
  { id: 'DOCTOR', label: 'Doctors' },
  { id: 'PHARMACIST', label: 'Pharmacists' },
  { id: 'NURSE', label: 'Nurses' },
  { id: 'INDUSTRY', label: 'Industry & Corporate' },
  { id: 'OTHERS', label: 'Others' },
];

const ALERT_TYPES = [
  { id: 'info', label: 'Info (Navy Blue)', bg: 'bg-blue-50 border-blue-200 text-blue-900', icon: Info },
  { id: 'warning', label: 'Warning (Amber)', bg: 'bg-amber-50 border-amber-200 text-amber-900', icon: AlertTriangle },
  { id: 'critical', label: 'Urgent (Rose Red)', bg: 'bg-rose-50 border-rose-200 text-rose-900', icon: Flame },
  { id: 'success', label: 'Notice (Emerald)', bg: 'bg-emerald-50 border-emerald-200 text-emerald-900', icon: CheckCircle2 },
];

const SPEEDS = [
  { id: 'slow', label: 'Slow (38s)' },
  { id: 'normal', label: 'Normal (25s)' },
  { id: 'fast', label: 'Fast (15s)' },
];

export const CreateEditMarqueeModal = ({
  isOpen,
  onClose,
  alert = null,
  onSuccess,
}) => {
  const [formData, setFormData] = useState({
    title: '',
    message: '',
    targetUserTypes: ['ALL'],
    alertType: 'info',
    priority: 'medium',
    speed: 'normal',
    linkUrl: '',
    linkLabel: '',
    isActive: true,
    startDate: new Date().toISOString().split('T')[0],
    endDate: '',
  });

  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isEditMode = !!alert;

  useEffect(() => {
    if (alert) {
      setFormData({
        title: alert.title || '',
        message: alert.message || '',
        targetUserTypes: alert.targetUserTypes?.length > 0 ? alert.targetUserTypes : ['ALL'],
        alertType: alert.alertType || 'info',
        priority: alert.priority || 'medium',
        speed: alert.speed || 'normal',
        linkUrl: alert.linkUrl || '',
        linkLabel: alert.linkLabel || '',
        isActive: alert.isActive !== undefined ? alert.isActive : true,
        startDate: alert.startDate
          ? new Date(alert.startDate).toISOString().split('T')[0]
          : new Date().toISOString().split('T')[0],
        endDate: alert.endDate
          ? new Date(alert.endDate).toISOString().split('T')[0]
          : '',
      });
    } else {
      setFormData({
        title: 'ANNOUNCEMENT',
        message: '',
        targetUserTypes: ['ALL'],
        alertType: 'info',
        priority: 'medium',
        speed: 'normal',
        linkUrl: '',
        linkLabel: '',
        isActive: true,
        startDate: new Date().toISOString().split('T')[0],
        endDate: '',
      });
    }
    setErrors({});
    setApiError('');
  }, [alert, isOpen]);

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: '' }));
    if (apiError) setApiError('');
  };

  const toggleUserType = (typeId) => {
    let current = [...formData.targetUserTypes];
    if (typeId === 'ALL') {
      current = ['ALL'];
    } else {
      current = current.filter((t) => t !== 'ALL');
      if (current.includes(typeId)) {
        current = current.filter((t) => t !== typeId);
      } else {
        current.push(typeId);
      }
      if (current.length === 0) current = ['ALL'];
    }
    handleChange('targetUserTypes', current);
  };

  const validate = () => {
    const errs = {};
    if (!formData.title.trim()) errs.title = 'Alert tag / title is required';
    if (!formData.message.trim()) errs.message = 'Marquee alert message is required';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e?.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    setApiError('');

    try {
      await onSuccess(formData, isEditMode ? alert._id : null);
      onClose();
    } catch (err) {
      setApiError(err.message || 'Failed to save marquee alert.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedAlertConfig = ALERT_TYPES.find((a) => a.id === formData.alertType) || ALERT_TYPES[0];
  const IconComp = selectedAlertConfig.icon;

  return (
    <AdminModal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditMode ? `Edit Marquee Alert: ${alert?.title}` : 'Provision User-Specific Marquee Alert'}
      description="Configure ticker headline, targeted healthcare cohorts, alert styling, and speed."
      confirmLabel={isEditMode ? 'Update Alert' : 'Broadcast Marquee Alert'}
      isConfirming={isSubmitting}
      onConfirm={handleSubmit}
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-xs select-none font-sans">
        {apiError && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
            <span>{apiError}</span>
          </div>
        )}

        {/* Live Marquee Preview Banner */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="font-bold text-slate-700 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[#E76120]" />
              <span>Real-Time Live Dashboard Preview</span>
            </span>
            <span className="text-[10px] text-slate-400">Preview changes as you type</span>
          </div>

          <div
            className={`p-3 rounded-2xl border ${selectedAlertConfig.bg} shadow-2xs overflow-hidden flex items-center gap-3 transition-colors`}
          >
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[10px] font-black uppercase bg-white border border-slate-200 shrink-0 shadow-2xs">
              <IconComp className="w-3.5 h-3.5 shrink-0" />
              <span className="text-slate-800">{formData.title || 'ALERT'}</span>
            </div>

            <div className="flex-1 overflow-hidden relative">
              <div
                className={
                  formData.speed === 'slow'
                    ? 'animate-nfi-marquee-slow'
                    : formData.speed === 'fast'
                    ? 'animate-nfi-marquee-fast'
                    : 'animate-nfi-marquee'
                }
              >
                <span className="inline-flex items-center gap-2 text-xs font-semibold">
                  <span>{formData.message || 'Type your message below to see the animated marquee ticker in action...'}</span>
                  {formData.linkUrl && (
                    <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-white/90 border border-slate-300 text-slate-900">
                      {formData.linkLabel || 'View Details'}
                    </span>
                  )}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Form Fields Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
          <InputField
            id="title"
            label="Alert Title / Tag"
            placeholder="e.g. STUDENT EXAM NOTICE, CLINICAL ADVISORY"
            value={formData.title}
            onChange={(e) => handleChange('title', e.target.value.toUpperCase())}
            error={errors.title}
            required
          />

          {/* Alert Type Theme */}
          <div className="flex flex-col gap-1.5">
            <label className="font-semibold text-slate-700">Alert Color &amp; Severity Theme</label>
            <select
              value={formData.alertType}
              onChange={(e) => handleChange('alertType', e.target.value)}
              className="h-10 px-3 bg-white border border-slate-200 rounded-xl font-bold text-xs outline-none focus:border-[#E76120]"
            >
              {ALERT_TYPES.map((at) => (
                <option key={at.id} value={at.id}>
                  {at.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Message Body */}
        <div className="flex flex-col gap-1.5">
          <label className="font-semibold text-slate-700 flex items-center justify-between">
            <span>Marquee Alert Message Body <span className="text-red-500">*</span></span>
            <span className="text-[11px] text-slate-400 font-normal">{formData.message.length} characters</span>
          </label>
          <textarea
            rows={3}
            placeholder="Type the announcement or notice message that will scroll on the targeted users' dashboard..."
            value={formData.message}
            onChange={(e) => handleChange('message', e.target.value)}
            className={`w-full p-3 bg-white border rounded-xl text-xs outline-none focus:border-[#E76120] ${
              errors.message ? 'border-red-400' : 'border-slate-200'
            }`}
          />
          {errors.message && <span className="text-[11px] text-red-600 font-medium">{errors.message}</span>}
        </div>

        {/* Target User Types Selection */}
        <div className="space-y-2 p-3.5 bg-slate-50 border border-slate-200/80 rounded-2xl">
          <div className="flex items-center justify-between">
            <label className="font-bold text-slate-800 flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-[#284661]" />
              <span>Target Healthcare Cohorts (Who sees this marquee?)</span>
            </label>
            <span className="text-[11px] text-slate-500">Select one or multiple</span>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {USER_TYPES.map((ut) => {
              const isSelected = formData.targetUserTypes.includes(ut.id);
              return (
                <button
                  key={ut.id}
                  type="button"
                  onClick={() => toggleUserType(ut.id)}
                  className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-all cursor-pointer border ${
                    isSelected
                      ? 'bg-[#284661] text-white border-[#284661] shadow-2xs'
                      : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                  }`}
                >
                  {ut.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Speed, Priority, Link Options */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
          <div className="flex flex-col gap-1.5">
            <label className="font-semibold text-slate-700">Scroll Speed</label>
            <select
              value={formData.speed}
              onChange={(e) => handleChange('speed', e.target.value)}
              className="h-10 px-3 bg-white border border-slate-200 rounded-xl font-bold text-xs outline-none focus:border-[#E76120]"
            >
              {SPEEDS.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>

          <InputField
            id="linkUrl"
            label="Action Link (Optional URL)"
            placeholder="e.g. /monographs/9th-edition"
            value={formData.linkUrl}
            onChange={(e) => handleChange('linkUrl', e.target.value)}
          />

          <InputField
            id="linkLabel"
            label="Button Text"
            placeholder="e.g. View Guidelines"
            value={formData.linkLabel}
            onChange={(e) => handleChange('linkLabel', e.target.value)}
          />
        </div>

        {/* Validity Dates & Active Toggle */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 pt-1 items-center">
          <InputField
            id="startDate"
            label="Start Date"
            type="date"
            value={formData.startDate}
            onChange={(e) => handleChange('startDate', e.target.value)}
          />

          <InputField
            id="endDate"
            label="End Date (Optional Expiry)"
            type="date"
            value={formData.endDate}
            onChange={(e) => handleChange('endDate', e.target.value)}
          />

          <div className="flex items-center gap-2 pt-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.isActive}
                onChange={(e) => handleChange('isActive', e.target.checked)}
                className="w-4 h-4 rounded text-[#E76120] focus:ring-[#E76120]"
              />
              <span className="font-bold text-slate-800">Broadcast as Active Alert</span>
            </label>
          </div>
        </div>
      </form>
    </AdminModal>
  );
};

export default CreateEditMarqueeModal;
