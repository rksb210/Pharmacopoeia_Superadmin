import React from 'react';
import { Badge } from '../../ui/badge';
import { Button } from '../../ui/button';
import {
  FileText,
  Printer,
  CheckCircle2,
  Building2,
  Calendar,
  CreditCard,
  Download,
} from 'lucide-react';

export const ConsolidatedInvoiceCard = ({ invoice, job }) => {
  if (!invoice) return null;

  const handlePrint = () => {
    window.print();
  };

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
            Generated: {new Date(invoice.generatedAt).toLocaleDateString('en-IN')}
          </span>
          <Badge variant="nfiNavy" className="text-[9px] font-bold">
            <CheckCircle2 className="w-2.5 h-2.5 mr-1" />
            <span>{invoice.paymentStatus?.toUpperCase()}</span>
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
          <p className="text-slate-600 text-xs">{invoice.billingContact || 'Institutional Coordinator'}</p>
        </div>

        <div className="space-y-1 text-left sm:text-right">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
            Batch Job Reference
          </span>
          <p className="font-mono font-bold text-slate-800 text-xs">{job?.jobId || 'BATCH-2026'}</p>
          <p className="text-slate-500 text-xs">
            Tier: {job?.tier || 'Institutional'} · Plan: {job?.planName || 'NFI Formulary'}
          </p>
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
                  Valid through 31 Dec 2031 (BRD Policy)
                </span>
              </td>
              <td className="p-3 text-center font-bold text-slate-800">
                {invoice.totalSubscribers} Seats
              </td>
              <td className="p-3 text-right text-slate-600 font-mono">
                ₹{invoice.unitPriceINR?.toLocaleString('en-IN')}
              </td>
              <td className="p-3 text-right font-black text-slate-900 font-mono">
                ₹{invoice.subtotalINR?.toLocaleString('en-IN')}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Financial Summary Breakdown */}
      <div className="flex justify-end pt-2">
        <div className="w-full sm:w-72 space-y-2 text-xs">
          <div className="flex justify-between text-slate-600">
            <span>Subtotal:</span>
            <span className="font-mono font-semibold">₹{invoice.subtotalINR?.toLocaleString('en-IN')}</span>
          </div>

          <div className="flex justify-between text-slate-600">
            <span>GST ({invoice.taxPercent}%):</span>
            <span className="font-mono font-semibold">₹{invoice.taxAmountINR?.toLocaleString('en-IN')}</span>
          </div>

          <div className="flex justify-between border-t border-slate-200 pt-2 text-slate-900 font-black text-sm">
            <span>Consolidated Total:</span>
            <span className="font-mono text-[#284661]">₹{invoice.finalAmountINR?.toLocaleString('en-IN')}</span>
          </div>
        </div>
      </div>

      {/* Action Footer */}
      <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 print:hidden">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handlePrint}
          className="rounded-xl text-xs font-semibold cursor-pointer"
        >
          <Printer className="w-3.5 h-3.5 mr-1" />
          <span>Print / Save PDF</span>
        </Button>
      </div>
    </div>
  );
};

export default ConsolidatedInvoiceCard;
