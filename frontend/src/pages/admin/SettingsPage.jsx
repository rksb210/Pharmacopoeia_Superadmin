import React, { useState, useEffect } from 'react';
import {
  Settings,
  CreditCard,
  Users,
  Sparkles,
  Search,
  Lock,
  Bell,
  AlertTriangle,
  History,
  Save,
  CheckCircle2,
  RefreshCw,
  RotateCcw,
  ShieldCheck,
  Eye,
  Sliders,
} from 'lucide-react';
import PageContainer from '../../components/admin/common/PageContainer';
import PageHeader from '../../components/admin/common/PageHeader';
import AdminLoader from '../../components/admin/common/AdminLoader';
import AdminErrorState from '../../components/admin/common/AdminErrorState';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import InputField from '../../components/common/InputField';
import configService from '../../services/config.service';
import PermissionGuard from '../../components/admin/common/PermissionGuard';

const TABS = [
  { id: 'subscription', label: '1. Subscriptions & BRD', icon: CreditCard },
  // { id: 'userRegistration', label: '2. User Registration', icon: Users },
  { id: 'trial', label: '2. Trial Licenses', icon: Sparkles },
  { id: 'contentAndSearch', label: '3. Content & Search', icon: Search },
  { id: 'securityAndSessions', label: '4. Security & Sessions', icon: Lock },
  { id: 'notificationsAndComms', label: '5. Notifications & Comms', icon: Bell },
  { id: 'maintenanceAndGeneral', label: '6. Maintenance & Banners', icon: AlertTriangle },
  { id: 'history', label: '7. Version History & Rollback', icon: History },
];

const ALL_USER_TYPES = ['DOCTOR', 'PHARMACIST', 'STUDENT', 'NURSE', 'INDUSTRY', 'OTHERS'];

export const SettingsPage = () => {
  const [activeTab, setActiveTab] = useState('subscription');
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [feedback, setFeedback] = useState({ message: '', type: '' });
  const [changeNote, setChangeNote] = useState('');

  // Local form state
  const [formData, setFormData] = useState({
    subscription: {
      fixedExpiryDate: '2031-12-31',
      renewalWindowDays: 90,
      gracePeriodDays: 15,
      allowEarlyRenewals: true,
    },
    trial: {
      defaultTrialDays: 14,
      maxTrialsPerUser: 1,
      allowTrialExtension: false,
    },
    userRegistration: {
      allowPublicRegistration: true,
      requireCredentialVerification: true,
      allowedUserTypes: ['DOCTOR', 'PHARMACIST', 'STUDENT', 'NURSE', 'INDUSTRY', 'OTHERS'],
      autoApproveStudents: false,
    },
    contentAndSearch: {
      enablePublicFeedback: true,
      enableMonographWatermarking: true,
      enableFuzzySearch: true,
      maxSearchResults: 50,
      monographReviewStages: 2,
    },
    securityAndSessions: {
      maxLoginAttempts: 5,
      lockoutDurationMinutes: 15,
      sessionTimeoutMinutes: 120,
      requireMFAForAdmins: true,
      passwordExpiryDays: 90,
    },
    notificationsAndComms: {
      enableInAppNotifications: true,
      enableEmailDispatches: true,
      enableSmsAlerts: false,
      supportEmail: 'support@nfi.gov.in',
      supportHotline: '+91-120-2783400',
    },
    maintenanceAndGeneral: {
      maintenanceMode: false,
      maintenanceMessage: 'Formulary portal is undergoing scheduled maintenance.',
      announcementBanner: 'National Formulary of India (NFI) 9th Edition 2026 digital monographs are now active.',
      announcementActive: true,
    },
  });

  const fetchConfig = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await configService.getFullConfig();
      if (res && res.config) {
        setConfig(res.config);
        const c = res.config;
        setFormData({
          subscription: {
            fixedExpiryDate: c.subscription?.fixedExpiryDate
              ? new Date(c.subscription.fixedExpiryDate).toISOString().split('T')[0]
              : '2031-12-31',
            renewalWindowDays: c.subscription?.renewalWindowDays ?? 90,
            gracePeriodDays: c.subscription?.gracePeriodDays ?? 15,
            allowEarlyRenewals: c.subscription?.allowEarlyRenewals ?? true,
          },
          trial: {
            defaultTrialDays: c.trial?.defaultTrialDays ?? 14,
            maxTrialsPerUser: c.trial?.maxTrialsPerUser ?? 1,
            allowTrialExtension: c.trial?.allowTrialExtension ?? false,
          },
          userRegistration: {
            allowPublicRegistration: c.userRegistration?.allowPublicRegistration ?? true,
            requireCredentialVerification: c.userRegistration?.requireCredentialVerification ?? true,
            allowedUserTypes: c.userRegistration?.allowedUserTypes || ALL_USER_TYPES,
            autoApproveStudents: c.userRegistration?.autoApproveStudents ?? false,
          },
          contentAndSearch: {
            enablePublicFeedback: c.contentAndSearch?.enablePublicFeedback ?? true,
            enableMonographWatermarking: c.contentAndSearch?.enableMonographWatermarking ?? true,
            enableFuzzySearch: c.contentAndSearch?.enableFuzzySearch ?? true,
            maxSearchResults: c.contentAndSearch?.maxSearchResults ?? 50,
            monographReviewStages: c.contentAndSearch?.monographReviewStages ?? 2,
          },
          securityAndSessions: {
            maxLoginAttempts: c.securityAndSessions?.maxLoginAttempts ?? 5,
            lockoutDurationMinutes: c.securityAndSessions?.lockoutDurationMinutes ?? 15,
            sessionTimeoutMinutes: c.securityAndSessions?.sessionTimeoutMinutes ?? 120,
            requireMFAForAdmins: c.securityAndSessions?.requireMFAForAdmins ?? true,
            passwordExpiryDays: c.securityAndSessions?.passwordExpiryDays ?? 90,
          },
          notificationsAndComms: {
            enableInAppNotifications: c.notificationsAndComms?.enableInAppNotifications ?? true,
            enableEmailDispatches: c.notificationsAndComms?.enableEmailDispatches ?? true,
            enableSmsAlerts: c.notificationsAndComms?.enableSmsAlerts ?? false,
            supportEmail: c.notificationsAndComms?.supportEmail || 'support@nfi.gov.in',
            supportHotline: c.notificationsAndComms?.supportHotline || '+91-120-2783400',
          },
          maintenanceAndGeneral: {
            maintenanceMode: c.maintenanceAndGeneral?.maintenanceMode ?? false,
            maintenanceMessage: c.maintenanceAndGeneral?.maintenanceMessage || '',
            announcementBanner: c.maintenanceAndGeneral?.announcementBanner || '',
            announcementActive: c.maintenanceAndGeneral?.announcementActive ?? false,
          },
        });
      }
    } catch (err) {
      setError(err.message || 'Failed to load application configuration.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConfig();
  }, []);

  const showFeedback = (message, type = 'success') => {
    setFeedback({ message, type });
    setTimeout(() => setFeedback({ message: '', type: '' }), 4000);
  };

  const handleSaveConfig = async (e) => {
    e?.preventDefault();
    setSaving(true);
    try {
      const res = await configService.updateConfig({
        ...formData,
        note: changeNote || 'Administrative settings updated',
      });
      if (res && res.config) {
        setConfig(res.config);
        setChangeNote('');
        showFeedback(`Configuration saved successfully (Version v${res.config.version}).`);
      }
    } catch (err) {
      showFeedback(err.message || 'Failed to save configuration.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleRestoreVersion = async (ver) => {
    if (!window.confirm(`Are you sure you want to rollback all settings to version v${ver}?`)) {
      return;
    }

    setLoading(true);
    try {
      const res = await configService.restoreVersion(ver);
      if (res && res.config) {
        showFeedback(`Successfully restored configuration to v${ver}.`);
        fetchConfig();
      }
    } catch (err) {
      showFeedback(err.message || 'Failed to restore version.', 'error');
      setLoading(false);
    }
  };

  const handleUserTypeToggle = (type) => {
    const current = formData.userRegistration.allowedUserTypes || [];
    if (current.includes(type)) {
      if (current.length === 1) return; // Maintain at least 1
      setFormData({
        ...formData,
        userRegistration: {
          ...formData.userRegistration,
          allowedUserTypes: current.filter((t) => t !== type),
        },
      });
    } else {
      setFormData({
        ...formData,
        userRegistration: {
          ...formData.userRegistration,
          allowedUserTypes: [...current, type],
        },
      });
    }
  };

  return (
    <PageContainer>
      {/* Header */}
      <PageHeader
        title="Application Configuration &amp; Settings"
        subtitle="Centralized management of dynamic BRD subscription rules, user cohorts, trial parameters, search indexing, security sessions, and maintenance banners."
      >
        {config && (
          <Badge variant="outline" className="bg-[#284661] text-white border-transparent text-xs font-bold py-1 px-3">
            Active Config: v{config.version}
          </Badge>
        )}

        <Button
          variant="outline"
          size="sm"
          onClick={fetchConfig}
          className="rounded-xl text-xs font-semibold cursor-pointer"
          title="Refresh Settings"
        >
          <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </Button>

        <PermissionGuard module="SETTINGS" section="SYSTEM" action="EDIT">
          <Button
            variant="nfiYellow"
            size="sm"
            onClick={handleSaveConfig}
            loading={saving}
            className="rounded-xl text-xs font-bold shadow-2xs cursor-pointer"
          >
            <Save className="w-3.5 h-3.5 mr-1.5" />
            <span>Save All Settings</span>
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
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
          <span className="font-semibold">{feedback.message}</span>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-slate-200">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-2 ${
                isActive
                  ? 'bg-[#284661] text-white shadow-2xs'
                  : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200/80'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {loading ? (
        <AdminLoader text="Loading centralized system configuration &amp; audit history..." />
      ) : error ? (
        <AdminErrorState
          title="Could not load system settings"
          message={error}
          onRetry={fetchConfig}
        />
      ) : (
        <div className="p-6 bg-white border border-slate-200/80 rounded-2xl shadow-2xs font-sans text-xs select-none space-y-6">
          {/* ========================================================= */}
          {/* TAB 1: SUBSCRIPTIONS & BRD VALIDITY */}
          {/* ========================================================= */}
          {activeTab === 'subscription' && (
            <div className="space-y-4 max-w-2xl animate-in fade-in-0 duration-150">
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl text-amber-900 space-y-1">
                <span className="font-bold block">BRD Fixed Subscription Validity Policy</span>
                <p className="text-[11px] text-amber-800 leading-relaxed">
                  As per Indian Pharmacopoeia platform rules, all standard commercial subscriptions remain valid until{' '}
                  <strong className="font-bold text-amber-950 underline decoration-amber-400">
                    {formData.subscription.fixedExpiryDate
                      ? new Date(formData.subscription.fixedExpiryDate).toLocaleDateString('en-GB', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                        })
                      : '31 December 2031'}
                  </strong>{' '}
                  irrespective of purchase date.
                </p>
              </div>

              <InputField
                id="fixedExpiryDate"
                label="BRD Fixed Expiration Date"
                type="date"
                value={formData.subscription.fixedExpiryDate}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    subscription: { ...formData.subscription, fixedExpiryDate: e.target.value },
                  })
                }
                helperText="Applies to all newly purchased formulary passes."
                required
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <InputField
                  id="renewalWindowDays"
                  label="Renewal Window (Days before Expiry)"
                  type="number"
                  value={formData.subscription.renewalWindowDays}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      subscription: { ...formData.subscription, renewalWindowDays: Number(e.target.value) },
                    })
                  }
                  required
                />

                <InputField
                  id="gracePeriodDays"
                  label="Grace Period (Days after Expiry)"
                  type="number"
                  value={formData.subscription.gracePeriodDays}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      subscription: { ...formData.subscription, gracePeriodDays: Number(e.target.value) },
                    })
                  }
                  required
                />
              </div>

              <label className="flex items-center gap-2 pt-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.subscription.allowEarlyRenewals}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      subscription: { ...formData.subscription, allowEarlyRenewals: e.target.checked },
                    })
                  }
                  className="w-4 h-4 rounded border-slate-300 text-[#E76120] accent-[#E76120] cursor-pointer"
                />
                <span className="font-bold text-slate-800">Allow Early Pass Renewals</span>
              </label>
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 2: USER REGISTRATION & COHORTS (Commented out) */}
          {/* ========================================================= */}
          {/* {activeTab === 'userRegistration' && (
            <div className="space-y-4 max-w-2xl animate-in fade-in-0 duration-150">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.userRegistration.allowPublicRegistration}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      userRegistration: {
                        ...formData.userRegistration,
                        allowPublicRegistration: e.target.checked,
                      },
                    })
                  }
                  className="w-4 h-4 rounded border-slate-300 text-[#E76120] accent-[#E76120] cursor-pointer"
                />
                <span className="font-bold text-slate-800">Allow Public Self-Registration</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.userRegistration.requireCredentialVerification}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      userRegistration: {
                        ...formData.userRegistration,
                        requireCredentialVerification: e.target.checked,
                      },
                    })
                  }
                  className="w-4 h-4 rounded border-slate-300 text-[#E76120] accent-[#E76120] cursor-pointer"
                />
                <span className="font-bold text-slate-800">
                  Enforce Mandatory Professional Credentials (Medical Reg No, APAAR ID, GSTIN)
                </span>
              </label>

              <div className="space-y-2 pt-2 border-t border-slate-100">
                <span className="font-bold text-slate-900 block">Allowed Healthcare Categories</span>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {ALL_USER_TYPES.map((type) => {
                    const isChecked = (formData.userRegistration.allowedUserTypes || []).includes(type);
                    return (
                      <button
                        key={type}
                        type="button"
                        onClick={() => handleUserTypeToggle(type)}
                        className={`p-2.5 rounded-xl border text-xs font-bold flex items-center justify-between cursor-pointer transition-all ${
                          isChecked
                            ? 'bg-blue-50 border-[#284661] text-[#284661]'
                            : 'bg-slate-50 border-slate-200 text-slate-400'
                        }`}
                      >
                        <span>{type}</span>
                        {isChecked && <CheckCircle2 className="w-3.5 h-3.5 text-[#284661]" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )} */}

          {/* ========================================================= */}
          {/* TAB 3: TRIAL LICENSES */}
          {/* ========================================================= */}
          {activeTab === 'trial' && (
            <div className="space-y-4 max-w-2xl animate-in fade-in-0 duration-150">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <InputField
                  id="defaultTrialDays"
                  label="Default Trial Period (Days)"
                  type="number"
                  value={formData.trial.defaultTrialDays}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      trial: { ...formData.trial, defaultTrialDays: Number(e.target.value) },
                    })
                  }
                  required
                />

                <InputField
                  id="maxTrialsPerUser"
                  label="Max Trials per Account"
                  type="number"
                  value={formData.trial.maxTrialsPerUser}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      trial: { ...formData.trial, maxTrialsPerUser: Number(e.target.value) },
                    })
                  }
                  required
                />
              </div>

              {/* <label className="flex items-center gap-2 pt-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.trial.allowTrialExtension}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      trial: { ...formData.trial, allowTrialExtension: e.target.checked },
                    })
                  }
                  className="w-4 h-4 rounded border-slate-300 text-[#E76120] accent-[#E76120] cursor-pointer"
                />
                <span className="font-bold text-slate-800">
                  Allow Manual Trial Extensions by Administrative Reviewers
                </span>
              </label> */}
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 4: CONTENT & SEARCH */}
          {/* ========================================================= */}
          {activeTab === 'contentAndSearch' && (
            <div className="space-y-4 max-w-2xl animate-in fade-in-0 duration-150">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.contentAndSearch.enablePublicFeedback}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      contentAndSearch: {
                        ...formData.contentAndSearch,
                        enablePublicFeedback: e.target.checked,
                      },
                    })
                  }
                  className="w-4 h-4 rounded border-slate-300 text-[#E76120] accent-[#E76120] cursor-pointer"
                />
                <span className="font-bold text-slate-800">
                  Enable Public Feedback &amp; Comments against Monographs
                </span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.contentAndSearch.enableMonographWatermarking}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      contentAndSearch: {
                        ...formData.contentAndSearch,
                        enableMonographWatermarking: e.target.checked,
                      },
                    })
                  }
                  className="w-4 h-4 rounded border-slate-300 text-[#E76120] accent-[#E76120] cursor-pointer"
                />
                <span className="font-bold text-slate-800">
                  Enforce Dynamic User Watermarking on PDF Exports &amp; Prints
                </span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.contentAndSearch.enableFuzzySearch}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      contentAndSearch: {
                        ...formData.contentAndSearch,
                        enableFuzzySearch: e.target.checked,
                      },
                    })
                  }
                  className="w-4 h-4 rounded border-slate-300 text-[#E76120] accent-[#E76120] cursor-pointer"
                />
                <span className="font-bold text-slate-800">
                  Enable Fuzzy Synonym Matching in Formulary Search
                </span>
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <InputField
                  id="maxSearchResults"
                  label="Max Search Results per Query"
                  type="number"
                  value={formData.contentAndSearch.maxSearchResults}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      contentAndSearch: {
                        ...formData.contentAndSearch,
                        maxSearchResults: Number(e.target.value),
                      },
                    })
                  }
                  required
                />

                <InputField
                  id="monographReviewStages"
                  label="Mandatory Editorial Review Stages"
                  type="number"
                  value={formData.contentAndSearch.monographReviewStages}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      contentAndSearch: {
                        ...formData.contentAndSearch,
                        monographReviewStages: Number(e.target.value),
                      },
                    })
                  }
                  required
                />
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 5: SECURITY & SESSIONS */}
          {/* ========================================================= */}
          {activeTab === 'securityAndSessions' && (
            <div className="space-y-4 max-w-2xl animate-in fade-in-0 duration-150">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <InputField
                  id="maxLoginAttempts"
                  label="Max Failed Login Attempts before Lockout"
                  type="number"
                  value={formData.securityAndSessions.maxLoginAttempts}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      securityAndSessions: {
                        ...formData.securityAndSessions,
                        maxLoginAttempts: Number(e.target.value),
                      },
                    })
                  }
                  required
                />

                <InputField
                  id="lockoutDurationMinutes"
                  label="Lockout Duration (Minutes)"
                  type="number"
                  value={formData.securityAndSessions.lockoutDurationMinutes}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      securityAndSessions: {
                        ...formData.securityAndSessions,
                        lockoutDurationMinutes: Number(e.target.value),
                      },
                    })
                  }
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <InputField
                  id="sessionTimeoutMinutes"
                  label="Administrative Session Timeout (Minutes)"
                  type="number"
                  value={formData.securityAndSessions.sessionTimeoutMinutes}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      securityAndSessions: {
                        ...formData.securityAndSessions,
                        sessionTimeoutMinutes: Number(e.target.value),
                      },
                    })
                  }
                  required
                />

                <InputField
                  id="passwordExpiryDays"
                  label="Staff Password Expiry (Days)"
                  type="number"
                  value={formData.securityAndSessions.passwordExpiryDays}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      securityAndSessions: {
                        ...formData.securityAndSessions,
                        passwordExpiryDays: Number(e.target.value),
                      },
                    })
                  }
                  required
                />
              </div>

              <label className="flex items-center gap-2 pt-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.securityAndSessions.requireMFAForAdmins}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      securityAndSessions: {
                        ...formData.securityAndSessions,
                        requireMFAForAdmins: e.target.checked,
                      },
                    })
                  }
                  className="w-4 h-4 rounded border-slate-300 text-[#E76120] accent-[#E76120] cursor-pointer"
                />
                <span className="font-bold text-slate-800">
                  Enforce Mandatory Two-Factor Authentication (2FA) for Administrative Staff
                </span>
              </label>
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 6: NOTIFICATIONS & COMMS */}
          {/* ========================================================= */}
          {activeTab === 'notificationsAndComms' && (
            <div className="space-y-4 max-w-2xl animate-in fade-in-0 duration-150">
              <div className="space-y-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.notificationsAndComms.enableInAppNotifications}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        notificationsAndComms: {
                          ...formData.notificationsAndComms,
                          enableInAppNotifications: e.target.checked,
                        },
                      })
                    }
                    className="w-4 h-4 rounded border-slate-300 text-[#E76120] accent-[#E76120] cursor-pointer"
                  />
                  <span className="font-bold text-slate-800">Enable In-App Notification Drawer</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.notificationsAndComms.enableEmailDispatches}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        notificationsAndComms: {
                          ...formData.notificationsAndComms,
                          enableEmailDispatches: e.target.checked,
                        },
                      })
                    }
                    className="w-4 h-4 rounded border-slate-300 text-[#E76120] accent-[#E76120] cursor-pointer"
                  />
                  <span className="font-bold text-slate-800">Enable Automated HTML Email Dispatches</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.notificationsAndComms.enableSmsAlerts}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        notificationsAndComms: {
                          ...formData.notificationsAndComms,
                          enableSmsAlerts: e.target.checked,
                        },
                      })
                    }
                    className="w-4 h-4 rounded border-slate-300 text-[#E76120] accent-[#E76120] cursor-pointer"
                  />
                  <span className="font-bold text-slate-800">Enable SMS Gateway Alerts</span>
                </label>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
                <InputField
                  id="supportEmail"
                  label="Official Support Email"
                  type="email"
                  value={formData.notificationsAndComms.supportEmail}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      notificationsAndComms: {
                        ...formData.notificationsAndComms,
                        supportEmail: e.target.value,
                      },
                    })
                  }
                  required
                />

                <InputField
                  id="supportHotline"
                  label="Official Support Hotline"
                  type="text"
                  value={formData.notificationsAndComms.supportHotline}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      notificationsAndComms: {
                        ...formData.notificationsAndComms,
                        supportHotline: e.target.value,
                      },
                    })
                  }
                  required
                />
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 7: MAINTENANCE & BANNERS */}
          {/* ========================================================= */}
          {activeTab === 'maintenanceAndGeneral' && (
            <div className="space-y-4 max-w-2xl animate-in fade-in-0 duration-150">
              <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-2xl space-y-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.maintenanceAndGeneral.maintenanceMode}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        maintenanceAndGeneral: {
                          ...formData.maintenanceAndGeneral,
                          maintenanceMode: e.target.checked,
                        },
                      })
                    }
                    className="w-4 h-4 rounded border-slate-300 text-rose-600 accent-rose-600 cursor-pointer"
                  />
                  <span className="font-bold text-rose-700">Activate Emergency Portal Maintenance Mode</span>
                </label>

                {formData.maintenanceAndGeneral.maintenanceMode && (
                  <div className="space-y-1 pt-1">
                    <label className="font-semibold text-slate-700 block">Maintenance Message Displayed to Public</label>
                    <textarea
                      rows={2}
                      value={formData.maintenanceAndGeneral.maintenanceMessage}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          maintenanceAndGeneral: {
                            ...formData.maintenanceAndGeneral,
                            maintenanceMessage: e.target.value,
                          },
                        })
                      }
                      className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs outline-none focus:border-rose-500"
                    />
                  </div>
                )}
              </div>

              <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-2xl space-y-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.maintenanceAndGeneral.announcementActive}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        maintenanceAndGeneral: {
                          ...formData.maintenanceAndGeneral,
                          announcementActive: e.target.checked,
                        },
                      })
                    }
                    className="w-4 h-4 rounded border-slate-300 text-[#E76120] accent-[#E76120] cursor-pointer"
                  />
                  <span className="font-bold text-slate-800">Display Top Announcement Ticker Banner</span>
                </label>

                {formData.maintenanceAndGeneral.announcementActive && (
                  <div className="space-y-1 pt-1">
                    <label className="font-semibold text-slate-700 block">Banner Ticker Text</label>
                    <textarea
                      rows={2}
                      value={formData.maintenanceAndGeneral.announcementBanner}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          maintenanceAndGeneral: {
                            ...formData.maintenanceAndGeneral,
                            announcementBanner: e.target.value,
                          },
                        })
                      }
                      className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs outline-none focus:border-[#E76120]"
                    />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 8: VERSION HISTORY & ROLLBACK */}
          {/* ========================================================= */}
          {activeTab === 'history' && (
            <div className="space-y-4 animate-in fade-in-0 duration-150">
              <span className="font-bold text-slate-900 text-xs block">
                Configuration Version History &amp; 1-Click Rollback
              </span>

              {(!config?.history || config.history.length === 0) ? (
                <p className="text-center py-6 text-slate-400">No version history records found.</p>
              ) : (
                <div className="space-y-3">
                  {config.history.map((h, idx) => (
                    <div
                      key={idx}
                      className="p-4 bg-slate-50 border border-slate-200/80 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="font-bold text-[10px]">
                            Version v{h.version}
                          </Badge>
                          <span className="text-slate-400 text-[11px]">
                            {new Date(h.updatedAt).toLocaleString('en-IN')}
                          </span>
                        </div>
                        <p className="text-slate-800 font-semibold text-xs mt-1">{h.note}</p>
                        <span className="text-[10px] text-slate-400">
                          Modified by <strong>{h.updatedBy}</strong> ({h.updatedByEmail})
                        </span>
                      </div>

                      <PermissionGuard module="SETTINGS" section="SYSTEM" action="EDIT">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleRestoreVersion(h.version)}
                          className="h-8 rounded-xl font-bold text-xs cursor-pointer shrink-0"
                        >
                          <RotateCcw className="w-3.5 h-3.5 mr-1" />
                          <span>Restore v{h.version}</span>
                        </Button>
                      </PermissionGuard>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Bottom Change Note input & Save button */}
          {activeTab !== 'history' && (
            <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex-1 max-w-md">
                <input
                  type="text"
                  placeholder="Audit reason / note for this adjustment..."
                  value={changeNote}
                  onChange={(e) => setChangeNote(e.target.value)}
                  className="w-full h-9 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:border-[#E76120]"
                />
              </div>

              <PermissionGuard module="SETTINGS" section="SYSTEM" action="EDIT">
                <Button
                  variant="nfiYellow"
                  size="sm"
                  onClick={handleSaveConfig}
                  loading={saving}
                  className="rounded-xl text-xs font-bold shadow-2xs cursor-pointer"
                >
                  <Save className="w-3.5 h-3.5 mr-1.5" />
                  <span>Save Configuration Changes</span>
                </Button>
              </PermissionGuard>
            </div>
          )}
        </div>
      )}
    </PageContainer>
  );
};

export default SettingsPage;
