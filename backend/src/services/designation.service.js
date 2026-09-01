import Designation from '../models/designation.model.js';
import Department from '../models/department.model.js';
import User from '../models/user.model.js';

export const designationService = {
  getDesignations: async ({ page = 1, limit = 10, search = '', department = 'all', status = 'all', sortBy = 'createdAt', sortOrder = 'desc' } = {}) => {
    const query = {};
    if (search && search.trim()) {
      const r = new RegExp(search.trim(), 'i');
      query.$or = [{ name: r }, { code: r }, { description: r }];
    }
    if (department && department !== 'all') query.department = department;
    if (status && status !== 'all') query.isActive = status === 'active';

    const pageNumber = Math.max(1, parseInt(page, 10) || 1);
    const pageSize = Math.max(1, Math.min(100, parseInt(limit, 10) || 10));
    const skip = (pageNumber - 1) * pageSize;
    const sort = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };

    const [designations, total] = await Promise.all([
      Designation.find(query).populate('department', 'name code').sort(sort).skip(skip).limit(pageSize).lean(),
      Designation.countDocuments(query),
    ]);

    const withCounts = await Promise.all(
      designations.map(async (d) => {
        const usersCount = await User.countDocuments({ designationRef: d._id });
        return { ...d, usersCount };
      })
    );

    return {
      designations: withCounts,
      pagination: { total, page: pageNumber, limit: pageSize, totalPages: Math.ceil(total / pageSize) || 1 },
    };
  },

  getDesignationById: async (id) => {
    const des = await Designation.findById(id).populate('department', 'name code').lean();
    if (!des) throw new Error('Designation not found');
    const usersCount = await User.countDocuments({ designationRef: des._id });
    return { designation: des, usersCount };
  },

  getByDepartment: async (departmentId, { activeOnly = true } = {}) => {
    const dept = await Department.findById(departmentId);
    if (!dept) throw new Error('Department not found');
    const q = { department: dept._id };
    if (activeOnly) q.isActive = true;
    return Designation.find(q).sort({ name: 1 }).select('name code description department isActive').lean();
  },

  getActiveDesignations: async () => {
    return Designation.find({ isActive: true }).populate('department', 'name code').sort({ name: 1 }).lean();
  },

  seedDefaults: async () => {
    const Department = (await import('../models/department.model.js')).default;
    const mapping = {
      IPC: ['Director', 'Deputy Director', 'Principal Scientific Officer', 'Senior Scientific Officer', 'Scientific Officer'],
      LAB_QC: ['Head of Laboratory', 'Senior Analyst', 'Analyst', 'Laboratory Attendant'],
      MFD: ['Head of Division', 'Senior Reviewer', 'Reviewer', 'Maker', 'Editor'],
      ADMIN_FIN: ['Head Administration', 'Administrative Officer', 'Accounts Officer', 'Office Superintendent'],
      IT: ['Head IT', 'System Administrator', 'Software Developer', 'Support Engineer'],
    };
    for (const [deptCode, names] of Object.entries(mapping)) {
      const dept = await Department.findOne({ code: deptCode });
      if (!dept) continue;
      for (const n of names) {
        const code = n.toUpperCase().replace(/[^A-Z0-9]+/g, '_');
        await Designation.findOneAndUpdate(
          { department: dept._id, code },
          { $setOnInsert: { name: n, description: `${n} in ${dept.name}`, isActive: true } },
          { upsert: true }
        );
      }
    }
  },

  createDesignation: async (data, requester) => {
    const { name, code, department, description = '', isActive = true } = data;
    const dept = await Department.findById(department);
    if (!dept) throw new Error('Selected department does not exist.');
    if (!dept.isActive) throw new Error('Cannot add designation to an inactive department.');

    const normalizedCode = (code || name.replace(/\s+/g, '_')).toUpperCase().trim();

    const existing = await Designation.findOne({
      department: dept._id,
      $or: [{ name: name.trim() }, { code: normalizedCode }],
    });
    if (existing) {
      if (existing.name === name.trim()) throw new Error('A designation with this name already exists in the selected department.');
      throw new Error('A designation with this code already exists in the selected department.');
    }

    const des = await Designation.create({
      name: name.trim(),
      code: normalizedCode,
      department: dept._id,
      description: description.trim(),
      isActive: !!isActive,
      createdBy: requester?._id || requester?.id || null,
    });

    return (await des.populate('department', 'name code')).toObject();
  },

  updateDesignation: async (id, data) => {
    const des = await Designation.findById(id);
    if (!des) throw new Error('Designation not found');

    const { name, code, department, description, isActive } = data;

    if (department !== undefined && String(department) !== String(des.department)) {
      const dept = await Department.findById(department);
      if (!dept) throw new Error('Selected department does not exist.');
      if (!dept.isActive) throw new Error('Cannot move designation to an inactive department.');
      // Check uniqueness in new department
      const checkName = name !== undefined ? name.trim() : des.name;
      const checkCode = code !== undefined ? code.toUpperCase().trim() : des.code;
      const dup = await Designation.findOne({
        department: dept._id,
        _id: { $ne: des._id },
        $or: [{ name: checkName }, { code: checkCode }],
      });
      if (dup) throw new Error('A designation with same name or code already exists in the target department.');
      des.department = dept._id;
    }

    if (name !== undefined) {
      if (!name || !name.trim()) throw new Error('Designation name cannot be empty');
      const dup = await Designation.findOne({ department: des.department, name: name.trim(), _id: { $ne: des._id } });
      if (dup) throw new Error('Another designation with this name already exists in this department.');
      des.name = name.trim();
    }
    if (code !== undefined) {
      const normalizedCode = code.toUpperCase().trim();
      if (!normalizedCode) throw new Error('Designation code cannot be empty');
      const dup = await Designation.findOne({ department: des.department, code: normalizedCode, _id: { $ne: des._id } });
      if (dup) throw new Error('Another designation with this code already exists in this department.');
      des.code = normalizedCode;
    }
    if (description !== undefined) des.description = description.trim();
    if (isActive !== undefined) des.isActive = !!isActive;

    await des.save();
    return (await des.populate('department', 'name code')).toObject();
  },

  toggleDesignationStatus: async (id, isActive) => {
    const des = await Designation.findById(id);
    if (!des) throw new Error('Designation not found');
    des.isActive = !!isActive;
    await des.save();
    return (await des.populate('department', 'name code')).toObject();
  },

  deleteDesignation: async (id) => {
    const des = await Designation.findById(id);
    if (!des) throw new Error('Designation not found');

    const userCount = await User.countDocuments({ designationRef: des._id });
    if (userCount > 0) throw new Error(`Cannot delete designation '${des.name}' because ${userCount} user(s) are assigned to it. Reassign them first.`);

    await Designation.findByIdAndDelete(id);
    return { message: `Designation '${des.name}' deleted successfully.` };
  },

  getStats: async () => {
    const [total, active, inactive] = await Promise.all([
      Designation.countDocuments({}),
      Designation.countDocuments({ isActive: true }),
      Designation.countDocuments({ isActive: false }),
    ]);
    return { total, active, inactive };
  },
};

export default designationService;
