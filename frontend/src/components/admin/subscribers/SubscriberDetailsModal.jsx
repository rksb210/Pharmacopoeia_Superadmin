import React, { useState } from 'react';
import AdminModal from '../common/AdminModal';
import { Badge } from '../../ui/badge';
import { Mail, Phone, Calendar, Clock, CreditCard, CheckCircle2, AlertCircle, ShoppingBag, ShieldCheck } from 'lucide-react';

export const SubscriberDetailsModal = ({
  isOpen,
  onClose,
  subscriber,
  onEdit,
  onManageSubscription,
}) => {
  const [activeTab, setActiveTab] = useState('profile'); // 'profile' | 'orders'

  if (!subscriber) return null;

  const sub = subscriber.subscription || {};
  const dynamicFields = subscriber.dynamicFields instanceof Map
    ? Object.fromEntries(subscriber.dynamicFields)
    : subscriber.dynamicFields || {};

  const getStatusBadge = (status) => {
    switch (status) {
      case 'active':
        return <Badge variant="nfiNavy" className="text-[10px] font-bold">Active License</Badge>;
      case 'trial':
        return <Badge variant="nfiYellow" className="text-[10px] font-bold">Free Trial</Badge>;
      case 'complimentary':
        return <Badge variant="secondary" className="text-[10px] font-bold bg-purple-100 text-purple-800">Complimentary VIP</Badge>;
      case 'expired':
        return <Badge variant="destructive" className="text-[10px] font-bold">Expired</Badge>;
      default:
        return <Badge variant="outline" className="text-[10px] font-bold">No Subscription</Badge>;
    }
  };

  return (
    <AdminModal
      isOpen={isOpen}
      onClose={onClose}
      title="Subscriber Details & Credentials"
      description={`Official verification and subscription details for ${subscriber.name}.`}
      confirmLabel="Manage Subscription"
      onConfirm={() => {
        onClose();
        if (onManageSubscription) onManageSubscription(subscriber);
      }}
      size="lg"
    >
      <div className="space-y-4 text-xs select-none font-sans">
        {/* Top Header Card */}
        <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-[#284661] text-white flex items-center justify-center font-bold text-lg shadow-xs">
              {subscriber.name?.charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="font-bold text-slate-900 text-sm sm:text-base">{subscriber.name}</h4>
                <Badge variant="outline" className="text-[10px] font-bold uppercase">
                  {subscriber.userType}
                </Badge>
              </div>
              <p className="text-slate-400 text-xs">@{subscriber.username} · {subscriber.email}</p>
            </div>
          </div>

          <div className="flex flex-col items-end gap-1">
            {getStatusBadge(sub.status)}
            <span className={`text-[11px] font-bold ${subscriber.isActive ? 'text-emerald-600' : 'text-red-500'}`}>
              ● {subscriber.isActive ? 'Active Account' : 'Deactivated'}
            </span>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
          <button
            type="button"
            onClick={() => setActiveTab('profile')}
            className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-colors cursor-pointer ${
              activeTab === 'profile'
                ? 'bg-[#284661] text-white shadow-2xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Profile &amp; Dynamic Credentials
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('orders')}
            className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-colors cursor-pointer ${
              activeTab === 'orders'
                ? 'bg-[#284661] text-white shadow-2xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Order History ({subscriber.orderHistory?.length || 0})
          </button>
        </div>

        {/* Tab 1: Profile & Credentials */}
        {activeTab === 'profile' && (
          <div className="space-y-3.5">
            {/* Dynamic Credentials Card */}
            <div className="p-4 bg-white border border-slate-200/80 rounded-2xl shadow-2xs space-y-3">
              <div className="flex items-center gap-1.5 text-slate-800 font-bold">
                <ShieldCheck className="w-4 h-4 text-[#E76120]" />
                <span>Verified Dynamic Credentials ({subscriber.userType})</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                {Object.entries(dynamicFields).map(([key, val]) => (
                  <div key={key} className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                    <span className="text-[10px] font-bold text-slate-400 uppercase block mb-0.5">
                      {key.replace(/([A-Z])/g, ' $1')}
                    </span>
                    <span className="font-bold text-slate-900 break-all">{val || 'N/A'}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Subscription Summary Card */}
            <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-2xl space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 font-bold text-slate-800">
                  <CreditCard className="w-4 h-4 text-[#284661]" />
                  <span>Subscription Information</span>
                </div>
                <span className="font-bold text-slate-900">{sub.planName || 'Free Access'}</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-[11px] pt-1">
                <div className="bg-white p-2.5 rounded-xl border border-slate-100">
                  <span className="text-slate-400 block mb-0.5">Start Date</span>
                  <span className="font-bold text-slate-800">
                    {sub.startDate ? new Date(sub.startDate).toLocaleDateString('en-IN') : 'N/A'}
                  </span>
                </div>

                <div className="bg-white p-2.5 rounded-xl border border-slate-100">
                  <span className="text-slate-400 block mb-0.5">Expiry Date</span>
                  <span className="font-bold text-slate-800">
                    {sub.endDate ? new Date(sub.endDate).toLocaleDateString('en-IN') : 'Never (Free)'}
                  </span>
                </div>

                <div className="bg-white p-2.5 rounded-xl border border-slate-100">
                  <span className="text-slate-400 block mb-0.5">Discount Rate</span>
                  <span className="font-bold text-emerald-600">
                    {sub.discountPercent ? `${sub.discountPercent}% Off` : 'Standard'}
                  </span>
                </div>
              </div>
            </div>

            {/* Audit & Notes */}
            {subscriber.notes && (
              <div className="p-3 bg-amber-50/60 border border-amber-100 rounded-xl text-slate-700">
                <strong>Notes:</strong> {subscriber.notes}
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Order History */}
        {activeTab === 'orders' && (
          <div className="space-y-2 max-h-[45vh] overflow-y-auto pr-1">
            {(!subscriber.orderHistory || subscriber.orderHistory.length === 0) ? (
              <div className="p-8 text-center bg-slate-50 border border-slate-100 rounded-2xl text-slate-400">
                <ShoppingBag className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                <p className="font-semibold text-xs">No order transaction history recorded yet.</p>
              </div>
            ) : (
              subscriber.orderHistory.map((ord, idx) => (
                <div
                  key={ord.orderId || idx}
                  className="p-3.5 bg-white border border-slate-200/80 rounded-xl flex items-center justify-between gap-3 shadow-2xs"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900">{ord.planName}</span>
                      <span className="text-slate-400 font-mono text-[10px]">({ord.orderId})</span>
                    </div>
                    <span className="text-[11px] text-slate-400">
                      {new Date(ord.date).toLocaleDateString('en-IN', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </span>
                  </div>

                  <div className="flex flex-col items-end">
                    <span className="font-black text-slate-900 text-xs">
                      ₹{ord.amount?.toLocaleString('en-IN')}
                    </span>
                    <span className="text-[10px] font-bold text-emerald-600 flex items-center gap-0.5">
                      <CheckCircle2 className="w-3 h-3" />
                      {ord.paymentStatus}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </AdminModal>
  );
};

export default SubscriberDetailsModal;
