import React, { useState } from 'react';
import AdminModal from '../common/AdminModal';
import SubscriptionStatusBadge from './SubscriptionStatusBadge';
import { Badge } from '../../ui/badge';
import {
  CreditCard,
  User,
  Calendar,
  Clock,
  RotateCw,
  XCircle,
  Receipt,
  Truck,
  Phone,
  Mail,
  Copy,
  Check,
  Package,
} from 'lucide-react';
import { Button } from '../../ui/button';

export const SubscriptionDetailsModal = ({
  isOpen,
  onClose,
  subscription,
  onRenew,
  onCancel,
}) => {
  const [activeTab, setActiveTab] = useState('details'); // 'details' | 'timeline'
  const [copied, setCopied] = useState(false);

  if (!subscription) return null;

  const user = subscription.user || {};
  const isExpiringSoon =
    subscription.status === 'active' &&
    new Date(subscription.endDate) > new Date() &&
    new Date(subscription.endDate) <= new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

  const daysRemaining = Math.max(
    0,
    Math.ceil((new Date(subscription.endDate) - new Date()) / (1000 * 60 * 60 * 24))
  );

  // Determine delivery format
  const getDeliveryType = (sub) => {
    if (sub?.deliveryType) {
      const dt = sub.deliveryType.toUpperCase();
      if (dt === 'PHYSICAL') return 'PHYSICAL';
      if (dt === 'ONLINE_PHYSICAL' || dt === 'HYBRID') return 'ONLINE_PHYSICAL';
      if (dt === 'ONLINE') return 'ONLINE';
    }
    const name = (sub?.planName || '').toLowerCase();
    const code = (sub?.planCode || '').toLowerCase();
    if (
      name.includes('physical + online') ||
      name.includes('online + physical') ||
      name.includes('hybrid') ||
      code.includes('hybrid') ||
      code.includes('online_physical')
    ) {
      return 'ONLINE_PHYSICAL';
    }
    if (
      name.includes('physical') ||
      code.includes('physical') ||
      sub?.shippingAddress?.street1 ||
      sub?.shippingAddress?.formattedAddress
    ) {
      return 'PHYSICAL';
    }
    return 'ONLINE';
  };

  const deliveryType = getDeliveryType(subscription);
  const isPhysical = deliveryType === 'PHYSICAL';
  const isHybrid = deliveryType === 'ONLINE_PHYSICAL';
  const addr = subscription.shippingAddress || {};
  const hasAddressData = !!(addr.street1 || addr.formattedAddress || addr.fullName || addr.city);
  const hasShipping = isPhysical || isHybrid || hasAddressData;

  const handleCopyAddress = () => {
    const textToCopy = [
      `Recipient: ${addr.fullName || user.name || ''}`,
      `Phone: ${addr.phoneNumber || user.phoneNumber || ''}`,
      `Email: ${addr.email || user.email || ''}`,
      `Address: ${
        addr.formattedAddress ||
        [
          addr.street1,
          addr.street2,
          addr.landmark ? `Landmark: ${addr.landmark}` : '',
          addr.city,
          addr.state,
          addr.postalCode ? `PIN: ${addr.postalCode}` : '',
          addr.country || 'India',
        ]
          .filter(Boolean)
          .join(', ')
      }`,
      addr.deliveryInstructions ? `Delivery Instructions: ${addr.deliveryInstructions}` : '',
    ]
      .filter(Boolean)
      .join('\n');

    if (navigator.clipboard) {
      navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  return (
    <AdminModal
      isOpen={isOpen}
      onClose={onClose}
      title="Subscription Details & Lifecycle Audit"
      description={`Official digital pass registry for ${user.name || 'Subscriber'}.`}
      confirmLabel="Close Details"
      onConfirm={onClose}
      size="lg"
    >
      <div className="space-y-4 text-xs select-none font-sans overflow-hidden">
        {/* Top Header Card */}
        <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono font-bold text-slate-800 text-sm">
                {subscription.subscriptionId}
              </span>
              <SubscriptionStatusBadge
                status={subscription.status}
                type={subscription.type}
                isExpiringSoon={!isPhysical && isExpiringSoon}
              />
              {isPhysical && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                  📦 Physical Copy
                </span>
              )}
              {isHybrid && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-900 border border-purple-300">
                  ⚡ Physical + Online
                </span>
              )}
              {!isPhysical && !isHybrid && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-sky-100 text-sky-900 border border-sky-300">
                  🌐 Online Pass
                </span>
              )}
            </div>
            <h4 className="font-bold text-slate-900 text-sm mt-0.5 break-words">{subscription.planName}</h4>
            <p className="text-slate-400 text-xs truncate">
              Tier: <strong className="text-slate-700">{subscription.tier}</strong> · Invoice:{' '}
              <span className="font-mono text-slate-600">{subscription.invoiceNumber || 'N/A'}</span>
            </p>
          </div>

          {/* Quick Actions (Renew & Cancel only for Online / Hybrid; NOT for Physical Only) */}
          {!isPhysical && (
            <div className="flex items-center gap-2 shrink-0 self-start sm:self-auto">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  onClose();
                  if (onRenew) onRenew(subscription);
                }}
                className="h-8 rounded-xl font-bold text-xs cursor-pointer"
              >
                <RotateCw className="w-3.5 h-3.5 mr-1" />
                <span>{subscription.status === 'cancelled' ? 'Reactivate' : 'Renew'}</span>
              </Button>

              {subscription.status === 'active' && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => {
                    onClose();
                    if (onCancel) onCancel(subscription);
                  }}
                  className="h-8 rounded-xl font-bold text-xs cursor-pointer"
                >
                  <XCircle className="w-3.5 h-3.5 mr-1" />
                  <span>Cancel</span>
                </Button>
              )}
            </div>
          )}
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-2 border-b border-slate-100 pb-2 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab('details')}
            className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-colors whitespace-nowrap cursor-pointer ${
              activeTab === 'details'
                ? 'bg-[#284661] text-white shadow-2xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Subscription Breakdown &amp; Invoicing
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('timeline')}
            className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-colors whitespace-nowrap cursor-pointer ${
              activeTab === 'timeline'
                ? 'bg-[#284661] text-white shadow-2xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Audit Timeline History ({subscription.timeline?.length || 0})
          </button>
        </div>

        {/* Tab 1: Breakdown & Invoicing */}
        {activeTab === 'details' && (
          <div className="space-y-3.5">
            {/* Subscriber Card */}
            <div className="p-3.5 bg-white border border-slate-200/80 rounded-2xl space-y-2">
              <div className="flex items-center gap-2 font-bold text-slate-800">
                <User className="w-4 h-4 text-[#284661]" />
                <span>Subscriber Information</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-[11px]">
                <div className="min-w-0">
                  <span className="text-slate-400 block">Full Name</span>
                  <span className="font-bold text-slate-900 truncate block">{user.name || 'N/A'}</span>
                </div>
                <div className="min-w-0">
                  <span className="text-slate-400 block">Email Address</span>
                  <span className="font-bold text-slate-900 break-all block">{user.email || 'N/A'}</span>
                </div>
                <div className="min-w-0">
                  <span className="text-slate-400 block">User Category</span>
                  <Badge variant="outline" className="text-[9px] uppercase font-bold mt-0.5">
                    {user.userType || 'General'}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Hardcopy Shipping & Delivery Address Card (Shown for Physical or Hybrid plans, or if shipping address is recorded) */}
            {hasShipping && (
              <div className="p-3.5 bg-amber-50/40 border border-amber-200/90 rounded-2xl space-y-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2 font-bold text-slate-900">
                    <div className="w-7 h-7 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0 border border-amber-200">
                      <Truck className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-900">
                          Hardcopy Book Shipping &amp; Postal Address
                        </span>
                        <Badge variant="outline" className="text-[9px] font-bold bg-amber-100 text-amber-900 border-amber-300">
                          {isPhysical ? 'Physical Book' : 'Hybrid Dispatch'}
                        </Badge>
                      </div>
                      <span className="text-[10px] text-slate-500 font-normal">
                        Courier address provided during subscription checkout
                      </span>
                    </div>
                  </div>

                  {hasAddressData && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleCopyAddress}
                      className="h-7 px-2.5 rounded-xl text-[11px] font-bold border-amber-300 text-amber-900 hover:bg-amber-100/60 cursor-pointer shadow-2xs"
                    >
                      {copied ? (
                        <>
                          <Check className="w-3.5 h-3.5 mr-1 text-emerald-600" />
                          <span className="text-emerald-700">Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5 mr-1 text-amber-700" />
                          <span>Copy Address</span>
                        </>
                      )}
                    </Button>
                  )}
                </div>

                {hasAddressData ? (
                  <div className="space-y-2.5 pt-1 text-[11px]">
                    {/* Recipient Contact Strip */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 bg-white p-2.5 rounded-xl border border-amber-100">
                      <div>
                        <span className="text-slate-400 block text-[10px]">Recipient Name</span>
                        <span className="font-bold text-slate-900 truncate block">
                          {addr.fullName || user.name || 'N/A'}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px]">Mobile Number</span>
                        {addr.phoneNumber || user.phoneNumber ? (
                          <a
                            href={`tel:${addr.phoneNumber || user.phoneNumber}`}
                            className="font-bold text-[#284661] hover:underline flex items-center gap-1"
                          >
                            <Phone className="w-3 h-3 text-[#284661]" />
                            <span>{addr.phoneNumber || user.phoneNumber}</span>
                          </a>
                        ) : (
                          <span className="font-bold text-slate-900">N/A</span>
                        )}
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px]">Email Address</span>
                        {addr.email || user.email ? (
                          <a
                            href={`mailto:${addr.email || user.email}`}
                            className="font-bold text-[#284661] hover:underline flex items-center gap-1 truncate"
                          >
                            <Mail className="w-3 h-3 text-[#284661] shrink-0" />
                            <span className="truncate">{addr.email || user.email}</span>
                          </a>
                        ) : (
                          <span className="font-bold text-slate-900">N/A</span>
                        )}
                      </div>
                    </div>

                    {/* Postal Address Breakdown */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <div className="bg-white p-2.5 rounded-xl border border-slate-100 space-y-1">
                        <span className="text-slate-400 block text-[10px] font-semibold">Street &amp; Premise</span>
                        <p className="font-bold text-slate-900 leading-snug">
                          {addr.street1 || 'No street specified'}
                          {addr.street2 ? `, ${addr.street2}` : ''}
                        </p>
                        {addr.landmark && (
                          <p className="text-[10px] text-slate-500">
                            <strong className="text-slate-700">Landmark:</strong> {addr.landmark}
                          </p>
                        )}
                      </div>

                      <div className="bg-white p-2.5 rounded-xl border border-slate-100 space-y-1">
                        <span className="text-slate-400 block text-[10px] font-semibold">City, State &amp; PIN</span>
                        <p className="font-bold text-slate-900 leading-snug">
                          {[addr.city, addr.state].filter(Boolean).join(', ')}
                          {addr.postalCode ? ` - ${addr.postalCode}` : ''}
                        </p>
                        <p className="text-[10px] text-slate-500">
                          <strong className="text-slate-700">Country:</strong> {addr.country || 'India'}
                        </p>
                      </div>
                    </div>

                    {/* Delivery Instructions */}
                    {addr.deliveryInstructions && (
                      <div className="p-2.5 bg-blue-50/70 border border-blue-100 rounded-xl text-blue-900">
                        <span className="font-bold block text-[10px] text-blue-800 uppercase tracking-wider mb-0.5">
                          Delivery Instructions:
                        </span>
                        <p className="text-[11px]">{addr.deliveryInstructions}</p>
                      </div>
                    )}

                    {/* Formatted Full Address Text */}
                    {addr.formattedAddress && (
                      <div className="p-2 bg-white border border-amber-200/60 rounded-xl text-slate-600 text-[10.5px]">
                        <span className="text-slate-400 font-semibold block text-[9.5px] uppercase tracking-wider mb-0.5">
                          Postal Address Label:
                        </span>
                        <span className="select-all font-mono text-[11px] text-slate-800">{addr.formattedAddress}</span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="p-3 bg-amber-50/80 border border-amber-200 rounded-xl text-amber-800 text-[11px]">
                    ⚠️ Postal shipping address has not been provided or recorded yet for this physical subscription.
                  </div>
                )}
              </div>
            )}

            {/* Validity & Expiry Countdown (Only for Online / Hybrid; for Physical, no validity/expiry applies) */}
            {isPhysical ? (
              <div className="p-3.5 bg-amber-50/70 border border-amber-200/80 rounded-2xl space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 font-bold text-slate-800">
                    <Package className="w-4 h-4 text-amber-700" />
                    <span>Physical Copy — Hardcopy Book Edition</span>
                  </div>
                  <Badge variant="outline" className="text-[10px] font-bold bg-amber-100/90 text-amber-900 border-amber-300">
                    Perpetual (No Expiry Date)
                  </Badge>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[11px] pt-1">
                  <div className="bg-white p-2.5 rounded-xl border border-slate-100 min-w-0">
                    <span className="text-slate-400 block mb-0.5">Order / Issue Date</span>
                    <span className="font-bold text-slate-900 block truncate">
                      {new Date(subscription.startDate || subscription.createdAt).toLocaleDateString('en-IN', {
                        day: '2-digit',
                        month: 'long',
                        year: 'numeric',
                      })}
                    </span>
                  </div>

                  <div className="bg-white p-2.5 rounded-xl border border-slate-100 min-w-0">
                    <span className="text-slate-400 block mb-0.5">Validity Status</span>
                    <span className="font-bold text-amber-800 block truncate">
                      N/A · One-time Physical Shipment
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-2xl space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 font-bold text-slate-800">
                    <Calendar className="w-4 h-4 text-[#E76120]" />
                    <span>Validity &amp; Expiration</span>
                  </div>
                  <Badge variant="nfiYellow" className="text-[10px] font-bold">
                    {daysRemaining > 0 ? `${daysRemaining} Days Left` : 'Term Ended'}
                  </Badge>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[11px] pt-1">
                  <div className="bg-white p-2.5 rounded-xl border border-slate-100 min-w-0">
                    <span className="text-slate-400 block mb-0.5">Activation Date</span>
                    <span className="font-bold text-slate-900 block truncate">
                      {new Date(subscription.startDate).toLocaleDateString('en-IN', {
                        day: '2-digit',
                        month: 'long',
                        year: 'numeric',
                      })}
                    </span>
                  </div>

                  <div className="bg-white p-2.5 rounded-xl border border-slate-100 min-w-0">
                    <span className="text-slate-400 block mb-0.5">Expiry Date</span>
                    <span className="font-bold text-[#284661] block truncate">
                      {new Date(subscription.endDate).toLocaleDateString('en-IN', {
                        day: '2-digit',
                        month: 'long',
                        year: 'numeric',
                      })}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Financials & Invoicing */}
            <div className="p-3.5 bg-white border border-slate-200/80 rounded-2xl space-y-2">
              <div className="flex items-center gap-2 font-bold text-slate-800">
                <Receipt className="w-4 h-4 text-emerald-600" />
                <span>Financials &amp; Payment Verification</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] pt-1">
                <div className="bg-slate-50 p-2.5 rounded-xl min-w-0 overflow-hidden">
                  <span className="text-slate-400 block text-[10px] truncate">Base Price</span>
                  <span className="font-bold text-slate-900 block truncate">
                    ₹{subscription.amount?.toLocaleString('en-IN')}
                  </span>
                </div>

                <div className="bg-slate-50 p-2.5 rounded-xl min-w-0 overflow-hidden">
                  <span className="text-slate-400 block text-[10px] truncate">Concession</span>
                  <span className="font-bold text-emerald-600 block truncate">
                    {subscription.discountPercent > 0
                      ? `-${subscription.discountPercent}%`
                      : 'None'}
                  </span>
                </div>

                <div className="bg-slate-50 p-2.5 rounded-xl min-w-0 overflow-hidden">
                  <span className="text-slate-400 block text-[10px] truncate">Final Paid</span>
                  <span className="font-black text-slate-900 block truncate">
                    ₹{subscription.finalAmount?.toLocaleString('en-IN')}
                  </span>
                </div>

                <div className="bg-slate-50 p-2.5 rounded-xl min-w-0 overflow-hidden">
                  <span className="text-slate-400 block text-[10px] truncate">Payment Method</span>
                  <span className="font-bold text-slate-800 truncate block" title={subscription.paymentMethod}>
                    {subscription.paymentMethod}
                  </span>
                </div>
              </div>
            </div>

            {subscription.notes && (
              <div className="p-3 bg-amber-50/60 border border-amber-100 rounded-xl text-slate-700 break-words">
                <strong>Remarks:</strong> {subscription.notes}
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Chronological Audit Timeline */}
        {activeTab === 'timeline' && (
          <div className="space-y-3 max-h-[45vh] overflow-y-auto pr-1">
            {(!subscription.timeline || subscription.timeline.length === 0) ? (
              <p className="text-center text-slate-400 py-6">No timeline events logged.</p>
            ) : (
              subscription.timeline.map((evt, idx) => (
                <div
                  key={idx}
                  className="p-3 bg-white border border-slate-200/80 rounded-xl flex items-start gap-3 shadow-2xs"
                >
                  <div className="w-8 h-8 rounded-lg bg-blue-50 text-[#284661] flex items-center justify-center shrink-0 border border-blue-100 mt-0.5">
                    <Clock className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className="font-bold text-slate-900 truncate">{evt.action}</span>
                        {evt.statusTo && (
                          <Badge variant="outline" className="text-[9px] uppercase font-semibold shrink-0">
                            ➔ {evt.statusTo}
                          </Badge>
                        )}
                      </div>
                      <span className="text-[10px] text-slate-400 shrink-0">
                        {new Date(evt.timestamp).toLocaleString('en-IN')}
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-600 mt-1 break-words">{evt.reason}</p>
                    <span className="text-[10px] text-slate-400 block mt-0.5 truncate">
                      Performed by: <strong>{evt.performedBy}</strong>
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

export default SubscriptionDetailsModal;
