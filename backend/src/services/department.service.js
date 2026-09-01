import Department from '../models/department.model.js';
import Designation from '../models/designation.model.js';
import User from '../models/user.model.js';

export const departmentService = {
  getDepartments: async ({ page = 1, limit = 10, search = '', status = 'all', sortBy = 'createdAt', sortOrder = 'desc' } = {}) => {
    const query = {};
    if (search && search.trim()) {
      const r = new RegExp(search.trim(), 'i');
      query.$or = [{ name: r }, { code: r }, { description: r }];
    }
    if (status && status !== 'all') query.isActive = status === 'active';

    const pageNumber = Math.max(1, parseInt(page, 10) || 1);
    const pageSize = Math.max(1, Math.min(100, parseInt(limit, 10) || 10));
    const skip = (pageNumber - 1) * pageSize;
    const sort = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };

    const [departments, total] = await Promise.all([
      Department.find(query).sort(sort).skip(skip).limit(pageSize).lean(),
      Department.countDocuments(query),
    ]);

    const withCounts = await Promise.all(
      departments.map(async (d) => {
        const [designationsCount, usersCount] = await Promise.all([
          Designation.countDocuments({ department: d._id }),
          User.countDocuments({ departmentRef: d._id }),
        ]);
        return { ...d, designationsCount, usersCount };
      })
    );

    return {
      departments: withCounts,
      pagination: { total, page: pageNumber, limit: pageSize, totalPages: Math.ceil(total / pageSize) || 1 },
    };
  },

  getDepartmentById: async (id) => {
    const dept = await Department.findById(id).lean();
    if (!dept) throw new Error('Department not found');
    const [designationsCount, usersCount, designations] = await Promise.all([
      Designation.countDocuments({ department: dept._id }),
      User.countDocuments({ departmentRef: dept._id }),
      Designation.find({ department: dept._id }).sort({ name: 1 }).lean(),
    ]);
    return { department: dept, designationsCount, usersCount, designations };
  },

  getActiveDepartments: async () => {
    const count = await Department.countDocuments({});
    if (count === 0) await departmentService.seedDefaults();
    return Department.find({ isActive: true }).sort({ name: 1 }).select('name code description').lean();
  },

  seedDefaults: async () => {
    const defaults = [
      { name: 'Indian Pharmacopoeia Commission', code: 'IPC', description: 'Central governing body for drug standards' },
      { name: 'Laboratory & Quality Control', code: 'LAB_QC', description: 'Analytical and quality testing division' },
      { name: 'Monograph & Formulary Division', code: 'MFD', description: 'Drug monograph authoring and review' },
      { name: 'Administration & Finance', code: 'ADMIN_FIN', description: 'HR, finance and general administration' },
      { name: 'Information Technology', code: 'IT', description: 'Digital infrastructure and software systems' },
    ];
    for (const d of defaults) {
      await Department.findOneAndUpdate({ code: d.code }, { $setOnInsert: { name: d.name, description: d.description, isActive: true } }, { upsert: true });
    }
    // Ensure designations seeded
    const { designationService } = await import('./designation.service.js');
    await designationService.seedDefaults();
    return Department.find({ isActive: true }).sort({ name: 1 }).lean();
  },

  createDepartment: async (data, requester) => {
    const { name, code, description = '', isActive = true } = data;
    const normalizedCode = (code || name.replace(/\s+/g, '_')).toUpperCase().trim();

    const existing = await Department.findOne({ $or: [{ name: name.trim() }, { code: normalizedCode }] });
    if (existing) {
      if (existing.name === name.trim()) throw new Error('A department with this name already exists.');
      throw new Error('A department with this code already exists.');
    }

    const dept = await Department.create({
      name: name.trim(),
      code: normalizedCode,
      description: description.trim(),
      isActive: !!isActive,
      createdBy: requester?._id || requester?.id || null,
    });
    return dept;
  },

  updateDepartment: async (id, data) => {
    const dept = await Department.findById(id);
    if (!dept) throw new Error('Department not found');

    const { name, code, description, isActive } = data;

    if (name !== undefined) {
      if (!name || !name.trim()) throw new Error('Department name cannot be empty');
      const dup = await Department.findOne({ name: name.trim(), _id: { $ne: dept._id } });
      if (dup) throw new Error('Another department with this name already exists.');
      dept.name = name.trim();
    }
    if (code !== undefined) {
      const normalizedCode = code.toUpperCase().trim();
      if (!normalizedCode) throw new Error('Department code cannot be empty');
      const dup = await Department.findOne({ code: normalizedCode, _id: { $ne: dept._id } });
      if (dup) throw new Error('Another department with this code already exists.');
      dept.code = normalizedCode;
    }
    if (description !== undefined) dept.description = description.trim();
    if (isActive !== undefined) dept.isActive = !!isActive;

    await dept.save();
    return dept;
  },

  toggleDepartmentStatus: async (id, isActive) => {
    const dept = await Department.findById(id);
    if (!dept) throw new Error('Department not found');
    dept.isActive = !!isActive;
    await dept.save();
    return dept;
  },

  deleteDepartment: async (id) => {
    const dept = await Department.findById(id);
    if (!dept) throw new Error('Department not found');

    const [desCount, userCount] = await Promise.all([
      Designation.countDocuments({ department: dept._id }),
      User.countDocuments({ departmentRef: dept._id }),
    ]);

    if (desCount > 0) throw new Error(`Cannot delete department '${dept.name}' because it has ${desCount} designation(s) linked. Remove or reassign them first.`);
    if (userCount > 0) throw new Error(`Cannot delete department '${dept.name}' because ${userCount} user(s) are assigned to it. Reassign them first.`);

    await Department.findByIdAndDelete(id);
    return { message: `Department '${dept.name}' deleted successfully.` };
  },

  getStats: async () => {
    const [total, active, inactive] = await Promise.all([
      Department.countDocuments({}),
      Department.countDocuments({ isActive: true }),
      Department.countDocuments({ isActive: false }),
    ]);
    const totalDesignations = await Designation.countDocuments({});
    return { total, active, inactive, totalDesignations };
  },
};

export default departmentService;
