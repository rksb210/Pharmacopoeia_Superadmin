import bulkImportService from '../services/bulkImport.service.js';

export const downloadTemplate = async (req, res, next) => {
  try {
    const buffer = bulkImportService.generateTemplate();
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

    const { institutionName, billingContact, defaultPlanCode } = req.body;

    const result = await bulkImportService.parseAndValidateFile(req.file.buffer, {
      fileName: req.file.originalname,
      institutionName,
      billingContact,
      defaultPlanCode: defaultPlanCode || 'NFI-INDIVIDUAL',
      adminUser: req.user,
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

export const confirmImport = async (req, res, next) => {
  try {
    const { jobId } = req.body;
    if (!jobId) {
      return res.status(400).json({
        success: false,
        message: 'Job ID is required for confirmation.',
      });
    }

    const completedJob = await bulkImportService.confirmAndExecuteImport(jobId, req.user);

    return res.status(200).json({
      success: true,
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

export const getHistory = async (req, res, next) => {
  try {
    const { page, limit, search } = req.query;
    const history = await bulkImportService.getImportHistory({ page, limit, search });
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
