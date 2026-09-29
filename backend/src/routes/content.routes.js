import { Router } from 'express';
import {
  // Stats
  getContentStats,
  // Chapters
  getChapters,
  getActiveChapters,
  getChapterById,
  createChapter,
  updateChapter,
  deleteChapter,
  toggleChapterStatus,
  // Sub-Chapters
  getSubChapters,
  getActiveSubChapters,
  getSubChapterById,
  createSubChapter,
  updateSubChapter,
  deleteSubChapter,
  toggleSubChapterStatus,
  // Tables
  getTables,
  getActiveTables,
  getTableById,
  createTable,
  updateTable,
  deleteTable,
  toggleTableStatus,
  // Medicines
  getMedicines,
  getMedicineById,
  createMedicine,
  updateMedicine,
  deleteMedicine,
  toggleMedicineStatus,
  // Sections
  getMedicineSections,
  addMedicineSection,
  updateMedicineSection,
  deleteMedicineSection,
  reorderMedicineSections,
} from '../controllers/content.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';
import { requirePermission } from '../middlewares/rbac.middleware.js';

const router = Router();

// Protect all content routes
router.use(authenticate);

// Aggregated Stats
router.get('/stats', requirePermission('CONTENT', 'MONOGRAPHS', 'VIEW'), getContentStats);

// ==========================================
// CHAPTERS ROUTES
// ==========================================
router.get('/chapters/active', getActiveChapters);
router.get('/chapters', requirePermission('CONTENT', 'MONOGRAPHS', 'VIEW'), getChapters);
router.get('/chapters/:id', requirePermission('CONTENT', 'MONOGRAPHS', 'VIEW'), getChapterById);
router.post('/chapters', requirePermission('CONTENT', 'MONOGRAPHS', 'ADD'), createChapter);
router.put('/chapters/:id', requirePermission('CONTENT', 'MONOGRAPHS', 'EDIT'), updateChapter);
router.patch('/chapters/:id/status', requirePermission('CONTENT', 'MONOGRAPHS', 'EDIT'), toggleChapterStatus);
router.delete('/chapters/:id', requirePermission('CONTENT', 'MONOGRAPHS', 'DELETE'), deleteChapter);

// ==========================================
// SUB-CHAPTERS ROUTES
// ==========================================
router.get('/sub-chapters/active', getActiveSubChapters);
router.get('/sub-chapters', requirePermission('CONTENT', 'MONOGRAPHS', 'VIEW'), getSubChapters);
router.get('/sub-chapters/:id', requirePermission('CONTENT', 'MONOGRAPHS', 'VIEW'), getSubChapterById);
router.post('/sub-chapters', requirePermission('CONTENT', 'MONOGRAPHS', 'ADD'), createSubChapter);
router.put('/sub-chapters/:id', requirePermission('CONTENT', 'MONOGRAPHS', 'EDIT'), updateSubChapter);
router.patch('/sub-chapters/:id/status', requirePermission('CONTENT', 'MONOGRAPHS', 'EDIT'), toggleSubChapterStatus);
router.delete('/sub-chapters/:id', requirePermission('CONTENT', 'MONOGRAPHS', 'DELETE'), deleteSubChapter);

// ==========================================
// TABLES ROUTES
// ==========================================
router.get('/tables/active', getActiveTables);
router.get('/tables', requirePermission('CONTENT', 'MONOGRAPHS', 'VIEW'), getTables);
router.get('/tables/:id', requirePermission('CONTENT', 'MONOGRAPHS', 'VIEW'), getTableById);
router.post('/tables', requirePermission('CONTENT', 'MONOGRAPHS', 'ADD'), createTable);
router.put('/tables/:id', requirePermission('CONTENT', 'MONOGRAPHS', 'EDIT'), updateTable);
router.patch('/tables/:id/status', requirePermission('CONTENT', 'MONOGRAPHS', 'EDIT'), toggleTableStatus);
router.delete('/tables/:id', requirePermission('CONTENT', 'MONOGRAPHS', 'DELETE'), deleteTable);

// ==========================================
// MEDICINES / MONOGRAPHS ROUTES
// ==========================================
router.get('/medicines', requirePermission('CONTENT', 'MONOGRAPHS', 'VIEW'), getMedicines);
router.get('/medicines/:id', requirePermission('CONTENT', 'MONOGRAPHS', 'VIEW'), getMedicineById);
router.post('/medicines', requirePermission('CONTENT', 'MONOGRAPHS', 'ADD'), createMedicine);
router.put('/medicines/:id', requirePermission('CONTENT', 'MONOGRAPHS', 'EDIT'), updateMedicine);
router.patch('/medicines/:id/status', requirePermission('CONTENT', 'MONOGRAPHS', 'EDIT'), toggleMedicineStatus);
router.delete('/medicines/:id', requirePermission('CONTENT', 'MONOGRAPHS', 'DELETE'), deleteMedicine);

// ==========================================
// MEDICINE SECTIONS ROUTES
// ==========================================
router.get('/medicines/:id/sections', requirePermission('CONTENT', 'MONOGRAPHS', 'VIEW'), getMedicineSections);
router.post('/medicines/:id/sections', requirePermission('CONTENT', 'MONOGRAPHS', 'ADD'), addMedicineSection);
router.put('/medicines/:id/sections/:sectionId', requirePermission('CONTENT', 'MONOGRAPHS', 'EDIT'), updateMedicineSection);
router.delete('/medicines/:id/sections/:sectionId', requirePermission('CONTENT', 'MONOGRAPHS', 'DELETE'), deleteMedicineSection);
router.post('/medicines/:id/sections/reorder', requirePermission('CONTENT', 'MONOGRAPHS', 'EDIT'), reorderMedicineSections);

export default router;
