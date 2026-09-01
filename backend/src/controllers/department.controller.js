import departmentService from '../services/department.service.js';

export const getDepartments = async (req, res, next) => {
  try {
    const { page, limit, search, status, sortBy, sortOrder } = req.query;
    const result = await departmentService.getDepartments({ page, limit, search, status, sortBy, sortOrder });
    return res.status(200).json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
};

export const getActiveDepartments = async (req, res, next) => {
  try {
    const departments = await departmentService.getActiveDepartments();
    return res.status(200).json({ success: true, departments });
  } catch (error) {
    next(error);
  }
};

export const getDepartmentById = async (req, res, next) => {
  try {
    const result = await departmentService.getDepartmentById(req.params.id);
    return res.status(200).json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
};

export const getDepartmentStats = async (req, res, next) => {
  try {
    const stats = await departmentService.getStats();
    return res.status(200).json({ success: true, stats });
  } catch (error) {
    next(error);
  }
};

export const createDepartment = async (req, res, next) => {
  try {
    const dept = await departmentService.createDepartment(req.body, req.user);
    return res.status(201).json({ success: true, message: 'Department created successfully.', department: dept });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

export const updateDepartment = async (req, res, next) => {
  try {
    const dept = await departmentService.updateDepartment(req.params.id, req.body);
    return res.status(200).json({ success: true, message: 'Department updated successfully.', department: dept });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

export const toggleDepartmentStatus = async (req, res, next) => {
  try {
    const { isActive } = req.body;
    const dept = await departmentService.toggleDepartmentStatus(req.params.id, isActive);
    return res.status(200).json({ success: true, message: `Department ${isActive ? 'activated' : 'deactivated'} successfully.`, department: dept });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

export const deleteDepartment = async (req, res, next) => {
  try {
    const result = await departmentService.deleteDepartment(req.params.id);
    return res.status(200).json({ success: true, ...result });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

export const seedDepartments = async (req, res, next) => {
  try {
    const departments = await departmentService.seedDefaults();
    return res.status(200).json({ success: true, message: 'Departments seeded successfully.', departments });
  } catch (error) {
    next(error);
  }
};
