import React from 'react';
import { Badge } from '../../ui/badge';
import { Button } from '../../ui/button';
import {
  Printer,
  CheckCircle2,
  Download,
} from 'lucide-react';

export const ConsolidatedInvoiceCard = ({ invoice, job }) => {
  if (!invoice) return null;

  const handlePrint = () => {
    document.body.classList.add('printing-invoice');
    const cleanUp = () => {
      document.body.classList.remove('printing-invoice');
      window.removeEventListener('afterprint', cleanUp);
    };
    window.addEventListener('afterprint', cleanUp);
    setTimeout(cleanUp, 3000);
    window.print();
  };

  const handleDownloadCredentialsCSV = () => {
    const records = (job?.records || []).filter(
      (r) => r.status === 'imported' || r.status === 'valid'
    );
    if (records.length === 0) return;

    const headers = [
      'Row #',
      'Full Name',
      'Email Address (Login ID)',
      'Temporary Password',
      'Mobile Number',
      'Role / Category',
      'Roll / Employee ID',
      'Department',
      'Subscription Pass ID',
      'Institution Name',
    ];

    const csvRows = [
      headers.join(','),
      ...records.map((r) =>
        [
          r.rowNumber || '',
          `"${(r.name || '').replace(/"/g, '""')}"`,
          `"${(r.email || '').replace(/"/g, '""')}"`,
          '"Nfi@2026!"',
          `"${(r.phoneNumber || r.phone || '').replace(/"/g, '""')}"`,
          `"${(r.roleCategory || r.userType || '').replace(/"/g, '""')}"`,
          `"${(r.rollOrEmployeeId || '').replace(/"/g, '""')}"`,
          `"${(r.department || '').replace(/"/g, '""')}"`,
          `"${r.subscriptionId || 'ACTIVE'}"`,
          `"${(job?.institutionName || invoice.institutionName || '').replace(/"/g, '""')}"`,
        ].join(',')
      ),
    ];

    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute(
      'download',
      `Enrolled_Credentials_${job?.jobId || invoice.invoiceNumber || 'Batch'}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const slabDiscount = invoice.slabDiscountINR || 0;
  const couponDiscount = invoice.couponDiscountINR || 0;
  const taxAmount = invoice.taxAmountINR || 0;

  return (
    <div className="printable-invoice p-6 bg-white border border-slate-200/80 rounded-2xl shadow-xs font-sans text-xs select-none space-y-5 print:border-none print:shadow-none">
      {/* Invoice Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b border-slate-100 pb-5">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-[#284661] text-white flex items-center justify-center font-bold text-base shadow-2xs">
            NFI
          </div>
          <div>
            <h3 className="text-base font-black text-slate-900 leading-tight">
              Indian Pharmacopoeia Commission
            </h3>
            <p className="text-slate-500 text-xs">
              National Formulary of India · Official Consolidated License Invoice
            </p>
          </div>
        </div>

        <div className="text-right sm:text-right space-y-1">
          <span className="font-mono font-black text-slate-900 text-sm block">
            {invoice.invoiceNumber}
          </span>
          <span className="text-slate-400 text-[11px] block">
            Generated:{' '}
            {new Date(invoice.generatedAt || Date.now()).toLocaleDateString('en-IN')}
          </span>
          <Badge variant="nfiNavy" className="text-[9px] font-bold">
            <CheckCircle2 className="w-2.5 h-2.5 mr-1" />
            <span>{(invoice.paymentStatus || 'PAID').toUpperCase()}</span>
          </Badge>
        </div>
      </div>

      {/* Bill To & Billing Institution Info */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-slate-50 border border-slate-200/60 rounded-xl">
        <div className="space-y-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
            Billed Institution
          </span>
          <p className="font-bold text-slate-900 text-sm">{invoice.institutionName}</p>
          <p className="text-slate-600 text-xs">
            {invoice.billingContact || 'Institutional Coordinator'}
          </p>
          {invoice.billingEmail && (
            <p className="text-slate-500 text-[11px] font-mono">{invoice.billingEmail}</p>
          )}
        </div>

        <div className="space-y-1 text-left sm:text-right">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
            Batch Job &amp; Payment Ref
          </span>
          <p className="font-mono font-bold text-slate-800 text-xs">
            {job?.jobId || 'BATCH-2026'}
          </p>
          <p className="text-slate-500 text-xs">
            Plan: {job?.planName || 'NFI Formulary'} · Mode:{' '}
            {invoice.paymentMethod || 'Institutional Invoice'}
          </p>
          {(invoice.paymentReference || invoice.transactionId) && (
            <p className="text-[#284661] font-mono text-[11px] font-bold">
              Ref / Txn ID: {invoice.paymentReference || invoice.transactionId}
            </p>
          )}
        </div>
      </div>

      {/* Line Item Table */}
      <div className="border border-slate-200/80 rounded-xl overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-500 text-[10px] uppercase font-bold">
            <tr>
              <th className="p-3">Item Description</th>
              <th className="p-3 text-center">Subscribers</th>
              <th className="p-3 text-right">Unit License Rate</th>
              <th className="p-3 text-right">Line Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-xs">
            <tr>
              <td className="p-3">
                <span className="font-bold text-slate-900 block">
                  {job?.planName || 'NFI Formulary Digital Access Pass'}
                </span>
                <span className="text-[10px] text-[#284661] font-semibold">
                  Institutional Cohort License · Default Login Password: Nfi@2026!
                </span>
              </td>
              <td className="p-3 text-center font-bold text-slate-800">
                {invoice.totalSubscribers} Seats
              </td>
              <td className="p-3 text-right text-slate-600 font-mono">
                ₹{(invoice.unitPriceINR || 0).toLocaleString('en-IN')}
              </td>
              <td className="p-3 text-right font-black text-slate-900 font-mono">
                ₹{(invoice.subtotalINR || 0).toLocaleString('en-IN')}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Financial Summary Breakdown */}
      <div className="flex justify-end pt-2">
        <div className="w-full sm:w-80 space-y-2 text-xs">
          <div className="flex justify-between text-slate-600">
            <span>Base Subtotal:</span>
            <span className="font-mono font-semibold">
              ₹{(invoice.subtotalINR || 0).toLocaleString('en-IN')}
            </span>
          </div>

          {slabDiscount > 0 && (
            <div className="flex justify-between text-emerald-700">
              <span>
                Volume Slab Discount ({invoice.slabDiscountPercent || 0}%):
              </span>
              <span className="font-mono font-bold">
                -₹{slabDiscount.toLocaleString('en-IN')}
              </span>
            </div>
          )}

          {couponDiscount > 0 && (
            <div className="flex justify-between text-emerald-700">
              <span>
                Promo Coupon {invoice.couponCode ? `(${invoice.couponCode})` : ''}:
              </span>
              <span className="font-mono font-bold">
                -₹{couponDiscount.toLocaleString('en-IN')}
              </span>
            </div>
          )}

          {taxAmount > 0 ? (
            <div className="flex justify-between text-slate-600">
              <span>GST ({invoice.taxPercent || 18}%):</span>
              <span className="font-mono font-semibold">
                +₹{taxAmount.toLocaleString('en-IN')}
              </span>
            </div>
          ) : (
            <div className="flex justify-between text-emerald-700">
              <span>GST (Printed Book / Exempt):</span>
              <span className="font-mono font-semibold">0% (₹0)</span>
            </div>
          )}

          <div className="flex justify-between border-t border-slate-200 pt-2 text-slate-900 font-black text-sm">
            <span>Net Consolidated Total:</span>
            <span className="font-mono text-[#284661]">
              ₹{(invoice.finalAmountINR ?? 0).toLocaleString('en-IN')}
            </span>
          </div>
        </div>
      </div>

      {/* Action Footer */}
      <div className="flex flex-wrap justify-end gap-2 pt-3 border-t border-slate-100 print:hidden">
        {job?.records?.length > 0 && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleDownloadCredentialsCSV}
            className="rounded-xl text-xs font-bold text-[#284661] border-slate-200 hover:bg-slate-50 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 mr-1" />
            <span>Download Enrolled Credentials (.CSV)</span>
          </Button>
        )}

        <Button
          type="button"
          variant="nfiNavy"
          size="sm"
          onClick={handlePrint}
          className="rounded-xl text-xs font-semibold cursor-pointer"
        >
          <Printer className="w-3.5 h-3.5 mr-1" />
          <span>Print / Save Invoice PDF</span>
        </Button>
      </div>
    </div>
  );
};

export default ConsolidatedInvoiceCard;
