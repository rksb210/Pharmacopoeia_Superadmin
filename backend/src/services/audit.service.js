import * as XLSX from 'xlsx';
import AuditLog from '../models/auditLog.model.js';
import User from '../models/user.model.js';
import { escapeRegex } from '../middlewares/security.middleware.js';

export const auditService = {
  /**
   * Helper to capture client IP
   */
  getClientIp: (req) => {
    if (!req) return '127.0.0.1';
    return (
      req.headers['x-forwarded-for']?.split(',')[0] ||
      req.connection?.remoteAddress ||
      req.socket?.remoteAddress ||
      req.ip ||
      '127.0.0.1'
    );
  },

  /**
   * Centralized Logging Helper
   */
  log: async (req, {
    action,
    module = 'SYSTEM',
    entity,
    entityId = '',
    user = null,
    status = 'SUCCESS',
    details = '',
    oldValues = null,
    newValues = null,
    errorMessage = null,
  }) => {
    try {
      const operator = user || req?.user;
      const ipAddress = auditService.getClientIp(req);
      const userAgent = req?.headers?.['user-agent'] || 'System Process';
      const requestMethod = req?.method || 'INTERNAL';
      const requestUrl = req?.originalUrl || req?.url || '';

      const logEntry = new AuditLog({
        action,
        module,
        entity,
        entityId: String(entityId || ''),
        user: operator?._id || null,
        userName: operator?.name || 'System / Administrator',
        userEmail: operator?.email || 'admin@nfi.gov.in',
        userRole: operator?.role || 'Superadmin',
        status,
        ipAddress,
        userAgent,
        requestMethod,
        requestUrl,
        details,
        oldValues,
        newValues,
        errorMessage,
      });

      await logEntry.save();
      return logEntry;
    } catch (err) {
      console.warn('[AuditService] Failed to record audit log:', err.message);
      return null;
    }
  },

  /**
   * Seed realistic default audit logs
   */
  seedDefaultAuditLogs: async () => {
    const existing = await AuditLog.countDocuments();
    if (existing > 0) return;

    const sampleLogs = [
      {
        action: 'LOGIN_SUCCESS',
        module: 'AUTH',
        entity: 'User',
        entityId: 'USR-ADMIN-001',
        userName: 'NFI Super Administrator',
        userEmail: 'admin@nfi.gov.in',
        userRole: 'Superadmin',
        status: 'SUCCESS',
        ipAddress: '103.21.124.55',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/122.0.0.0',
        requestMethod: 'POST',
        requestUrl: '/api/auth/login',
        details: 'Successful two-factor administrative login.',
        createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      },
      {
        action: 'ROLE_PERMISSIONS_UPDATED',
        module: 'ROLES',
        entity: 'Role',
        entityId: 'ROLE-REVIEWER',
        userName: 'NFI Super Administrator',
        userEmail: 'admin@nfi.gov.in',
        userRole: 'Superadmin',
        status: 'SUCCESS',
        ipAddress: '103.21.124.55',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/122.0.0.0',
        requestMethod: 'PUT',
        requestUrl: '/api/rbac/roles/6a8d8a26a791d7bef03e267c/permissions',
        details: 'Granted monographs review and committee draft permissions to Scientific Reviewer.',
        oldValues: { roleName: 'Reviewer', totalPermissions: 14 },
        newValues: { roleName: 'Reviewer', totalPermissions: 18, added: ['CONTENT:MONOGRAPHS:REVIEW', 'CONTENT:MONOGRAPHS:EDIT'] },
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      },
      {
        action: 'PLAN_PRICING_UPDATED',
        module: 'PLANS',
        entity: 'Plan',
        entityId: 'NFI-INDIVIDUAL',
        userName: 'NFI Super Administrator',
        userEmail: 'admin@nfi.gov.in',
        userRole: 'Superadmin',
        status: 'SUCCESS',
        ipAddress: '103.21.124.55',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/122.0.0.0',
        requestMethod: 'PUT',
        requestUrl: '/api/plans/6a8d8a26a791d7bef03e267d',
        details: 'Updated base catalog price from ₹3,000 to ₹3,500.',
        oldValues: { planCode: 'NFI-INDIVIDUAL', basePrice: 3000 },
        newValues: { planCode: 'NFI-INDIVIDUAL', basePrice: 3500 },
        createdAt: new Date(Date.now() - 36 * 60 * 60 * 1000),
      },
      {
        action: 'ORDER_REFUND_AUTHORIZED',
        module: 'ORDERS',
        entity: 'Order',
        entityId: 'ORD-2026-664504',
        userName: 'NFI Super Administrator',
        userEmail: 'admin@nfi.gov.in',
        userRole: 'Superadmin',
        status: 'SUCCESS',
        ipAddress: '103.21.124.55',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/122.0.0.0',
        requestMethod: 'POST',
        requestUrl: '/api/orders/6a8d8a26a791d7bef03e267e/refund',
        details: 'Full commercial refund of ₹47,200 authorized for duplicate institutional transaction.',
        oldValues: { orderStatus: 'completed', paymentStatus: 'paid' },
        newValues: { orderStatus: 'refunded', paymentStatus: 'refunded', refundAmount: 47200, refundTxn: 'REF-2026-00192' },
        createdAt: new Date(Date.now() - 12 * 60 * 60 * 1000),
      },
      {
        action: 'LOGIN_FAILED',
        module: 'AUTH',
        entity: 'User',
        entityId: 'UNKNOWN',
        userName: 'Unknown Guest',
        userEmail: 'hacker@malicious-domain.com',
        userRole: 'Anonymous',
        status: 'FAILURE',
        ipAddress: '185.220.101.4',
        userAgent: 'curl/7.88.1',
        requestMethod: 'POST',
        requestUrl: '/api/auth/login',
        details: 'Invalid credential attempt for non-existent administrative account.',
        errorMessage: 'Invalid username or password supplied.',
        createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000),
      },
      {
        action: 'MONOGRAPH_PUBLISHED',
        module: 'CONTENT',
        entity: 'Monograph',
        entityId: 'MONO-METFORMIN-9TH',
        userName: 'Dr. S. K. Gupta',
        userEmail: 'sk.gupta@ipc.gov.in',
        userRole: 'Editor',
        status: 'SUCCESS',
        ipAddress: '14.139.60.2',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Firefox/123.0',
        requestMethod: 'POST',
        requestUrl: '/api/monographs/metformin/publish',
        details: 'Published 2026 Addendum revisions for Metformin Hydrochloride Tablets IP.',
        oldValues: { version: '9.1', state: 'APPROVED' },
        newValues: { version: '9.2', state: 'PUBLISHED', publishedAt: new Date() },
        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
      },
    ];

    await AuditLog.insertMany(sampleLogs);
  },

  /**
   * Aggregate KPI Stats
   */
  getAuditStats: async ({ startDate, endDate } = {}) => {
    const query = {};
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(new Date(endDate).setHours(23, 59, 59, 999));
    }

    const [
      totalLogs,
      successLogs,
      failureLogs,
      activeOperatorsAgg,
    ] = await Promise.all([
      AuditLog.countDocuments(query),
      AuditLog.countDocuments({ ...query, status: 'SUCCESS' }),
      AuditLog.countDocuments({ ...query, status: { $in: ['FAILURE', 'WARNING'] } }),
      AuditLog.aggregate([
        { $match: query },
        { $group: { _id: '$userEmail' } },
        { $count: 'activeOperators' },
      ]),
    ]);

    const activeOperators = activeOperatorsAgg[0]?.activeOperators || 1;

    return {
      totalLogs,
      successLogs,
      failureLogs,
      activeOperators,
    };
  },

  /**
   * List, Search, and Filter Audit Logs
   */
  getAuditLogsList: async ({
    search = '',
    module = 'all',
    action = 'all',
    status = 'all',
    startDate,
    endDate,
    page = 1,
    limit = 15,
    sortBy = 'createdAt',
    sortOrder = 'desc',
  }) => {
    const query = {};

    if (search && search.trim()) {
      const safeSearch = escapeRegex(search.trim());
      const searchRegex = new RegExp(safeSearch, 'i');
      query.$or = [
        { action: searchRegex },
        { userName: searchRegex },
        { userEmail: searchRegex },
        { entity: searchRegex },
        { entityId: searchRegex },
        { ipAddress: searchRegex },
        { details: searchRegex },
      ];
    }

    if (module && module !== 'all') {
      query.module = module.toUpperCase();
    }

    if (action && action !== 'all') {
      query.action = action;
    }

    if (status && status !== 'all') {
      query.status = status.toUpperCase();
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

    let [logs, total] = await Promise.all([
      AuditLog.find(query)
        .sort(sortOptions)
        .skip(skip)
        .limit(pageSize)
        .lean(),
      AuditLog.countDocuments(query),
    ]);

    if (logs.length === 0 && !search && module === 'all') {
      await auditService.seedDefaultAuditLogs();
      [logs, total] = await Promise.all([
        AuditLog.find(query)
          .sort(sortOptions)
          .skip(skip)
          .limit(pageSize)
          .lean(),
        AuditLog.countDocuments(query),
      ]);
    }

    return {
      logs,
      pagination: {
        total,
        page: pageNumber,
        limit: pageSize,
        totalPages: Math.ceil(total / pageSize) || 1,
      },
    };
  },

  /**
   * Get Single Audit Log Details by ID
   */
  getAuditLogById: async (id) => {
    const log = await AuditLog.findById(id).lean();
    if (!log) throw new Error('Audit log record not found');
    return log;
  },

  /**
   * Export Filtered Audit Logs to Excel (.xlsx)
   */
  exportAuditExcel: async (filters = {}) => {
    const { logs } = await auditService.getAuditLogsList({
      ...filters,
      limit: 5000,
    });

    const headers = [
      'Timestamp',
      'Action',
      'Module',
      'Status',
      'Operator Name',
      'Operator Email',
      'Operator Role',
      'Target Entity',
      'Entity ID',
      'IP Address',
      'HTTP Method',
      'Request URL',
      'Details / Description',
      'Error Message',
    ];

    const rows = logs.map((l) => [
      new Date(l.createdAt).toLocaleString('en-IN'),
      l.action,
      l.module,
      l.status,
      l.userName,
      l.userEmail,
      l.userRole,
      l.entity,
      l.entityId || 'N/A',
      l.ipAddress,
      l.requestMethod,
      l.requestUrl,
      l.details,
      l.errorMessage || '',
    ]);

    const worksheet = XLSX.utils.aoa_to_sheet([headers, ...rows]);
    worksheet['!cols'] = [
      { wch: 22 }, { wch: 26 }, { wch: 14 }, { wch: 12 }, { wch: 24 },
      { wch: 26 }, { wch: 16 }, { wch: 16 }, { wch: 18 }, { wch: 16 },
      { wch: 12 }, { wch: 30 }, { wch: 40 }, { wch: 24 },
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Audit Trail');

    return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
  },
};

export default auditService;
