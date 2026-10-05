import Chapter from '../models/chapter.model.js';
import SubChapter from '../models/subChapter.model.js';
import Medicine from '../models/medicine.model.js';
import ContentTable from '../models/contentTable.model.js';

class ContentService {
  // ==========================================
  // CHAPTERS MANAGEMENT
  // ==========================================

  async getChapters({ page = 1, limit = 10, search = '', status = 'all', sortBy = 'order', sortOrder = 'asc' }) {
    const rootCondition = {
      $or: [{ level: 1 }, { level: { $exists: false } }, { parentChapterId: null }],
    };
    const andConditions = [rootCondition];

    if (search && search.trim()) {
      const regex = new RegExp(search.trim(), 'i');
      andConditions.push({
        $or: [{ title: regex }, { code: regex }, { chapterNumber: regex }, { description: regex }],
      });
    }

    if (status === 'active') andConditions.push({ isActive: true });
    else if (status === 'inactive') andConditions.push({ isActive: false });
    else if (status && status !== 'all') andConditions.push({ status });

    const query = andConditions.length > 1 ? { $and: andConditions } : andConditions[0];

    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.max(1, Math.min(100, parseInt(limit, 10)));
    const skip = (pageNum - 1) * limitNum;
    const sort = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };

    const [chapters, total] = await Promise.all([
      Chapter.find(query)
        .populate('submittedBy', 'name email username role')
        .populate('reviewedBy', 'name email username role')
        .populate('createdBy', 'name email username role')
        .sort(sort)
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Chapter.countDocuments(query),
    ]);

    // Attach linked counts (subchapters and medicines)
    const chapterIds = chapters.map((c) => c._id);
    const [subChapterCounts, medicineCounts] = await Promise.all([
      SubChapter.aggregate([
        { $match: { chapterId: { $in: chapterIds } } },
        { $group: { _id: '$chapterId', count: { $sum: 1 } } },
      ]),
      Medicine.aggregate([
        { $match: { chapterId: { $in: chapterIds } } },
        { $group: { _id: '$chapterId', count: { $sum: 1 } } },
      ]),
    ]);

    const subCountMap = new Map(subChapterCounts.map((s) => [s._id.toString(), s.count]));
    const medCountMap = new Map(medicineCounts.map((m) => [m._id.toString(), m.count]));

    const enrichedChapters = chapters.map((c) => ({
      ...c,
      subChaptersCount: subCountMap.get(c._id.toString()) || 0,
      medicinesCount: medCountMap.get(c._id.toString()) || 0,
    }));

    return {
      chapters: enrichedChapters,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum) || 1,
      },
    };
  }

  async getActiveChapters() {
    return Chapter.find({
      isActive: true,
      $or: [{ level: 1 }, { level: { $exists: false } }, { parentChapterId: null }],
    })
      .sort({ order: 1, chapterNumber: 1, title: 1 })
      .lean();
  }

  async getChapterById(id) {
    const chapter = await Chapter.findById(id)
      .populate('submittedBy', 'name email username role')
      .populate('reviewedBy', 'name email username role')
      .populate('createdBy', 'name email username role')
      .lean();
    if (!chapter) throw new Error('Chapter not found');
    return chapter;
  }

  async createChapter(data, user) {
    const code = (data.code || '').trim().toUpperCase();
    if (!code) throw new Error('Chapter code is required');

    const existing = await Chapter.findOne({ code });
    if (existing) throw new Error(`Chapter code "${code}" already exists.`);

    const count = await Chapter.countDocuments();
    const isSuperAdmin = user?.role === 'superadmin';
    // Admin creates: if status specified as draft, keep draft; otherwise in_review (or published if superadmin)
    const status = data.status || (isSuperAdmin ? 'published' : 'in_review');

    const performerName = user?.name || user?.fullName || user?.username || 'Admin';
    const roleName = user?.role || 'Admin';

    const chapter = new Chapter({
      ...data,
      code,
      status,
      order: data.order !== undefined && data.order !== '' ? Number(data.order) : count + 1,
      createdBy: user?._id || null,
      submittedBy: user?._id || null,
      submittedAt: new Date(),
      workflowHistory: [
        {
          action: status === 'in_review' ? 'SUBMITTED_FOR_REVIEW' : status === 'published' ? 'CREATED_AND_PUBLISHED' : 'DRAFT_CREATED',
          performedBy: user?._id || null,
          performerName,
          roleName,
          previousStatus: null,
          newStatus: status,
          comments: data.workflowComments || `Chapter created with status "${status}".`,
          timestamp: new Date(),
        },
      ],
    });

    return chapter.save();
  }

  async updateChapter(id, data, user) {
    const chapter = await Chapter.findById(id);
    if (!chapter) throw new Error('Chapter not found');

    const prevStatus = chapter.status;
    const isSuperAdmin = user?.role === 'superadmin';

    if (data.code && data.code.trim().toUpperCase() !== chapter.code) {
      const code = data.code.trim().toUpperCase();
      const existing = await Chapter.findOne({ code, _id: { $ne: id } });
      if (existing) throw new Error(`Chapter code "${code}" is already in use.`);
      chapter.code = code;
    }

    if (data.title !== undefined) chapter.title = data.title.trim();
    if (data.chapterNumber !== undefined) chapter.chapterNumber = data.chapterNumber.trim();
    if (data.description !== undefined) chapter.description = data.description.trim();
    if (data.order !== undefined) chapter.order = Number(data.order);
    if (data.isActive !== undefined) chapter.isActive = Boolean(data.isActive);

    // Review flow: If an admin updates content, it must be reviewed and approved before publishing
    let nextStatus = chapter.status;
    if (data.status === 'draft') {
      nextStatus = 'draft';
    } else if (isSuperAdmin && data.status) {
      nextStatus = data.status;
    } else {
      // Admin update always transitions to in_review awaiting reviewer approval
      nextStatus = 'in_review';
    }

    chapter.status = nextStatus;
    chapter.submittedBy = user?._id || chapter.submittedBy;
    chapter.submittedAt = new Date();

    const performerName = user?.name || user?.fullName || user?.username || 'Admin';
    const roleName = user?.role || 'Admin';

    chapter.workflowHistory.push({
      action: nextStatus === 'in_review' ? 'UPDATE_SUBMITTED_FOR_REVIEW' : 'CHAPTER_UPDATED',
      performedBy: user?._id || null,
      performerName,
      roleName,
      previousStatus: prevStatus,
      newStatus: nextStatus,
      comments: data.workflowComments || `Chapter updated by ${roleName} and submitted for review.`,
      timestamp: new Date(),
    });

    return chapter.save();
  }

  async reviewChapter(id, { decision, comments }, user) {
    const chapter = await Chapter.findById(id);
    if (!chapter) throw new Error('Chapter not found');

    const prevStatus = chapter.status;
    const isApproved = decision === 'APPROVE';
    const nextStatus = isApproved ? 'published' : 'draft';
    const actionLabel = isApproved ? 'APPROVED_AND_PUBLISHED' : 'REVISION_REQUESTED';

    chapter.status = nextStatus;
    chapter.reviewedBy = user?._id || null;
    chapter.reviewedAt = new Date();
    chapter.reviewNotes = comments || (isApproved ? 'Approved by Reviewer.' : 'Revision requested.');

    const performerName = user?.name || user?.fullName || user?.username || 'Reviewer';
    const roleName = user?.role || 'Reviewer';

    chapter.workflowHistory.push({
      action: actionLabel,
      performedBy: user?._id || null,
      performerName,
      roleName,
      previousStatus: prevStatus,
      newStatus: nextStatus,
      comments: comments || (isApproved ? 'Chapter approved and published to formulary.' : 'Revision requested by reviewer.'),
      timestamp: new Date(),
    });

    return (await chapter.save()).populate([
      { path: 'submittedBy', select: 'name email username role' },
      { path: 'reviewedBy', select: 'name email username role' },
    ]);
  }

  async deleteChapter(id) {
    const chapter = await Chapter.findById(id);
    if (!chapter) throw new Error('Chapter not found');

    const [linkedSubChapters, linkedMedicines] = await Promise.all([
      SubChapter.countDocuments({ chapterId: id }),
      Medicine.countDocuments({ chapterId: id }),
    ]);

    if (linkedSubChapters > 0 || linkedMedicines > 0) {
      throw new Error(
        `Cannot delete Chapter "${chapter.title}". It has ${linkedSubChapters} sub-chapter(s) and ${linkedMedicines} medicine(s) associated with it. Delete or reassign them first.`
      );
    }

    await Chapter.findByIdAndDelete(id);
    return { success: true, message: `Chapter "${chapter.title}" deleted successfully.` };
  }

  async toggleChapterStatus(id, isActive) {
    const chapter = await Chapter.findById(id);
    if (!chapter) throw new Error('Chapter not found');
    chapter.isActive = Boolean(isActive);
    return chapter.save();
  }

  // ==========================================
  // SUB-CHAPTERS MANAGEMENT
  // ==========================================

  async getSubChapters({ page = 1, limit = 10, search = '', chapterId = '', status = 'all', sortBy = 'order', sortOrder = 'asc' }) {
    const query = {};

    if (chapterId && chapterId !== 'all') {
      query.chapterId = chapterId;
    }

    if (search && search.trim()) {
      const regex = new RegExp(search.trim(), 'i');
      query.$or = [{ title: regex }, { code: regex }, { subChapterNumber: regex }, { description: regex }];
    }

    if (status === 'active') query.isActive = true;
    else if (status === 'inactive') query.isActive = false;
    else if (status && status !== 'all') query.status = status;

    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.max(1, Math.min(100, parseInt(limit, 10)));
    const skip = (pageNum - 1) * limitNum;
    const sort = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };

    const [subChapters, total] = await Promise.all([
      SubChapter.find(query)
        .populate('chapterId', 'title code chapterNumber status')
        .populate('submittedBy', 'name email username role')
        .populate('reviewedBy', 'name email username role')
        .populate('createdBy', 'name email username role')
        .sort(sort)
        .skip(skip)
        .limit(limitNum)
        .lean(),
      SubChapter.countDocuments(query),
    ]);

    // Attach medicine count
    const subChapterIds = subChapters.map((s) => s._id);
    const medicineCounts = await Medicine.aggregate([
      { $match: { subChapterId: { $in: subChapterIds } } },
      { $group: { _id: '$subChapterId', count: { $sum: 1 } } },
    ]);
    const medCountMap = new Map(medicineCounts.map((m) => [m._id.toString(), m.count]));

    const enriched = subChapters.map((s) => ({
      ...s,
      chapter: s.chapterId,
      medicinesCount: medCountMap.get(s._id.toString()) || 0,
    }));

    return {
      subChapters: enriched,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum) || 1,
      },
    };
  }

  async getActiveSubChapters(chapterId = null) {
    const query = { isActive: true };
    if (chapterId) query.chapterId = chapterId;
    return SubChapter.find(query).sort({ order: 1, subChapterNumber: 1, title: 1 }).lean();
  }

  async getSubChapterById(id) {
    const sub = await SubChapter.findById(id)
      .populate('chapterId', 'title code chapterNumber status')
      .populate('submittedBy', 'name email username role')
      .populate('reviewedBy', 'name email username role')
      .populate('createdBy', 'name email username role')
      .lean();
    if (!sub) throw new Error('Sub-Chapter not found');
    return sub;
  }

  async createSubChapter(data, user) {
    if (!data.chapterId) throw new Error('Parent Chapter is required');
    const chapter = await Chapter.findById(data.chapterId);
    if (!chapter) throw new Error('Parent Chapter does not exist');

    const code = (data.code || '').trim().toUpperCase();
    if (!code) throw new Error('Sub-Chapter code is required');

    const existing = await SubChapter.findOne({ chapterId: data.chapterId, code });
    if (existing) throw new Error(`Sub-Chapter code "${code}" already exists in chapter "${chapter.title}".`);

    const count = await SubChapter.countDocuments({ chapterId: data.chapterId });
    const isSuperAdmin = user?.role === 'superadmin';
    const status = data.status || (isSuperAdmin ? 'published' : 'in_review');

    const performerName = user?.name || user?.fullName || user?.username || 'Admin';
    const roleName = user?.role || 'Admin';

    const subChapter = new SubChapter({
      ...data,
      code,
      status,
      order: data.order !== undefined && data.order !== '' ? Number(data.order) : count + 1,
      createdBy: user?._id || null,
      submittedBy: user?._id || null,
      submittedAt: new Date(),
      workflowHistory: [
        {
          action: status === 'in_review' ? 'SUBMITTED_FOR_REVIEW' : status === 'published' ? 'CREATED_AND_PUBLISHED' : 'DRAFT_CREATED',
          performedBy: user?._id || null,
          performerName,
          roleName,
          previousStatus: null,
          newStatus: status,
          comments: data.workflowComments || `Sub-Chapter created with status "${status}".`,
          timestamp: new Date(),
        },
      ],
    });

    return (await subChapter.save()).populate([
      { path: 'chapterId', select: 'title code chapterNumber' },
      { path: 'submittedBy', select: 'name email username role' },
    ]);
  }

  async updateSubChapter(id, data, user) {
    const sub = await SubChapter.findById(id);
    if (!sub) throw new Error('Sub-Chapter not found');

    const prevStatus = sub.status;
    const isSuperAdmin = user?.role === 'superadmin';
    const targetChapterId = data.chapterId || sub.chapterId;

    if (data.code) {
      const code = data.code.trim().toUpperCase();
      const existing = await SubChapter.findOne({
        chapterId: targetChapterId,
        code,
        _id: { $ne: id },
      });
      if (existing) throw new Error(`Sub-Chapter code "${code}" already exists in this chapter.`);
      sub.code = code;
    }

    if (data.chapterId) sub.chapterId = data.chapterId;
    if (data.title !== undefined) sub.title = data.title.trim();
    if (data.subChapterNumber !== undefined) sub.subChapterNumber = data.subChapterNumber.trim();
    if (data.description !== undefined) sub.description = data.description.trim();
    if (data.order !== undefined) sub.order = Number(data.order);
    if (data.isActive !== undefined) sub.isActive = Boolean(data.isActive);

    // Review flow: Admin update triggers reviewer approval requirement
    let nextStatus = sub.status;
    if (data.status === 'draft') {
      nextStatus = 'draft';
    } else if (isSuperAdmin && data.status) {
      nextStatus = data.status;
    } else {
      nextStatus = 'in_review';
    }

    sub.status = nextStatus;
    sub.submittedBy = user?._id || sub.submittedBy;
    sub.submittedAt = new Date();

    const performerName = user?.name || user?.fullName || user?.username || 'Admin';
    const roleName = user?.role || 'Admin';

    sub.workflowHistory.push({
      action: nextStatus === 'in_review' ? 'UPDATE_SUBMITTED_FOR_REVIEW' : 'SUBCHAPTER_UPDATED',
      performedBy: user?._id || null,
      performerName,
      roleName,
      previousStatus: prevStatus,
      newStatus: nextStatus,
      comments: data.workflowComments || `Sub-Chapter updated by ${roleName} and submitted for review.`,
      timestamp: new Date(),
    });

    return (await sub.save()).populate([
      { path: 'chapterId', select: 'title code chapterNumber' },
      { path: 'submittedBy', select: 'name email username role' },
      { path: 'reviewedBy', select: 'name email username role' },
    ]);
  }

  async reviewSubChapter(id, { decision, comments }, user) {
    const sub = await SubChapter.findById(id);
    if (!sub) throw new Error('Sub-Chapter not found');

    const prevStatus = sub.status;
    const isApproved = decision === 'APPROVE';
    const nextStatus = isApproved ? 'published' : 'draft';
    const actionLabel = isApproved ? 'APPROVED_AND_PUBLISHED' : 'REVISION_REQUESTED';

    sub.status = nextStatus;
    sub.reviewedBy = user?._id || null;
    sub.reviewedAt = new Date();
    sub.reviewNotes = comments || (isApproved ? 'Approved by Reviewer.' : 'Revision requested.');

    const performerName = user?.name || user?.fullName || user?.username || 'Reviewer';
    const roleName = user?.role || 'Reviewer';

    sub.workflowHistory.push({
      action: actionLabel,
      performedBy: user?._id || null,
      performerName,
      roleName,
      previousStatus: prevStatus,
      newStatus: nextStatus,
      comments: comments || (isApproved ? 'Sub-Chapter approved and published to formulary.' : 'Revision requested by reviewer.'),
      timestamp: new Date(),
    });

    return (await sub.save()).populate([
      { path: 'chapterId', select: 'title code chapterNumber' },
      { path: 'submittedBy', select: 'name email username role' },
      { path: 'reviewedBy', select: 'name email username role' },
    ]);
  }

  async deleteSubChapter(id) {
    const sub = await SubChapter.findById(id);
    if (!sub) throw new Error('Sub-Chapter not found');

    const linkedMedicines = await Medicine.countDocuments({ subChapterId: id });
    if (linkedMedicines > 0) {
      throw new Error(
        `Cannot delete Sub-Chapter "${sub.title}". It has ${linkedMedicines} medicine(s) linked to it. Reassign or delete them first.`
      );
    }

    await SubChapter.findByIdAndDelete(id);
    return { success: true, message: `Sub-Chapter "${sub.title}" deleted successfully.` };
  }

  async toggleSubChapterStatus(id, isActive) {
    const sub = await SubChapter.findById(id);
    if (!sub) throw new Error('Sub-Chapter not found');
    sub.isActive = Boolean(isActive);
    return sub.save();
  }

  // ==========================================
  // TABLE COLLECTION MANAGEMENT
  // ==========================================

  async getTables({ page = 1, limit = 10, search = '', status = 'all', sortBy = 'createdAt', sortOrder = 'desc' }) {
    const query = {};

    if (search && search.trim()) {
      const regex = new RegExp(search.trim(), 'i');
      query.$or = [{ title: regex }, { tableCode: regex }, { caption: regex }, { footnotes: regex }];
    }

    if (status === 'active') query.isActive = true;
    else if (status === 'inactive') query.isActive = false;

    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.max(1, Math.min(100, parseInt(limit, 10)));
    const skip = (pageNum - 1) * limitNum;
    const sort = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };

    const [tables, total] = await Promise.all([
      ContentTable.find(query)
        .populate('medicineId', 'name')
        .populate('chapterId', 'title code')
        .sort(sort)
        .skip(skip)
        .limit(limitNum)
        .lean(),
      ContentTable.countDocuments(query),
    ]);

    return {
      tables,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum) || 1,
      },
    };
  }

  async getActiveTables() {
    return ContentTable.find({ isActive: true }).select('title tableCode caption headers rows footnotes').lean();
  }

  async getTableById(id) {
    const table = await ContentTable.findById(id)
      .populate('medicineId', 'name')
      .populate('chapterId', 'title code')
      .lean();
    if (!table) throw new Error('Table not found');
    return table;
  }

  async createTable(data, user) {
    const tableCode = (data.tableCode || '').trim().toUpperCase();
    if (!tableCode) throw new Error('Table code is required');

    const existing = await ContentTable.findOne({ tableCode });
    if (existing) throw new Error(`Table code "${tableCode}" already exists.`);

    const table = new ContentTable({
      ...data,
      tableCode,
      headers: Array.isArray(data.headers) && data.headers.length > 0 ? data.headers : ['Column 1', 'Column 2'],
      rows: Array.isArray(data.rows) && data.rows.length > 0 ? data.rows : [['', '']],
      createdBy: user?._id || null,
    });

    return table.save();
  }

  async updateTable(id, data) {
    const table = await ContentTable.findById(id);
    if (!table) throw new Error('Table not found');

    if (data.tableCode && data.tableCode.trim().toUpperCase() !== table.tableCode) {
      const tableCode = data.tableCode.trim().toUpperCase();
      const existing = await ContentTable.findOne({ tableCode, _id: { $ne: id } });
      if (existing) throw new Error(`Table code "${tableCode}" is already in use.`);
      table.tableCode = tableCode;
    }

    if (data.title !== undefined) table.title = data.title.trim();
    if (data.caption !== undefined) table.caption = data.caption.trim();
    if (data.headers !== undefined) table.headers = data.headers;
    if (data.rows !== undefined) table.rows = data.rows;
    if (data.footnotes !== undefined) table.footnotes = data.footnotes.trim();
    if (data.medicineId !== undefined) table.medicineId = data.medicineId || null;
    if (data.chapterId !== undefined) table.chapterId = data.chapterId || null;
    if (data.isActive !== undefined) table.isActive = Boolean(data.isActive);

    return table.save();
  }

  async deleteTable(id) {
    const table = await ContentTable.findById(id);
    if (!table) throw new Error('Table not found');

    // Check if any medicine sections reference this tableId
    const medicineUsingTable = await Medicine.findOne({ 'sections.tableId': id }).select('name').lean();
    if (medicineUsingTable) {
      throw new Error(
        `Cannot delete Table "${table.title}". It is referenced in the monograph for "${medicineUsingTable.name}". Unlink it from the medicine sections first.`
      );
    }

    await ContentTable.findByIdAndDelete(id);
    return { success: true, message: `Table "${table.title}" deleted successfully.` };
  }

  async toggleTableStatus(id, isActive) {
    const table = await ContentTable.findById(id);
    if (!table) throw new Error('Table not found');
    table.isActive = Boolean(isActive);
    return table.save();
  }

  // ==========================================
  // MEDICINES / DRUG MONOGRAPHS MANAGEMENT
  // ==========================================

  async getMedicines({
    page = 1,
    limit = 10,
    search = '',
    chapterId = '',
    subChapterId = '',
    status = 'all',
    schedule = 'all',
    sortBy = 'name',
    sortOrder = 'asc',
  }) {
    const query = {};

    if (chapterId && chapterId !== 'all') query.chapterId = chapterId;
    if (subChapterId && subChapterId !== 'all') query.subChapterId = subChapterId;

    if (search && search.trim()) {
      const regex = new RegExp(search.trim(), 'i');
      query.$or = [
        { name: regex },
        { brandNames: regex },
        { therapeuticClass: regex },
        { atcCode: regex },
        { dosageForm: regex },
      ];
    }

    if (status !== 'all') query.status = status;
    if (schedule !== 'all') query.schedule = schedule;

    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.max(1, Math.min(100, parseInt(limit, 10)));
    const skip = (pageNum - 1) * limitNum;
    const sort = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };

    const [medicines, total] = await Promise.all([
      Medicine.find(query)
        .populate('chapterId', 'title code chapterNumber status')
        .populate('subChapterId', 'title code subChapterNumber status')
        .populate('sections.tableId', 'title tableCode headers rows caption footnotes')
        .populate('submittedBy', 'name email username role')
        .populate('reviewedBy', 'name email username role')
        .populate('createdBy', 'name email username role')
        .sort(sort)
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Medicine.countDocuments(query),
    ]);

    const enriched = medicines.map((m) => {
      const normalizedSections = Array.isArray(m.sections)
        ? m.sections.map((s, idx) => ({
            ...s,
            _id: s._id || `sec-${idx}`,
            title: s.title || s.label || `Section ${idx + 1}`,
            label: s.label || s.title || `Section ${idx + 1}`,
            content: s.content !== undefined && s.content !== '' ? s.content : (s.text || ''),
            text: s.text !== undefined && s.text !== '' ? s.text : (s.content || ''),
            order: s.order ?? idx + 1,
          }))
        : [];
      return {
        ...m,
        chapter: m.chapterId,
        subChapter: m.subChapterId,
        sections: normalizedSections,
        sectionsCount: normalizedSections.length,
        tablesCount: normalizedSections.filter(
          (s) => s.tableId || (s.customTable && s.customTable.headers?.length > 0)
        ).length,
      };
    });

    return {
      medicines: enriched,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum) || 1,
      },
    };
  }

  async getMedicineById(id) {
    const medicine = await Medicine.findById(id)
      .populate('chapterId', 'title code chapterNumber status')
      .populate('subChapterId', 'title code subChapterNumber status')
      .populate('sections.tableId', 'title tableCode headers rows caption footnotes')
      .populate('submittedBy', 'name email username role')
      .populate('reviewedBy', 'name email username role')
      .populate('createdBy', 'name email username role')
      .lean();
    if (!medicine) throw new Error('Medicine monograph not found');

    const normalizedSections = Array.isArray(medicine.sections)
      ? medicine.sections.map((s, idx) => ({
          ...s,
          _id: s._id || `sec-${idx}`,
          title: s.title || s.label || `Section ${idx + 1}`,
          label: s.label || s.title || `Section ${idx + 1}`,
          content: s.content !== undefined && s.content !== '' ? s.content : (s.text || ''),
          text: s.text !== undefined && s.text !== '' ? s.text : (s.content || ''),
          order: s.order ?? idx + 1,
        }))
      : [];

    return {
      ...medicine,
      sections: normalizedSections,
    };
  }

  async createMedicine(data, user) {
    if (!data.name || !data.name.trim()) throw new Error('Medicine generic name is required');
    if (!data.chapterId) throw new Error('Parent Chapter is required');

    const chapter = await Chapter.findById(data.chapterId);
    if (!chapter) throw new Error('Selected Chapter does not exist');

    if (data.subChapterId) {
      const sub = await SubChapter.findById(data.subChapterId);
      if (!sub) throw new Error('Selected Sub-Chapter does not exist');
    }

    let brandNames = [];
    if (Array.isArray(data.brandNames)) {
      brandNames = data.brandNames;
    } else if (typeof data.brandNames === 'string') {
      brandNames = data.brandNames
        .split(',')
        .map((b) => b.trim())
        .filter(Boolean);
    }

    // Default monograph sections if none provided
    const defaultSections = [
      { title: 'Indications & Clinical Uses', content: '', order: 1 },
      { title: 'Dosage & Administration', content: '', order: 2 },
      { title: 'Contraindications', content: '', order: 3 },
      { title: 'Adverse Reactions & Side Effects', content: '', order: 4 },
      { title: 'Precautions & Warnings', content: '', order: 5 },
      { title: 'Drug Interactions', content: '', order: 6 },
      { title: 'Storage & Stability', content: '', order: 7 },
    ];

    const isSuperAdmin = user?.role === 'superadmin';
    const status = data.status || (isSuperAdmin ? 'published' : 'in_review');

    const performerName = user?.name || user?.fullName || user?.username || 'Admin';
    const roleName = user?.role || 'Admin';

    const medicine = new Medicine({
      ...data,
      brandNames,
      status,
      sections: Array.isArray(data.sections) && data.sections.length > 0 ? data.sections : defaultSections,
      createdBy: user?._id || null,
      submittedBy: user?._id || null,
      submittedAt: new Date(),
      workflowHistory: [
        {
          action: status === 'in_review' ? 'SUBMITTED_FOR_REVIEW' : status === 'published' ? 'CREATED_AND_PUBLISHED' : 'DRAFT_CREATED',
          performedBy: user?._id || null,
          performerName,
          roleName,
          previousStatus: null,
          newStatus: status,
          comments: data.workflowComments || `Medicine monograph created with status "${status}".`,
          timestamp: new Date(),
        },
      ],
    });

    return (await medicine.save()).populate([
      { path: 'chapterId', select: 'title code chapterNumber' },
      { path: 'subChapterId', select: 'title code subChapterNumber' },
      { path: 'sections.tableId', select: 'title tableCode headers rows caption footnotes' },
      { path: 'submittedBy', select: 'name email username role' },
    ]);
  }

  async updateMedicine(id, data, user) {
    const medicine = await Medicine.findById(id);
    if (!medicine) throw new Error('Medicine monograph not found');

    const prevStatus = medicine.status;
    const isSuperAdmin = user?.role === 'superadmin';

    if (data.name !== undefined) medicine.name = data.name.trim();
    if (data.chapterId !== undefined) medicine.chapterId = data.chapterId;
    if (data.subChapterId !== undefined) medicine.subChapterId = data.subChapterId || null;
    if (data.therapeuticClass !== undefined) medicine.therapeuticClass = data.therapeuticClass.trim();
    if (data.dosageForm !== undefined) medicine.dosageForm = data.dosageForm.trim();
    if (data.strength !== undefined) medicine.strength = data.strength.trim();
    if (data.atcCode !== undefined) medicine.atcCode = data.atcCode.trim().toUpperCase();
    if (data.schedule !== undefined) medicine.schedule = data.schedule.trim();
    if (data.isActive !== undefined) medicine.isActive = Boolean(data.isActive);

    // Review flow: Admin updates must be approved by reviewer before publishing
    let nextStatus = medicine.status;
    if (data.status === 'draft') {
      nextStatus = 'draft';
    } else if (isSuperAdmin && data.status) {
      nextStatus = data.status;
    } else {
      nextStatus = 'in_review';
    }

    medicine.status = nextStatus;
    medicine.submittedBy = user?._id || medicine.submittedBy;
    medicine.submittedAt = new Date();

    if (data.brandNames !== undefined) {
      if (Array.isArray(data.brandNames)) {
        medicine.brandNames = data.brandNames;
      } else if (typeof data.brandNames === 'string') {
        medicine.brandNames = data.brandNames
          .split(',')
          .map((b) => b.trim())
          .filter(Boolean);
      }
    }

    if (Array.isArray(data.sections)) {
      medicine.sections = data.sections;
    }

    const performerName = user?.name || user?.fullName || user?.username || 'Admin';
    const roleName = user?.role || 'Admin';

    medicine.workflowHistory.push({
      action: nextStatus === 'in_review' ? 'UPDATE_SUBMITTED_FOR_REVIEW' : 'MEDICINE_UPDATED',
      performedBy: user?._id || null,
      performerName,
      roleName,
      previousStatus: prevStatus,
      newStatus: nextStatus,
      comments: data.workflowComments || `Medicine monograph updated by ${roleName} and submitted for review.`,
      timestamp: new Date(),
    });

    return (await medicine.save()).populate([
      { path: 'chapterId', select: 'title code chapterNumber' },
      { path: 'subChapterId', select: 'title code subChapterNumber' },
      { path: 'sections.tableId', select: 'title tableCode headers rows caption footnotes' },
      { path: 'submittedBy', select: 'name email username role' },
      { path: 'reviewedBy', select: 'name email username role' },
    ]);
  }

  async reviewMedicine(id, { decision, comments }, user) {
    const medicine = await Medicine.findById(id);
    if (!medicine) throw new Error('Medicine monograph not found');

    const prevStatus = medicine.status;
    const isApproved = decision === 'APPROVE';
    const nextStatus = isApproved ? 'published' : 'draft';
    const actionLabel = isApproved ? 'APPROVED_AND_PUBLISHED' : 'REVISION_REQUESTED';

    medicine.status = nextStatus;
    medicine.reviewedBy = user?._id || null;
    medicine.reviewedAt = new Date();
    medicine.reviewNotes = comments || (isApproved ? 'Approved by Reviewer.' : 'Revision requested.');

    const performerName = user?.name || user?.fullName || user?.username || 'Reviewer';
    const roleName = user?.role || 'Reviewer';

    medicine.workflowHistory.push({
      action: actionLabel,
      performedBy: user?._id || null,
      performerName,
      roleName,
      previousStatus: prevStatus,
      newStatus: nextStatus,
      comments: comments || (isApproved ? 'Medicine monograph approved and published to formulary.' : 'Revision requested by reviewer.'),
      timestamp: new Date(),
    });

    return (await medicine.save()).populate([
      { path: 'chapterId', select: 'title code chapterNumber' },
      { path: 'subChapterId', select: 'title code subChapterNumber' },
      { path: 'sections.tableId', select: 'title tableCode headers rows caption footnotes' },
      { path: 'submittedBy', select: 'name email username role' },
      { path: 'reviewedBy', select: 'name email username role' },
    ]);
  }

  async deleteMedicine(id) {
    const medicine = await Medicine.findById(id);
    if (!medicine) throw new Error('Medicine monograph not found');

    await Medicine.findByIdAndDelete(id);
    return { success: true, message: `Medicine "${medicine.name}" deleted successfully.` };
  }

  async toggleMedicineStatus(id, isActive) {
    const medicine = await Medicine.findById(id);
    if (!medicine) throw new Error('Medicine monograph not found');
    medicine.isActive = Boolean(isActive);
    return medicine.save();
  }

  // ==========================================
  // MEDICINE SECTIONS CRUD
  // ==========================================

  async getMedicineSections(medicineId) {
    const medicine = await Medicine.findById(medicineId)
      .populate('sections.tableId', 'title tableCode headers rows caption footnotes')
      .lean();
    if (!medicine) throw new Error('Medicine monograph not found');
    return (medicine.sections || []).map((s, idx) => ({
      ...s,
      title: s.title || s.label || `Section ${idx + 1}`,
      label: s.label || s.title || `Section ${idx + 1}`,
      content: s.content !== undefined && s.content !== '' ? s.content : (s.text || ''),
      text: s.text !== undefined && s.text !== '' ? s.text : (s.content || ''),
      order: s.order ?? idx + 1,
    }));
  }

  async addMedicineSection(medicineId, sectionData) {
    const medicine = await Medicine.findById(medicineId);
    if (!medicine) throw new Error('Medicine monograph not found');

    const title = (sectionData.title || sectionData.label || '').trim();
    if (!title) {
      throw new Error('Section title is required');
    }

    const order =
      sectionData.order !== undefined && sectionData.order !== ''
        ? Number(sectionData.order)
        : medicine.sections.length + 1;

    const content = sectionData.content !== undefined ? sectionData.content : (sectionData.text || '');
    const key = sectionData.key || title.toLowerCase().replace(/[^a-z0-9]+/g, '_');

    const newSection = {
      title,
      label: title,
      content,
      text: content,
      key,
      order,
      pageNumber: sectionData.pageNumber ? Number(sectionData.pageNumber) : null,
      tableId: sectionData.tableId || null,
      customTable: sectionData.customTable || { headers: [], rows: [], caption: '', footnotes: '' },
    };

    medicine.sections.push(newSection);
    await medicine.save();

    const populated = await Medicine.findById(medicineId)
      .populate('sections.tableId', 'title tableCode headers rows caption footnotes')
      .lean();

    return (populated.sections || []).map((s, idx) => ({
      ...s,
      title: s.title || s.label || `Section ${idx + 1}`,
      label: s.label || s.title || `Section ${idx + 1}`,
      content: s.content !== undefined && s.content !== '' ? s.content : (s.text || ''),
      text: s.text !== undefined && s.text !== '' ? s.text : (s.content || ''),
      order: s.order ?? idx + 1,
    }));
  }

  async updateMedicineSection(medicineId, sectionId, sectionData) {
    const medicine = await Medicine.findById(medicineId);
    if (!medicine) throw new Error('Medicine monograph not found');

    const section =
      medicine.sections.id(sectionId) ||
      medicine.sections.find((s) => s._id?.toString() === sectionId?.toString() || s.key === sectionId);
    if (!section) throw new Error('Section not found in this monograph');

    if (sectionData.title !== undefined || sectionData.label !== undefined) {
      const val = (sectionData.title || sectionData.label || '').trim();
      section.title = val;
      section.label = val;
    }
    if (sectionData.content !== undefined || sectionData.text !== undefined) {
      const val = sectionData.content !== undefined ? sectionData.content : sectionData.text;
      section.content = val;
      section.text = val;
    }
    if (sectionData.key !== undefined) section.key = sectionData.key.trim();
    if (sectionData.pageNumber !== undefined) {
      section.pageNumber = sectionData.pageNumber ? Number(sectionData.pageNumber) : null;
    }
    if (sectionData.order !== undefined) section.order = Number(sectionData.order);
    if (sectionData.tableId !== undefined) section.tableId = sectionData.tableId || null;

    if (sectionData.customTable !== undefined) {
      section.customTable = {
        headers: sectionData.customTable.headers || [],
        rows: sectionData.customTable.rows || [],
        caption: sectionData.customTable.caption || '',
        footnotes: sectionData.customTable.footnotes || '',
      };
    }

    await medicine.save();

    const populated = await Medicine.findById(medicineId)
      .populate('sections.tableId', 'title tableCode headers rows caption footnotes')
      .lean();

    return (populated.sections || []).map((s, idx) => ({
      ...s,
      title: s.title || s.label || `Section ${idx + 1}`,
      label: s.label || s.title || `Section ${idx + 1}`,
      content: s.content !== undefined && s.content !== '' ? s.content : (s.text || ''),
      text: s.text !== undefined && s.text !== '' ? s.text : (s.content || ''),
      order: s.order ?? idx + 1,
    }));
  }

  async deleteMedicineSection(medicineId, sectionId) {
    const medicine = await Medicine.findById(medicineId);
    if (!medicine) throw new Error('Medicine monograph not found');

    const sectionIndex = medicine.sections.findIndex(
      (s) => s._id?.toString() === sectionId?.toString() || s.key === sectionId
    );
    if (sectionIndex === -1) throw new Error('Section not found in this monograph');

    const removedTitle = medicine.sections[sectionIndex].title || medicine.sections[sectionIndex].label || 'Section';
    medicine.sections.splice(sectionIndex, 1);
    await medicine.save();

    const populated = await Medicine.findById(medicineId)
      .populate('sections.tableId', 'title tableCode headers rows caption footnotes')
      .lean();

    const normalizedSections = (populated?.sections || []).map((s, idx) => ({
      ...s,
      title: s.title || s.label || `Section ${idx + 1}`,
      label: s.label || s.title || `Section ${idx + 1}`,
      content: s.content !== undefined && s.content !== '' ? s.content : (s.text || ''),
      text: s.text !== undefined && s.text !== '' ? s.text : (s.content || ''),
      order: s.order ?? idx + 1,
    }));

    return {
      success: true,
      message: `Section "${removedTitle}" removed successfully.`,
      sections: normalizedSections,
    };
  }

  async reorderMedicineSections(medicineId, orderedSectionIds) {
    const medicine = await Medicine.findById(medicineId);
    if (!medicine) throw new Error('Medicine monograph not found');

    if (Array.isArray(orderedSectionIds)) {
      orderedSectionIds.forEach((id, index) => {
        const sec = medicine.sections.id(id);
        if (sec) sec.order = index + 1;
      });
      medicine.sections.sort((a, b) => (a.order || 0) - (b.order || 0));
      await medicine.save();
    }

    return medicine.sections;
  }

  // ==========================================
  // AGGREGATED STATS
  // ==========================================

  async getContentStats() {
    const rootChapterQuery = {
      $or: [{ level: 1 }, { level: { $exists: false } }, { parentChapterId: null }],
    };
    const [
      totalChapters,
      activeChapters,
      inReviewChapters,
      totalSubChapters,
      inReviewSubChapters,
      totalMedicines,
      publishedMedicines,
      inReviewMedicines,
      totalTables,
    ] = await Promise.all([
      Chapter.countDocuments(rootChapterQuery),
      Chapter.countDocuments({ ...rootChapterQuery, isActive: true }),
      Chapter.countDocuments({ ...rootChapterQuery, status: 'in_review' }),
      SubChapter.countDocuments(),
      SubChapter.countDocuments({ status: 'in_review' }),
      Medicine.countDocuments(),
      Medicine.countDocuments({ status: 'published' }),
      Medicine.countDocuments({ status: 'in_review' }),
      ContentTable.countDocuments(),
    ]);

    return {
      totalChapters,
      activeChapters,
      inReviewChapters,
      totalSubChapters,
      inReviewSubChapters,
      totalMedicines,
      publishedMedicines,
      inReviewMedicines,
      totalPendingReview: inReviewChapters + inReviewSubChapters + inReviewMedicines,
      totalTables,
    };
  }
}

export const contentService = new ContentService();
export default contentService;
