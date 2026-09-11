import mongoose from 'mongoose';
import BulkImport from '../models/bulkImport.model.js';
import Subscriber from '../models/subscriber.model.js';
import { escapeRegex } from '../middlewares/security.middleware.js';
import * as XLSX from 'xlsx';

export const institutionalSubscriptionService = {
  /**
   * 1. Top Metric Counters (KPI Dashboard)
   */
  getInstitutionalStats: async () => {
    // 1. Total Enrolled Seats
    // Count all active or provisioned subscribers enrolled under an institution / bulk batch
    const [
      cohortSubscriberCount,
      allSubscribersInBatches,
      batchesAgg,
    ] = await Promise.all([
      // Subscribers tagged directly with parentInstitutionId or batchReference or institutionName
      Subscriber.countDocuments({
        $or: [
          { parentInstitutionId: { $ne: null } },
          { batchReference: { $exists: true, $ne: null, $ne: '' } },
          { userType: { $in: ['UNIVERSITIES_COLLEGES', 'INDUSTRY'] } },
        ],
      }),

      // Aggregate valid seats recorded in completed or active bulk import jobs
      BulkImport.aggregate([
        {
          $group: {
            _id: null,
            totalEnrolledInJobs: { $sum: { $ifNull: ['$validCount', '$validRows', 0] } },
            totalInvoiced: {
              $sum: {
                $ifNull: [
                  '$consolidatedInvoice.finalAmountINR',
                  '$invoice.totalAmount',
                  0,
                ],
              },
            },
          },
        },
      ]),

      // Aggregate breakdown by University vs Industry
      BulkImport.aggregate([
        {
          $group: {
            _id: {
              $cond: [
                {
                  $or: [
                    { $eq: ['$userType', 'UNIVERSITIES_COLLEGES'] },
                    { $regexMatch: { input: { $ifNull: ['$institutionName', ''] }, regex: /university|college|institute|academy|campus|school/i } },
                  ],
                },
                'UNIVERSITIES_COLLEGES',
                'INDUSTRY',
              ],
            },
            batchCount: { $sum: 1 },
            seatsCount: { $sum: { $ifNull: ['$validCount', '$validRows', 0] } },
          },
        },
      ]),
    ]);

    const statsOverview = batchesAgg.reduce(
      (acc, curr) => {
        if (curr._id === 'UNIVERSITIES_COLLEGES') {
          acc.universityBatches = curr.batchCount;
          acc.universitySeats = curr.seatsCount;
        } else {
          acc.industryBatches = curr.batchCount;
          acc.industrySeats = curr.seatsCount;
        }
        return acc;
      },
      { universityBatches: 0, universitySeats: 0, industryBatches: 0, industrySeats: 0 }
    );

    const totalInvoiced = allSubscribersInBatches[0]?.totalInvoiced || 0;
    const totalEnrolledSeats = Math.max(
      cohortSubscriberCount,
      allSubscribersInBatches[0]?.totalEnrolledInJobs || 0
    );

    return {
      totalEnrolledSeats,
      universityBatches: statsOverview.universityBatches,
      universitySeats: statsOverview.universitySeats,
      industryBatches: statsOverview.industryBatches,
      industrySeats: statsOverview.industrySeats,
      totalInvoicedVolume: totalInvoiced,
    };
  },

  /**
   * 2. Segmented Batch Ledger (Universities vs Industry)
   */
  getBatchesLedger: async ({
    page = 1,
    limit = 10,
    search = '',
    stakeholderType = 'ALL', // 'ALL' | 'UNIVERSITIES_COLLEGES' | 'INDUSTRY'
    status = '',
    dateFrom = '',
    dateTo = '',
  }) => {
    const query = {};

    // Search query
    if (search && search.trim()) {
      const safe = escapeRegex(search.trim());
      const regex = new RegExp(safe, 'i');
      query.$or = [
        { jobId: regex },
        { batchReference: regex },
        { institutionName: regex },
        { 'coordinator.name': regex },
        { 'coordinator.email': regex },
        { billingContact: regex },
        { 'consolidatedInvoice.invoiceNumber': regex },
        { 'invoice.invoiceNumber': regex },
      ];
    }

    // Stakeholder Type Filter
    if (stakeholderType && stakeholderType !== 'ALL') {
      if (stakeholderType === 'UNIVERSITIES_COLLEGES') {
        query.$or = [
          { userType: 'UNIVERSITIES_COLLEGES' },
          { institutionName: { $regex: /university|college|institute|academy|campus|school/i } },
        ];
      } else if (stakeholderType === 'INDUSTRY') {
        query.$and = [
          { userType: { $ne: 'UNIVERSITIES_COLLEGES' } },
          { institutionName: { $not: { $regex: /university|college|institute|academy|campus|school/i } } },
        ];
      }
    }

    // Status Filter
    if (status && status !== 'ALL') {
      query.status = status.toLowerCase();
    }

    // Date Range Filters
    if (dateFrom || dateTo) {
      query.createdAt = {};
      if (dateFrom) query.createdAt.$gte = new Date(dateFrom);
      if (dateTo) {
        const toDate = new Date(dateTo);
        toDate.setHours(23, 59, 59, 999);
        query.createdAt.$lte = toDate;
      }
    }

    const pageNumber = Math.max(1, parseInt(page, 10));
    const pageSize = Math.max(1, Math.min(100, parseInt(limit, 10)));
    const skip = (pageNumber - 1) * pageSize;

    const [batches, total] = await Promise.all([
      BulkImport.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(pageSize)
        .populate('importedBy', 'name email role')
        .populate('institutionId', 'name email dynamicFields userType')
        .lean(),
      BulkImport.countDocuments(query),
    ]);

    // Format batches for unified consumption
    const formattedBatches = batches.map((b) => {
      const isUniversity =
        b.userType === 'UNIVERSITIES_COLLEGES' ||
        /university|college|institute|academy|campus|school/i.test(b.institutionName || '');

      return {
        _id: b._id,
        batchRef: b.batchReference || b.jobId || `BATCH-${b._id}`,
        jobId: b.jobId || b.batchReference,
        createdAt: b.createdAt,
        institutionName: b.institutionName || b.institutionId?.dynamicFields?.universityCollegeName || b.institutionId?.dynamicFields?.companyName || 'Institutional Partner',
        institutionId: b.institutionId?._id || b.institutionId || null,
        userType: isUniversity ? 'UNIVERSITIES_COLLEGES' : 'INDUSTRY',
        stakeholderLabel: isUniversity ? 'Academic / University' : 'Industry / Corporate',
        coordinator: {
          name: b.coordinator?.name || b.billingContact || b.importedBy?.name || 'Authorized Coordinator',
          email: b.coordinator?.email || b.importedBy?.email || '',
          phone: b.coordinator?.phone || '',
        },
        totalRows: b.totalRows || b.records?.length || 0,
        validSeats: b.validCount ?? b.validRows ?? (b.records?.filter((r) => r.status === 'valid' || r.status === 'imported' || r.status === 'ENROLLED')?.length || 0),
        failedRows: b.invalidCount ?? b.failedRows ?? (b.records?.filter((r) => r.status === 'invalid' || r.status === 'failed' || r.status === 'INVALID' || r.status === 'FAILED')?.length || 0),
        invoice: {
          invoiceNumber: b.consolidatedInvoice?.invoiceNumber || b.invoice?.invoiceNumber || `INV-${(b.jobId || b._id).toString().slice(-6).toUpperCase()}`,
          invoiceDate: b.consolidatedInvoice?.generatedAt || b.invoice?.invoiceDate || b.createdAt,
          subtotal: b.consolidatedInvoice?.subtotalINR || b.invoice?.subtotal || 0,
          taxAmount: b.consolidatedInvoice?.taxAmountINR || b.invoice?.taxAmount || 0,
          totalAmount: b.consolidatedInvoice?.finalAmountINR || b.invoice?.totalAmount || 0,
          status: (b.consolidatedInvoice?.paymentStatus || b.invoice?.status || 'PAID').toUpperCase(),
          paymentMethod: b.consolidatedInvoice?.paymentMethod || 'Institutional Invoice / NEFT',
          unitPriceINR: b.consolidatedInvoice?.unitPriceINR || (b.consolidatedInvoice?.subtotalINR ? Math.round(b.consolidatedInvoice.subtotalINR / (b.validCount || 1)) : 3500),
        },
        plan: {
          code: b.planCode || 'NFI-INSTITUTIONAL',
          name: b.planName || 'Institutional Universal Access Pass',
          tier: b.tier || 'Institutional',
        },
        status: (b.status || 'COMPLETED').toUpperCase(),
        recordsCount: b.records?.length || 0,
      };
    });

    return {
      batches: formattedBatches,
      pagination: {
        total,
        page: pageNumber,
        limit: pageSize,
        totalPages: Math.ceil(total / pageSize) || 1,
      },
    };
  },

  /**
   * 3. Batch Member Roster Modal (Deep Inspection)
   */
  getBatchRoster: async (batchId) => {
    const isObjectId = mongoose.isValidObjectId(batchId);
    const query = isObjectId ? { $or: [{ _id: batchId }, { jobId: batchId }, { batchReference: batchId }] } : { $or: [{ jobId: batchId }, { batchReference: batchId }] };

    const batch = await BulkImport.findOne(query)
      .populate('importedBy', 'name email role')
      .populate('institutionId', 'name email dynamicFields userType')
      .lean();

    if (!batch) {
      throw new Error('Batch cohort record not found');
    }

    // Attempt to enrich records with live Subscriber database account info if available
    const records = (batch.records || []).map((rec, idx) => ({
      rowNumber: rec.rowNumber || idx + 1,
      name: rec.name || 'Member',
      email: rec.email || '—',
      phone: rec.phoneNumber || rec.phone || '—',
      userType: rec.userType || batch.userType || 'STUDENT',
      roleOrCategory: rec.roleOrCategory || rec.dynamicFields?.designation || rec.userType || 'Member',
      rollOrEmployeeId: rec.rollOrEmployeeId || rec.dynamicFields?.apaarId || rec.dynamicFields?.registrationNo || '—',
      department: rec.department || rec.dynamicFields?.department || 'General',
      status: (rec.status || 'ENROLLED').toUpperCase(),
      subscriptionId: rec.subscriptionId || '—',
      userId: rec.userId || rec.createdSubscriberId || null,
      remarks: rec.remarks || (rec.errors?.length ? rec.errors.join('; ') : 'Active license provisioned'),
    }));

    const isUniversity =
      batch.userType === 'UNIVERSITIES_COLLEGES' ||
      /university|college|institute|academy|campus|school/i.test(batch.institutionName || '');

    return {
      batchMetadata: {
        _id: batch._id,
        batchRef: batch.batchReference || batch.jobId,
        createdAt: batch.createdAt,
        institutionName: batch.institutionName || 'Institutional Partner',
        userType: isUniversity ? 'UNIVERSITIES_COLLEGES' : 'INDUSTRY',
        stakeholderLabel: isUniversity ? 'Academic / University' : 'Industry / Corporate',
        coordinator: {
          name: batch.coordinator?.name || batch.billingContact || batch.importedBy?.name || 'Coordinator',
          email: batch.coordinator?.email || batch.importedBy?.email || '—',
          phone: batch.coordinator?.phone || '—',
        },
        plan: {
          code: batch.planCode,
          name: batch.planName,
        },
        totalRows: batch.totalRows || records.length,
        validSeats: batch.validCount ?? batch.validRows ?? records.length,
        failedRows: batch.invalidCount ?? batch.failedRows ?? 0,
        invoice: {
          invoiceNumber: batch.consolidatedInvoice?.invoiceNumber || batch.invoice?.invoiceNumber || `INV-${(batch.jobId || batch._id).toString().slice(-6).toUpperCase()}`,
          invoiceDate: batch.consolidatedInvoice?.generatedAt || batch.invoice?.invoiceDate || batch.createdAt,
          subtotal: batch.consolidatedInvoice?.subtotalINR || batch.invoice?.subtotal || 0,
          taxAmount: batch.consolidatedInvoice?.taxAmountINR || batch.invoice?.taxAmount || 0,
          totalAmount: batch.consolidatedInvoice?.finalAmountINR || batch.invoice?.totalAmount || 0,
          status: (batch.consolidatedInvoice?.paymentStatus || batch.invoice?.status || 'PAID').toUpperCase(),
          paymentMethod: batch.consolidatedInvoice?.paymentMethod || 'Institutional Invoice / NEFT',
          unitPriceINR: batch.consolidatedInvoice?.unitPriceINR || (batch.consolidatedInvoice?.subtotalINR ? Math.round(batch.consolidatedInvoice.subtotalINR / (batch.validCount || 1)) : 3500),
        },
      },
      members: records,
    };
  },

  /**
   * 4. Export Batch Roster (.CSV)
   */
  exportBatchRosterCSV: async (batchId) => {
    const { batchMetadata, members } = await institutionalSubscriptionService.getBatchRoster(batchId);

    const headers = [
      '#',
      'Full Name',
      'Email Address',
      'Mobile Phone',
      'Role / Category',
      'Roll No / Employee ID',
      'Department',
      'Subscription Pass ID',
      'Status',
      'Remarks',
    ];

    const rows = members.map((m) => [
      m.rowNumber,
      m.name,
      m.email,
      m.phone,
      m.roleOrCategory,
      m.rollOrEmployeeId,
      m.department,
      m.subscriptionId,
      m.status,
      m.remarks,
    ]);

    const wsData = [
      [`Institution: ${batchMetadata.institutionName}`],
      [`Batch Ref: ${batchMetadata.batchRef}`, `Export Date: ${new Date().toLocaleString()}`],
      [`Coordinator: ${batchMetadata.coordinator.name} (${batchMetadata.coordinator.email})`],
      [],
      headers,
      ...rows,
    ];

    const ws = XLSX.utils.aoa_to_sheet(wsData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Batch_Roster');
    return XLSX.write(wb, { type: 'buffer', bookType: 'csv' });
  },

  /**
   * 5. Global Enrolled Members Directory Tab
   */
  getGlobalEnrolledMembers: async ({
    page = 1,
    limit = 15,
    search = '',
    stakeholderType = 'ALL',
    status = 'ALL',
  }) => {
    const query = {};

    // Search query
    if (search && search.trim()) {
      const safe = escapeRegex(search.trim());
      const regex = new RegExp(safe, 'i');
      query.$or = [
        { name: regex },
        { email: regex },
        { phoneNumber: regex },
        { 'dynamicFields.companyName': regex },
        { 'dynamicFields.universityCollegeName': regex },
        { 'dynamicFields.apaarId': regex },
        { 'dynamicFields.registrationNo': regex },
        { institutionName: regex },
        { batchReference: regex },
      ];
    }

    // Stakeholder Type Filter
    if (stakeholderType && stakeholderType !== 'ALL') {
      if (stakeholderType === 'UNIVERSITIES_COLLEGES') {
        query.userType = { $in: ['UNIVERSITIES_COLLEGES', 'STUDENT'] };
      } else if (stakeholderType === 'INDUSTRY') {
        query.userType = 'INDUSTRY';
      }
    }

    // Active Status Filter
    if (status && status !== 'ALL') {
      query.isActive = status === 'ACTIVE';
    }

    const pageNumber = Math.max(1, parseInt(page, 10));
    const pageSize = Math.max(1, Math.min(100, parseInt(limit, 10)));
    const skip = (pageNumber - 1) * pageSize;

    const [members, total] = await Promise.all([
      Subscriber.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(pageSize)
        .populate('parentInstitutionId', 'name dynamicFields userType')
        .lean(),
      Subscriber.countDocuments(query),
    ]);

    const formattedMembers = members.map((m) => {
      const institutionName =
        m.institutionName ||
        m.parentInstitutionId?.dynamicFields?.universityCollegeName ||
        m.parentInstitutionId?.dynamicFields?.companyName ||
        m.dynamicFields?.universityCollegeName ||
        m.dynamicFields?.companyName ||
        m.dynamicFields?.institution ||
        'Institutional License';

      const isUni =
        m.userType === 'UNIVERSITIES_COLLEGES' ||
        m.userType === 'STUDENT' ||
        /university|college|institute|school|academy/i.test(institutionName);

      return {
        _id: m._id,
        name: m.name,
        email: m.email,
        phoneNumber: m.phoneNumber || '—',
        userType: m.userType,
        stakeholderType: isUni ? 'UNIVERSITIES_COLLEGES' : 'INDUSTRY',
        stakeholderLabel: isUni ? 'Academic / University' : 'Industry / Corporate',
        institutionName,
        rollOrEmployeeId: m.dynamicFields?.apaarId || m.dynamicFields?.registrationNo || m.dynamicFields?.employeeId || '—',
        department: m.dynamicFields?.department || m.dynamicFields?.designation || 'Standard',
        subscriptionStatus: m.subscription?.status || 'none',
        planName: m.subscription?.planName || 'Institutional Formulary Pass',
        isActive: m.isActive,
        batchReference: m.batchReference || 'Direct / Batch',
        createdAt: m.createdAt,
      };
    });

    return {
      members: formattedMembers,
      pagination: {
        total,
        page: pageNumber,
        limit: pageSize,
        totalPages: Math.ceil(total / pageSize) || 1,
      },
    };
  },

  /**
   * 6. Toggle Individual Seat Active / Inactive Status
   */
  toggleMemberSeatStatus: async (subscriberId) => {
    const subscriber = await Subscriber.findById(subscriberId);
    if (!subscriber) {
      throw new Error('Subscriber seat not found');
    }

    subscriber.isActive = !subscriber.isActive;

    // Ensure legacy or user-portal capitalized subscription status does not fail Mongoose validation
    if (subscriber.subscription && subscriber.subscription.status) {
      subscriber.subscription.status = subscriber.subscription.status.toLowerCase();
    }

    await subscriber.save();

    return {
      _id: subscriber._id,
      name: subscriber.name,
      email: subscriber.email,
      isActive: subscriber.isActive,
    };
  },

  /**
   * 7. Institution Master (Summary of all registered Universities & Industries)
   */
  getInstitutionMaster: async ({ search = '', stakeholderType = 'ALL' }) => {
    const match = {
      userType: { $in: ['UNIVERSITIES_COLLEGES', 'INDUSTRY'] },
    };

    if (stakeholderType && stakeholderType !== 'ALL') {
      match.userType = stakeholderType;
    }

    if (search && search.trim()) {
      const safe = escapeRegex(search.trim());
      const regex = new RegExp(safe, 'i');
      match.$or = [
        { name: regex },
        { email: regex },
        { 'dynamicFields.companyName': regex },
        { 'dynamicFields.universityCollegeName': regex },
        { 'dynamicFields.state': regex },
      ];
    }

    const institutions = await Subscriber.find(match)
      .sort({ createdAt: -1 })
      .lean();

    // Map and calculate stats for each institution
    const institutionIds = institutions.map((i) => i._id);

    const [batchCounts, memberCounts] = await Promise.all([
      BulkImport.aggregate([
        { $match: { institutionId: { $in: institutionIds } } },
        {
          $group: {
            _id: '$institutionId',
            batchesCount: { $sum: 1 },
            totalSeats: { $sum: { $ifNull: ['$validCount', '$validRows', 0] } },
            totalVolume: {
              $sum: {
                $ifNull: [
                  '$consolidatedInvoice.finalAmountINR',
                  '$invoice.totalAmount',
                  0,
                ],
              },
            },
          },
        },
      ]),

      Subscriber.aggregate([
        { $match: { parentInstitutionId: { $in: institutionIds } } },
        {
          $group: {
            _id: '$parentInstitutionId',
            activeSeats: {
              $sum: {
                $cond: [{ $eq: ['$isActive', true] }, 1, 0],
              },
            },
            totalSeats: { $sum: 1 },
          },
        },
      ]),
    ]);

    const batchMap = new Map(batchCounts.map((b) => [b._id.toString(), b]));
    const memberMap = new Map(memberCounts.map((m) => [m._id.toString(), m]));

    return institutions.map((inst) => {
      const bInfo = batchMap.get(inst._id.toString()) || { batchesCount: 0, totalSeats: 0, totalVolume: 0 };
      const mInfo = memberMap.get(inst._id.toString()) || { activeSeats: 0, totalSeats: 0 };

      const instName =
        inst.dynamicFields?.universityCollegeName ||
        inst.dynamicFields?.companyName ||
        inst.name;

      const isUni = inst.userType === 'UNIVERSITIES_COLLEGES';

      return {
        _id: inst._id,
        name: instName,
        userType: inst.userType,
        stakeholderLabel: isUni ? 'Academic / University' : 'Industry / Corporate',
        state: inst.dynamicFields?.state || inst.dynamicFields?.registrationState || 'National',
        coordinator: {
          name: inst.name,
          email: inst.email,
          phone: inst.phoneNumber || '—',
        },
        gstinOrPan: inst.dynamicFields?.gstin || inst.dynamicFields?.pan || '—',
        batchesCount: bInfo.batchesCount,
        totalSeatsEnrolled: Math.max(bInfo.totalSeats, mInfo.totalSeats),
        activeSeats: mInfo.activeSeats || bInfo.totalSeats,
        totalInvoicedVolume: bInfo.totalVolume,
        status: inst.isActive ? 'ACTIVE' : 'INACTIVE',
        joinedDate: inst.createdAt,
      };
    });
  },
};

export default institutionalSubscriptionService;
