import React from 'react';
import AdminModal from '../common/AdminModal';
import { Printer, Download, Receipt, Building, CheckCircle2 } from 'lucide-react';
import { Button } from '../../ui/button';
import { Badge } from '../../ui/badge';

export const InvoiceModal = ({
  isOpen,
  onClose,
  order,
}) => {
  if (!order) return null;

  const pricing = order.pricing || {};
  const base = pricing.baseAmount || 0;
  const discount = pricing.discountAmount || 0;
  const taxable = Math.max(0, base - discount);
  const tax = pricing.taxAmount || 0;
  const cgst = Math.round(tax / 2);
  const sgst = tax - cgst;
  const total = pricing.totalAmount || 0;

  const handlePrint = () => {
    window.print();
  };

  return (
    <AdminModal
      isOpen={isOpen}
      onClose={onClose}
      title="Official GST Tax Invoice"
      description={`Tax invoice ${order.invoiceNumber} for Order ${order.orderNumber}.`}
      confirmLabel="Close Invoice"
      onConfirm={onClose}
      size="lg"
    >
      <div className="space-y-4 text-xs select-none font-sans overflow-hidden">
        {/* Printable Invoice Container */}
        <div id="printable-invoice" className="p-6 bg-white border border-slate-200 rounded-2xl shadow-xs space-y-6 font-sans text-slate-800">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-[#284661] text-white flex items-center justify-center font-black text-base shadow-2xs">
                NFI
              </div>
              <div>
                <h3 className="font-black text-slate-900 text-base">
                  Indian Pharmacopoeia Commission
                </h3>
                <p className="text-slate-500 text-xs">
                  Ministry of Health &amp; Family Welfare, Govt. of India
                </p>
                <span className="text-[10px] text-slate-400 font-mono">
                  GSTIN: 09AAAAI2026B1Z5 · Sector 23, Raj Nagar, Ghaziabad 201002
                </span>
              </div>
            </div>

            <div className="text-left sm:text-right">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                TAX INVOICE
              </span>
              <h4 className="font-mono font-black text-slate-900 text-base">{order.invoiceNumber}</h4>
              <span className="text-slate-500 text-xs block mt-0.5">
                Date: <strong>{new Date(order.createdAt).toLocaleDateString('en-IN')}</strong>
              </span>
              <span className="text-[11px] font-mono text-slate-400">Order: {order.orderNumber}</span>
            </div>
          </div>

          {/* Billed To / Customer Specs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-3.5 bg-slate-50 border border-slate-200/80 rounded-xl text-xs">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Billed To (Subscriber)
              </span>
              <h5 className="font-bold text-slate-900 text-sm mt-0.5">{order.userName}</h5>
              <span className="text-slate-600 block">{order.userEmail}</span>
              <Badge variant="outline" className="text-[9px] uppercase font-bold mt-1">
                Category: {order.userType}
              </Badge>
            </div>

            <div className="text-left sm:text-right space-y-1 text-[11px]">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Transaction Status
              </span>
              <div className="flex sm:justify-end gap-1.5 items-center">
                <Badge variant={order.payment?.status === 'paid' ? 'nfiNavy' : 'secondary'} className="text-[9px] uppercase font-bold">
                  Payment: {order.payment?.status}
                </Badge>
              </div>
              <span className="text-slate-500 block">
                Gateway: <strong>{order.payment?.gateway}</strong> ({order.payment?.paymentMethod})
              </span>
              <span className="font-mono text-slate-400 text-[10px] block">
                Txn Ref: {order.payment?.gatewayTransactionId || 'N/A'}
              </span>
            </div>
          </div>

          {/* Line Items Table */}
          <div className="border border-slate-200 rounded-xl overflow-hidden">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100/80 border-b border-slate-200 text-slate-600 font-bold">
                  <th className="p-3">Item Description</th>
                  <th className="p-3 text-center">Tier</th>
                  <th className="p-3 text-right">Base Price</th>
                  <th className="p-3 text-right">Discount</th>
                  <th className="p-3 text-right">Taxable Total</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-slate-100">
                  <td className="p-3">
                    <span className="font-bold text-slate-900 block">{order.planName}</span>
                    <span className="text-[10px] text-slate-400">
                      Digital Formulary Access (BRD Fixed Validity through 31 Dec 2031)
                    </span>
                  </td>
                  <td className="p-3 text-center">
                    <Badge variant="outline" className="text-[8px] font-bold uppercase">
                      {order.tier}
                    </Badge>
                  </td>
                  <td className="p-3 text-right font-mono font-bold text-slate-700">
                    ₹{base.toLocaleString('en-IN')}
                  </td>
                  <td className="p-3 text-right font-mono font-semibold text-emerald-600">
                    {discount > 0 ? `-₹${discount.toLocaleString('en-IN')}` : '₹0'}
                  </td>
                  <td className="p-3 text-right font-mono font-bold text-slate-900">
                    ₹{taxable.toLocaleString('en-IN')}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Tax Breakdown & Gross Total */}
          <div className="flex flex-col sm:flex-row justify-between items-start gap-4 pt-2">
            <div className="text-[11px] text-slate-500 space-y-1 max-w-xs">
              <span className="font-bold text-slate-700 block">Terms &amp; Conditions:</span>
              <p>1. This is a computer-generated official tax invoice and does not require a physical signature.</p>
              <p>2. Subscriptions remain valid until 31 December 2031 as per Indian Pharmacopoeia Commission rules.</p>
            </div>

            <div className="w-full sm:w-64 space-y-2 text-xs bg-slate-50 p-3.5 rounded-xl border border-slate-200/80">
              <div className="flex justify-between text-slate-600">
                <span>Taxable Amount:</span>
                <span className="font-mono font-bold">₹{taxable.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between text-slate-500 text-[11px]">
                <span>CGST (9%):</span>
                <span className="font-mono">₹{cgst.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between text-slate-500 text-[11px]">
                <span>SGST (9%):</span>
                <span className="font-mono">₹{sgst.toLocaleString('en-IN')}</span>
              </div>
              <div className="pt-2 border-t border-slate-200 flex justify-between font-black text-sm text-slate-900">
                <span>Final Paid (INR):</span>
                <span className="font-mono text-[#284661]">₹{total.toLocaleString('en-IN')}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-2 pt-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handlePrint}
            className="rounded-xl text-xs font-bold cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5 mr-1.5" />
            <span>Print Invoice</span>
          </Button>
        </div>
      </div>
    </AdminModal>
  );
};

export default InvoiceModal;
