import crypto from 'crypto';
import * as XLSX from 'xlsx';
import Order from '../models/order.model.js';
import Subscriber from '../models/subscriber.model.js';
import Subscription from '../models/subscription.model.js';
import Plan from '../models/plan.model.js';

export const orderService = {
  /**
   * Seed realistic commercial orders across all transaction states
   */
  seedDefaultOrders: async () => {
    const existingOrders = await Order.countDocuments();
    if (existingOrders > 0) return;

    const [subscribers, plans] = await Promise.all([
      Subscriber.find().limit(5).lean(),
      Plan.find().limit(5).lean(),
    ]);

    if (subscribers.length === 0) return;

    const defaultOrders = [
      {
        orderNumber: 'ORD-2026-901241',
        invoiceNumber: 'INV-2026-004121',
        user: subscribers[0]._id,
        userName: subscribers[0].name,
        userEmail: subscribers[0].email,
        userType: subscribers[0].userType || 'DOCTOR',
        planName: 'Individual Practitioner Annual Pass',
        planCode: 'NFI-INDIVIDUAL',
        tier: 'INDIVIDUAL',
        pricing: {
          baseAmount: 3500,
          discountAmount: 500,
          couponCode: 'MED-SPECIAL',
          taxRatePercent: 18,
          taxAmount: 540,
          totalAmount: 3540,
          currency: 'INR',
        },
        orderStatus: 'completed',
        payment: {
          status: 'paid',
          gateway: 'Razorpay',
          gatewayTransactionId: 'pay_Nsf910284Kla',
          paymentMethod: 'UPI',
          paidAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
          gatewaySignature: 'hmac_sha256_verified_sig_99120',
        },
        clientIp: '103.21.124.55',
        auditTimeline: [
          {
            action: 'Checkout Initiated',
            performedBy: 'Subscriber',
            timestamp: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
            note: 'Initiated checkout via Razorpay Gateway',
            previousStatus: null,
            newStatus: 'processing',
          },
          {
            action: 'Payment Captured & Verified',
            performedBy: 'Razorpay Webhook (Server)',
            timestamp: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
            note: 'Captured ₹3,540 via UPI transaction pay_Nsf910284Kla',
            previousStatus: 'processing',
            newStatus: 'completed',
          },
        ],
      },
      {
        orderNumber: 'ORD-2026-881202',
        invoiceNumber: 'INV-2026-004122',
        user: subscribers[1]?._id || subscribers[0]._id,
        userName: subscribers[1]?.name || 'Dr. Kavita Nair',
        userEmail: subscribers[1]?.email || 'kavita.nair@aiims.edu',
        userType: 'STUDENT',
        planName: 'Academic Scholar Formulary Pass',
        planCode: 'NFI-STUDENT-SPECIAL',
        tier: 'STUDENT',
        pricing: {
          baseAmount: 1200,
          discountAmount: 200,
          couponCode: 'CAMPUS-2026',
          taxRatePercent: 18,
          taxAmount: 180,
          totalAmount: 1180,
          currency: 'INR',
        },
        orderStatus: 'completed',
        payment: {
          status: 'paid',
          gateway: 'BillDesk',
          gatewayTransactionId: 'bd_txn_882019234',
          paymentMethod: 'Credit_Card',
          paidAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
          gatewaySignature: 'billdesk_verified_sig_88201',
        },
        clientIp: '49.36.18.92',
        auditTimeline: [
          {
            action: 'Checkout Initiated',
            performedBy: 'Subscriber',
            timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
            note: 'Initiated checkout via BillDesk Gateway',
            previousStatus: null,
            newStatus: 'processing',
          },
          {
            action: 'Payment Captured',
            performedBy: 'BillDesk Server Webhook',
            timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
            note: 'Card transaction authorized',
            previousStatus: 'processing',
            newStatus: 'completed',
          },
        ],
      },
      {
        orderNumber: 'ORD-2026-773403',
        invoiceNumber: 'INV-2026-004123',
        user: subscribers[0]._id,
        userName: subscribers[0].name,
        userEmail: subscribers[0].email,
        userType: subscribers[0].userType || 'DOCTOR',
        planName: 'Clinical Specialist Edition',
        planCode: 'NFI-CLINICAL-SPECIALIST',
        tier: 'INDIVIDUAL',
        pricing: {
          baseAmount: 6000,
          discountAmount: 0,
          couponCode: '',
          taxRatePercent: 18,
          taxAmount: 1080,
          totalAmount: 7080,
          currency: 'INR',
        },
        orderStatus: 'failed',
        payment: {
          status: 'failed',
          gateway: 'Razorpay',
          gatewayTransactionId: 'pay_failed_9921014a',
          paymentMethod: 'Debit_Card',
          failureReason: 'Card issuer 3D-Secure authentication timed out',
          failureCode: 'GATEWAY_TIMEOUT_3DS',
        },
        clientIp: '14.139.60.2',
        auditTimeline: [
          {
            action: 'Checkout Initiated',
            performedBy: 'Subscriber',
            timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
            note: 'Order initiated for Clinical Specialist pass',
            previousStatus: null,
            newStatus: 'processing',
          },
          {
            action: 'Payment Failed',
            performedBy: 'Razorpay Gateway',
            timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
            note: 'Failure: Card issuer 3D-Secure authentication timed out',
            previousStatus: 'processing',
            newStatus: 'failed',
          },
        ],
      },
      {
        orderNumber: 'ORD-2026-664504',
        invoiceNumber: 'INV-2026-004124',
        user: subscribers[0]._id,
        userName: subscribers[0].name,
        userEmail: subscribers[0].email,
        userType: 'INDUSTRY',
        planName: 'Institutional Campus License (50 Seats)',
        planCode: 'NFI-INSTITUTIONAL',
        tier: 'INSTITUTIONAL',
        pricing: {
          baseAmount: 45000,
          discountAmount: 5000,
          couponCode: 'INST-VIP',
          taxRatePercent: 18,
          taxAmount: 7200,
          totalAmount: 47200,
          currency: 'INR',
        },
        orderStatus: 'refunded',
        payment: {
          status: 'refunded',
          gateway: 'NEFT_RTGS',
          gatewayTransactionId: 'neft_utr_9920194812',
          paymentMethod: 'NEFT_RTGS',
          paidAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
        },
        refund: {
          isRefunded: true,
          refundAmount: 47200,
          refundReason: 'Accidental duplicate institutional subscription purchase',
          refundTransactionId: 'ref_neft_utr_00192841',
          refundedAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000),
        },
        clientIp: '103.21.124.55',
        auditTimeline: [
          {
            action: 'Bank NEFT Payment Received',
            performedBy: 'Treasury Officer',
            timestamp: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
            note: 'NEFT verified and pass assigned',
            previousStatus: null,
            newStatus: 'completed',
          },
          {
            action: 'Full Refund Processed',
            performedBy: 'Superadmin',
            timestamp: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000),
            note: 'Refund of ₹47,200 issued due to duplicate institutional purchase',
            previousStatus: 'completed',
            newStatus: 'refunded',
          },
        ],
      },
    ];

    for (const ord of defaultOrders) {
      await Order.findOneAndUpdate({ orderNumber: ord.orderNumber }, ord, {
        upsert: true,
        new: true,
      });
    }
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
      const searchRegex = new RegExp(search.trim(), 'i');
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

    let [orders, total] = await Promise.all([
      Order.find(query)
        .sort(sortOptions)
        .skip(skip)
        .limit(pageSize)
        .populate('user', 'name email phone registrationNo apaarId gstin')
        .populate('subscription', 'subscriptionId startDate endDate status')
        .lean(),
      Order.countDocuments(query),
    ]);

    if (orders.length === 0 && !search && orderStatus === 'all') {
      await orderService.seedDefaultOrders();
      [orders, total] = await Promise.all([
        Order.find(query)
          .sort(sortOptions)
          .skip(skip)
          .limit(pageSize)
          .populate('user', 'name email phone registrationNo apaarId gstin')
          .populate('subscription', 'subscriptionId startDate endDate status')
          .lean(),
        Order.countDocuments(query),
      ]);
    }

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
