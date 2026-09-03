import React, { useState, useEffect } from 'react';
import AdminModal from '../common/AdminModal';
import CouponStatusBadge from './CouponStatusBadge';
import { Badge } from '../../ui/badge';
import { Button } from '../../ui/button';
import {
  Ticket,
  Users,
  Calendar,
  CreditCard,
  Edit2,
  Clock,
  History,
  ShoppingBag,
  Percent,
} from 'lucide-react';
import couponService from '../../../services/coupon.service';

export const CouponDetailsModal = ({
  isOpen,
  onClose,
  coupon,
  onEdit,
}) => {
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'redemptions'
  const [detailedCoupon, setDetailedCoupon] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!coupon || !isOpen) return;

    const fetchDetails = async () => {
      setLoading(true);
      try {
        const res = await couponService.getCouponById(coupon._id);
        if (res && res.coupon) {
          setDetailedCoupon(res.coupon);
        }
      } catch (err) {
        console.warn('Failed to load coupon details:', err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchDetails();
    setActiveTab('overview');
  }, [coupon, isOpen]);

  if (!coupon) return null;
  const c = detailedCoupon || coupon;

  const totalDiscountSaved =
    c.redemptionHistory?.reduce((sum, r) => sum + (r.discountApplied || 0), 0) || 0;

  return (
    <AdminModal
      isOpen={isOpen}
      onClose={onClose}
      title={`Coupon Details: ${c.code}`}
      description={`Promotional campaign parameters, targeting criteria, and redemption history.`}
      confirmLabel="Edit Voucher"
      onConfirm={() => {
        onClose();
        if (onEdit) onEdit(c);
      }}
      size="lg"
    >
      <div className="space-y-4 text-xs select-none font-sans overflow-hidden">
        {/* Top Header Card */}
        <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono font-black text-slate-900 text-sm tracking-wider">
                {c.code}
              </span>
              <CouponStatusBadge coupon={c} />
            </div>
            <h3 className="font-bold text-slate-900 text-base mt-1 break-words">{c.title}</h3>
            <p className="text-slate-500 text-xs mt-0.5 break-words">{c.description}</p>
          </div>

          <div className="flex flex-col items-start sm:items-end shrink-0">
            <span className="text-xl sm:text-2xl font-black text-[#E76120]">
              {c.discountType === 'percentage'
                ? `${c.discountValue}% OFF`
                : `₹${c.discountValue?.toLocaleString('en-IN')} OFF`}
            </span>
            {c.maxDiscountINR > 0 && (
              <span className="text-[10px] text-slate-400 font-semibold">
                Cap: ₹{c.maxDiscountINR?.toLocaleString('en-IN')}
              </span>
            )}
          </div>
        </div>

        {/* Quick Stats Metric Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          <div className="p-3 bg-blue-50/70 border border-blue-100 rounded-xl text-center min-w-0 overflow-hidden">
            <span className="text-[10px] font-bold text-[#284661] uppercase block truncate">
              Total Redemptions
            </span>
            <span className="text-lg font-black text-slate-900 block truncate">{c.usageCount || 0}</span>
          </div>

          <div className="p-3 bg-amber-50/70 border border-amber-100 rounded-xl text-center min-w-0 overflow-hidden">
            <span className="text-[10px] font-bold text-amber-700 uppercase block truncate">
              Remaining Quota
            </span>
            <span className="text-lg font-black text-slate-900 block truncate">
              {c.usageLimit > 0 ? Math.max(0, c.usageLimit - c.usageCount) : 'Unlimited'}
            </span>
          </div>

          <div className="p-3 bg-emerald-50/70 border border-emerald-100 rounded-xl text-center min-w-0 overflow-hidden">
            <span className="text-[10px] font-bold text-emerald-700 uppercase block truncate">
              Total Discount Saved
            </span>
            <span className="text-lg font-black text-emerald-900 block truncate">
              ₹{totalDiscountSaved.toLocaleString('en-IN')}
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
            Voucher Parameters &amp; Targeting
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('redemptions')}
            className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-colors cursor-pointer ${
              activeTab === 'redemptions'
                ? 'bg-[#284661] text-white shadow-2xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Redemption History ({c.redemptionHistory?.length || 0})
          </button>
        </div>

        {/* Tab 1: Overview */}
        {activeTab === 'overview' && (
          <div className="space-y-3.5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-3 bg-white border border-slate-200/80 rounded-xl space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase">
                  Validity Window
                </span>
                <p className="font-bold text-slate-900">
                  {new Date(c.startDate).toLocaleDateString('en-IN')} ➔{' '}
                  {new Date(c.endDate).toLocaleDateString('en-IN')}
                </p>
              </div>

              <div className="p-3 bg-white border border-slate-200/80 rounded-xl space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase">
                  Per-User Redemption Limit
                </span>
                <p className="font-bold text-slate-900">{c.perUserLimit || 1} time(s) per account</p>
              </div>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl space-y-1.5">
              <span className="text-[10px] font-bold text-slate-400 uppercase">
                Targeted User Categories
              </span>
              <div className="flex flex-wrap gap-1">
                {c.applicableUserTypes?.map((ut) => (
                  <Badge key={ut} variant="outline" className="text-[9px] font-bold uppercase">
                    {ut}
                  </Badge>
                ))}
              </div>
            </div>

            {c.specificEmails?.length > 0 && (
              <div className="p-3 bg-white border border-slate-200/80 rounded-xl space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase">
                  Restricted Email Domains / Targets
                </span>
                <p className="font-mono text-slate-800 text-[11px] break-all">
                  {c.specificEmails.join(', ')}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Redemption History */}
        {activeTab === 'redemptions' && (
          <div className="space-y-2 max-h-[45vh] overflow-y-auto pr-1">
            {(!c.redemptionHistory || c.redemptionHistory.length === 0) ? (
              <div className="p-8 text-center bg-slate-50 border border-slate-100 rounded-2xl text-slate-400">
                <ShoppingBag className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                <p className="font-semibold text-xs">No redemptions logged for this voucher yet.</p>
              </div>
            ) : (
              c.redemptionHistory.map((red, idx) => (
                <div
                  key={idx}
                  className="p-3 bg-white border border-slate-200/80 rounded-xl flex items-center justify-between gap-3 shadow-2xs"
                >
                  <div>
                    <span className="font-bold text-slate-900 block">{red.userEmail}</span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      Sub ID: {red.subscriptionId || 'Direct'} ·{' '}
                      {new Date(red.date).toLocaleDateString('en-IN')}
                    </span>
                  </div>

                  <div className="flex flex-col items-end">
                    <span className="font-bold text-emerald-600">
                      -₹{red.discountApplied?.toLocaleString('en-IN')}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      Order: ₹{red.orderAmount?.toLocaleString('en-IN')} ➔ Final: ₹
                      {red.finalAmount?.toLocaleString('en-IN')}
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

export default CouponDetailsModal;
