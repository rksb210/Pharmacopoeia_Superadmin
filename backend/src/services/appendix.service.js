import Appendix from '../models/appendix.model.js';

export const appendixService = {
  /**
   * Get overall appendix statistics
   */
  async getStats() {
    const [total, active, withTables, withSections] = await Promise.all([
      Appendix.countDocuments(),
      Appendix.countDocuments({ status: 'ACTIVE' }),
      Appendix.countDocuments({
        $or: [
          { 'tables.0': { $exists: true } },
          { 'structuredTables.0': { $exists: true } },
        ],
      }),
      Appendix.countDocuments({
        $or: [
          { 'structuredSections.0': { $exists: true } },
          { 'subSections.0': { $exists: true } },
        ],
      }),
    ]);

    return {
      total,
      active,
      inactive: Math.max(0, total - active),
      withTables,
      withSections,
    };
  },

  /**
   * Get paginated list of appendices with search & filter
   */
  async getAppendices({
    page = 1,
    limit = 25,
    search = '',
    status = 'all',
    sortBy = 'order',
    sortOrder = 'asc',
  } = {}) {
    const query = {};

    if (status && status !== 'all') {
      query.status = status.toUpperCase();
    }

    if (search && search.trim()) {
      const regex = new RegExp(search.trim(), 'i');
      query.$or = [
        { title: regex },
        { number: regex },
        { slug: regex },
        { sourceText: regex },
      ];
    }

    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.max(1, Math.min(100, parseInt(limit, 10)));
    const skip = (pageNum - 1) * limitNum;

    // Handle numeric or custom sort
    let sort = {};
    if (sortBy === 'order' || sortBy === 'number') {
      sort = { order: sortOrder === 'desc' ? -1 : 1, number: sortOrder === 'desc' ? -1 : 1 };
    } else {
      sort = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };
    }

    const [appendices, total] = await Promise.all([
      Appendix.find(query)
        .sort(sort)
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Appendix.countDocuments(query),
    ]);

    // Format fields for frontend consistency
    const enriched = appendices.map((app) => ({
      ...app,
      isActive: app.status === 'ACTIVE' || app.isActive === true,
      sectionsCount: (app.structuredSections?.length || 0) + (app.subSections?.length || 0),
      tablesCount: (app.structuredTables?.length || 0) + (app.tables?.length || 0),
    }));

    return {
      appendices: enriched,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum) || 1,
      },
    };
  },

  /**
   * Get single appendix by ID
   */
  async getAppendixById(id) {
    const appendix = await Appendix.findById(id).lean();
    if (!appendix) {
      throw new Error('Appendix not found');
    }
    return {
      ...appendix,
      isActive: appendix.status === 'ACTIVE' || appendix.isActive === true,
      sectionsCount: (appendix.structuredSections?.length || 0) + (appendix.subSections?.length || 0),
      tablesCount: (appendix.structuredTables?.length || 0) + (appendix.tables?.length || 0),
    };
  },

  /**
   * Create new Appendix
   */
  async createAppendix(data, user) {
    const number = String(data.number || '').trim();
    const title = String(data.title || '').trim();

    if (!number) throw new Error('Appendix number is required (e.g. "1", "2")');
    if (!title) throw new Error('Appendix title is required');

    const cleanTitle = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    const slug = data.slug?.trim() || `appendix-${number.toLowerCase()}-${cleanTitle}`;

    // Compute default order
    let order = Number(data.order);
    if (isNaN(order) || order <= 0) {
      const maxItem = await Appendix.findOne().sort({ order: -1 }).select('order');
      order = (maxItem?.order || 0) + 1;
    }

    const status = (data.status || 'ACTIVE').toUpperCase();
    const isActive = status === 'ACTIVE';

    const pageRange = {
      start: data.pageRange?.start ? Number(data.pageRange.start) : null,
      end: data.pageRange?.end ? Number(data.pageRange.end) : null,
    };

    const bookPageRange = {
      start: data.bookPageRange?.start ? Number(data.bookPageRange.start) : null,
      end: data.bookPageRange?.end ? Number(data.bookPageRange.end) : null,
    };

    const newAppendix = new Appendix({
      number,
      title,
      slug,
      order,
      status,
      isActive,
      pageRange,
      bookPageRange,
      sourceText: data.sourceText || '',
      structuredSections: data.structuredSections || [],
      structuredTables: data.structuredTables || [],
      subSections: data.subSections || [],
      tables: data.tables || [],
      submittedBy: user?._id || null,
    });

    const saved = await newAppendix.save();
    return saved;
  },

  /**
   * Update Appendix
   */
  async updateAppendix(id, data, user) {
    const appendix = await Appendix.findById(id);
    if (!appendix) throw new Error('Appendix not found');

    if (data.number !== undefined) appendix.number = String(data.number).trim();
    if (data.title !== undefined) appendix.title = String(data.title).trim();
    if (data.order !== undefined) appendix.order = Number(data.order);
    if (data.sourceText !== undefined) appendix.sourceText = data.sourceText;

    if (data.slug !== undefined && data.slug.trim()) {
      appendix.slug = data.slug.trim().toLowerCase();
    } else if (data.title || data.number) {
      const cleanTitle = appendix.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
      appendix.slug = `appendix-${appendix.number.toLowerCase()}-${cleanTitle}`;
    }

    if (data.pageRange !== undefined) {
      appendix.pageRange = {
        start: data.pageRange?.start ? Number(data.pageRange.start) : null,
        end: data.pageRange?.end ? Number(data.pageRange.end) : null,
      };
    }

    if (data.bookPageRange !== undefined) {
      appendix.bookPageRange = {
        start: data.bookPageRange?.start ? Number(data.bookPageRange.start) : null,
        end: data.bookPageRange?.end ? Number(data.bookPageRange.end) : null,
      };
    }

    if (data.status !== undefined) {
      appendix.status = data.status.toUpperCase();
      appendix.isActive = appendix.status === 'ACTIVE';
    } else if (data.isActive !== undefined) {
      appendix.isActive = Boolean(data.isActive);
      appendix.status = appendix.isActive ? 'ACTIVE' : 'INACTIVE';
    }

    if (Array.isArray(data.structuredSections)) {
      appendix.structuredSections = data.structuredSections;
    }

    if (Array.isArray(data.structuredTables)) {
      appendix.structuredTables = data.structuredTables;
    }

    const saved = await appendix.save();
    return saved;
  },

  /**
   * Toggle Appendix Active Status
   */
  async toggleAppendixStatus(id, isActive) {
    const appendix = await Appendix.findById(id);
    if (!appendix) throw new Error('Appendix not found');

    appendix.isActive = Boolean(isActive);
    appendix.status = appendix.isActive ? 'ACTIVE' : 'INACTIVE';

    const saved = await appendix.save();
    return saved;
  },

  /**
   * Delete Appendix
   */
  async deleteAppendix(id) {
    const appendix = await Appendix.findById(id);
    if (!appendix) throw new Error('Appendix not found');

    const title = appendix.title;
    const number = appendix.number;
    await Appendix.findByIdAndDelete(id);

    return {
      success: true,
      message: `Appendix ${number}: "${title}" has been deleted.`,
    };
  },
};

export default appendixService;
