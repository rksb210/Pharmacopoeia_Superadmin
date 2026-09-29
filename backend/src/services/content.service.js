import Chapter from '../models/chapter.model.js';
import SubChapter from '../models/subChapter.model.js';
import Medicine from '../models/medicine.model.js';
import ContentTable from '../models/contentTable.model.js';

class ContentService {
  // ==========================================
  // CHAPTERS MANAGEMENT
  // ==========================================

  async getChapters({ page = 1, limit = 10, search = '', status = 'all', sortBy = 'order', sortOrder = 'asc' }) {
    const query = {};

    if (search && search.trim()) {
      const regex = new RegExp(search.trim(), 'i');
      query.$or = [{ title: regex }, { code: regex }, { chapterNumber: regex }, { description: regex }];
    }

    if (status === 'active') query.isActive = true;
    else if (status === 'inactive') query.isActive = false;

    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.max(1, Math.min(100, parseInt(limit, 10)));
    const skip = (pageNum - 1) * limitNum;
    const sort = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };

    const [chapters, total] = await Promise.all([
      Chapter.find(query).sort(sort).skip(skip).limit(limitNum).lean(),
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
    return Chapter.find({ isActive: true }).sort({ order: 1, chapterNumber: 1, title: 1 }).lean();
  }

  async getChapterById(id) {
    const chapter = await Chapter.findById(id).lean();
    if (!chapter) throw new Error('Chapter not found');
    return chapter;
  }

  async createChapter(data, user) {
    const code = (data.code || '').trim().toUpperCase();
    if (!code) throw new Error('Chapter code is required');

    const existing = await Chapter.findOne({ code });
    if (existing) throw new Error(`Chapter code "${code}" already exists.`);

    const count = await Chapter.countDocuments();
    const chapter = new Chapter({
      ...data,
      code,
      order: data.order !== undefined && data.order !== '' ? Number(data.order) : count + 1,
      createdBy: user?._id || null,
    });

    return chapter.save();
  }

  async updateChapter(id, data) {
    const chapter = await Chapter.findById(id);
    if (!chapter) throw new Error('Chapter not found');

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

    return chapter.save();
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

    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.max(1, Math.min(100, parseInt(limit, 10)));
    const skip = (pageNum - 1) * limitNum;
    const sort = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };

    const [subChapters, total] = await Promise.all([
      SubChapter.find(query)
        .populate('chapterId', 'title code chapterNumber')
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
    const sub = await SubChapter.findById(id).populate('chapterId', 'title code chapterNumber').lean();
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
    const subChapter = new SubChapter({
      ...data,
      code,
      order: data.order !== undefined && data.order !== '' ? Number(data.order) : count + 1,
      createdBy: user?._id || null,
    });

    return (await subChapter.save()).populate('chapterId', 'title code chapterNumber');
  }

  async updateSubChapter(id, data) {
    const sub = await SubChapter.findById(id);
    if (!sub) throw new Error('Sub-Chapter not found');

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

    return (await sub.save()).populate('chapterId', 'title code chapterNumber');
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
        .populate('chapterId', 'title code chapterNumber')
        .populate('subChapterId', 'title code subChapterNumber')
        .populate('sections.tableId', 'title tableCode headers rows caption footnotes')
        .sort(sort)
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Medicine.countDocuments(query),
    ]);

    const enriched = medicines.map((m) => ({
      ...m,
      chapter: m.chapterId,
      subChapter: m.subChapterId,
      sectionsCount: Array.isArray(m.sections) ? m.sections.length : 0,
      tablesCount: Array.isArray(m.sections)
        ? m.sections.filter((s) => s.tableId || (s.customTable && s.customTable.headers?.length > 0)).length
        : 0,
    }));

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
      .populate('chapterId', 'title code chapterNumber')
      .populate('subChapterId', 'title code subChapterNumber')
      .populate('sections.tableId', 'title tableCode headers rows caption footnotes')
      .lean();
    if (!medicine) throw new Error('Medicine monograph not found');
    return medicine;
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

    const medicine = new Medicine({
      ...data,
      brandNames,
      sections: Array.isArray(data.sections) && data.sections.length > 0 ? data.sections : defaultSections,
      createdBy: user?._id || null,
    });

    return (await medicine.save()).populate([
      { path: 'chapterId', select: 'title code chapterNumber' },
      { path: 'subChapterId', select: 'title code subChapterNumber' },
      { path: 'sections.tableId', select: 'title tableCode headers rows caption footnotes' },
    ]);
  }

  async updateMedicine(id, data) {
    const medicine = await Medicine.findById(id);
    if (!medicine) throw new Error('Medicine monograph not found');

    if (data.name !== undefined) medicine.name = data.name.trim();
    if (data.chapterId !== undefined) medicine.chapterId = data.chapterId;
    if (data.subChapterId !== undefined) medicine.subChapterId = data.subChapterId || null;
    if (data.therapeuticClass !== undefined) medicine.therapeuticClass = data.therapeuticClass.trim();
    if (data.dosageForm !== undefined) medicine.dosageForm = data.dosageForm.trim();
    if (data.strength !== undefined) medicine.strength = data.strength.trim();
    if (data.atcCode !== undefined) medicine.atcCode = data.atcCode.trim().toUpperCase();
    if (data.schedule !== undefined) medicine.schedule = data.schedule.trim();
    if (data.status !== undefined) medicine.status = data.status;
    if (data.isActive !== undefined) medicine.isActive = Boolean(data.isActive);

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

    return (await medicine.save()).populate([
      { path: 'chapterId', select: 'title code chapterNumber' },
      { path: 'subChapterId', select: 'title code subChapterNumber' },
      { path: 'sections.tableId', select: 'title tableCode headers rows caption footnotes' },
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
    return medicine.sections || [];
  }

  async addMedicineSection(medicineId, sectionData) {
    const medicine = await Medicine.findById(medicineId);
    if (!medicine) throw new Error('Medicine monograph not found');

    if (!sectionData.title || !sectionData.title.trim()) {
      throw new Error('Section title is required');
    }

    const order =
      sectionData.order !== undefined && sectionData.order !== ''
        ? Number(sectionData.order)
        : medicine.sections.length + 1;

    const newSection = {
      title: sectionData.title.trim(),
      content: sectionData.content || '',
      order,
      tableId: sectionData.tableId || null,
      customTable: sectionData.customTable || { headers: [], rows: [], caption: '', footnotes: '' },
    };

    medicine.sections.push(newSection);
    await medicine.save();

    const populated = await Medicine.findById(medicineId)
      .populate('sections.tableId', 'title tableCode headers rows caption footnotes')
      .lean();

    return populated.sections;
  }

  async updateMedicineSection(medicineId, sectionId, sectionData) {
    const medicine = await Medicine.findById(medicineId);
    if (!medicine) throw new Error('Medicine monograph not found');

    const section = medicine.sections.id(sectionId);
    if (!section) throw new Error('Section not found in this monograph');

    if (sectionData.title !== undefined) section.title = sectionData.title.trim();
    if (sectionData.content !== undefined) section.content = sectionData.content;
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

    return populated.sections;
  }

  async deleteMedicineSection(medicineId, sectionId) {
    const medicine = await Medicine.findById(medicineId);
    if (!medicine) throw new Error('Medicine monograph not found');

    const section = medicine.sections.id(sectionId);
    if (!section) throw new Error('Section not found in this monograph');

    medicine.sections.pull(sectionId);
    await medicine.save();

    return { success: true, message: `Section "${section.title}" removed successfully.` };
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
    const [totalChapters, activeChapters, totalSubChapters, totalMedicines, publishedMedicines, totalTables] =
      await Promise.all([
        Chapter.countDocuments(),
        Chapter.countDocuments({ isActive: true }),
        SubChapter.countDocuments(),
        Medicine.countDocuments(),
        Medicine.countDocuments({ status: 'published' }),
        ContentTable.countDocuments(),
      ]);

    return {
      totalChapters,
      activeChapters,
      totalSubChapters,
      totalMedicines,
      publishedMedicines,
      totalTables,
    };
  }
}

export const contentService = new ContentService();
export default contentService;
