import crypto from 'crypto';
import * as XLSX from 'xlsx';
import Order from '../models/order.model.js';
import Subscriber from '../models/subscriber.model.js';
import Subscription from '../models/subscription.model.js';
import Plan from '../models/plan.model.js';
import { escapeRegex } from '../middlewares/security.middleware.js';

export const orderService = {
  /**
   * Seed realistic commercial orders (Disabled to keep orders 100% dynamic)
   */
  seedDefaultOrders: async () => {
    return;
  },

  /**
   * Aggregate KPI Financial Metrics
   */
  getOrderStats: async () => {
    const [
      totalOrders,
      completedOrders,
      failedOrders,
      refundedOrders,
      revenueAgg,
      refundAgg,
    ] = await Promise.all([
      Order.countDocuments(),
      Order.countDocuments({ orderStatus: 'completed' }),
      Order.countDocuments({ orderStatus: 'failed' }),
      Order.countDocuments({ orderStatus: 'refunded' }),
      Order.aggregate([
        { $match: { orderStatus: 'completed' } },
        { $group: { _id: null, totalGross: { $sum: '$pricing.totalAmount' } } },
      ]),
      Order.aggregate([
        { $match: { orderStatus: 'refunded' } },
        { $group: { _id: null, totalRefunded: { $sum: '$refund.refundAmount' } } },
      ]),
    ]);

    const totalRevenueINR = revenueAgg[0]?.totalGross || 0;
    const totalRefundsINR = refundAgg[0]?.totalRefunded || 0;
    const averageOrderValueINR =
      completedOrders > 0 ? Math.round(totalRevenueINR / completedOrders) : 0;

    return {
      totalOrders,
      completedOrders,
      failedOrders,
      refundedOrders,
      totalRevenueINR,
      totalRefundsINR,
      averageOrderValueINR,
    };
  },

  /**
   * List, Search, and Filter Orders
   */
  getOrdersList: async ({
    search = '',
    orderStatus = 'all',
    paymentStatus = 'all',
    planCode = 'all',
    userType = 'all',
    paymentMethod = 'all',
    startDate,
    endDate,
    page = 1,
    limit = 10,
    sortBy = 'createdAt',
    sortOrder = 'desc',
  }) => {
    const query = {};

    if (search && search.trim()) {
      const safeSearch = escapeRegex(search.trim());
      const searchRegex = new RegExp(safeSearch, 'i');
      query.$or = [
        { orderNumber: searchRegex },
        { invoiceNumber: searchRegex },
        { userName: searchRegex },
        { userEmail: searchRegex },
        { planName: searchRegex },
        { 'payment.gatewayTransactionId': searchRegex },
      ];
    }

    if (orderStatus && orderStatus !== 'all') {
      query.orderStatus = orderStatus;
    }

    if (paymentStatus && paymentStatus !== 'all') {
      query['payment.status'] = paymentStatus;
    }

    if (planCode && planCode !== 'all') {
      query.planCode = planCode.toUpperCase();
    }

    if (userType && userType !== 'all') {
      query.userType = userType;
    }

    if (paymentMethod && paymentMethod !== 'all') {
      query['payment.paymentMethod'] = paymentMethod;
    }

    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(new Date(endDate).setHours(23, 59, 59, 999));
    }

    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1;

    const pageNumber = Math.max(1, parseInt(page, 10));
    const pageSize = Math.max(1, Math.min(100, parseInt(limit, 10)));
    const skip = (pageNumber - 1) * pageSize;

    const [orders, total] = await Promise.all([
      Order.find(query)
        .sort(sortOptions)
        .skip(skip)
        .limit(pageSize)
        .populate('user', 'name email phone registrationNo apaarId gstin')
        .populate('subscription', 'subscriptionId startDate endDate status')
        .lean(),
      Order.countDocuments(query),
    ]);

    return {
      orders,
      pagination: {
        total,
        page: pageNumber,
        limit: pageSize,
        totalPages: Math.ceil(total / pageSize) || 1,
      },
    };
  },

  /**
   * Get Single Order Details by ID
   */
  getOrderById: async (id) => {
    const order = await Order.findById(id)
      .populate('user', 'name email phone registrationNo registrationState apaarId gstin pan designation')
      .populate('subscription')
      .populate('refund.refundedBy', 'name email role');

    if (!order) throw new Error('Order not found');
    return order;
  },

  /**
   * Process Full or Partial Refund
   */
  processRefund: async (id, { refundAmount, reason }, adminUser) => {
    const order = await Order.findById(id);
    if (!order) throw new Error('Order not found');

    if (order.orderStatus === 'refunded') {
      throw new Error('This order has already been fully refunded.');
    }

    if (order.payment.status !== 'paid') {
      throw new Error('Only successfully paid orders can be refunded.');
    }

    const amountToRefund = Number(refundAmount) || order.pricing.totalAmount;
    if (amountToRefund <= 0 || amountToRefund > order.pricing.totalAmount) {
      throw new Error(`Refund amount must be between ₹1 and ₹${order.pricing.totalAmount}.`);
    }

    const randomSuffix = crypto.randomBytes(3).toString('hex').toUpperCase();
    const refundTxnId = `REF-${new Date().getFullYear()}-${randomSuffix}`;

    order.orderStatus = 'refunded';
    order.payment.status = 'refunded';
    order.refund = {
      isRefunded: true,
      refundAmount: amountToRefund,
      refundReason: reason || 'Administrative concession / refund',
      refundTransactionId: refundTxnId,
      refundedAt: new Date(),
      refundedBy: adminUser?._id || null,
    };

    order.auditTimeline.push({
      action: 'Refund Issued & Processed',
      performedBy: adminUser?.name || 'Administrator',
      timestamp: new Date(),
      note: `Refund of ₹${amountToRefund.toLocaleString('en-IN')} authorized. Ref: ${refundTxnId}. Reason: ${reason || 'N/A'}`,
      previousStatus: 'completed',
      newStatus: 'refunded',
    });

    await order.save();

    // If order was linked to an active subscription, deactivate it
    if (order.subscription) {
      const sub = await Subscription.findById(order.subscription);
      if (sub && sub.status === 'active') {
        sub.status = 'cancelled';
        sub.timeline.push({
          action: 'CANCELLED_DUE_TO_REFUND',
          statusFrom: 'active',
          statusTo: 'cancelled',
          performedBy: adminUser?.name || 'Admin',
          reason: `Associated Order ${order.orderNumber} was refunded.`,
          timestamp: new Date(),
        });
        await sub.save();
      }
    }

    return order;
  },

  /**
   * Export Filtered Orders to Excel Workbook (.xlsx)
   */
  exportOrdersExcel: async (filters = {}) => {
    const { orders } = await orderService.getOrdersList({
      ...filters,
      limit: 5000,
    });

    const headers = [
      'Order Number',
      'Invoice Number',
      'Subscriber Name',
      'Subscriber Email',
      'User Type',
      'Plan Name',
      'Plan Code',
      'Tier',
      'Base Price (INR)',
      'Discount Concession (INR)',
      '18% GST (INR)',
      'Total Amount (INR)',
      'Order Status',
      'Payment Status',
      'Payment Gateway',
      'Payment Mode',
      'Gateway Transaction ID',
      'Paid At',
      'Is Refunded',
      'Refund Amount (INR)',
      'Order Created At',
    ];

    const rows = orders.map((o) => [
      o.orderNumber,
      o.invoiceNumber,
      o.userName,
      o.userEmail,
      o.userType,
      o.planName,
      o.planCode,
      o.tier,
      o.pricing?.baseAmount || 0,
      o.pricing?.discountAmount || 0,
      o.pricing?.taxAmount || 0,
      o.pricing?.totalAmount || 0,
      o.orderStatus?.toUpperCase(),
      o.payment?.status?.toUpperCase(),
      o.payment?.gateway,
      o.payment?.paymentMethod,
      o.payment?.gatewayTransactionId || 'N/A',
      o.payment?.paidAt ? new Date(o.payment.paidAt).toLocaleString('en-IN') : 'N/A',
      o.refund?.isRefunded ? 'YES' : 'NO',
      o.refund?.refundAmount || 0,
      new Date(o.createdAt).toLocaleString('en-IN'),
    ]);

    const worksheet = XLSX.utils.aoa_to_sheet([headers, ...rows]);
    worksheet['!cols'] = [
      { wch: 18 }, { wch: 18 }, { wch: 22 }, { wch: 26 }, { wch: 14 },
      { wch: 32 }, { wch: 18 }, { wch: 14 }, { wch: 16 }, { wch: 16 },
      { wch: 16 }, { wch: 18 }, { wch: 14 }, { wch: 14 }, { wch: 16 },
      { wch: 14 }, { wch: 24 }, { wch: 20 }, { wch: 12 }, { wch: 16 },
      { wch: 20 },
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Commercial Orders');

    return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
  },
};

export default orderService;
