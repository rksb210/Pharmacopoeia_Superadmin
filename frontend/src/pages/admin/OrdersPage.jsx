import React, { useState, useEffect, useCallback } from 'react';
import {
  CreditCard,
  CheckCircle2,
  Clock,
  XCircle,
  RotateCcw,
  RefreshCw,
  Search,
  Filter,
  Receipt,
  Download,
  FileText,
  TrendingUp,
  AlertTriangle,
  Calendar,
} from 'lucide-react';
import PageContainer from '../../components/admin/common/PageContainer';
import PageHeader from '../../components/admin/common/PageHeader';
import StatCard from '../../components/admin/common/StatCard';
import AdminLoader from '../../components/admin/common/AdminLoader';
import AdminErrorState from '../../components/admin/common/AdminErrorState';
import AdminEmptyState from '../../components/admin/common/AdminEmptyState';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '../../components/ui/table';

import orderService from '../../services/order.service';
import PermissionGuard from '../../components/admin/common/PermissionGuard';

// Components & Modals
import OrderStatusBadge from '../../components/admin/orders/OrderStatusBadge';
import PaymentStatusBadge from '../../components/admin/orders/PaymentStatusBadge';
import InvoiceModal from '../../components/admin/orders/InvoiceModal';
import RefundOrderModal from '../../components/admin/orders/RefundOrderModal';
import OrderDetailsModal from '../../components/admin/orders/OrderDetailsModal';

const PAYMENT_METHODS = [
  { id: 'all', label: 'All Payment Modes' },
  { id: 'UPI', label: 'UPI' },
  { id: 'Credit_Card', label: 'Credit Card' },
  { id: 'Debit_Card', label: 'Debit Card' },
  { id: 'NetBanking', label: 'NetBanking' },
  { id: 'NEFT_RTGS', label: 'NEFT / RTGS' },
];

export const OrdersPage = () => {
  const [stats, setStats] = useState({
    totalOrders: 0,
    completedOrders: 0,
    failedOrders: 0,
    refundedOrders: 0,
    totalRevenueINR: 0,
    totalRefundsINR: 0,
    averageOrderValueINR: 0,
  });

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState('');
  const [feedback, setFeedback] = useState({ message: '', type: '' });

  // Filter States
  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'completed' | 'processing' | 'failed' | 'refunded'
  const [searchQuery, setSearchQuery] = useState('');
  const [paymentMethodFilter, setPaymentMethodFilter] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  // Modals
  const [invoicingOrder, setInvoicingOrder] = useState(null);
  const [refundingOrder, setRefundingOrder] = useState(null);
  const [viewingOrder, setViewingOrder] = useState(null);

  // Fetch KPI Stats
  const fetchStats = async () => {
    try {
      const res = await orderService.getStats();
      if (res && res.stats) setStats(res.stats);
    } catch (err) {
      console.warn('Failed to load order stats:', err.message);
    }
  };

  // Fetch Orders List
  const fetchOrders = useCallback(async () => {
    setLoading(true);
    setError('');

    let computedStatus = 'all';
    if (activeTab === 'completed') computedStatus = 'completed';
    else if (activeTab === 'processing') computedStatus = 'processing';
    else if (activeTab === 'failed') computedStatus = 'failed';
    else if (activeTab === 'refunded') computedStatus = 'refunded';

    try {
      const res = await orderService.getOrders({
        page: currentPage,
        limit: 10,
        search: searchQuery,
        orderStatus: computedStatus,
        paymentMethod: paymentMethodFilter,
        startDate,
        endDate,
      });

      if (res && res.orders) {
        setOrders(res.orders);
        setTotalPages(res.pagination?.totalPages || 1);
        setTotalItems(res.pagination?.total || 0);
      }
    } catch (err) {
      setError(err.message || 'Failed to load commercial orders.');
    } finally {
      setLoading(false);
    }
  }, [currentPage, activeTab, searchQuery, paymentMethodFilter, startDate, endDate]);

  useEffect(() => {
    fetchStats();
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const showFeedback = (message, type = 'success') => {
    setFeedback({ message, type });
    setTimeout(() => setFeedback({ message: '', type: '' }), 4000);
  };

  // Export Excel Handler
  const handleExportExcel = async () => {
    setExporting(true);
    try {
      let computedStatus = 'all';
      if (activeTab === 'completed') computedStatus = 'completed';
      else if (activeTab === 'processing') computedStatus = 'processing';
      else if (activeTab === 'failed') computedStatus = 'failed';
      else if (activeTab === 'refunded') computedStatus = 'refunded';

      const blob = await orderService.exportExcel({
        search: searchQuery,
        orderStatus: computedStatus,
        paymentMethod: paymentMethodFilter,
        startDate,
        endDate,
      });

      const url = window.URL.createObjectURL(new Blob([blob]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute(
        'download',
        `NFI_Orders_Ledger_${new Date().toISOString().split('T')[0]}.xlsx`
      );
      document.body.appendChild(link);
      link.click();
      link.remove();
      showFeedback('Orders transaction spreadsheet exported successfully.');
    } catch (err) {
      showFeedback(err.message || 'Export failed', 'error');
    } finally {
      setExporting(false);
    }
  };

  // Refund Handler
  const handleProcessRefund = async (orderId, { refundAmount, reason }) => {
    await orderService.processRefund(orderId, { refundAmount, reason });
    showFeedback(`Refund of ₹${refundAmount.toLocaleString('en-IN')} processed successfully.`);
    fetchOrders();
    fetchStats();
  };

  return (
    <PageContainer>
      {/* Header */}
      <PageHeader
        title="Order &amp; Payment Management"
        subtitle="Immutable financial ledgers, server-side gateway transaction verification, official GST tax invoicing, and refund telemetry."
      >
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            fetchStats();
            fetchOrders();
          }}
          className="rounded-xl text-xs font-semibold cursor-pointer"
          title="Refresh orders"
        >
          <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={handleExportExcel}
          loading={exporting}
          className="rounded-xl text-xs font-bold cursor-pointer"
        >
          <Download className="w-3.5 h-3.5 mr-1.5" />
          <span>Export Excel</span>
        </Button>
      </PageHeader>

      {/* Global Feedback Banner */}
      {feedback.message && (
        <div
          className={`p-3.5 rounded-2xl border text-xs flex items-center gap-2 select-none shadow-xs animate-in fade-in-0 duration-150 ${
            feedback.type === 'error'
              ? 'bg-red-50 border-red-200 text-red-700'
              : 'bg-emerald-50 border-emerald-200 text-emerald-800'
          }`}
        >
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
          <span className="font-semibold">{feedback.message}</span>
        </div>
      )}

      {/* 4 KPI Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard
          title="Total Gross Revenue"
          value={`₹${(stats.totalRevenueINR || 0).toLocaleString('en-IN')}`}
          subtitle={`AOV: ₹${(stats.averageOrderValueINR || 0).toLocaleString('en-IN')}`}
          icon={TrendingUp}
          iconColor="text-emerald-600"
          iconBg="bg-emerald-50"
        />

        <StatCard
          title="Successful Orders"
          value={stats.completedOrders}
          subtitle="Captured transactions"
          icon={CreditCard}
          iconColor="text-[#284661]"
          iconBg="bg-blue-50"
        />

        <StatCard
          title="Failed Payments"
          value={stats.failedOrders}
          subtitle="Declines / Timeouts"
          icon={XCircle}
          iconColor="text-red-600"
          iconBg="bg-red-50"
        />

        <StatCard
          title="Total Refunds"
          value={`₹${(stats.totalRefundsINR || 0).toLocaleString('en-IN')}`}
          subtitle={`${stats.refundedOrders} refunded orders`}
          icon={RotateCcw}
          iconColor="text-purple-600"
          iconBg="bg-purple-50"
        />
      </div>

      {/* Filter Tabs & Toolbar */}
      <div className="p-4 bg-white border border-slate-200/80 rounded-2xl shadow-2xs space-y-3.5">
        {/* Quick Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-slate-100">
          {[
            { id: 'all', label: 'All Orders', count: stats.totalOrders },
            { id: 'completed', label: 'Completed / Paid', count: stats.completedOrders },
            { id: 'failed', label: 'Failed Attempts', count: stats.failedOrders },
            { id: 'refunded', label: 'Refunded', count: stats.refundedOrders },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => {
                setActiveTab(tab.id);
                setCurrentPage(1);
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                activeTab === tab.id
                  ? 'bg-[#284661] text-white shadow-2xs'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <span>{tab.label}</span>
              {tab.count !== undefined && (
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                    activeTab === tab.id ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Search & Filter Dropdowns */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search Order No, Invoice No, Subscriber, Txn ID..."
              className="w-full h-9 pl-8 pr-3 bg-slate-50/80 border border-slate-200 rounded-xl text-xs outline-none focus:border-[#E76120]"
            />
          </div>

          <select
            value={paymentMethodFilter}
            onChange={(e) => {
              setPaymentMethodFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="h-9 px-3 bg-slate-50/80 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 outline-none focus:border-[#E76120] cursor-pointer"
          >
            {PAYMENT_METHODS.map((p) => (
              <option key={p.id} value={p.id}>
                {p.label}
              </option>
            ))}
          </select>

          <div className="flex items-center gap-2">
            <input
              type="date"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                setCurrentPage(1);
              }}
              className="h-9 px-2.5 bg-slate-50/80 border border-slate-200 rounded-xl text-xs outline-none focus:border-[#E76120] w-1/2"
              title="Start Date"
            />
            <input
              type="date"
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value);
                setCurrentPage(1);
              }}
              className="h-9 px-2.5 bg-slate-50/80 border border-slate-200 rounded-xl text-xs outline-none focus:border-[#E76120] w-1/2"
              title="End Date"
            />
          </div>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white border border-slate-200/80 rounded-2xl shadow-2xs overflow-hidden font-sans select-none text-xs">
        {loading ? (
          <AdminLoader text="Loading commercial orders &amp; payment gateway records..." />
        ) : error ? (
          <AdminErrorState
            title="Could not load orders"
            message={error}
            onRetry={fetchOrders}
          />
        ) : orders.length === 0 ? (
          <AdminEmptyState
            title="No orders found"
            description="No transaction records match your current filter parameters."
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order &amp; Invoice</TableHead>
                <TableHead>Plan &amp; Tier</TableHead>
                <TableHead>Subscriber Details</TableHead>
                <TableHead>Amount (INR)</TableHead>
                <TableHead>Gateway &amp; Mode</TableHead>
                <TableHead>Order Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.map((o) => (
                <TableRow key={o._id}>
                  {/* Order & Invoice */}
                  <TableCell>
                    <div>
                      <span className="font-mono font-bold text-slate-900 text-xs block">
                        {o.orderNumber}
                      </span>
                      <span className="font-mono text-[10px] text-slate-400">
                        {o.invoiceNumber}
                      </span>
                    </div>
                  </TableCell>

                  {/* Plan & Tier */}
                  <TableCell className="max-w-xs">
                    <div>
                      <span className="font-bold text-slate-800 text-xs block truncate" title={o.planName}>
                        {o.planName}
                      </span>
                      <Badge variant="outline" className="text-[8px] font-bold uppercase mt-0.5">
                        {o.tier}
                      </Badge>
                    </div>
                  </TableCell>

                  {/* Subscriber */}
                  <TableCell>
                    <div>
                      <span className="font-bold text-slate-900 text-xs block truncate">
                        {o.userName}
                      </span>
                      <span className="text-[10px] text-slate-400 block truncate">
                        {o.userEmail} · <strong className="text-slate-600">{o.userType}</strong>
                      </span>
                    </div>
                  </TableCell>

                  {/* Pricing (Base + Tax) */}
                  <TableCell>
                    <div>
                      <span className="font-black text-slate-900 text-xs block">
                        ₹{o.pricing?.totalAmount?.toLocaleString('en-IN')}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        Incl. 18% GST (₹{o.pricing?.taxAmount || 0})
                      </span>
                    </div>
                  </TableCell>

                  {/* Gateway & Mode */}
                  <TableCell>
                    <div>
                      <span className="font-bold text-slate-700 text-xs block">
                        {o.payment?.gateway}
                      </span>
                      <span className="text-[10px] text-slate-400 block">
                        {o.payment?.paymentMethod}
                      </span>
                    </div>
                  </TableCell>

                  {/* Order Status */}
                  <TableCell>
                    <div className="space-y-0.5">
                      <OrderStatusBadge status={o.orderStatus} />
                      {o.payment?.status !== 'paid' && (
                        <PaymentStatusBadge status={o.payment?.status} />
                      )}
                    </div>
                  </TableCell>

                  {/* Actions */}
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      {/* View Invoice */}
                      <button
                        type="button"
                        onClick={() => setInvoicingOrder(o)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-[#284661] hover:bg-slate-100 cursor-pointer"
                        title="Official Tax Invoice"
                      >
                        <Receipt className="w-4 h-4" />
                      </button>

                      {/* Refund */}
                      {o.payment?.status === 'paid' && !o.refund?.isRefunded && (
                        <PermissionGuard module="SUBSCRIPTIONS" section="PLANS" action="EDIT">
                          <button
                            type="button"
                            onClick={() => setRefundingOrder(o)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-slate-100 cursor-pointer"
                            title="Process Refund"
                          >
                            <RotateCcw className="w-4 h-4" />
                          </button>
                        </PermissionGuard>
                      )}

                      {/* Transaction Details */}
                      <button
                        type="button"
                        onClick={() => setViewingOrder(o)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
                        title="View Order Details"
                      >
                        <FileText className="w-4 h-4" />
                      </button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      {/* Official Tax Invoice Modal */}
      <InvoiceModal
        isOpen={!!invoicingOrder}
        onClose={() => setInvoicingOrder(null)}
        order={invoicingOrder}
      />

      {/* Refund Modal */}
      <RefundOrderModal
        isOpen={!!refundingOrder}
        onClose={() => setRefundingOrder(null)}
        order={refundingOrder}
        onRefund={handleProcessRefund}
      />

      {/* Details Dossier Modal */}
      <OrderDetailsModal
        isOpen={!!viewingOrder}
        onClose={() => setViewingOrder(null)}
        order={viewingOrder}
        onViewInvoice={(o) => setInvoicingOrder(o)}
        onRefund={(o) => setRefundingOrder(o)}
      />
    </PageContainer>
  );
};

export default OrdersPage;
