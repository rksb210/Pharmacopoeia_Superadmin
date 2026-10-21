import bulkImportService from '../services/bulkImport.service.js';
import { auditService } from '../services/audit.service.js';

export const downloadTemplate = async (req, res, next) => {
  try {
    const { userType = 'UNIVERSITIES_COLLEGES' } = req.query;
    const buffer = bulkImportService.generateTemplate(userType);
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader(
      'Content-Disposition',
      'attachment; filename="NFI_Bulk_Subscribers_Import_Template.xlsx"'
    );
    return res.send(buffer);
  } catch (error) {
    next(error);
  }
};

export const uploadAndValidate = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Please upload a valid Excel (.xlsx, .xls) or .csv file.',
      });
    }

    const {
      institutionName,
      institutionId,
      userType,
      billingContact,
      coordinator: rawCoordinator,
      defaultPlanCode,
    } = req.body;

    let coordinator = {};
    if (rawCoordinator) {
      try {
        coordinator =
          typeof rawCoordinator === 'string' ? JSON.parse(rawCoordinator) : rawCoordinator;
      } catch {
        coordinator = {};
      }
    }

    const result = await bulkImportService.parseAndValidateFile(req.file.buffer, {
      fileName: req.file.originalname,
      institutionName,
      institutionId,
      userType: userType || 'UNIVERSITIES_COLLEGES',
      billingContact,
      coordinator,
      defaultPlanCode: defaultPlanCode || '',
      adminUser: req.user,
    });

    await auditService.log(req, {
      action: 'BULK_BATCH_VALIDATED',
      module: 'BULK_SUBSCRIPTIONS',
      entity: 'BulkImportJob',
      entityId: result.jobId,
      status: result.invalidCount > 0 ? 'WARNING' : 'SUCCESS',
      details: `Validated bulk file "${req.file.originalname}" (${institutionName || 'Institutional'}). Valid: ${result.validCount}, Invalid: ${result.invalidCount}.`,
      newValues: {
        totalRows: result.totalRows,
        validCount: result.validCount,
        invalidCount: result.invalidCount,
      },
    });

    return res.status(200).json({
      success: true,
      message: `File parsed successfully. ${result.validCount} valid records, ${result.invalidCount} invalid records found.`,
      preview: result,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

export const validateDirectRows = async (req, res) => {
  try {
    const {
      rows,
      institutionName,
      institutionId,
      userType,
      billingContact,
      coordinator,
      defaultPlanCode,
    } = req.body;

    const result = await bulkImportService.validateDirectRows({
      rows,
      institutionName,
      institutionId,
      userType: userType || 'UNIVERSITIES_COLLEGES',
      billingContact,
      coordinator: coordinator || {},
      defaultPlanCode: defaultPlanCode || '',
      adminUser: req.user,
    });

    await auditService.log(req, {
      action: 'BULK_BATCH_VALIDATED',
      module: 'BULK_SUBSCRIPTIONS',
      entity: 'BulkImportJob',
      entityId: result.jobId,
      status: result.invalidCount > 0 ? 'WARNING' : 'SUCCESS',
      details: `Validated direct manual roster (${institutionName || 'Institutional'}). Valid: ${result.validCount}, Invalid: ${result.invalidCount}.`,
      newValues: {
        totalRows: result.totalRows,
        validCount: result.validCount,
        invalidCount: result.invalidCount,
      },
    });

    return res.status(200).json({
      success: true,
      message: `Roster validated successfully. ${result.validCount} valid records, ${result.invalidCount} invalid records found.`,
      preview: result,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

export const confirmImport = async (req, res, next) => {
  try {
    const {
      jobId,
      couponCode,
      paymentMethod,
      paymentStatus,
      paymentReference,
      transactionId,
      remarks,
    } = req.body;
    if (!jobId) {
      return res.status(400).json({
        success: false,
        message: 'Job ID is required for confirmation.',
      });
    }

    const refId = (paymentReference || transactionId || '').trim();
    if (!refId) {
      return res.status(400).json({
        success: false,
        message:
          'Transaction / Reference ID is mandatory. Please enter a UTR, receipt, cheque number, or reference note.',
      });
    }

    const userRoleCode = (
      typeof req.user?.role === 'string'
        ? req.user.role
        : req.user?.role?.code || ''
    ).toLowerCase();
    const isSuperAdmin = userRoleCode === 'superadmin';

    if (!isSuperAdmin) {
      // L1 / Maker: Submit for Approver review
      const submittedJob = await bulkImportService.submitBatchForApproval(jobId, req.user, {
        couponCode,
        paymentMethod,
        paymentStatus,
        paymentReference: refId,
        transactionId: refId,
        remarks: remarks || 'Submitted for Approver authorization',
      });

      await auditService.log(req, {
        action: 'BULK_BATCH_SUBMITTED_FOR_APPROVAL',
        module: 'BULK_SUBSCRIPTIONS',
        entity: 'BulkImportJob',
        entityId: submittedJob._id,
        status: 'PENDING',
        details: `Submitted bulk import batch for "${submittedJob.institutionName}" (${submittedJob.validCount} subscribers) for Approver review.`,
        newValues: {
          status: submittedJob.status,
          validCount: submittedJob.validCount,
          approvalStatus: submittedJob.approvalStatus,
        },
      });

      return res.status(200).json({
        success: true,
        isPendingApproval: true,
        message: `Bulk batch submitted for Approver review. ${submittedJob.validCount} subscriber accounts will be provisioned once approved.`,
        job: submittedJob,
      });
    }

    // Super Admin: Direct Provisioning
    const completedJob = await bulkImportService.confirmAndExecuteImport(jobId, req.user, {
      couponCode,
      paymentMethod,
      paymentStatus,
      paymentReference: refId,
      transactionId: refId,
    });

    await auditService.log(req, {
      action: 'BULK_BATCH_EXECUTED',
      module: 'BULK_SUBSCRIPTIONS',
      entity: 'BulkImportJob',
      entityId: completedJob._id,
      status: 'SUCCESS',
      details: `Executed bulk import job for "${completedJob.institutionName}". Provisioned ${completedJob.validCount} subscribers with plan ${completedJob.planCode}.`,
      newValues: {
        status: completedJob.status,
        validCount: completedJob.validCount,
      },
    });

    return res.status(200).json({
      success: true,
      isPendingApproval: false,
      message: `Bulk batch imported successfully. ${completedJob.validCount} subscribers enrolled and subscriptions provisioned.`,
      job: completedJob,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

export const approveBatch = async (req, res) => {
  try {
    const { id } = req.params;
    const { comments = '' } = req.body;

    const approvedJob = await bulkImportService.confirmAndExecuteImport(id, req.user, {
      approvalComments: comments,
    });

    await auditService.log(req, {
      action: 'BULK_BATCH_APPROVED',
      module: 'BULK_SUBSCRIPTIONS',
      entity: 'BulkImportJob',
      entityId: approvedJob._id,
      status: 'SUCCESS',
      details: `Approved bulk batch "${approvedJob.jobId}" for "${approvedJob.institutionName}". Provisioned ${approvedJob.validCount} subscribers.`,
      newValues: {
        status: approvedJob.status,
        approvalStatus: approvedJob.approvalStatus,
      },
    });

    return res.status(200).json({
      success: true,
      message: `Bulk batch #${approvedJob.jobId} approved and ${approvedJob.validCount} subscribers provisioned successfully.`,
      job: approvedJob,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

export const rejectBatch = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason = '' } = req.body;

    if (!reason || !reason.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Rejection reason is required.',
      });
    }

    const rejectedJob = await bulkImportService.rejectBatch(id, req.user, { reason });

    await auditService.log(req, {
      action: 'BULK_BATCH_REJECTED',
      module: 'BULK_SUBSCRIPTIONS',
      entity: 'BulkImportJob',
      entityId: rejectedJob._id,
      status: 'REJECTED',
      details: `Rejected bulk batch "${rejectedJob.jobId}" for "${rejectedJob.institutionName}". Reason: ${reason}`,
      newValues: {
        status: rejectedJob.status,
        approvalStatus: rejectedJob.approvalStatus,
        rejectionReason: reason,
      },
    });

    return res.status(200).json({
      success: true,
      message: `Bulk batch #${rejectedJob.jobId} rejected.`,
      job: rejectedJob,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

export const resubmitBatch = async (req, res) => {
  try {
    const { id } = req.params;
    const { paymentReference, paymentMethod, remarks } = req.body;

    const resubmittedJob = await bulkImportService.resubmitBatch(id, req.user, {
      paymentReference,
      paymentMethod,
      remarks,
    });

    await auditService.log(req, {
      action: 'BULK_BATCH_RESUBMITTED',
      module: 'BULK_SUBSCRIPTIONS',
      entity: 'BulkImportJob',
      entityId: resubmittedJob._id,
      status: 'PENDING',
      details: `Resubmitted bulk batch "${resubmittedJob.jobId}" for "${resubmittedJob.institutionName}" for Approver review.`,
      newValues: {
        status: resubmittedJob.status,
        approvalStatus: resubmittedJob.approvalStatus,
      },
    });

    return res.status(200).json({
      success: true,
      message: `Bulk batch #${resubmittedJob.jobId} resubmitted for Approver review.`,
      job: resubmittedJob,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

export const getHistory = async (req, res, next) => {
  try {
    const { page, limit, search, status } = req.query;
    const history = await bulkImportService.getImportHistory({ page, limit, search, status });
    return res.status(200).json({
      success: true,
      ...history,
    });
  } catch (error) {
    next(error);
  }
};

export const getJobById = async (req, res, next) => {
  try {
    const job = await bulkImportService.getImportJobById(req.params.id);
    return res.status(200).json({
      success: true,
      job,
    });
  } catch (error) {
    next(error);
  }
};

export const downloadErrorReport = async (req, res, next) => {
  try {
    const buffer = await bulkImportService.generateErrorReport(req.params.id);
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="Bulk_Import_Error_Report_${req.params.id}.xlsx"`
    );
    return res.send(buffer);
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};
