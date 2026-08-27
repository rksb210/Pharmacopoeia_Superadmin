import mongoose from 'mongoose';
import * as XLSX from 'xlsx';
import crypto from 'crypto';
import bcrypt from 'bcrypt';
import BulkImport from '../models/bulkImport.model.js';
import Subscriber from '../models/subscriber.model.js';
import Subscription from '../models/subscription.model.js';
import Plan from '../models/plan.model.js';
import SystemConfig from '../models/systemConfig.model.js';

const findJobSafely = (id) => {
  if (!id) return null;
  const isObjectId = mongoose.isValidObjectId(id);
  const query = isObjectId ? { $or: [{ _id: id }, { jobId: id }] } : { jobId: id };
  return BulkImport.findOne(query);
};

export const bulkImportService = {
  /**
   * Generate Official Formatted Excel Template
   */
  generateTemplate: () => {
    const headers = [
      'Full Name',
      'Email Address',
      'Phone Number',
      'User Type (STUDENT/DOCTOR/PHARMACIST/NURSE/INDUSTRY/OTHERS)',
      'Plan Code (Optional - e.g. NFI-INDIVIDUAL, NFI-STUDENT-SPECIAL)',
      'APAAR ID (Required for Student)',
      'Registration No (Required for Doctor/Pharmacist/Nurse)',
      'Registration State (Required for Doctor/Pharmacist/Nurse)',
      'GSTIN (Required for Industry)',
      'PAN (Required for Industry)',
      'Designation (For Others)',
    ];

    const sampleRows = [
      [
        'Dr. Rajeshwar Sharma',
        'dr.rajeshwar@aiims.edu',
        '+919811223344',
        'DOCTOR',
        'NFI-INDIVIDUAL',
        '',
        'MCI-DL-84920',
        'Delhi',
        '',
        '',
        '',
      ],
      [
        'Ananya Sengupta',
        'ananya.s@pgimer.edu.in',
        '+919822334455',
        'STUDENT',
        'NFI-STUDENT-SPECIAL',
        'APAAR-2026-9841',
        '',
        '',
        '',
        '',
        '',
      ],
      [
        'Vikramaditya Pharma Labs',
        'regulatory@vikrampharma.com',
        '+919833445566',
        'INDUSTRY',
        'NFI-INSTITUTIONAL',
        '',
        '',
        '',
        '07AAAAA0000A1Z5',
        'AAACV1234D',
        '',
      ],
      [
        'Pooja Nair',
        'pooja.nair@apollo.com',
        '+919844556677',
        'PHARMACIST',
        'NFI-INDIVIDUAL',
        '',
        'KSPC-84192',
        'Karnataka',
        '',
        '',
        '',
      ],
    ];

    const wsData = [headers, ...sampleRows];
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Subscribers_Import_Template');

    return XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
  },

  /**
   * Parse & Validate Uploaded Excel / CSV
   */
  parseAndValidateFile: async (fileBuffer, { fileName, institutionName, billingContact = '', defaultPlanCode = 'NFI-INDIVIDUAL', adminUser }) => {
    const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    if (!sheetName) throw new Error('Uploaded Excel file contains no valid sheets.');

    const sheet = workbook.Sheets[sheetName];
    const rawRows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });

    if (rawRows.length < 2) {
      throw new Error('The uploaded file contains no subscriber records or data rows.');
    }

    const headers = rawRows[0].map((h) => String(h).trim().toLowerCase());
    const dataRows = rawRows.slice(1);

    // Resolve Default Plan details
    const selectedPlan = await Plan.findOne({ code: defaultPlanCode.toUpperCase().trim() });
    const planName = selectedPlan?.name || 'NFI 9th Edition Formulary';
    const tier = selectedPlan?.tier || 'Institutional';

    // In-file duplicate tracker
    const seenEmailsInFile = new Set();
    const validatedRecords = [];

    // Pre-fetch all registered subscriber emails in database for fast duplicate check
    const existingEmailsList = await Subscriber.find({}).select('email').lean();
    const registeredEmails = new Set(existingEmailsList.map((s) => s.email.toLowerCase()));

    for (let i = 0; i < dataRows.length; i++) {
      const row = dataRows[i];
      if (row.length === 0 || row.every((c) => String(c).trim() === '')) continue;

      const rowNumber = i + 2; // 1-indexed (row 1 is header)
      const name = String(row[0] || '').trim();
      const email = String(row[1] || '').trim().toLowerCase();
      const phoneNumber = String(row[2] || '').trim();
      const userType = String(row[3] || 'OTHERS').toUpperCase().trim();
      const rowPlanCode = String(row[4] || defaultPlanCode).toUpperCase().trim();
      const apaarId = String(row[5] || '').trim();
      const regNo = String(row[6] || '').trim();
      const state = String(row[7] || '').trim();
      const gstin = String(row[8] || '').trim();
      const pan = String(row[9] || '').trim();
      const designation = String(row[10] || '').trim();

      const errors = [];

      // 1. Name Check
      if (!name) errors.push('Full Name is missing');

      // 2. Email Validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!email) {
        errors.push('Email Address is missing');
      } else if (!emailRegex.test(email)) {
        errors.push(`Invalid email address format '${email}'`);
      } else if (seenEmailsInFile.has(email)) {
        errors.push(`Duplicate email address in this upload file (${email})`);
      } else if (registeredEmails.has(email)) {
        errors.push(`Subscriber with email '${email}' is already registered in the platform`);
      }

      if (email) seenEmailsInFile.add(email);

      // 3. User Type Check
      const validUserTypes = ['STUDENT', 'DOCTOR', 'PHARMACIST', 'NURSE', 'INDUSTRY', 'OTHERS'];
      if (!validUserTypes.includes(userType)) {
        errors.push(`Invalid User Type '${userType}'. Allowed: ${validUserTypes.join(', ')}`);
      }

      // 4. Dynamic Fields Check
      const dynamicFields = {};
      if (userType === 'STUDENT') {
        if (!apaarId) errors.push('APAAR ID / Edu-ID is required for Student accounts');
        dynamicFields.apaarId = apaarId;
      } else if (['DOCTOR', 'PHARMACIST', 'NURSE'].includes(userType)) {
        if (!regNo) errors.push(`Registration No is mandatory for ${userType}`);
        if (!state) errors.push(`State of Registration is mandatory for ${userType}`);
        dynamicFields.registrationNo = regNo;
        dynamicFields.registrationState = state;
      } else if (userType === 'INDUSTRY') {
        const gstinRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
        const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;

        if (!gstin && !pan) {
          errors.push('Either GSTIN or PAN is mandatory for Industry entities');
        }
        if (gstin && !gstinRegex.test(gstin.toUpperCase())) {
          errors.push(`Invalid GSTIN format '${gstin}'. Must be 15 characters (e.g. 22AAAAA0000A1Z5)`);
        }
        if (pan && !panRegex.test(pan.toUpperCase())) {
          errors.push(`Invalid Corporate PAN format '${pan}'. Must be 10 characters (e.g. AAAAA9999A)`);
        }

        dynamicFields.gstin = gstin ? gstin.toUpperCase() : '';
        dynamicFields.pan = pan ? pan.toUpperCase() : '';
      } else if (userType === 'OTHERS') {
        dynamicFields.designation = designation || 'Professional';
      }

      const status = errors.length === 0 ? 'valid' : 'invalid';

      validatedRecords.push({
        rowNumber,
        name,
        email,
        phoneNumber,
        userType: validUserTypes.includes(userType) ? userType : 'OTHERS',
        dynamicFields,
        planCode: rowPlanCode,
        status,
        errors,
      });
    }

    const totalRows = validatedRecords.length;
    const validCount = validatedRecords.filter((r) => r.status === 'valid').length;
    const invalidCount = totalRows - validCount;

    // Generate unique Job ID
    const randomSuffix = crypto.randomBytes(3).toString('hex').toUpperCase();
    const jobId = `BLK-${new Date().getFullYear()}-${randomSuffix}`;

    const bulkJob = await BulkImport.create({
      jobId,
      fileName,
      institutionName: institutionName || 'Institutional Consortium',
      billingContact,
      planCode: defaultPlanCode.toUpperCase(),
      planName,
      tier,
      totalRows,
      validCount,
      invalidCount,
      status: 'preview',
      records: validatedRecords,
      importedBy: adminUser?._id || null,
    });

    return {
      jobId: bulkJob.jobId,
      _id: bulkJob._id,
      fileName: bulkJob.fileName,
      institutionName: bulkJob.institutionName,
      planCode: bulkJob.planCode,
      planName: bulkJob.planName,
      totalRows,
      validCount,
      invalidCount,
      records: validatedRecords,
    };
  },

  /**
   * Confirm and Execute Batch Provisioning
   */
  confirmAndExecuteImport: async (jobIdentifier, adminUser) => {
    const job = await findJobSafely(jobIdentifier);

    if (!job) throw new Error('Bulk import job not found');
    if (job.status === 'completed') {
      throw new Error('This bulk batch has already been processed and imported.');
    }

    const validRecords = job.records.filter((r) => r.status === 'valid');
    if (validRecords.length === 0) {
      throw new Error('No valid records found in this batch to import.');
    }

    job.status = 'processing';
    await job.save();

    // Fetch Plan Details & Fixed Validity Policy (BRD 2031 Rule)
    const plan = await Plan.findOne({ code: job.planCode });
    const fixedConfig = await SystemConfig.findOne({ key: 'SUBSCRIPTION_FIXED_EXPIRY_DATE' });
    const fixedExpiry = fixedConfig?.value
      ? new Date(fixedConfig.value)
      : new Date('2031-12-31T23:59:59.999Z');

    const unitPrice = plan?.priceINR || 3500;
    const count = validRecords.length;
    const subtotal = count * unitPrice;
    const taxAmount = Math.round((subtotal * 18) / 100);
    const finalAmount = subtotal + taxAmount;

    const invoiceNumber = `C-INV-${new Date().getFullYear()}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;

    // Execute User & Subscription Creation
    for (let i = 0; i < job.records.length; i++) {
      const rec = job.records[i];
      if (rec.status !== 'valid') continue;

      try {
        const tempPassword = `Nfi@${crypto.randomBytes(4).toString('hex')}`;
        const hashedPassword = await bcrypt.hash(tempPassword, 10);
        const username = rec.email.split('@')[0].replace(/[^a-zA-Z0-9_]/g, '') + '_' + crypto.randomBytes(2).toString('hex');

        // Create Subscriber Account
        const newSubscriber = await Subscriber.create({
          name: rec.name,
          email: rec.email,
          username,
          password: hashedPassword,
          phoneNumber: rec.phoneNumber,
          userType: rec.userType,
          dynamicFields: rec.dynamicFields,
          institution: job.institutionName,
          status: 'active',
          isEmailVerified: true,
          subscription: {
            status: 'active',
            planName: job.planName,
            tier: job.tier,
            startDate: new Date(),
            endDate: fixedExpiry,
          },
        });

        // Create Official Subscription Pass
        const randomSubNum = Math.floor(10000 + Math.random() * 90000);
        const subscriptionId = `SUB-${new Date().getFullYear()}-${randomSubNum}`;

        const newSubscription = await Subscription.create({
          subscriptionId,
          user: newSubscriber._id,
          planName: job.planName,
          planCode: job.planCode,
          tier: job.tier,
          type: 'paid',
          status: 'active',
          startDate: new Date(),
          endDate: fixedExpiry,
          amount: unitPrice,
          discountPercent: 0,
          finalAmount: unitPrice,
          paymentMethod: 'Consolidated Institutional License',
          paymentStatus: 'success',
          invoiceNumber,
          assignedBy: adminUser?._id || null,
          timeline: [
            {
              action: 'ASSIGNED',
              statusFrom: 'none',
              statusTo: 'active',
              performedBy: adminUser?.name || 'Super Admin',
              reason: `Bulk enrollment via Batch Job ${job.jobId} for ${job.institutionName}`,
            },
          ],
        });

        // Link in record
        rec.status = 'imported';
        rec.userId = newSubscriber._id;
        rec.subscriptionId = newSubscription.subscriptionId;
      } catch (err) {
        rec.status = 'failed';
        rec.errors.push(err.message);
      }
    }

    // Attach Consolidated Institutional Invoice
    job.consolidatedInvoice = {
      invoiceNumber,
      institutionName: job.institutionName,
      billingContact: job.billingContact,
      totalSubscribers: count,
      unitPriceINR: unitPrice,
      subtotalINR: subtotal,
      discountINR: 0,
      taxPercent: 18,
      taxAmountINR: taxAmount,
      finalAmountINR: finalAmount,
      paymentMethod: 'Institutional Invoice / NEFT',
      paymentStatus: 'paid',
      generatedAt: new Date(),
    };

    job.status = 'completed';
    job.completedAt = new Date();
    await job.save();

    return job;
  },

  /**
   * Get Past Bulk Imports History
   */
  getImportHistory: async ({ page = 1, limit = 10, search = '' }) => {
    const query = {};
    if (search && search.trim()) {
      const regex = new RegExp(search.trim(), 'i');
      query.$or = [{ jobId: regex }, { fileName: regex }, { institutionName: regex }];
    }

    const pageNumber = Math.max(1, parseInt(page, 10));
    const pageSize = Math.max(1, Math.min(50, parseInt(limit, 10)));
    const skip = (pageNumber - 1) * pageSize;

    const [jobs, total] = await Promise.all([
      BulkImport.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(pageSize)
        .populate('importedBy', 'name email role')
        .lean(),
      BulkImport.countDocuments(query),
    ]);

    return {
      jobs,
      pagination: {
        total,
        page: pageNumber,
        limit: pageSize,
        totalPages: Math.ceil(total / pageSize) || 1,
      },
    };
  },

  /**
   * Get Bulk Import Job Details by ID
   */
  getImportJobById: async (id) => {
    const job = await findJobSafely(id).populate('importedBy', 'name email role');

    if (!job) throw new Error('Bulk import job not found');
    return job;
  },

  /**
   * Generate Downloadable Excel Error Report
   */
  generateErrorReport: async (jobIdentifier) => {
    const job = await findJobSafely(jobIdentifier);

    if (!job) throw new Error('Bulk import job not found');

    const invalidRecords = job.records.filter((r) => r.status === 'invalid' || r.status === 'failed');
    if (invalidRecords.length === 0) {
      throw new Error('There are no errors or invalid records in this batch.');
    }

    const headers = [
      'Original Row Number',
      'Full Name',
      'Email Address',
      'Phone Number',
      'User Type',
      'Failure Reason(s)',
    ];

    const rows = invalidRecords.map((r) => [
      r.rowNumber,
      r.name,
      r.email,
      r.phoneNumber,
      r.userType,
      r.errors.join('; '),
    ]);

    const wsData = [headers, ...rows];
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Error_Report');

    return XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
  },
};

export default bulkImportService;
