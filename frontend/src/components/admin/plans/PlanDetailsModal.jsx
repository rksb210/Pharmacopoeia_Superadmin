import React, { useState, useEffect } from 'react';
import AdminModal from '../common/AdminModal';
import { Badge } from '../../ui/badge';
import { Button } from '../../ui/button';
import {
  CreditCard,
  Users,
  Check,
  Clock,
  History,
  ShieldCheck,
  Edit2,
  Calendar,
  Sparkles,
} from 'lucide-react';
import planService from '../../../services/plan.service';

export const PlanDetailsModal = ({
  isOpen,
  onClose,
  plan,
  onEdit,
}) => {
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'audit'
  const [detailedPlan, setDetailedPlan] = useState(null);
  const [usage, setUsage] = useState({ activeSubscribers: 0, totalSubscribers: 0, totalRevenueINR: 0 });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!plan || !isOpen) return;

    const fetchDetails = async () => {
      setLoading(true);
      try {
        const res = await planService.getPlanById(plan._id);
        if (res && res.plan) {
          setDetailedPlan(res.plan);
          setUsage(res.usage || {});
        }
      } catch (err) {
        console.warn('Failed to load plan details:', err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchDetails();
    setActiveTab('overview');
  }, [plan, isOpen]);

  if (!plan) return null;
  const p = detailedPlan || plan;

  return (
    <AdminModal
      isOpen={isOpen}
      onClose={onClose}
      title="Plan Details & Pricing Audit Trail"
      description={`Formulary tier specifications and price change history for ${p.name}.`}
      confirmLabel="Edit Plan Configurations"
      onConfirm={() => {
        onClose();
        if (onEdit) onEdit(p);
      }}
      size="lg"
    >
      <div className="space-y-4 text-xs select-none font-sans overflow-hidden">
        {/* Top Summary Banner */}
        <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono font-bold text-slate-800 text-sm">{p.code}</span>
              <Badge variant="outline" className="text-[9px] uppercase font-bold">
                {p.tier}
              </Badge>
              {p.isPopular && (
                <Badge variant="nfiYellow" className="text-[9px] font-bold">
                  Recommended
                </Badge>
              )}
            </div>
            <h3 className="font-bold text-slate-900 text-base mt-1 break-words">{p.name}</h3>
            <p className="text-slate-500 text-xs mt-0.5 break-words">{p.description}</p>
          </div>

          <div className="flex flex-col items-start sm:items-end shrink-0">
            <span className="text-xl sm:text-2xl font-black text-slate-900">
              ₹{p.priceINR?.toLocaleString('en-IN')}
            </span>
            <span className="text-[11px] font-bold text-emerald-600">
              ● {p.isActive ? 'Active in Public Store' : 'Deactivated'}
            </span>
          </div>
        </div>

        {/* Live Usage Metrics Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          <div className="p-3 bg-blue-50/70 border border-blue-100 rounded-xl text-center min-w-0 overflow-hidden">
            <span className="text-[10px] font-bold text-[#284661] uppercase block truncate">
              Active Subscribers
            </span>
            <span className="text-lg font-black text-slate-900 block truncate">
              {usage.activeSubscribers || 0}
            </span>
          </div>

          <div className="p-3 bg-purple-50/70 border border-purple-100 rounded-xl text-center min-w-0 overflow-hidden">
            <span className="text-[10px] font-bold text-purple-700 uppercase block truncate">
              Lifetime Issued
            </span>
            <span className="text-lg font-black text-slate-900 block truncate">{usage.totalSubscribers || 0}</span>
          </div>

          <div className="p-3 bg-emerald-50/70 border border-emerald-100 rounded-xl text-center min-w-0 overflow-hidden">
            <span className="text-[10px] font-bold text-emerald-700 uppercase block truncate">
              Total Revenue Generated
            </span>
            <span className="text-lg font-black text-emerald-900 block truncate">
              ₹{(usage.totalRevenueINR || 0).toLocaleString('en-IN')}
            </span>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
          <button
            type="button"
            onClick={() => setActiveTab('overview')}
            className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-colors cursor-pointer ${
              activeTab === 'overview'
                ? 'bg-[#284661] text-white shadow-2xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Tier Rules &amp; Features
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('audit')}
            className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-colors cursor-pointer ${
              activeTab === 'audit'
                ? 'bg-[#284661] text-white shadow-2xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Pricing Change Audit Trail ({p.auditLogs?.length || 0})
          </button>
        </div>

        {/* Tab 1: Rules & Features */}
        {activeTab === 'overview' && (
          <div className="space-y-3.5">
            {/* Validity & Quotas */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-3 bg-white border border-slate-200/80 rounded-xl space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase">
                  Validity Policy
                </span>
                <p className="font-bold text-slate-900">
                  {p.validityType === 'fixed_date'
                    ? `Fixed Expiry: ${p.fixedDate ? new Date(p.fixedDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '31 Dec 2031'}`
                    : `${p.durationValue} ${p.validityType?.replace('duration_', '')}`}
                </p>
              </div>

              <div className="p-3 bg-white border border-slate-200/80 rounded-xl space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase">
                  Concurrent Seats
                </span>
                <p className="font-bold text-slate-900">
                  {p.seatQuota === 1
                    ? 'Single User (1 Workstation)'
                    : p.seatQuota === 0
                    ? 'Unlimited Campus Seats'
                    : `${p.seatQuota} Concurrent Users`}
                </p>
              </div>
            </div>

            {/* Applicable User Types */}
            <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl space-y-1.5">
              <span className="text-[10px] font-bold text-slate-400 uppercase">
                Eligible Target Categories
              </span>
              <div className="flex flex-wrap gap-1">
                {p.applicableUserTypes?.map((ut) => (
                  <Badge key={ut} variant="outline" className="text-[9px] font-bold uppercase">
                    {ut}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Features Checklist */}
            <div className="p-3.5 bg-white border border-slate-200/80 rounded-xl space-y-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase">
                Included Formulary Benefits
              </span>
              <ul className="space-y-1 text-slate-700">
                {p.features?.map((feat, idx) => (
                  <li key={idx} className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>{feat}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* Tab 2: Pricing Change Audit Trail */}
        {activeTab === 'audit' && (
          <div className="space-y-2.5 max-h-[45vh] overflow-y-auto pr-1">
            {(!p.auditLogs || p.auditLogs.length === 0) ? (
              <p className="text-center text-slate-400 py-6">No historical changes logged.</p>
            ) : (
              p.auditLogs.map((log, idx) => (
                <div
                  key={idx}
                  className="p-3 bg-white border border-slate-200/80 rounded-xl shadow-2xs space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-slate-900">{log.changeType}</span>
                      <span className="text-slate-400">by {log.changedBy}</span>
                    </div>
                    <span className="text-[10px] text-slate-400">
                      {new Date(log.timestamp).toLocaleString('en-IN')}
                    </span>
                  </div>

                  <p className="text-slate-600 italic text-[11px]">{log.reason}</p>

                  {log.previousValues && (
                    <div className="p-2 bg-slate-50 rounded-lg text-[10px] text-slate-500 font-mono">
                      Previous Price: ₹{log.previousValues?.priceINR} ➔ New Price: ₹
                      {log.newValues?.priceINR}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </AdminModal>
  );
};

export default PlanDetailsModal;
