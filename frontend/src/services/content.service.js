import api from './api';

export const contentService = {
  // Stats
  getStats: async () => api.get('/content/stats'),

  // Chapters
  getChapters: async (params = {}) => api.get('/content/chapters', { params }),
  getActiveChapters: async () => api.get('/content/chapters/active'),
  getChapterById: async (id) => api.get(`/content/chapters/${id}`),
  createChapter: async (data) => api.post('/content/chapters', data),
  updateChapter: async (id, data) => api.put(`/content/chapters/${id}`, data),
  toggleChapterStatus: async (id, isActive) => api.patch(`/content/chapters/${id}/status`, { isActive }),
  deleteChapter: async (id) => api.delete(`/content/chapters/${id}`),

  // Sub-Chapters
  getSubChapters: async (params = {}) => api.get('/content/sub-chapters', { params }),
  getActiveSubChapters: async (chapterId) => api.get('/content/sub-chapters/active', { params: { chapterId } }),
  getSubChapterById: async (id) => api.get(`/content/sub-chapters/${id}`),
  createSubChapter: async (data) => api.post('/content/sub-chapters', data),
  updateSubChapter: async (id, data) => api.put(`/content/sub-chapters/${id}`, data),
  toggleSubChapterStatus: async (id, isActive) => api.patch(`/content/sub-chapters/${id}/status`, { isActive }),
  deleteSubChapter: async (id) => api.delete(`/content/sub-chapters/${id}`),

  // Tables
  getTables: async (params = {}) => api.get('/content/tables', { params }),
  getActiveTables: async () => api.get('/content/tables/active'),
  getTableById: async (id) => api.get(`/content/tables/${id}`),
  createTable: async (data) => api.post('/content/tables', data),
  updateTable: async (id, data) => api.put(`/content/tables/${id}`, data),
  toggleTableStatus: async (id, isActive) => api.patch(`/content/tables/${id}/status`, { isActive }),
  deleteTable: async (id) => api.delete(`/content/tables/${id}`),

  // Medicines
  getMedicines: async (params = {}) => api.get('/content/medicines', { params }),
  getMedicineById: async (id) => api.get(`/content/medicines/${id}`),
  createMedicine: async (data) => api.post('/content/medicines', data),
  updateMedicine: async (id, data) => api.put(`/content/medicines/${id}`, data),
  toggleMedicineStatus: async (id, isActive) => api.patch(`/content/medicines/${id}/status`, { isActive }),
  deleteMedicine: async (id) => api.delete(`/content/medicines/${id}`),

  // Sections
  getMedicineSections: async (medicineId) => api.get(`/content/medicines/${medicineId}/sections`),
  addMedicineSection: async (medicineId, data) => api.post(`/content/medicines/${medicineId}/sections`, data),
  updateMedicineSection: async (medicineId, sectionId, data) => api.put(`/content/medicines/${medicineId}/sections/${sectionId}`, data),
  deleteMedicineSection: async (medicineId, sectionId) => api.delete(`/content/medicines/${medicineId}/sections/${sectionId}`),
  reorderMedicineSections: async (medicineId, orderedSectionIds) => api.post(`/content/medicines/${medicineId}/sections/reorder`, { orderedSectionIds }),
};

export default contentService;
