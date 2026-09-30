import React, { useState } from 'react';
import { Badge } from '../../ui/badge';
import { Button } from '../../ui/button';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '../../ui/table';
import {
  CheckCircle2,
  XCircle,
  Download,
  ArrowRight,
  RotateCcw,
  Tag,
  Sparkles,
  Receipt,
  CreditCard,
  Hash,
} from 'lucide-react';
import bulkImportService from '../../../services/bulkImport.service';
import couponService from '../../../services/coupon.service';

export const BulkPreviewTable = ({
  previewData,
  onConfirmImport,
  onReset,
  isImporting,
}) => {
  const [activeFilter, setActiveFilter] = useState('all'); // 'all' | 'valid' | 'invalid'
  const [isDownloadingError, setIsDownloadingError] = useState(false);

  // Billing & Payment State
  const [paymentMethod, setPaymentMethod] = useState('Institutional Invoice / NEFT');
  const [paymentStatus, setPaymentStatus] = useState('paid');
  const [paymentReference, setPaymentReference] = useState('');
  const [referenceError, setReferenceError] = useState('');

  // Coupon State
  const [couponInput, setCouponInput] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponError, setCouponError] = useState('');

  if (!previewData) return null;

  const {
    records = [],
    validCount = 0,
    invalidCount = 0,
    totalRows = 0,
    jobId,
    userType = 'UNIVERSITIES_COLLEGES',
    planCode = 'NFI-2026_ONLINE',
    planName = 'NFI 2026 (Online)',
    pricingPreview = {},
    plan = null,
  } = previewData;

  const unitPriceINR = pricingPreview.unitPriceINR ?? 660;
  const subtotalINR = pricingPreview.subtotalINR ?? validCount * unitPriceINR;
  const slabDiscountPercent = pricingPreview.slabDiscountPercent ?? 0;
  const slabDiscountINR = pricingPreview.slabDiscountINR ?? 0;
  const appliedSlabLabel = pricingPreview.appliedSlabLabel || null;
  const afterSlabAmountINR = Math.max(0, subtotalINR - slabDiscountINR);

  const couponDiscountINR = appliedCoupon?.discountAmount || 0;
  const taxableBaseINR = Math.max(0, afterSlabAmountINR - couponDiscountINR);

  // Dynamic GST calculation matching User Portal & Government Norms
  const isPhysical =
    plan?.deliveryType === 'PHYSICAL' ||
    plan?.isGstApplicable === false ||
    (planCode === 'NFI-2026' && String(planName).toLowerCase().includes('physical'));

  const taxPercent =
    pricingPreview.taxPercent !== undefined
      ? pricingPreview.taxPercent
      : isPhysical
      ? 0
      : 18;

  const isComplimentary = paymentMethod === 'Complimentary / Waived';
  const taxAmountINR =
    isComplimentary || taxPercent === 0
      ? 0
      : Math.round((taxableBaseINR * taxPercent) / 100);

  const netPayableINR = isComplimentary ? 0 : taxableBaseINR + taxAmountINR;

  const filteredRecords = records.filter((r) => {
    if (activeFilter === 'valid') return r.status === 'valid' || r.status === 'imported';
    if (activeFilter === 'invalid') return r.status === 'invalid' || r.status === 'failed';
    return true;
  });

  const handleDownloadErrors = async () => {
    setIsDownloadingError(true);
    try {
      const blob = await bulkImportService.downloadErrorReport(jobId || previewData._id);
      const url = window.URL.createObjectURL(new Blob([blob]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Error_Report_${jobId || 'Batch'}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
    } catch (err) {
      alert(err.message || 'Failed to generate error report.');
    } finally {
      setIsDownloadingError(false);
    }
  };

  const handleApplyCoupon = async () => {
    const trimmed = couponInput.trim().toUpperCase();
    if (!trimmed) return;
    setCouponLoading(true);
    setCouponError('');
    try {
      const res = await couponService.validateCoupon({
        code: trimmed,
        orderAmount: afterSlabAmountINR,
        planCode,
        userType,
      });
      if (res && res.valid) {
        setAppliedCoupon({
          code: res.code || trimmed,
          discountAmount: res.discountAmount || 0,
          discountType: res.discountType,
          discountValue: res.discountValue,
        });
      } else {
        setCouponError(res?.message || 'Invalid or inapplicable coupon code.');
        setAppliedCoupon(null);
      }
    } catch (err) {
      setCouponError(err.message || 'Invalid or inapplicable coupon code.');
      setAppliedCoupon(null);
    } finally {
      setCouponLoading(false);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponInput('');
    setCouponError('');
  };

  const handleConfirm = () => {
    const trimmedRef = paymentReference.trim();
    if (!trimmedRef) {
      setReferenceError('Transaction / Reference ID is mandatory to confirm this batch.');
      return;
    }
    setReferenceError('');
    onConfirmImport({
      couponCode: appliedCoupon?.code || '',
      paymentMethod,
      paymentStatus: isComplimentary ? 'waived' : paymentStatus,
      paymentReference: trimmedRef,
      transactionId: trimmedRef,
    });
  };

  return (
    <div className="space-y-4 font-sans select-none text-xs">
      {/* Metric Strip & Action Bar */}
      <div className="p-4 bg-white border border-slate-200/80 rounded-2xl shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Filter Tabs */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveFilter('all')}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeFilter === 'all'
                ? 'bg-[#284661] text-white shadow-2xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <span>All Rows</span>
            <span className="bg-white/20 text-white text-[10px] px-1.5 py-0.2 rounded-full">
              {totalRows}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveFilter('valid')}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeFilter === 'valid'
                ? 'bg-emerald-700 text-white shadow-2xs'
                : 'text-emerald-700 hover:bg-emerald-50'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Valid ({validCount})</span>
          </button>

          {invalidCount > 0 && (
            <button
              type="button"
              onClick={() => setActiveFilter('invalid')}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeFilter === 'invalid'
                  ? 'bg-red-700 text-white shadow-2xs'
                  : 'text-red-700 hover:bg-red-50'
              }`}
            >
              <XCircle className="w-3.5 h-3.5" />
              <span>Errors ({invalidCount})</span>
            </button>
          )}
        </div>

        {/* Download Errors & Reset */}
        <div className="flex items-center gap-2 self-end sm:self-auto">
          {invalidCount > 0 && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleDownloadErrors}
              disabled={isDownloadingError}
              className="rounded-xl text-xs font-bold text-red-700 border-red-200 hover:bg-red-50 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 mr-1" />
              <span>{isDownloadingError ? 'Downloading...' : 'Download Error Excel (.xlsx)'}</span>
            </Button>
          )}

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onReset}
            className="rounded-xl text-xs font-bold cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5 mr-1" />
            <span>Back / Re-upload</span>
          </Button>
        </div>
      </div>

      {/* Preview Table (6-Column Standard Roster) */}
      <div className="bg-white border border-slate-200/80 rounded-2xl shadow-2xs overflow-hidden max-h-[48vh] overflow-y-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">#</TableHead>
              <TableHead>Full Name &amp; Mobile</TableHead>
              <TableHead>Email Address</TableHead>
              <TableHead>Role / Category</TableHead>
              <TableHead>ID &amp; Department</TableHead>
              <TableHead>Status &amp; Verification</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredRecords.map((rec) => {
              const isValid = rec.status === 'valid' || rec.status === 'imported';
              const roleLabel =
                rec.roleCategory ||
                rec.dynamicFields?.roleCategory ||
                (rec.userType === 'UNIVERSITIES_COLLEGES' ? 'Student' : rec.userType);
              const rollOrEmpId =
                rec.rollOrEmployeeId || rec.dynamicFields?.rollOrEmployeeId || '—';
              const department =
                rec.department || rec.dynamicFields?.department || '—';

              return (
                <TableRow
                  key={rec.rowNumber}
                  className={isValid ? 'hover:bg-slate-50/70' : 'bg-red-50/40 hover:bg-red-50/70'}
                >
                  {/* Row Number */}
                  <TableCell className="font-mono text-slate-400 text-xs">
                    {rec.rowNumber}
                  </TableCell>

                  {/* Name & Mobile */}
                  <TableCell>
                    <span className="font-bold text-slate-900 text-xs block">{rec.name || '—'}</span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {rec.phoneNumber || rec.phone || '—'}
                    </span>
                  </TableCell>

                  {/* Email */}
                  <TableCell>
                    <span className="font-mono text-slate-700 text-xs">{rec.email || '—'}</span>
                  </TableCell>

                  {/* Role / Category */}
                  <TableCell>
                    <Badge variant="outline" className="text-[9px] uppercase font-bold">
                      {roleLabel}
                    </Badge>
                  </TableCell>

                  {/* Roll / Emp ID & Department */}
                  <TableCell>
                    <div className="text-[11px] text-slate-700">
                      <span className="font-mono font-bold block">{rollOrEmpId}</span>
                      <span className="text-[10px] text-slate-400">{department}</span>
                    </div>
                  </TableCell>

                  {/* Status & Error Reason */}
                  <TableCell>
                    {isValid ? (
                      <Badge variant="nfiNavy" className="text-[9px] font-bold">
                        <CheckCircle2 className="w-2.5 h-2.5 mr-1" />
                        <span>Ready to Import</span>
                      </Badge>
                    ) : (
                      <div className="space-y-0.5">
                        <Badge
                          variant="destructive"
                          className="text-[9px] font-bold bg-red-100 text-red-700 border-red-200"
                        >
                          <XCircle className="w-2.5 h-2.5 mr-1" />
                          <span>Validation Failed</span>
                        </Badge>
                        <p className="text-[10px] text-red-600 font-medium">
                          {rec.errors?.join('; ')}
                        </p>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* Consolidated Billing, Volume Slab Discount & Promo Code Box */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left: Promo Code & Payment Configuration */}
        <div className="lg:col-span-7 p-5 bg-white border border-slate-200/80 rounded-2xl shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-[#284661]" />
              <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider">
                Billing Mode &amp; Promotional Discount
              </h4>
            </div>
            {appliedSlabLabel && (
              <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 text-[10px] font-bold">
                <Sparkles className="w-3 h-3 mr-1" />
                <span>Auto Slab Applied: {appliedSlabLabel}</span>
              </Badge>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                Payment / Billing Method
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:bg-white focus:border-[#284661]"
              >
                <option value="Institutional Invoice / NEFT">Institutional Invoice / NEFT</option>
                <option value="Cash / Direct Deposit">Cash / Direct Deposit</option>
                <option value="Online Payment / Razorpay">Online Payment / Razorpay</option>
                <option value="Cheque / Demand Draft">Cheque / Demand Draft</option>
                <option value="Complimentary / Waived">Complimentary / Waived (₹0)</option>
              </select>
            </div>

            <div>
              <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                Invoice Payment Status
              </label>
              <select
                value={isComplimentary ? 'waived' : paymentStatus}
                disabled={isComplimentary}
                onChange={(e) => setPaymentStatus(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:bg-white focus:border-[#284661] disabled:opacity-60"
              >
                <option value="paid">PAID (Immediate Activation)</option>
                <option value="pending">PENDING (Invoice Raised)</option>
                {isComplimentary && <option value="waived">WAIVED (Complimentary)</option>}
              </select>
            </div>
          </div>

          {/* Mandatory Transaction / Reference ID */}
          <div className="pt-2 border-t border-slate-100">
            <div className="flex items-center justify-between mb-1">
              <label className="text-[11px] font-bold text-slate-800 flex items-center gap-1">
                <Hash className="w-3.5 h-3.5 text-[#284661]" />
                <span>Transaction / Reference ID</span>
                <span className="text-red-500 font-black">*</span>
              </label>
              <span className="text-[10px] text-slate-400 font-mono">Mandatory for Audit</span>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="text"
                value={paymentReference}
                onChange={(e) => {
                  setPaymentReference(e.target.value.toUpperCase());
                  if (referenceError) setReferenceError('');
                }}
                placeholder={
                  paymentMethod === 'Cash / Direct Deposit'
                    ? 'Enter CASH or Receipt / Voucher No.'
                    : paymentMethod === 'Cheque / Demand Draft'
                    ? 'Enter Cheque / DD No. & Bank Name'
                    : 'Enter UTR No. / Razorpay ID / Bank Ref'
                }
                className={`flex-1 px-3 py-2 bg-slate-50 border rounded-xl text-xs font-mono uppercase text-slate-800 focus:outline-none focus:bg-white focus:border-[#284661] ${
                  referenceError ? 'border-red-400 bg-red-50/50' : 'border-slate-200'
                }`}
              />
              {paymentMethod === 'Cash / Direct Deposit' && !paymentReference && (
                <button
                  type="button"
                  onClick={() => {
                    setPaymentReference('CASH');
                    if (referenceError) setReferenceError('');
                  }}
                  className="px-2.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[10px] rounded-xl transition-all cursor-pointer whitespace-nowrap"
                >
                  Set &ldquo;CASH&rdquo;
                </button>
              )}
            </div>
            {referenceError ? (
              <p className="text-[11px] text-red-600 font-medium mt-1">{referenceError}</p>
            ) : (
              <p className="text-[10px] text-slate-400 mt-1">
                Mandatory payment identifier (UTR number, cash receipt, bank deposit ref, or cheque no).
              </p>
            )}
          </div>

          {/* Promo Coupon Box */}
          <div className="pt-2 border-t border-slate-100">
            <label className="text-[11px] font-semibold text-slate-600 block mb-1.5">
              Have an Institutional Promo / Coupon Code?
            </label>
            {appliedCoupon ? (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Tag className="w-4 h-4 text-emerald-700" />
                  <div>
                    <span className="font-mono font-black text-emerald-900 text-xs">
                      {appliedCoupon.code}
                    </span>
                    <span className="text-[11px] text-emerald-700 block">
                      Extra ₹{appliedCoupon.discountAmount.toLocaleString('en-IN')} discount applied!
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleRemoveCoupon}
                  className="text-[11px] font-bold text-red-600 hover:underline cursor-pointer"
                >
                  Remove
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={couponInput}
                  onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                  placeholder="Enter coupon code (optional)"
                  className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono uppercase text-slate-800 focus:outline-none focus:bg-white focus:border-[#284661]"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleApplyCoupon}
                  disabled={!couponInput.trim() || couponLoading || isComplimentary}
                  className="rounded-xl text-xs font-bold cursor-pointer h-9 px-4"
                >
                  {couponLoading ? 'Checking...' : 'Apply Code'}
                </Button>
              </div>
            )}
            {couponError && (
              <p className="text-[11px] text-red-600 font-medium mt-1">{couponError}</p>
            )}
          </div>
        </div>

        {/* Right: Consolidated Order Summary (Styled to match Project Navy #284661) */}
        <div className="lg:col-span-5 p-5 bg-gradient-to-br from-[#284661] to-[#1c3347] text-white rounded-2xl shadow-xs border border-[#1b3145] flex flex-col justify-between space-y-4">
          <div className="space-y-2.5">
            <div className="flex items-center justify-between border-b border-white/15 pb-2.5">
              <div className="flex items-center gap-2">
                <Receipt className="w-4 h-4 text-[#FFD243]" />
                <span className="font-bold text-xs uppercase tracking-wider text-slate-100">
                  Consolidated Order Summary
                </span>
              </div>
              <span className="text-[11px] font-mono text-emerald-300 font-bold">{planName}</span>
            </div>

            <div className="flex justify-between text-xs text-slate-200">
              <span>
                Base Amount ({validCount} Seats × ₹{unitPriceINR.toLocaleString('en-IN')}):
              </span>
              <span className="font-mono font-semibold">
                ₹{subtotalINR.toLocaleString('en-IN')}
              </span>
            </div>

            {slabDiscountINR > 0 && (
              <div className="flex justify-between text-xs text-emerald-300">
                <span>Volume Slab Discount ({slabDiscountPercent}%):</span>
                <span className="font-mono font-bold">
                  -₹{slabDiscountINR.toLocaleString('en-IN')}
                </span>
              </div>
            )}

            {couponDiscountINR > 0 && (
              <div className="flex justify-between text-xs text-[#FFD243]">
                <span>Promo Coupon ({appliedCoupon?.code}):</span>
                <span className="font-mono font-bold">
                  -₹{couponDiscountINR.toLocaleString('en-IN')}
                </span>
              </div>
            )}

            {/* Dynamic GST Row (18% for Digital/Online, 0% for Physical) */}
            {taxPercent > 0 ? (
              <div className="flex justify-between text-xs text-sky-200">
                <span>
                  GST ({taxPercent}%) [CGST {taxPercent / 2}% + SGST {taxPercent / 2}%]:
                </span>
                <span className="font-mono font-bold">
                  +₹{taxAmountINR.toLocaleString('en-IN')}
                </span>
              </div>
            ) : (
              <div className="flex justify-between text-xs text-emerald-300">
                <span>GST (Printed Book / Exempt):</span>
                <span className="font-mono font-bold">0% (₹0)</span>
              </div>
            )}

            <div className="flex justify-between border-t border-white/20 pt-2.5 text-sm font-black text-white">
              <span>Net Consolidated Payable:</span>
              <span className="font-mono text-[#FFD243] text-base">
                ₹{netPayableINR.toLocaleString('en-IN')}
              </span>
            </div>
          </div>

          <Button
            type="button"
            variant="nfiYellow"
            size="lg"
            onClick={handleConfirm}
            disabled={validCount === 0 || isImporting}
            className="w-full rounded-xl font-black shadow-2xs cursor-pointer text-xs justify-center"
          >
            <span>
              {isImporting
                ? 'Provisioning Subscriptions...'
                : `Confirm & Provision ${validCount} Passes`}
            </span>
            <ArrowRight className="w-4 h-4 ml-1.5" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default BulkPreviewTable;
