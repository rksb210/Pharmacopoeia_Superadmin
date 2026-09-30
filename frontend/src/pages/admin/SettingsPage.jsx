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
  { id: 'subscription', label: '1. Edition & Expiry Horizon', icon: CreditCard },
  { id: 'securityAndSessions', label: '2. Security & Sessions', icon: Lock },
  { id: 'notificationsAndComms', label: '3. Support & Communications', icon: Bell },
  { id: 'maintenanceAndGeneral', label: '4. Portal Maintenance', icon: AlertTriangle },
  { id: 'history', label: '5. Version History & Rollback', icon: History },
];

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
    },
    securityAndSessions: {
      maxLoginAttempts: 5,
      lockoutDurationMinutes: 15,
      sessionTimeoutMinutes: 120,
    },
    notificationsAndComms: {
      enableInAppNotifications: true,
      enableEmailDispatches: true,
      supportEmail: 'support@nfi.gov.in',
      supportHotline: '+91-120-2783400',
    },
    maintenanceAndGeneral: {
      maintenanceMode: false,
      maintenanceMessage: 'Formulary portal is undergoing scheduled maintenance.',
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
          },
          securityAndSessions: {
            maxLoginAttempts: c.securityAndSessions?.maxLoginAttempts ?? 5,
            lockoutDurationMinutes: c.securityAndSessions?.lockoutDurationMinutes ?? 15,
            sessionTimeoutMinutes: c.securityAndSessions?.sessionTimeoutMinutes ?? 120,
          },
          notificationsAndComms: {
            enableInAppNotifications: c.notificationsAndComms?.enableInAppNotifications ?? true,
            enableEmailDispatches: c.notificationsAndComms?.enableEmailDispatches ?? true,
            supportEmail: c.notificationsAndComms?.supportEmail || 'support@nfi.gov.in',
            supportHotline: c.notificationsAndComms?.supportHotline || '+91-120-2783400',
          },
          maintenanceAndGeneral: {
            maintenanceMode: c.maintenanceAndGeneral?.maintenanceMode ?? false,
            maintenanceMessage: c.maintenanceAndGeneral?.maintenanceMessage || 'Formulary portal is undergoing scheduled maintenance.',
          },
        });
        if (c.securityAndSessions?.sessionTimeoutMinutes) {
          localStorage.setItem('nfi_session_timeout_minutes', String(c.securityAndSessions.sessionTimeoutMinutes));
          window.dispatchEvent(
            new CustomEvent('nfi_config_updated', {
              detail: { sessionTimeoutMinutes: c.securityAndSessions.sessionTimeoutMinutes },
            })
          );
        }
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
        if (res.config.securityAndSessions?.sessionTimeoutMinutes) {
          localStorage.setItem('nfi_session_timeout_minutes', String(res.config.securityAndSessions.sessionTimeoutMinutes));
          window.dispatchEvent(
            new CustomEvent('nfi_config_updated', {
              detail: { sessionTimeoutMinutes: res.config.securityAndSessions.sessionTimeoutMinutes },
            })
          );
        }
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

  return (
    <PageContainer>
      {/* Header */}
      <PageHeader
        title="Application Configuration &amp; Settings"
        subtitle="Centralized management of NFI edition sunset horizon, staff session security, support channels, and portal maintenance."
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
          {/* TAB 1: EDITION HORIZON & EXPIRY */}
          {/* ========================================================= */}
          {activeTab === 'subscription' && (
            <div className="space-y-4 max-w-2xl animate-in fade-in-0 duration-150">
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl text-amber-900 space-y-1">
                <span className="font-bold block">NFI 7th Edition Fixed Validity Horizon Standard</span>
                <p className="text-[11px] text-amber-800 leading-relaxed">
                  As per Indian Pharmacopoeia platform rules, all standard commercial subscriptions remain valid until the edition sunset horizon of{' '}
                  <strong className="font-bold text-amber-950 underline decoration-amber-400">
                    {formData.subscription.fixedExpiryDate
                      ? new Date(formData.subscription.fixedExpiryDate).toLocaleDateString('en-GB', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                        })
                      : '31 December 2031'}
                  </strong>{' '}
                  irrespective of purchase or activation date.
                </p>
              </div>

              <InputField
                id="fixedExpiryDate"
                label="Fixed Expiration Date"
                type="date"
                value={formData.subscription.fixedExpiryDate}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    subscription: { ...formData.subscription, fixedExpiryDate: e.target.value },
                  })
                }
                helperText="Standard edition horizon applied to all public and institutional subscribers."
                required
              />
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 2: SECURITY & SESSIONS */}
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
                  helperText="Protects against brute-force attacks."
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
                  helperText="Temporary lock period after failed attempts."
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
                  helperText="Automatic logout period for inactive staff sessions."
                  required
                />
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 3: SUPPORT & COMMUNICATIONS */}
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
                  helperText="Displayed to users on helpdesk &amp; invoices."
                  required
                />

                <InputField
                  id="supportHotline"
                  label="Official Support Helpline"
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
                  helperText="IPC helpline number for subscriber queries."
                  required
                />
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 4: PORTAL MAINTENANCE */}
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

              <div className="p-4 bg-amber-50/70 border border-amber-200/70 rounded-2xl text-xs text-amber-900 space-y-1">
                <span className="font-bold flex items-center gap-1.5 text-amber-950">
                  <Sparkles className="w-3.5 h-3.5 text-[#E76120]" />
                  Marquee Broadcast Tickers
                </span>
                <p className="text-[11px] text-amber-800 leading-relaxed">
                  For announcements, public tickers, and alerts, please use the dedicated <strong>Marquee Broadcast Alerts</strong> manager in the <strong>CRM module</strong>.
                </p>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 5: VERSION HISTORY & ROLLBACK */}
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
