import orderService from '../services/order.service.js';
import { auditService } from '../services/audit.service.js';

export const getOrderStats = async (req, res, next) => {
  try {
    const stats = await orderService.getOrderStats();
    return res.status(200).json({
      success: true,
      stats,
    });
  } catch (error) {
    next(error);
  }
};

export const getOrdersList = async (req, res, next) => {
  try {
    const {
      search,
      orderStatus,
      paymentStatus,
      planCode,
      userType,
      paymentMethod,
      startDate,
      endDate,
      page,
      limit,
      sortBy,
      sortOrder,
    } = req.query;

    const result = await orderService.getOrdersList({
      search,
      orderStatus,
      paymentStatus,
      planCode,
      userType,
      paymentMethod,
      startDate,
      endDate,
      page,
      limit,
      sortBy,
      sortOrder,
    });

    return res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error) {
    next(error);
  }
};

export const getOrderById = async (req, res, next) => {
  try {
    const order = await orderService.getOrderById(req.params.id);
    return res.status(200).json({
      success: true,
      order,
    });
  } catch (error) {
    next(error);
  }
};

export const processRefund = async (req, res) => {
  try {
    const { refundAmount, reason } = req.body;
    const refundedOrder = await orderService.processRefund(
      req.params.id,
      { refundAmount, reason },
      req.user
    );

    await auditService.log(req, {
      action: 'ORDER_REFUND_PROCESSED',
      module: 'ORDERS',
      entity: 'Order',
      entityId: refundedOrder.orderNumber || refundedOrder._id,
      status: 'WARNING',
      details: `Authorized financial refund of ₹${refundAmount} on Order #${refundedOrder.orderNumber || refundedOrder._id}. Reason: ${reason || 'Customer refund'}.`,
      newValues: {
        orderStatus: refundedOrder.orderStatus,
        paymentStatus: refundedOrder.paymentStatus,
        refundAmount,
      },
    });

    return res.status(200).json({
      success: true,
      message: 'Refund authorized and processed successfully.',
      order: refundedOrder,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

export const exportOrders = async (req, res, next) => {
  try {
    const {
      search,
      orderStatus,
      paymentStatus,
      planCode,
      userType,
      paymentMethod,
      startDate,
      endDate,
    } = req.query;

    const excelBuffer = await orderService.exportOrdersExcel({
      search,
      orderStatus,
      paymentStatus,
      planCode,
      userType,
      paymentMethod,
      startDate,
      endDate,
    });

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="NFI_Orders_Ledger_${new Date().toISOString().split('T')[0]}.xlsx"`
    );
    return res.send(excelBuffer);
  } catch (error) {
    next(error);
  }
};
