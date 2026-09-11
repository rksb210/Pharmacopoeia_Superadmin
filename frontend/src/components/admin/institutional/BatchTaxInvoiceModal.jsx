import React from 'react';
import AdminModal from '../common/AdminModal';
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

export const BatchTaxInvoiceModal = ({ isOpen, onClose, invoice, batch }) => {
  if (!isOpen) return null;

  const inv = invoice || batch?.invoice;
  if (!inv) return null;

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

  const invoiceNumber = inv.invoiceNumber || 'INV-NFI-PENDING';
  const finalAmount = inv.totalAmount || inv.finalAmountINR || 0;
  const subtotal = inv.subtotal || inv.subtotalINR || 0;
  const taxAmount = inv.taxAmount || inv.taxAmountINR || 0;
  const unitPrice = inv.unitPriceINR || (subtotal && batch?.validSeats ? Math.round(subtotal / batch.validSeats) : 3500);

  return (
    <AdminModal
      isOpen={isOpen}
      onClose={onClose}
      title={`Consolidated Tax Invoice: ${invoiceNumber}`}
      description="Official institutional license receipt and tax statement issued by Indian Pharmacopoeia Commission."
      confirmLabel="Close"
      onConfirm={onClose}
      size="lg"
    >
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
                Ministry of Health &amp; Family Welfare, Govt. of India · Sector 23, Raj Nagar, Ghaziabad - 201002
              </p>
            </div>
          </div>

          <div className="text-left sm:text-right space-y-1">
            <span className="font-mono font-black text-slate-900 text-sm block">
              {invoiceNumber}
            </span>
            <span className="text-slate-400 text-[11px] block">
              Date: {new Date(inv.invoiceDate || inv.generatedAt || Date.now()).toLocaleDateString('en-IN')}
            </span>
            <Badge variant="nfiNavy" className="text-[9px] font-bold">
              <CheckCircle2 className="w-2.5 h-2.5 mr-1" />
              <span>{inv.status || 'PAID'}</span>
            </Badge>
          </div>
        </div>

        {/* Bill To Info */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-slate-50 border border-slate-200/80 rounded-2xl">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Billed To (Institution):
            </span>
            <span className="text-sm font-black text-slate-900 block mt-0.5">
              {batch?.institutionName || 'Institutional Licensee'}
            </span>
            <div className="text-slate-500 text-[11px] space-y-0.5 mt-1 font-mono">
              <p>Coordinator: {batch?.coordinator?.name || 'Authorized Lead'}</p>
              <p>Email: {batch?.coordinator?.email || '—'}</p>
              {batch?.coordinator?.phone && <p>Phone: {batch.coordinator.phone}</p>}
            </div>
          </div>

          <div className="sm:text-right">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Billing &amp; Tax Reference:
            </span>
            <p className="font-mono font-bold text-slate-700 text-xs mt-0.5">
              Batch Ref: {batch?.batchRef || batch?.jobId || 'BATCH-COHORT'}
            </p>
            <p className="text-slate-500 text-[11px] font-mono mt-0.5">
              Payment Mode: {inv.paymentMethod || 'Institutional License / NEFT'}
            </p>
            <p className="text-slate-500 text-[11px] font-mono">
              Stakeholder: {batch?.stakeholderLabel || 'Corporate/Academic'}
            </p>
          </div>
        </div>

        {/* Itemized Table */}
        <div className="border border-slate-200/80 rounded-2xl overflow-hidden bg-white">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 border-b border-slate-200/80">
              <tr>
                <th className="p-3 font-bold">Description</th>
                <th className="p-3 font-bold text-center">Enrolled Seats</th>
                <th className="p-3 font-bold text-right">Unit Rate (INR)</th>
                <th className="p-3 font-bold text-right">Net Total (INR)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              <tr>
                <td className="p-3 font-medium">
                  <span className="font-bold text-slate-900 block">
                    {batch?.plan?.name || 'NFI 9th Edition Institutional Formulary Access Pass'}
                  </span>
                  <span className="text-[10px] text-slate-400">
                    Comprehensive digital monograph access, interactions engine, and search suite.
                  </span>
                </td>
                <td className="p-3 text-center font-black text-slate-900">
                  {batch?.validSeats || 1}
                </td>
                <td className="p-3 text-right font-mono text-slate-700">
                  ₹{unitPrice.toLocaleString('en-IN')}
                </td>
                <td className="p-3 text-right font-mono font-bold text-slate-900">
                  ₹{subtotal.toLocaleString('en-IN')}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Calculation Totals */}
        <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
          <div className="text-[11px] text-slate-400 max-w-sm">
            <p className="font-semibold text-slate-600">Statutory Tax Note:</p>
            <p>
              Standard 18% GST applicable on digital information database subscriptions under SAC 998431.
            </p>
          </div>

          <div className="w-full sm:w-64 space-y-2 font-mono">
            <div className="flex justify-between text-slate-500 text-xs">
              <span>Subtotal:</span>
              <span>₹{subtotal.toLocaleString('en-IN')}</span>
            </div>
            <div className="flex justify-between text-slate-500 text-xs">
              <span>GST (18%):</span>
              <span>₹{taxAmount.toLocaleString('en-IN')}</span>
            </div>
            <div className="flex justify-between text-slate-900 font-black text-sm pt-2 border-t border-slate-200">
              <span>Total Payable:</span>
              <span className="text-[#284661]">₹{finalAmount.toLocaleString('en-IN')}</span>
            </div>
          </div>
        </div>

        {/* Bottom Actions */}
        <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 print:hidden">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handlePrint}
            className="rounded-xl text-xs font-bold cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5 mr-1" />
            <span>Print Invoice</span>
          </Button>

          <Button
            type="button"
            variant="nfiNavy"
            size="sm"
            onClick={handlePrint}
            className="rounded-xl text-xs font-bold cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 mr-1" />
            <span>Download Invoice PDF</span>
          </Button>
        </div>
      </div>
    </AdminModal>
  );
};

export default BatchTaxInvoiceModal;
