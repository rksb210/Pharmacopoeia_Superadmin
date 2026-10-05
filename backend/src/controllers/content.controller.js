import contentService from '../services/content.service.js';
import { auditService } from '../services/audit.service.js';

// ==========================================
// STATS
// ==========================================
export const getContentStats = async (req, res, next) => {
  try {
    const stats = await contentService.getContentStats();
    return res.status(200).json({ success: true, stats });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// CHAPTERS CONTROLLER
// ==========================================
export const getChapters = async (req, res, next) => {
  try {
    const { page, limit, search, status, sortBy, sortOrder } = req.query;
    const result = await contentService.getChapters({ page, limit, search, status, sortBy, sortOrder });
    return res.status(200).json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
};

export const getActiveChapters = async (req, res, next) => {
  try {
    const chapters = await contentService.getActiveChapters();
    return res.status(200).json({ success: true, chapters });
  } catch (error) {
    next(error);
  }
};

export const getChapterById = async (req, res, next) => {
  try {
    const chapter = await contentService.getChapterById(req.params.id);
    return res.status(200).json({ success: true, chapter });
  } catch (error) {
    next(error);
  }
};

export const createChapter = async (req, res, next) => {
  try {
    const chapter = await contentService.createChapter(req.body, req.user);

    await auditService.log(req, {
      action: 'CHAPTER_CREATED',
      module: 'CONTENT',
      entity: 'Chapter',
      entityId: chapter._id,
      status: 'SUCCESS',
      details: `Created chapter "${chapter.title}" (${chapter.code}).`,
      newValues: { title: chapter.title, code: chapter.code, chapterNumber: chapter.chapterNumber },
    });

    return res.status(201).json({ success: true, message: 'Chapter created successfully.', chapter });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

export const updateChapter = async (req, res, next) => {
  try {
    const chapter = await contentService.updateChapter(req.params.id, req.body, req.user);

    await auditService.log(req, {
      action: 'CHAPTER_UPDATED',
      module: 'CONTENT',
      entity: 'Chapter',
      entityId: chapter._id,
      status: 'SUCCESS',
      details: `Updated chapter "${chapter.title}" (${chapter.code}).`,
      newValues: req.body,
    });

    return res.status(200).json({ success: true, message: 'Chapter updated successfully.', chapter });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

export const reviewChapter = async (req, res, next) => {
  try {
    const { decision, comments } = req.body;
    const chapter = await contentService.reviewChapter(req.params.id, { decision, comments }, req.user);

    await auditService.log(req, {
      action: decision === 'APPROVE' ? 'CHAPTER_APPROVED' : 'CHAPTER_REVISION_REQUESTED',
      module: 'CONTENT',
      entity: 'Chapter',
      entityId: chapter._id,
      status: 'SUCCESS',
      details: `${decision === 'APPROVE' ? 'Approved and published' : 'Requested revision on'} chapter "${chapter.title}".`,
      newValues: { decision, comments, status: chapter.status },
    });

    return res.status(200).json({
      success: true,
      message: decision === 'APPROVE' ? 'Chapter approved and published successfully.' : 'Revision requested successfully.',
      chapter,
    });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

export const deleteChapter = async (req, res, next) => {
  try {
    const result = await contentService.deleteChapter(req.params.id);

    await auditService.log(req, {
      action: 'CHAPTER_DELETED',
      module: 'CONTENT',
      entity: 'Chapter',
      entityId: req.params.id,
      status: 'SUCCESS',
      details: result.message,
    });

    return res.status(200).json({ success: true, message: result.message });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

export const toggleChapterStatus = async (req, res, next) => {
  try {
    const { isActive } = req.body;
    const chapter = await contentService.toggleChapterStatus(req.params.id, isActive);

    await auditService.log(req, {
      action: isActive ? 'CHAPTER_ACTIVATED' : 'CHAPTER_DEACTIVATED',
      module: 'CONTENT',
      entity: 'Chapter',
      entityId: chapter._id,
      status: 'SUCCESS',
      details: `Chapter "${chapter.title}" status changed to ${isActive ? 'active' : 'inactive'}.`,
    });

    return res.status(200).json({ success: true, message: `Chapter ${isActive ? 'activated' : 'deactivated'}.`, chapter });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

// ==========================================
// SUB-CHAPTERS CONTROLLER
// ==========================================
export const getSubChapters = async (req, res, next) => {
  try {
    const { page, limit, search, chapterId, status, sortBy, sortOrder } = req.query;
    const result = await contentService.getSubChapters({ page, limit, search, chapterId, status, sortBy, sortOrder });
    return res.status(200).json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
};

export const getActiveSubChapters = async (req, res, next) => {
  try {
    const { chapterId } = req.query;
    const subChapters = await contentService.getActiveSubChapters(chapterId);
    return res.status(200).json({ success: true, subChapters });
  } catch (error) {
    next(error);
  }
};

export const getSubChapterById = async (req, res, next) => {
  try {
    const subChapter = await contentService.getSubChapterById(req.params.id);
    return res.status(200).json({ success: true, subChapter });
  } catch (error) {
    next(error);
  }
};

export const createSubChapter = async (req, res, next) => {
  try {
    const subChapter = await contentService.createSubChapter(req.body, req.user);

    await auditService.log(req, {
      action: 'SUBCHAPTER_CREATED',
      module: 'CONTENT',
      entity: 'SubChapter',
      entityId: subChapter._id,
      status: 'SUCCESS',
      details: `Created sub-chapter "${subChapter.title}" (${subChapter.code}).`,
      newValues: { title: subChapter.title, code: subChapter.code, chapterId: subChapter.chapterId },
    });

    return res.status(201).json({ success: true, message: 'Sub-Chapter created successfully.', subChapter });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

export const updateSubChapter = async (req, res, next) => {
  try {
    const subChapter = await contentService.updateSubChapter(req.params.id, req.body, req.user);

    await auditService.log(req, {
      action: 'SUBCHAPTER_UPDATED',
      module: 'CONTENT',
      entity: 'SubChapter',
      entityId: subChapter._id,
      status: 'SUCCESS',
      details: `Updated sub-chapter "${subChapter.title}" (${subChapter.code}).`,
      newValues: req.body,
    });

    return res.status(200).json({ success: true, message: 'Sub-Chapter updated successfully.', subChapter });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

export const reviewSubChapter = async (req, res, next) => {
  try {
    const { decision, comments } = req.body;
    const subChapter = await contentService.reviewSubChapter(req.params.id, { decision, comments }, req.user);

    await auditService.log(req, {
      action: decision === 'APPROVE' ? 'SUBCHAPTER_APPROVED' : 'SUBCHAPTER_REVISION_REQUESTED',
      module: 'CONTENT',
      entity: 'SubChapter',
      entityId: subChapter._id,
      status: 'SUCCESS',
      details: `${decision === 'APPROVE' ? 'Approved and published' : 'Requested revision on'} sub-chapter "${subChapter.title}".`,
      newValues: { decision, comments, status: subChapter.status },
    });

    return res.status(200).json({
      success: true,
      message: decision === 'APPROVE' ? 'Sub-Chapter approved and published successfully.' : 'Revision requested successfully.',
      subChapter,
    });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

export const deleteSubChapter = async (req, res, next) => {
  try {
    const result = await contentService.deleteSubChapter(req.params.id);

    await auditService.log(req, {
      action: 'SUBCHAPTER_DELETED',
      module: 'CONTENT',
      entity: 'SubChapter',
      entityId: req.params.id,
      status: 'SUCCESS',
      details: result.message,
    });

    return res.status(200).json({ success: true, message: result.message });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

export const toggleSubChapterStatus = async (req, res, next) => {
  try {
    const { isActive } = req.body;
    const subChapter = await contentService.toggleSubChapterStatus(req.params.id, isActive);

    await auditService.log(req, {
      action: isActive ? 'SUBCHAPTER_ACTIVATED' : 'SUBCHAPTER_DEACTIVATED',
      module: 'CONTENT',
      entity: 'SubChapter',
      entityId: subChapter._id,
      status: 'SUCCESS',
      details: `Sub-Chapter "${subChapter.title}" status changed to ${isActive ? 'active' : 'inactive'}.`,
    });

    return res.status(200).json({ success: true, message: `Sub-Chapter ${isActive ? 'activated' : 'deactivated'}.`, subChapter });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

// ==========================================
// TABLES CONTROLLER
// ==========================================
export const getTables = async (req, res, next) => {
  try {
    const { page, limit, search, status, sortBy, sortOrder } = req.query;
    const result = await contentService.getTables({ page, limit, search, status, sortBy, sortOrder });
    return res.status(200).json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
};

export const getActiveTables = async (req, res, next) => {
  try {
    const tables = await contentService.getActiveTables();
    return res.status(200).json({ success: true, tables });
  } catch (error) {
    next(error);
  }
};

export const getTableById = async (req, res, next) => {
  try {
    const table = await contentService.getTableById(req.params.id);
    return res.status(200).json({ success: true, table });
  } catch (error) {
    next(error);
  }
};

export const createTable = async (req, res, next) => {
  try {
    const table = await contentService.createTable(req.body, req.user);

    await auditService.log(req, {
      action: 'TABLE_CREATED',
      module: 'CONTENT',
      entity: 'ContentTable',
      entityId: table._id,
      status: 'SUCCESS',
      details: `Created content table "${table.title}" (${table.tableCode}).`,
      newValues: { title: table.title, tableCode: table.tableCode },
    });

    return res.status(201).json({ success: true, message: 'Table created successfully.', table });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

export const updateTable = async (req, res, next) => {
  try {
    const table = await contentService.updateTable(req.params.id, req.body);

    await auditService.log(req, {
      action: 'TABLE_UPDATED',
      module: 'CONTENT',
      entity: 'ContentTable',
      entityId: table._id,
      status: 'SUCCESS',
      details: `Updated content table "${table.title}" (${table.tableCode}).`,
      newValues: req.body,
    });

    return res.status(200).json({ success: true, message: 'Table updated successfully.', table });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

export const deleteTable = async (req, res, next) => {
  try {
    const result = await contentService.deleteTable(req.params.id);

    await auditService.log(req, {
      action: 'TABLE_DELETED',
      module: 'CONTENT',
      entity: 'ContentTable',
      entityId: req.params.id,
      status: 'SUCCESS',
      details: result.message,
    });

    return res.status(200).json({ success: true, message: result.message });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

export const toggleTableStatus = async (req, res, next) => {
  try {
    const { isActive } = req.body;
    const table = await contentService.toggleTableStatus(req.params.id, isActive);

    await auditService.log(req, {
      action: isActive ? 'TABLE_ACTIVATED' : 'TABLE_DEACTIVATED',
      module: 'CONTENT',
      entity: 'ContentTable',
      entityId: table._id,
      status: 'SUCCESS',
      details: `Table "${table.title}" status changed to ${isActive ? 'active' : 'inactive'}.`,
    });

    return res.status(200).json({ success: true, message: `Table ${isActive ? 'activated' : 'deactivated'}.`, table });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

// ==========================================
// MEDICINES CONTROLLER
// ==========================================
export const getMedicines = async (req, res, next) => {
  try {
    const { page, limit, search, chapterId, subChapterId, status, schedule, sortBy, sortOrder } = req.query;
    const result = await contentService.getMedicines({
      page,
      limit,
      search,
      chapterId,
      subChapterId,
      status,
      schedule,
      sortBy,
      sortOrder,
    });
    return res.status(200).json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
};

export const getMedicineById = async (req, res, next) => {
  try {
    const medicine = await contentService.getMedicineById(req.params.id);
    return res.status(200).json({ success: true, medicine });
  } catch (error) {
    next(error);
  }
};

export const createMedicine = async (req, res, next) => {
  try {
    const medicine = await contentService.createMedicine(req.body, req.user);

    await auditService.log(req, {
      action: 'MEDICINE_CREATED',
      module: 'CONTENT',
      entity: 'Medicine',
      entityId: medicine._id,
      status: 'SUCCESS',
      details: `Created monograph for medicine "${medicine.name}".`,
      newValues: { name: medicine.name, chapterId: medicine.chapterId, therapeuticClass: medicine.therapeuticClass },
    });

    return res.status(201).json({ success: true, message: 'Medicine monograph created successfully.', medicine });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

export const updateMedicine = async (req, res, next) => {
  try {
    const medicine = await contentService.updateMedicine(req.params.id, req.body, req.user);

    await auditService.log(req, {
      action: 'MEDICINE_UPDATED',
      module: 'CONTENT',
      entity: 'Medicine',
      entityId: medicine._id,
      status: 'SUCCESS',
      details: `Updated monograph for medicine "${medicine.name}".`,
      newValues: req.body,
    });

    return res.status(200).json({ success: true, message: 'Medicine monograph updated successfully.', medicine });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

export const reviewMedicine = async (req, res, next) => {
  try {
    const { decision, comments } = req.body;
    const medicine = await contentService.reviewMedicine(req.params.id, { decision, comments }, req.user);

    await auditService.log(req, {
      action: decision === 'APPROVE' ? 'MEDICINE_APPROVED' : 'MEDICINE_REVISION_REQUESTED',
      module: 'CONTENT',
      entity: 'Medicine',
      entityId: medicine._id,
      status: 'SUCCESS',
      details: `${decision === 'APPROVE' ? 'Approved and published' : 'Requested revision on'} medicine monograph "${medicine.name}".`,
      newValues: { decision, comments, status: medicine.status },
    });

    return res.status(200).json({
      success: true,
      message: decision === 'APPROVE' ? 'Medicine monograph approved and published successfully.' : 'Revision requested successfully.',
      medicine,
    });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

export const deleteMedicine = async (req, res, next) => {
  try {
    const result = await contentService.deleteMedicine(req.params.id);

    await auditService.log(req, {
      action: 'MEDICINE_DELETED',
      module: 'CONTENT',
      entity: 'Medicine',
      entityId: req.params.id,
      status: 'SUCCESS',
      details: result.message,
    });

    return res.status(200).json({ success: true, message: result.message });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

export const toggleMedicineStatus = async (req, res, next) => {
  try {
    const { isActive } = req.body;
    const medicine = await contentService.toggleMedicineStatus(req.params.id, isActive);

    await auditService.log(req, {
      action: isActive ? 'MEDICINE_ACTIVATED' : 'MEDICINE_DEACTIVATED',
      module: 'CONTENT',
      entity: 'Medicine',
      entityId: medicine._id,
      status: 'SUCCESS',
      details: `Medicine "${medicine.name}" status changed to ${isActive ? 'active' : 'inactive'}.`,
    });

    return res.status(200).json({ success: true, message: `Medicine ${isActive ? 'activated' : 'deactivated'}.`, medicine });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

// ==========================================
// SECTIONS CONTROLLER
// ==========================================
export const getMedicineSections = async (req, res, next) => {
  try {
    const sections = await contentService.getMedicineSections(req.params.id);
    return res.status(200).json({ success: true, sections });
  } catch (error) {
    next(error);
  }
};

export const addMedicineSection = async (req, res, next) => {
  try {
    const sections = await contentService.addMedicineSection(req.params.id, req.body);

    await auditService.log(req, {
      action: 'SECTION_ADDED',
      module: 'CONTENT',
      entity: 'Medicine',
      entityId: req.params.id,
      status: 'SUCCESS',
      details: `Added section "${req.body.title}" to medicine ID ${req.params.id}.`,
    });

    return res.status(201).json({ success: true, message: 'Section added successfully.', sections });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

export const updateMedicineSection = async (req, res, next) => {
  try {
    const sections = await contentService.updateMedicineSection(req.params.id, req.params.sectionId, req.body);

    await auditService.log(req, {
      action: 'SECTION_UPDATED',
      module: 'CONTENT',
      entity: 'Medicine',
      entityId: req.params.id,
      status: 'SUCCESS',
      details: `Updated section "${req.body.title || req.params.sectionId}" in medicine ID ${req.params.id}.`,
    });

    return res.status(200).json({ success: true, message: 'Section updated successfully.', sections });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

export const deleteMedicineSection = async (req, res, next) => {
  try {
    const result = await contentService.deleteMedicineSection(req.params.id, req.params.sectionId);

    await auditService.log(req, {
      action: 'SECTION_DELETED',
      module: 'CONTENT',
      entity: 'Medicine',
      entityId: req.params.id,
      status: 'SUCCESS',
      details: result.message,
    });

    return res.status(200).json({
      success: true,
      message: result.message,
      sections: result.sections,
    });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

export const reorderMedicineSections = async (req, res, next) => {
  try {
    const { orderedSectionIds } = req.body;
    const sections = await contentService.reorderMedicineSections(req.params.id, orderedSectionIds);
    return res.status(200).json({ success: true, message: 'Sections reordered successfully.', sections });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
};
