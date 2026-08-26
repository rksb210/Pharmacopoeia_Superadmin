import React, { useState, useEffect } from 'react';
import AdminModal from '../common/AdminModal';
import OrderStatusBadge from './OrderStatusBadge';
import PaymentStatusBadge from './PaymentStatusBadge';
import { Badge } from '../../ui/badge';
import { Button } from '../../ui/button';
import {
  CreditCard,
  User,
  Calendar,
  Clock,
  Receipt,
  FileText,
  ShieldCheck,
  RotateCcw,
  AlertTriangle,
  XCircle,
  Laptop,
} from 'lucide-react';
import orderService from '../../../services/order.service';

export const OrderDetailsModal = ({
  isOpen,
  onClose,
  order,
  onViewInvoice,
  onRefund,
}) => {
  const [activeTab, setActiveTab] = useState('financials'); // 'financials' | 'subscriber' | 'timeline'
  const [detailedOrder, setDetailedOrder] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!order || !isOpen) return;

    const fetchOrder = async () => {
      setLoading(true);
      try {
        const res = await orderService.getOrderById(order._id);
        if (res && res.order) {
          setDetailedOrder(res.order);
        }
      } catch (err) {
        console.warn('Failed to load order details:', err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
    setActiveTab('financials');
  }, [order, isOpen]);

  if (!order) return null;
  const o = detailedOrder || order;

  return (
    <AdminModal
      isOpen={isOpen}
      onClose={onClose}
      title={`Order Dossier: ${o.orderNumber}`}
      description={`Transaction telemetry, tax splits, and ledger history.`}
      confirmLabel="Close"
      onConfirm={onClose}
      size="lg"
    >
      <div className="space-y-4 text-xs select-none font-sans overflow-hidden">
        {/* Top Header Card */}
        <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono font-black text-slate-900 text-sm tracking-wider">
                {o.orderNumber}
              </span>
              <OrderStatusBadge status={o.orderStatus} />
              <PaymentStatusBadge status={o.payment?.status} />
              <span className="font-mono text-slate-500 text-[11px]">Invoice: {o.invoiceNumber}</span>
            </div>
            <h3 className="font-bold text-slate-900 text-base mt-1 break-words">{o.planName}</h3>
            <p className="text-slate-400 text-xs">
              Purchased by <strong className="text-slate-700">{o.userName}</strong> ({o.userEmail})
              · {new Date(o.createdAt).toLocaleString('en-IN')}
            </p>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-1.5 shrink-0 self-start sm:self-auto">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                onClose();
                if (onViewInvoice) onViewInvoice(o);
              }}
              className="h-8 rounded-xl font-bold text-xs cursor-pointer"
            >
              <Receipt className="w-3.5 h-3.5 mr-1" />
              <span>Invoice</span>
            </Button>

            {o.payment?.status === 'paid' && !o.refund?.isRefunded && (
              <Button
                variant="destructive"
                size="sm"
                onClick={() => {
                  onClose();
                  if (onRefund) onRefund(o);
                }}
                className="h-8 rounded-xl font-bold text-xs cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5 mr-1" />
                <span>Refund</span>
              </Button>
            )}
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1.5 border-b border-slate-100 pb-2 overflow-x-auto">
          {[
            { id: 'financials', label: '1. Financials & Gateway' },
            { id: 'subscriber', label: '2. Subscriber Info' },
            { id: 'timeline', label: `3. Audit Timeline (${o.auditTimeline?.length || 0})` },
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

        {/* Tab 1: Financials & Gateway */}
        {activeTab === 'financials' && (
          <div className="space-y-3.5 animate-in fade-in-0 duration-150">
            {/* Price Split Strip */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
              <div className="bg-slate-50 p-2.5 rounded-xl min-w-0">
                <span className="text-slate-400 block text-[10px]">Base Catalog Price</span>
                <span className="font-bold text-slate-900 block truncate">
                  ₹{o.pricing?.baseAmount?.toLocaleString('en-IN')}
                </span>
              </div>

              <div className="bg-slate-50 p-2.5 rounded-xl min-w-0">
                <span className="text-slate-400 block text-[10px]">Concession Discount</span>
                <span className="font-bold text-emerald-600 block truncate">
                  {o.pricing?.discountAmount > 0
                    ? `-₹${o.pricing.discountAmount?.toLocaleString('en-IN')}`
                    : 'None'}
                </span>
              </div>

              <div className="bg-slate-50 p-2.5 rounded-xl min-w-0">
                <span className="text-slate-400 block text-[10px]">18% GST Tax</span>
                <span className="font-bold text-slate-900 block truncate">
                  ₹{o.pricing?.taxAmount?.toLocaleString('en-IN')}
                </span>
              </div>

              <div className="bg-slate-50 p-2.5 rounded-xl min-w-0">
                <span className="text-slate-400 block text-[10px]">Final Gross Paid</span>
                <span className="font-black text-slate-900 block truncate">
                  ₹{o.pricing?.totalAmount?.toLocaleString('en-IN')}
                </span>
              </div>
            </div>

            {/* Gateway Telemetry */}
            <div className="p-3.5 bg-white border border-slate-200/80 rounded-2xl space-y-2">
              <div className="flex items-center gap-2 font-bold text-slate-800">
                <CreditCard className="w-4 h-4 text-[#284661]" />
                <span>Payment Gateway &amp; Telemetry Verification</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-[11px] pt-1">
                <div>
                  <span className="text-slate-400 block">Gateway Provider</span>
                  <span className="font-bold text-slate-900">{o.payment?.gateway} ({o.payment?.paymentMethod})</span>
                </div>

                <div>
                  <span className="text-slate-400 block">Gateway Transaction Reference</span>
                  <span className="font-mono font-bold text-slate-900 break-all">
                    {o.payment?.gatewayTransactionId || 'N/A'}
                  </span>
                </div>

                <div>
                  <span className="text-slate-400 block">Payment Captured Timestamp</span>
                  <span className="font-bold text-slate-900">
                    {o.payment?.paidAt ? new Date(o.payment.paidAt).toLocaleString('en-IN') : 'Pending / Not Captured'}
                  </span>
                </div>
              </div>

              {o.payment?.failureReason && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-800 rounded-xl space-y-0.5 mt-2">
                  <span className="font-bold block">Payment Failure Telemetry:</span>
                  <p className="text-[11px]">{o.payment.failureReason} (Code: {o.payment.failureCode || 'N/A'})</p>
                </div>
              )}

              {o.refund?.isRefunded && (
                <div className="p-3 bg-purple-50 border border-purple-200 text-purple-900 rounded-xl space-y-0.5 mt-2">
                  <span className="font-bold block">Refund Dossier:</span>
                  <p className="text-[11px]">
                    Refund of <strong>₹{o.refund.refundAmount?.toLocaleString('en-IN')}</strong> processed on{' '}
                    {new Date(o.refund.refundedAt).toLocaleString('en-IN')} (Ref: {o.refund.refundTransactionId}).
                  </p>
                  <p className="text-[10px] text-purple-700">Reason: {o.refund.refundReason}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 2: Subscriber Info */}
        {activeTab === 'subscriber' && (
          <div className="space-y-3.5 animate-in fade-in-0 duration-150">
            <div className="p-3.5 bg-white border border-slate-200/80 rounded-2xl space-y-2">
              <div className="flex items-center gap-2 font-bold text-slate-800">
                <User className="w-4 h-4 text-[#284661]" />
                <span>Customer Profile &amp; Verified Credentials</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-[11px]">
                <div>
                  <span className="text-slate-400 block">Full Name</span>
                  <span className="font-bold text-slate-900">{o.userName}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Email Address</span>
                  <span className="font-bold text-slate-900">{o.userEmail}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">User Category</span>
                  <Badge variant="outline" className="text-[9px] uppercase font-bold mt-0.5">
                    {o.userType}
                  </Badge>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Chronological Audit Timeline */}
        {activeTab === 'timeline' && (
          <div className="space-y-3 max-h-[45vh] overflow-y-auto pr-1 animate-in fade-in-0 duration-150">
            {(!o.auditTimeline || o.auditTimeline.length === 0) ? (
              <p className="text-center text-slate-400 py-6">No timeline events recorded.</p>
            ) : (
              o.auditTimeline.map((evt, idx) => (
                <div
                  key={idx}
                  className="p-3 bg-white border border-slate-200/80 rounded-xl flex items-start gap-3 shadow-2xs"
                >
                  <div className="w-8 h-8 rounded-lg bg-blue-50 text-[#284661] flex items-center justify-center shrink-0 border border-blue-100 mt-0.5">
                    <Clock className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <span className="font-bold text-slate-900 truncate">{evt.action}</span>
                      <span className="text-[10px] text-slate-400 shrink-0 font-mono">
                        {new Date(evt.timestamp).toLocaleString('en-IN')}
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-600 mt-0.5 break-words">{evt.note}</p>
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

export default OrderDetailsModal;
