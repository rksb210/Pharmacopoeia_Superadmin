import React, { useState, useEffect } from 'react';
import AdminModal from '../common/AdminModal';
import InputField from '../../common/InputField';
import { Badge } from '../../ui/badge';
import {
  Bell,
  Mail,
  MessageSquare,
  Megaphone,
  AlertCircle,
  CheckCircle2,
  Calendar,
  Clock,
  Send,
  Users,
} from 'lucide-react';

const CATEGORIES = [
  { id: 'NEW_CONTENT', label: 'New Content Release (Formulary/Monograph)' },
  { id: 'SUBSCRIPTION_EXPIRY', label: 'Subscription Expiry & Renewal Advisory' },
  { id: 'EVENTS', label: 'Conferences & National Symposiums' },
  { id: 'WEBINARS', label: 'Webinars & Online Masterclasses' },
  { id: 'TRAINING', label: 'CME Training & Certification' },
  { id: 'ANNOUNCEMENT', label: 'Official Announcement / Safety Bulletin' },
  { id: 'WORKFLOW', label: 'Editorial Workflow Alert' },
  { id: 'GENERAL', label: 'General System Notification' },
];

const CHANNELS = [
  { id: 'in_app', label: 'In-App Center', icon: Bell },
  { id: 'email', label: 'HTML Email', icon: Mail },
  { id: 'sms', label: 'SMS Gateway', icon: MessageSquare },
  { id: 'broadcast_banner', label: 'Top Sticky Banner', icon: Megaphone },
];

const ROLES = ['superadmin', 'admin', 'subadmin', 'maker', 'reviewer', 'approver'];
const USER_TYPES = ['STUDENT', 'DOCTOR', 'PHARMACIST', 'NURSE', 'INDUSTRY', 'OTHERS'];

export const CreateEditNotificationModal = ({
  isOpen,
  onClose,
  notification = null,
  onSuccess,
}) => {
  const [activeTab, setActiveTab] = useState('content'); // 'content' | 'audience' | 'schedule'

  const [formData, setFormData] = useState({
    title: '',
    message: '',
    category: 'ANNOUNCEMENT',
    channels: ['in_app', 'email'],
    priority: 'medium',
    targetAudience: {
      type: 'ALL',
      roles: [],
      userTypes: [],
      specificEmails: '',
    },
    actionUrl: '',
    actionLabel: 'View Details',
    sendNow: true,
    scheduledAt: '',
    startDate: new Date().toISOString().split('T')[0],
    endDate: '',
  });

  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isEditMode = !!notification;

  useEffect(() => {
    if (notification) {
      setFormData({
        title: notification.title || '',
        message: notification.message || '',
        category: notification.category || 'ANNOUNCEMENT',
        channels: notification.channels || ['in_app'],
        priority: notification.priority || 'medium',
        targetAudience: {
          type: notification.targetAudience?.type || 'ALL',
          roles: notification.targetAudience?.roles || [],
          userTypes: notification.targetAudience?.userTypes || [],
          specificEmails: notification.targetAudience?.specificEmails?.join(', ') || '',
        },
        actionUrl: notification.actionUrl || '',
        actionLabel: notification.actionLabel || 'View Details',
        sendNow: notification.status === 'sent',
        scheduledAt: notification.scheduledAt
          ? new Date(notification.scheduledAt).toISOString().slice(0, 16)
          : '',
        startDate: notification.startDate
          ? new Date(notification.startDate).toISOString().split('T')[0]
          : new Date().toISOString().split('T')[0],
        endDate: notification.endDate
          ? new Date(notification.endDate).toISOString().split('T')[0]
          : '',
      });
    } else {
      setFormData({
        title: '',
        message: '',
        category: 'ANNOUNCEMENT',
        channels: ['in_app', 'email'],
        priority: 'medium',
        targetAudience: {
          type: 'ALL',
          roles: [],
          userTypes: [],
          specificEmails: '',
        },
        actionUrl: '',
        actionLabel: 'View Details',
        sendNow: true,
        scheduledAt: '',
        startDate: new Date().toISOString().split('T')[0],
        endDate: '',
      });
    }
    setActiveTab('content');
    setErrors({});
    setApiError('');
  }, [notification, isOpen]);

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: '' }));
    if (apiError) setApiError('');
  };

  const toggleChannel = (chId) => {
    let current = [...formData.channels];
    if (current.includes(chId)) {
      if (current.length > 1) current = current.filter((c) => c !== chId);
    } else {
      current.push(chId);
    }
    handleChange('channels', current);
  };

  const toggleRole = (r) => {
    let current = [...formData.targetAudience.roles];
    if (current.includes(r)) {
      current = current.filter((item) => item !== r);
    } else {
      current.push(r);
    }
    setFormData((prev) => ({
      ...prev,
      targetAudience: { ...prev.targetAudience, roles: current },
    }));
  };

  const toggleUserType = (ut) => {
    let current = [...formData.targetAudience.userTypes];
    if (current.includes(ut)) {
      current = current.filter((item) => item !== ut);
    } else {
      current.push(ut);
    }
    setFormData((prev) => ({
      ...prev,
      targetAudience: { ...prev.targetAudience, userTypes: current },
    }));
  };

  const validate = () => {
    const errs = {};
    if (!formData.title.trim()) errs.title = 'Notification title is required';
    if (!formData.message.trim()) errs.message = 'Message body is required';
    if (formData.channels.length === 0) errs.channels = 'Select at least one channel';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e?.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    setApiError('');

    try {
      const emailList = formData.targetAudience.specificEmails
        ? formData.targetAudience.specificEmails.split(',').map((s) => s.trim()).filter(Boolean)
        : [];

      const payload = {
        ...formData,
        targetAudience: {
          ...formData.targetAudience,
          specificEmails: emailList,
        },
      };

      await onSuccess(payload, isEditMode ? notification._id : null);
      onClose();
    } catch (err) {
      setApiError(err.message || 'Failed to save notification campaign.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AdminModal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditMode ? `Edit Campaign: ${notification?.title}` : 'Create Broadcast & Notification Campaign'}
      description="Configure multi-channel alerts, target healthcare cohorts, priority levels, and delivery schedule."
      confirmLabel={isEditMode ? 'Save Campaign' : formData.sendNow ? 'Dispatch Immediately' : 'Schedule Campaign'}
      isConfirming={isSubmitting}
      onConfirm={handleSubmit}
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-xs select-none font-sans overflow-hidden">
        {apiError && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
            <span>{apiError}</span>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="flex items-center gap-1.5 border-b border-slate-100 pb-2 overflow-x-auto">
          {[
            { id: 'content', label: '1. Message & Use Case' },
            { id: 'audience', label: '2. Target Audience' },
            { id: 'schedule', label: '3. Priority & Schedule' },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all whitespace-nowrap cursor-pointer ${
                activeTab === tab.id
                  ? 'bg-[#284661] text-white shadow-2xs'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab 1: Content & Use Case */}
        {activeTab === 'content' && (
          <div className="space-y-3.5 animate-in fade-in-0 duration-150">
            <InputField
              id="title"
              label="Notification Headline / Subject"
              placeholder="e.g. Release of NFI 9th Edition Monograph Addendum 2026"
              value={formData.title}
              onChange={(e) => handleChange('title', e.target.value)}
              error={errors.title}
              required
            />

            <div className="flex flex-col gap-1">
              <label className="font-semibold text-slate-700">Notification Use Case / Category</label>
              <select
                value={formData.category}
                onChange={(e) => handleChange('category', e.target.value)}
                className="h-10 px-3 bg-white border border-slate-200 rounded-xl font-bold text-xs outline-none focus:border-[#E76120]"
              >
                {CATEGORIES.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-700 block">
                Message Body (Plain Text or Markdown) <span className="text-red-500">*</span>
              </label>
              <textarea
                rows={3}
                placeholder="Write detailed notification content..."
                value={formData.message}
                onChange={(e) => handleChange('message', e.target.value)}
                className="w-full p-3 bg-white border border-slate-200 rounded-xl text-xs outline-none focus:border-[#E76120]"
              />
              {errors.message && <p className="text-red-600 text-[11px]">{errors.message}</p>}
            </div>

            {/* Channels Multi-Select Pills */}
            <div className="space-y-1.5">
              <label className="font-semibold text-slate-700 block">
                Active Communication Channels
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {CHANNELS.map((ch) => {
                  const Icon = ch.icon;
                  const isSelected = formData.channels.includes(ch.id);

                  return (
                    <button
                      key={ch.id}
                      type="button"
                      onClick={() => toggleChannel(ch.id)}
                      className={`p-2.5 rounded-xl border flex items-center gap-2 font-bold cursor-pointer transition-all ${
                        isSelected
                          ? 'bg-blue-50 border-[#284661] text-[#284661] shadow-2xs'
                          : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span className="text-[11px] truncate">{ch.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Action CTA Link */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <InputField
                id="actionUrl"
                label="Action CTA URL / Deep Link (Optional)"
                placeholder="e.g. /admin/subscriptions or https://ipc.gov.in"
                value={formData.actionUrl}
                onChange={(e) => handleChange('actionUrl', e.target.value)}
              />

              <InputField
                id="actionLabel"
                label="Action CTA Button Text"
                placeholder="e.g. Renew Pass Now / View Addendum"
                value={formData.actionLabel}
                onChange={(e) => handleChange('actionLabel', e.target.value)}
              />
            </div>
          </div>
        )}

        {/* Tab 2: Target Audience */}
        {activeTab === 'audience' && (
          <div className="space-y-4 animate-in fade-in-0 duration-150">
            <div className="space-y-1.5">
              <label className="font-semibold text-slate-700 block">Target Audience Type</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { id: 'ALL', label: 'Universal (All Users)' },
                  { id: 'ROLES', label: 'Internal Staff Roles' },
                  { id: 'USER_TYPES', label: 'Subscriber Categories' },
                  { id: 'SPECIFIC_EMAILS', label: 'Specific Target Emails' },
                ].map((aud) => (
                  <button
                    key={aud.id}
                    type="button"
                    onClick={() =>
                      setFormData((prev) => ({
                        ...prev,
                        targetAudience: { ...prev.targetAudience, type: aud.id },
                      }))
                    }
                    className={`p-2.5 rounded-xl border font-bold text-xs cursor-pointer transition-all ${
                      formData.targetAudience.type === aud.id
                        ? 'bg-[#284661] text-white shadow-2xs'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {aud.label}
                  </button>
                ))}
              </div>
            </div>

            {/* If ROLES */}
            {formData.targetAudience.type === 'ROLES' && (
              <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-2xl space-y-2">
                <span className="font-bold text-slate-800 block">Select Administrative Roles</span>
                <div className="flex flex-wrap gap-1.5">
                  {ROLES.map((r) => {
                    const isSelected = formData.targetAudience.roles.includes(r);
                    return (
                      <button
                        key={r}
                        type="button"
                        onClick={() => toggleRole(r)}
                        className={`px-3 py-1.5 rounded-xl font-bold uppercase text-[10px] cursor-pointer transition-all ${
                          isSelected
                            ? 'bg-[#284661] text-white'
                            : 'bg-white border border-slate-200 text-slate-600'
                        }`}
                      >
                        {r}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* If USER_TYPES */}
            {formData.targetAudience.type === 'USER_TYPES' && (
              <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-2xl space-y-2">
                <span className="font-bold text-slate-800 block">Select Subscriber Categories</span>
                <div className="flex flex-wrap gap-1.5">
                  {USER_TYPES.map((ut) => {
                    const isSelected = formData.targetAudience.userTypes.includes(ut);
                    return (
                      <button
                        key={ut}
                        type="button"
                        onClick={() => toggleUserType(ut)}
                        className={`px-3 py-1.5 rounded-xl font-bold uppercase text-[10px] cursor-pointer transition-all ${
                          isSelected
                            ? 'bg-emerald-700 text-white'
                            : 'bg-white border border-slate-200 text-slate-600'
                        }`}
                      >
                        {ut}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* If SPECIFIC_EMAILS */}
            {formData.targetAudience.type === 'SPECIFIC_EMAILS' && (
              <InputField
                id="specificEmails"
                label="Target Recipient Email Addresses (Comma separated)"
                placeholder="e.g. dr.meera@hospital.org, dean@aiims.edu, advisory@ipc.gov.in"
                value={formData.targetAudience.specificEmails}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    targetAudience: { ...prev.targetAudience, specificEmails: e.target.value },
                  }))
                }
              />
            )}
          </div>
        )}

        {/* Tab 3: Priority & Schedule */}
        {activeTab === 'schedule' && (
          <div className="space-y-4 animate-in fade-in-0 duration-150">
            {/* Priority Level */}
            <div className="space-y-1.5">
              <label className="font-semibold text-slate-700 block">Broadcast Priority Level</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { id: 'low', label: 'Low', desc: 'Routine CME & News' },
                  { id: 'medium', label: 'Medium', desc: 'Standard Alerts' },
                  { id: 'high', label: 'High', desc: 'Workflow & Expiries' },
                  { id: 'urgent', label: 'Urgent', desc: 'Critical Drug Alerts' },
                ].map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => handleChange('priority', p.id)}
                    className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                      formData.priority === p.id
                        ? 'bg-blue-50 border-[#284661] text-[#284661] shadow-2xs'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <span className="font-bold text-xs uppercase block">{p.label}</span>
                    <span className="text-[10px] text-slate-400">{p.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Send Now vs Schedule */}
            <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-2xl space-y-3">
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-900">
                  <input
                    type="radio"
                    name="sendMode"
                    checked={formData.sendNow}
                    onChange={() => handleChange('sendNow', true)}
                    className="w-4 h-4 text-[#E76120]"
                  />
                  <span>Dispatch Immediately Upon Saving</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-900">
                  <input
                    type="radio"
                    name="sendMode"
                    checked={!formData.sendNow}
                    onChange={() => handleChange('sendNow', false)}
                    className="w-4 h-4 text-[#E76120]"
                  />
                  <span>Schedule For Future Delivery</span>
                </label>
              </div>

              {!formData.sendNow && (
                <div className="w-full sm:w-1/2 pt-1">
                  <InputField
                    id="scheduledAt"
                    label="Scheduled Dispatch Date &amp; Time"
                    type="datetime-local"
                    value={formData.scheduledAt}
                    onChange={(e) => handleChange('scheduledAt', e.target.value)}
                  />
                </div>
              )}
            </div>

            {/* Validity Dates */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <InputField
                id="startDate"
                label="Campaign Active From"
                type="date"
                value={formData.startDate}
                onChange={(e) => handleChange('startDate', e.target.value)}
              />

              <InputField
                id="endDate"
                label="Campaign Expiration Date (Optional)"
                type="date"
                value={formData.endDate}
                onChange={(e) => handleChange('endDate', e.target.value)}
              />
            </div>
          </div>
        )}
      </form>
    </AdminModal>
  );
};

export default CreateEditNotificationModal;
