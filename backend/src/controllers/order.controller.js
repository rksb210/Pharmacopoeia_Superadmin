import orderService from '../services/order.service.js';

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
