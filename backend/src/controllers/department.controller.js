import departmentService from '../services/department.service.js';
import { auditService } from '../services/audit.service.js';

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

    await auditService.log(req, {
      action: 'DEPARTMENT_CREATED',
      module: 'DEPARTMENTS',
      entity: 'Department',
      entityId: dept._id,
      status: 'SUCCESS',
      details: `Created department "${dept.name}" (${dept.code}).`,
      newValues: { name: dept.name, code: dept.code, description: dept.description },
    });

    return res.status(201).json({ success: true, message: 'Department created successfully.', department: dept });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

export const updateDepartment = async (req, res, next) => {
  try {
    const dept = await departmentService.updateDepartment(req.params.id, req.body);

    await auditService.log(req, {
      action: 'DEPARTMENT_UPDATED',
      module: 'DEPARTMENTS',
      entity: 'Department',
      entityId: dept._id,
      status: 'SUCCESS',
      details: `Updated department "${dept.name}" (${dept.code}).`,
      newValues: { name: dept.name, code: dept.code, description: dept.description },
    });

    return res.status(200).json({ success: true, message: 'Department updated successfully.', department: dept });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

export const toggleDepartmentStatus = async (req, res, next) => {
  try {
    const { isActive } = req.body;
    const dept = await departmentService.toggleDepartmentStatus(req.params.id, isActive);

    await auditService.log(req, {
      action: 'DEPARTMENT_STATUS_CHANGED',
      module: 'DEPARTMENTS',
      entity: 'Department',
      entityId: dept._id,
      status: 'SUCCESS',
      details: `Department "${dept.name}" ${isActive ? 'activated' : 'deactivated'}.`,
      newValues: { isActive },
    });

    return res.status(200).json({ success: true, message: `Department ${isActive ? 'activated' : 'deactivated'} successfully.`, department: dept });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

export const deleteDepartment = async (req, res, next) => {
  try {
    const result = await departmentService.deleteDepartment(req.params.id);

    await auditService.log(req, {
      action: 'DEPARTMENT_DELETED',
      module: 'DEPARTMENTS',
      entity: 'Department',
      entityId: req.params.id,
      status: 'SUCCESS',
      details: `Deleted department ID ${req.params.id}.`,
    });

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
