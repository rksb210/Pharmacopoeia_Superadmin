import designationService from '../services/designation.service.js';

export const getDesignations = async (req, res, next) => {
  try {
    const { page, limit, search, department, status, sortBy, sortOrder } = req.query;
    const result = await designationService.getDesignations({ page, limit, search, department, status, sortBy, sortOrder });
    return res.status(200).json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
};

export const getDesignationsByDepartment = async (req, res, next) => {
  try {
    const { departmentId } = req.params;
    const { activeOnly } = req.query;
    const designations = await designationService.getByDepartment(departmentId, { activeOnly: activeOnly !== 'false' });
    return res.status(200).json({ success: true, designations });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

export const getActiveDesignations = async (req, res, next) => {
  try {
    const designations = await designationService.getActiveDesignations();
    return res.status(200).json({ success: true, designations });
  } catch (error) {
    next(error);
  }
};

export const getDesignationById = async (req, res, next) => {
  try {
    const result = await designationService.getDesignationById(req.params.id);
    return res.status(200).json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
};

export const getDesignationStats = async (req, res, next) => {
  try {
    const stats = await designationService.getStats();
    return res.status(200).json({ success: true, stats });
  } catch (error) {
    next(error);
  }
};

export const createDesignation = async (req, res, next) => {
  try {
    const des = await designationService.createDesignation(req.body, req.user);
    return res.status(201).json({ success: true, message: 'Designation created successfully.', designation: des });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

export const updateDesignation = async (req, res, next) => {
  try {
    const des = await designationService.updateDesignation(req.params.id, req.body);
    return res.status(200).json({ success: true, message: 'Designation updated successfully.', designation: des });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

export const toggleDesignationStatus = async (req, res, next) => {
  try {
    const { isActive } = req.body;
    const des = await designationService.toggleDesignationStatus(req.params.id, isActive);
    return res.status(200).json({ success: true, message: `Designation ${isActive ? 'activated' : 'deactivated'} successfully.`, designation: des });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

export const deleteDesignation = async (req, res, next) => {
  try {
    const result = await designationService.deleteDesignation(req.params.id);
    return res.status(200).json({ success: true, ...result });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

export const seedDesignations = async (req, res, next) => {
  try {
    await designationService.seedDefaults();
    const designations = await designationService.getActiveDesignations();
    return res.status(200).json({ success: true, message: 'Designations seeded successfully.', designations });
  } catch (error) {
    next(error);
  }
};
