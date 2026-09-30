import mongoose from 'mongoose';
import * as XLSX from 'xlsx';
import crypto from 'crypto';
import bcrypt from 'bcrypt';
import BulkImport from '../models/bulkImport.model.js';
import Subscriber from '../models/subscriber.model.js';
import Subscription from '../models/subscription.model.js';
import Plan from '../models/plan.model.js';
import Coupon from '../models/coupon.model.js';
import SystemConfig from '../models/systemConfig.model.js';
import { couponService } from './coupon.service.js';

const findJobSafely = (id) => {
  if (!id) return null;
  const isObjectId = mongoose.isValidObjectId(id);
  const query = isObjectId
    ? { $or: [{ _id: id }, { jobId: id }, { batchReference: id }] }
    : { $or: [{ jobId: id }, { batchReference: id }] };
  return BulkImport.findOne(query);
};

const cleanStr = (val) => String(val ?? '').trim();

/**
 * Find matching bulk discount slab from plan.bulkDiscountSlabs
 */
const findMatchingBulkSlab = (plan, seatCount) => {
  const slabs = plan?.bulkDiscountSlabs;
  if (!Array.isArray(slabs) || slabs.length === 0) return null;
  const qty = Math.max(1, Number(seatCount) || 1);
  return (
    slabs.find((s) => {
      const min = Number(s.minQty) || 1;
      const max = s.maxQty !== null && s.maxQty !== undefined && s.maxQty !== '' ? Number(s.maxQty) : Infinity;
      return qty >= min && qty <= max;
    }) || null
  );
};

/**
 * Calculate bulk pricing (Volume Slab Discount + Promo Coupon + Dynamic GST)
 */
const calculateBulkPricing = (plan, seatCount, couponDiscountINR = 0) => {
  const count = Math.max(0, Number(seatCount) || 0);
  const unitPriceINR = Number(plan?.priceINR) || 660;
  const subtotalINR = count * unitPriceINR;

  const matchedSlab = findMatchingBulkSlab(plan, count);
  const slabDiscountPercent = Number(matchedSlab?.discountPercent) || 0;
  const slabDiscountINR = Math.round((subtotalINR * slabDiscountPercent) / 100);

  const afterSlabAmount = Math.max(0, subtotalINR - slabDiscountINR);
  const effectiveCouponDiscountINR = Math.min(afterSlabAmount, Math.max(0, Number(couponDiscountINR) || 0));
  const totalDiscountINR = slabDiscountINR + effectiveCouponDiscountINR;
  const taxableBaseINR = Math.max(0, subtotalINR - totalDiscountINR);

  // Dynamic GST: Physical book only is exempt (0%). Online Digital & Hybrid are 18% GST.
  const isPhysical =
    plan?.deliveryType === 'PHYSICAL' ||
    plan?.isGstApplicable === false ||
    String(plan?.code || '').toUpperCase() === 'NFI-2026' && String(plan?.name || '').toLowerCase().includes('physical');
  const taxPercent = isPhysical ? 0 : (plan?.gstRatePercent ?? 18);
  const taxAmountINR = taxPercent > 0 ? Math.round((taxableBaseINR * taxPercent) / 100) : 0;
  const finalAmountINR = taxableBaseINR + taxAmountINR;

  return {
    totalSubscribers: count,
    unitPriceINR,
    subtotalINR,
    slabLabel: matchedSlab?.label || '',
    slabDiscountPercent,
    slabDiscountINR,
    couponDiscountINR: effectiveCouponDiscountINR,
    discountINR: totalDiscountINR,
    taxableBaseINR,
    taxPercent,
    taxAmountINR,
    finalAmountINR,
  };
};

/**
 * Normalize a BulkImport / BulkImportJob document for unified Admin UI display
 */
const normalizeJobDoc = (j) => {
  if (!j) return j;
  const doc = typeof j.toObject === 'function' ? j.toObject() : { ...j };

  const jobId = doc.jobId || doc.batchReference || `BATCH-${String(doc._id).slice(-6).toUpperCase()}`;
  const batchReference = doc.batchReference || doc.jobId || jobId;
  const fileName = doc.fileName || doc.uploadedFileName || 'Direct_Manual_Roster.xlsx';
  const validCount = doc.validCount || doc.validRows || 0;
  const invalidCount = doc.invalidCount || doc.failedRows || 0;
  const totalRows = doc.totalRows || validCount + invalidCount || (doc.records?.length || 0);
  const planCode = doc.planCode || doc.plan?.planId || 'NFI-INSTITUTIONAL';
  const planName = doc.planName || doc.plan?.name || 'NFI Formulary Access Pass';
  const status = (doc.status || 'completed').toLowerCase();

  const unitPriceINR =
    doc.consolidatedInvoice?.unitPriceINR ||
    doc.plan?.pricePerSeat ||
    (doc.invoice?.subtotal && validCount ? Math.round(doc.invoice.subtotal / validCount) : 3500);
  const subtotalINR =
    doc.consolidatedInvoice?.subtotalINR ?? doc.invoice?.subtotal ?? validCount * unitPriceINR;
  const finalAmountINR =
    doc.consolidatedInvoice?.finalAmountINR ?? doc.invoice?.totalAmount ?? subtotalINR;

  const consolidatedInvoice = doc.consolidatedInvoice?.invoiceNumber
    ? {
        ...doc.consolidatedInvoice,
        taxPercent: doc.consolidatedInvoice.taxPercent ?? (isPhysicalOnly ? 0 : 18),
        taxAmountINR: doc.consolidatedInvoice.taxAmountINR ?? 0,
      }
    : {
        invoiceNumber: doc.invoice?.invoiceNumber || `INV-${jobId}`,
        institutionName: doc.institutionName || 'Institutional Partner',
        billingContact:
          doc.billingContact ||
          doc.coordinator?.email ||
          doc.coordinator?.name ||
          'Institutional Coordinator',
        billingAddress: doc.coordinator?.address || '',
        gstin: doc.coordinator?.gstin || '',
        pan: doc.coordinator?.pan || '',
        state: doc.coordinator?.state || '',
        totalSubscribers: validCount,
        unitPriceINR,
        subtotalINR,
        slabDiscountPercent: 0,
        slabDiscountINR: 0,
        couponCode: doc.couponCode || '',
        couponDiscountINR: 0,
        discountINR: doc.invoice?.discountAmount || Math.max(0, subtotalINR - finalAmountINR),
        taxPercent: doc.invoice?.taxRate ?? (isPhysicalOnly ? 0 : 18),
        taxAmountINR: doc.invoice?.taxAmount ?? 0,
        finalAmountINR,
        paymentMethod: doc.invoice?.paymentMethod || doc.paymentMethod || 'Razorpay Online Gateway',
        paymentStatus: (doc.invoice?.paymentStatus || doc.invoice?.status || 'paid').toLowerCase(),
        paymentReference:
          doc.consolidatedInvoice?.paymentReference ||
          doc.consolidatedInvoice?.transactionId ||
          doc.invoice?.paymentReference ||
          doc.invoice?.transactionId ||
          doc.paymentReference ||
          '',
        transactionId:
          doc.consolidatedInvoice?.transactionId ||
          doc.consolidatedInvoice?.paymentReference ||
          doc.invoice?.transactionId ||
          doc.invoice?.paymentReference ||
          '',
        generatedAt: doc.invoice?.invoiceDate || doc.createdAt || new Date(),
      };

  const records = (doc.records || []).map((r, idx) => ({
    ...r,
    rowNumber: r.rowNumber || idx + 1,
    phoneNumber: r.phoneNumber || r.phone || '',
    phone: r.phone || r.phoneNumber || '',
    userType: r.userType || doc.userType || 'STUDENT',
    status:
      r.status === 'ENROLLED'
        ? 'imported'
        : r.status === 'VALID'
        ? 'valid'
        : r.status === 'INVALID'
        ? 'invalid'
        : r.status === 'FAILED'
        ? 'failed'
        : r.status || 'valid',
    errors:
      Array.isArray(r.errors) && r.errors.length > 0
        ? r.errors
        : r.remarks && (r.status === 'INVALID' || r.status === 'FAILED' || r.status === 'invalid')
        ? [r.remarks]
        : [],
  }));

  return {
    ...doc,
    jobId,
    batchReference,
    fileName,
    validCount,
    invalidCount,
    totalRows,
    planCode,
    planName,
    status,
    consolidatedInvoice,
    records,
  };
};

/**
 * Determine default member userType based on institution stakeholder type
 */
const resolveMemberUserType = (stakeholderType, rowCategory = '') => {
  const upperRow = cleanStr(rowCategory).toUpperCase();
  const explicitTypes = [
    'STUDENT',
    'DOCTOR',
    'PHARMACIST',
    'NURSE',
    'INDUSTRY',
    'UNIVERSITIES_COLLEGES',
    'HOSPITALS',
    'RETAIL_PHARMACIST',
    'OTHERS',
  ];
  if (explicitTypes.includes(upperRow)) return upperRow;

  const st = cleanStr(stakeholderType).toUpperCase();
  if (st === 'UNIVERSITIES_COLLEGES') return 'STUDENT';
  if (st === 'HOSPITALS' || st === 'HOSPITAL') return 'DOCTOR';
  if (st === 'RETAIL_PHARMACIST') return 'PHARMACIST';
  if (st === 'INDUSTRY') return 'INDUSTRY';
  return 'OTHERS';
};

/**
 * Shared row validation logic for both Excel upload and Direct Manual Entry table
 */
const validateRosterRows = async ({
  normalizedRows,
  institutionName,
  institutionId = null,
  stakeholderType = 'UNIVERSITIES_COLLEGES',
  coordinator = {},
  defaultPlanCode = '',
  fileName = 'Direct_Manual_Roster.xlsx',
  adminUser = null,
}) => {
  // Resolve Selected Plan
  let selectedPlan = null;
  if (defaultPlanCode) {
    if (mongoose.isValidObjectId(defaultPlanCode)) {
      selectedPlan = await Plan.findById(defaultPlanCode);
    }
    if (!selectedPlan) {
      selectedPlan = await Plan.findOne({ code: defaultPlanCode.toUpperCase().trim() });
    }
  }
  if (!selectedPlan) {
    selectedPlan = await Plan.findOne({ isActive: true }).sort({ createdAt: 1 });
  }

  const planCode = selectedPlan?.code || defaultPlanCode || 'NFI-ONLINE';
  const planName = selectedPlan?.name || 'NFI 9th Edition Formulary Pass';
  const tier = selectedPlan?.tier || 'Institutional';

  // Collect emails & phones for bulk DB duplicate check
  const candidateEmails = normalizedRows.map((r) => r.email).filter(Boolean);
  const existingSubscribers = await Subscriber.find(
    candidateEmails.length > 0 ? { email: { $in: candidateEmails } } : {},
    { email: 1, phoneNumber: 1 }
  ).lean();

  const existingDbEmails = new Set(
    existingSubscribers.map((s) => cleanStr(s.email).toLowerCase()).filter(Boolean)
  );

  const seenEmailsInBatch = new Set();
  const seenPhonesInBatch = new Set();
  const validatedRecords = [];

  for (let i = 0; i < normalizedRows.length; i++) {
    const r = normalizedRows[i];
    const rowNumber = r.rowNumber || i + 1;
    const name = cleanStr(r.name);
    const email = cleanStr(r.email).toLowerCase();
    const rawPhone = cleanStr(r.phone);
    const phoneDigits = rawPhone.replace(/\D/g, '').slice(-10);
    const formattedPhone = phoneDigits.length === 10 ? `+91 ${phoneDigits}` : rawPhone;
    const roleOrCategory = cleanStr(r.roleOrCategory);
    const rollOrEmployeeId = cleanStr(r.rollOrEmployeeId);
    const department = cleanStr(r.department);
    const address = cleanStr(r.address || coordinator?.address || '');
    const userType = resolveMemberUserType(stakeholderType, r.userType || roleOrCategory);

    const errors = [];

    // 1. Name Check (if provided, min 2 chars; fallback to email prefix on import)
    if (name && name.length < 2) {
      errors.push('Name is too short (minimum 2 characters)');
    }

    // 2. Email Validation (Mandatory)
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email) {
      errors.push('Email Address is required');
    } else if (!emailRegex.test(email)) {
      errors.push(`Invalid email format '${email}'`);
    } else if (seenEmailsInBatch.has(email)) {
      errors.push(`Duplicate email in this batch (${email})`);
    } else if (existingDbEmails.has(email)) {
      errors.push(`Email '${email}' is already registered in NFI Portal`);
    }
    if (email) seenEmailsInBatch.add(email);

    // 3. 10-digit Indian Mobile Number Validation (Mandatory, matching User Portal)
    if (!phoneDigits) {
      errors.push('10-digit Mobile Number is required');
    } else if (phoneDigits.length !== 10) {
      errors.push('Mobile number must be 10 digits');
    } else if (!/^[6-9]/.test(phoneDigits)) {
      errors.push('Mobile number must start with 6, 7, 8, or 9');
    } else if (seenPhonesInBatch.has(phoneDigits)) {
      errors.push(`Duplicate mobile number in this batch (${phoneDigits})`);
    }
    if (phoneDigits) seenPhonesInBatch.add(phoneDigits);

    const status = errors.length === 0 ? 'valid' : 'invalid';

    validatedRecords.push({
      rowNumber,
      name: name || (email ? email.split('@')[0] : ''),
      email,
      phone: formattedPhone,
      phoneNumber: formattedPhone,
      address,
      userType,
      roleOrCategory: roleOrCategory || userType,
      rollOrEmployeeId,
      department,
      dynamicFields: {
        roleOrCategory: roleOrCategory || userType,
        rollOrEmployeeId,
        department,
        collegeOrCompany: institutionName,
        address,
        gstin: coordinator?.gstin || '',
        pan: coordinator?.pan || '',
        state: coordinator?.state || '',
      },
      planCode,
      status,
      errors,
      remarks: errors.length > 0 ? errors.join(', ') : 'Ready for enrollment',
    });
  }

  const totalRows = validatedRecords.length;
  const validCount = validatedRecords.filter((r) => r.status === 'valid').length;
  const invalidCount = totalRows - validCount;

  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const randomSuffix = crypto.randomBytes(2).toString('hex').toUpperCase();
  const batchReference = `BATCH-${year}-${month}-${randomSuffix}`;
  const jobId = batchReference;

  const pricingPreview = calculateBulkPricing(selectedPlan, validCount, 0);

  const bulkJob = await BulkImport.create({
    jobId,
    batchReference,
    fileName,
    uploadedFileName: fileName,
    institutionName: institutionName || 'Institutional Partner',
    institutionId: institutionId && mongoose.isValidObjectId(institutionId) ? institutionId : null,
    userType: stakeholderType || 'UNIVERSITIES_COLLEGES',
    billingContact: coordinator?.email || coordinator?.phone || '',
    coordinator: {
      name: coordinator?.name || adminUser?.name || 'Institutional Coordinator',
      email: cleanStr(coordinator?.email || adminUser?.email || '').toLowerCase(),
      phone: cleanStr(coordinator?.phone || ''),
      address: cleanStr(coordinator?.address || ''),
      gstin: cleanStr(coordinator?.gstin || '').toUpperCase(),
      pan: cleanStr(coordinator?.pan || '').toUpperCase(),
      state: cleanStr(coordinator?.state || ''),
    },
    planCode,
    planName,
    plan: {
      planId: selectedPlan?._id?.toString() || planCode,
      name: planName,
      pricePerSeat: pricingPreview.unitPriceINR,
      validityMonths: 12,
    },
    tier,
    totalRows,
    validCount,
    invalidCount,
    validRows: validCount,
    failedRows: invalidCount,
    status: 'preview',
    records: validatedRecords,
    importedBy: adminUser?._id || null,
  });

  return {
    jobId: bulkJob.jobId,
    batchReference: bulkJob.batchReference,
    _id: bulkJob._id,
    fileName: bulkJob.fileName,
    institutionName: bulkJob.institutionName,
    userType: bulkJob.userType,
    coordinator: bulkJob.coordinator,
    planCode: bulkJob.planCode,
    planName: bulkJob.planName,
    plan: selectedPlan,
    pricingPreview,
    totalRows,
    validCount,
    invalidCount,
    records: validatedRecords,
  };
};

export const bulkImportService = {
  /**
   * 1. Generate Official 6-Column Excel Template (Matched with User Portal)
   */
  generateTemplate: (userType = 'UNIVERSITIES_COLLEGES') => {
    const type = String(userType || 'UNIVERSITIES_COLLEGES').toUpperCase();
    const isAcademic = type === 'UNIVERSITIES_COLLEGES';
    const isHospital = type === 'HOSPITALS' || type === 'HOSPITAL';
    const isRetail = type === 'RETAIL_PHARMACIST';

    let headers;
    let sampleRows;

    if (isAcademic) {
      headers = [
        'Full Name',
        'Email Address',
        'Mobile Number',
        'Category / Role',
        'Roll / Enrollment Number',
        'Department / Course',
      ];
      sampleRows = [
        [
          'Aarav Sharma',
          'aarav.sharma@aiims.edu',
          '9876543210',
          'Student (B.Pharm)',
          'AIIMS-2026-001',
          'Pharmacology',
        ],
        [
          'Dr. Meera Nair',
          'meera.nair@aiims.edu',
          '9876543211',
          'Faculty / Professor',
          'FAC-2026-104',
          'Clinical Pharmacy',
        ],
      ];
    } else if (isHospital) {
      headers = [
        'Full Name',
        'Email Address',
        'Mobile Number',
        'Designation / Role',
        'Staff ID / Reg No.',
        'Ward / Department',
      ];
      sampleRows = [
        [
          'Dr. Rajeshwar Sharma',
          'dr.rajeshwar@apollo.com',
          '9811223344',
          'Senior Consultant',
          'MCI-DL-84920',
          'Internal Medicine',
        ],
        [
          'Pooja Nair',
          'pooja.nair@apollo.com',
          '9844556677',
          'Clinical Pharmacist',
          'KSPC-84192',
          'Hospital Pharmacy',
        ],
      ];
    } else if (isRetail) {
      headers = [
        'Full Name',
        'Email Address',
        'Mobile Number',
        'Designation / Role',
        'Pharmacist Reg No.',
        'Branch / Store Location',
      ];
      sampleRows = [
        [
          'Ramesh Gupta',
          'ramesh.g@medplus.in',
          '9822334455',
          'Chief Pharmacist',
          'DL-PH-19283',
          'Connaught Place Branch',
        ],
      ];
    } else {
      headers = [
        'Full Name',
        'Email Address',
        'Mobile Number',
        'Designation / Job Title',
        'Employee ID',
        'Department / Division',
      ];
      sampleRows = [
        [
          'Siddharth Roy',
          'siddharth.roy@biopharma-labs.com',
          '9823456781',
          'Senior Research Scientist',
          'EMP-8921',
          'R&D Formulation',
        ],
        [
          'Kavita Reddy',
          'kavita.r@biopharma-labs.com',
          '9834567812',
          'Regulatory Affairs Lead',
          'EMP-8945',
          'Regulatory & Compliance',
        ],
      ];
    }

    const ws = XLSX.utils.aoa_to_sheet([headers, ...sampleRows]);
    ws['!cols'] = [
      { wch: 24 },
      { wch: 34 },
      { wch: 18 },
      { wch: 24 },
      { wch: 26 },
      { wch: 26 },
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Subscribers_Import');

    return XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
  },

  /**
   * 2A. Parse & Validate Uploaded Excel / CSV File
   */
  parseAndValidateFile: async (
    fileBuffer,
    {
      fileName,
      institutionName,
      institutionId = null,
      userType = 'UNIVERSITIES_COLLEGES',
      billingContact = '',
      coordinator = {},
      defaultPlanCode = '',
      adminUser,
    }
  ) => {
    const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    if (!sheetName) throw new Error('Uploaded Excel file contains no valid sheets.');

    const sheet = workbook.Sheets[sheetName];
    const jsonRows = XLSX.utils.sheet_to_json(sheet, { defval: '' });
    if (!jsonRows || jsonRows.length === 0) {
      throw new Error('The uploaded file contains no subscriber records or data rows.');
    }

    const normalizedRows = jsonRows.map((row, idx) => {
      const vals = Object.values(row);
      const name = cleanStr(row['Full Name'] || row['Name'] || row['name'] || vals[0]);
      const email = cleanStr(row['Email Address'] || row['Email'] || row['email'] || vals[1]);
      const phone = cleanStr(
        row['Mobile Number'] || row['Phone Number'] || row['Mobile'] || row['Phone'] || row['phone'] || vals[2]
      );
      const roleOrCategory = cleanStr(
        row['Category / Role'] ||
          row['Designation / Job Title'] ||
          row['Designation / Role'] ||
          row['Role'] ||
          row['Designation'] ||
          vals[3]
      );
      const rollOrEmployeeId = cleanStr(
        row['Roll / Enrollment Number'] ||
          row['Employee ID'] ||
          row['Staff ID / Reg No.'] ||
          row['Pharmacist Reg No.'] ||
          row['Roll No'] ||
          row['ID'] ||
          vals[4]
      );
      const department = cleanStr(
        row['Department / Course'] ||
          row['Department / Division'] ||
          row['Ward / Department'] ||
          row['Branch / Store Location'] ||
          row['Department'] ||
          vals[5]
      );

      return {
        rowNumber: idx + 2,
        name,
        email,
        phone,
        roleOrCategory,
        rollOrEmployeeId,
        department,
      };
    });

    return validateRosterRows({
      normalizedRows,
      institutionName,
      institutionId,
      stakeholderType: userType,
      coordinator: {
        ...coordinator,
        email: coordinator?.email || billingContact || '',
      },
      defaultPlanCode,
      fileName,
      adminUser,
    });
  },

  /**
   * 2B. Validate Direct Manual Entry Rows from Admin Roster Table
   */
  validateDirectRows: async ({
    rows = [],
    institutionName,
    institutionId = null,
    userType = 'UNIVERSITIES_COLLEGES',
    billingContact = '',
    coordinator = {},
    defaultPlanCode = '',
    adminUser,
  }) => {
    if (!Array.isArray(rows) || rows.length === 0) {
      throw new Error('Please enter at least one member row in the roster table.');
    }

    const normalizedRows = rows.map((r, idx) => ({
      rowNumber: idx + 1,
      name: r.name,
      email: r.email,
      phone: r.phone || r.phoneNumber,
      address: r.address,
      roleOrCategory: r.roleOrCategory,
      rollOrEmployeeId: r.rollOrEmployeeId,
      department: r.department,
    }));

    return validateRosterRows({
      normalizedRows,
      institutionName,
      institutionId,
      stakeholderType: userType,
      coordinator: {
        ...coordinator,
        email: coordinator?.email || billingContact || '',
      },
      defaultPlanCode,
      fileName: 'Direct_Manual_Roster.xlsx',
      adminUser,
    });
  },

  /**
   * 3. Confirm and Execute Batch Provisioning (With Slab Discount, Coupon & 0% GST)
   */
  confirmAndExecuteImport: async (
    jobIdentifier,
    adminUser,
    {
      couponCode = '',
      paymentMethod = 'Institutional Invoice / NEFT',
      paymentStatus = 'paid',
      paymentReference = '',
      transactionId = '',
    } = {}
  ) => {
    const job = await findJobSafely(jobIdentifier);

    if (!job) throw new Error('Bulk import job not found');
    if (job.status === 'completed' || job.status === 'COMPLETED') {
      throw new Error('This bulk batch has already been processed and imported.');
    }

    const validRecords = job.records.filter(
      (r) => r.status === 'valid' || r.status === 'VALID'
    );
    if (validRecords.length === 0) {
      throw new Error('No valid records found in this batch to import.');
    }

    job.status = 'processing';
    await job.save();

    // Fetch Plan Details
    let plan = await Plan.findOne({ code: job.planCode });
    if (!plan && job.plan?.planId && mongoose.isValidObjectId(job.plan.planId)) {
      plan = await Plan.findById(job.plan.planId);
    }

    // Validity end date (12 months or Plan durationDays)
    const validityDays = Number(plan?.durationDays) || 365;
    const validUntil = new Date(Date.now() + validityDays * 24 * 60 * 60 * 1000);

    // Calculate Slab Pricing
    const basePricing = calculateBulkPricing(plan, validRecords.length, 0);
    const afterSlabSubtotal = Math.max(0, basePricing.subtotalINR - basePricing.slabDiscountINR);

    // Optional Promo Coupon Calculation
    let couponDiscountINR = 0;
    let appliedCouponDoc = null;
    const cleanCoupon = cleanStr(couponCode || job.couponCode).toUpperCase();

    if (cleanCoupon) {
      const couponResult = await couponService.validateAndApplyCoupon({
        code: cleanCoupon,
        orderAmount: afterSlabSubtotal,
        userId: job.institutionId || null,
        userEmail: job.coordinator?.email || job.billingContact || '',
        userType: job.userType || 'UNIVERSITIES_COLLEGES',
        planCode: job.planCode,
      });
      couponDiscountINR = couponResult.discountApplied || 0;
      appliedCouponDoc = await Coupon.findById(couponResult.couponId);
    }

    const finalPricing = calculateBulkPricing(plan, validRecords.length, couponDiscountINR);
    if (String(paymentStatus).toLowerCase() === 'waived') {
      finalPricing.finalAmountINR = 0;
    }

    const invoiceNumber = `C-INV-${new Date().getFullYear()}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
    const batchRef = job.batchReference || job.jobId;

    // Shared default temporary password (matching User Portal so CSV credentials export works)
    const defaultHashedPassword = await bcrypt.hash('Nfi@2026!', 10);
    const perSeatFinalAmount =
      validRecords.length > 0
        ? Math.round(finalPricing.finalAmountINR / validRecords.length)
        : finalPricing.unitPriceINR;

    // Execute Subscriber & Subscription Creation
    for (let i = 0; i < job.records.length; i++) {
      const rec = job.records[i];
      if (rec.status !== 'valid' && rec.status !== 'VALID') continue;

      try {
        const emailPrefix = rec.email
          .split('@')[0]
          .toLowerCase()
          .replace(/[^a-z0-9_]/g, '');
        const username = `${emailPrefix || 'member'}_${crypto.randomBytes(2).toString('hex')}`;

        // 1. Create Subscriber Account (with full Institutional Linking)
        const newSubscriber = await Subscriber.create({
          name: rec.name || emailPrefix || 'Member',
          email: rec.email,
          username,
          password: defaultHashedPassword,
          phoneNumber: rec.phoneNumber || rec.phone,
          address: rec.address || job.coordinator?.address || '',
          userType: rec.userType || resolveMemberUserType(job.userType, rec.roleOrCategory),
          dynamicFields: {
            ...(rec.dynamicFields || {}),
            roleOrCategory: rec.roleOrCategory,
            rollOrEmployeeId: rec.rollOrEmployeeId,
            department: rec.department,
            collegeOrCompany: job.institutionName,
          },
          parentInstitutionId: job.institutionId || null,
          institutionName: job.institutionName,
          institution: job.institutionName,
          batchReference: batchRef,
          status: 'active',
          isActive: true,
          isEmailVerified: true,
          subscription: {
            status: 'active',
            planName: job.planName,
            tier: job.tier || 'Institutional',
            startDate: new Date(),
            endDate: validUntil,
            validUntil,
            isInstitutionalSeat: true,
          },
        });

        // 2. Create Official Subscription Pass
        const randomSubNum = Math.floor(10000 + Math.random() * 90000);
        const subscriptionId = `SUB-${new Date().getFullYear()}-${randomSubNum}`;

        const newSubscription = await Subscription.create({
          subscriptionId,
          user: newSubscriber._id,
          planName: job.planName,
          planCode: job.planCode,
          tier: job.tier || 'Institutional',
          type: String(paymentStatus).toLowerCase() === 'waived' ? 'complimentary' : 'paid',
          status: 'active',
          startDate: new Date(),
          endDate: validUntil,
          amount: finalPricing.unitPriceINR,
          discountPercent: finalPricing.slabDiscountPercent,
          finalAmount: perSeatFinalAmount,
          paymentMethod: paymentMethod || 'Institutional Invoice / NEFT',
          paymentStatus: 'success',
          paymentReference: paymentReference || transactionId || '',
          invoiceNumber,
          assignedBy: adminUser?._id || null,
          timeline: [
            {
              action: 'ASSIGNED',
              statusFrom: 'none',
              statusTo: 'active',
              performedBy: adminUser?.name || 'Super Admin',
              reason: `Bulk enrollment via Batch ${batchRef} for ${job.institutionName}. Ref: ${paymentReference || transactionId || 'N/A'}`,
            },
          ],
        });

        rec.status = 'imported';
        rec.userId = newSubscriber._id;
        rec.createdSubscriberId = newSubscriber._id;
        rec.subscriptionId = newSubscription.subscriptionId;
        rec.credentialsSent = true;
        rec.remarks = 'Enrolled successfully. Default password: Nfi@2026!';
      } catch (err) {
        rec.status = 'failed';
        rec.errors.push(err.message);
        rec.remarks = err.message;
      }
    }

    // Record Coupon Redemption if coupon was applied
    if (appliedCouponDoc && couponDiscountINR > 0) {
      appliedCouponDoc.usageCount = (appliedCouponDoc.usageCount || 0) + 1;
      appliedCouponDoc.redemptionHistory.push({
        user: job.institutionId || null,
        userEmail: job.coordinator?.email || job.billingContact || '',
        orderAmount: afterSlabSubtotal,
        discountApplied: couponDiscountINR,
        finalAmount: finalPricing.finalAmountINR,
        subscriptionId: batchRef,
        redeemedAt: new Date(),
      });
      await appliedCouponDoc.save();
    }

    const normPaymentStatus = String(paymentStatus || 'paid').toLowerCase();

    // Attach Consolidated Institutional Invoice with dynamic GST
    job.consolidatedInvoice = {
      invoiceNumber,
      institutionName: job.institutionName,
      billingContact:
        job.billingContact || job.coordinator?.email || job.coordinator?.name || '',
      billingAddress: job.coordinator?.address || '',
      gstin: job.coordinator?.gstin || '',
      pan: job.coordinator?.pan || '',
      state: job.coordinator?.state || '',
      totalSubscribers: validRecords.length,
      unitPriceINR: finalPricing.unitPriceINR,
      subtotalINR: finalPricing.subtotalINR,
      slabDiscountPercent: finalPricing.slabDiscountPercent,
      slabDiscountINR: finalPricing.slabDiscountINR,
      couponCode: cleanCoupon,
      couponDiscountINR: finalPricing.couponDiscountINR,
      discountINR: finalPricing.discountINR,
      taxPercent: finalPricing.taxPercent,
      taxAmountINR: finalPricing.taxAmountINR,
      finalAmountINR: finalPricing.finalAmountINR,
      paymentMethod: paymentMethod || 'Institutional Invoice / NEFT',
      paymentStatus: normPaymentStatus,
      paymentReference: paymentReference || transactionId || '',
      transactionId: transactionId || paymentReference || '',
      generatedAt: new Date(),
    };

    // Sync User-Portal compatible `invoice` object
    job.invoice = {
      invoiceNumber,
      invoiceDate: new Date(),
      subtotal: finalPricing.subtotalINR,
      discountAmount: finalPricing.discountINR,
      taxRate: finalPricing.taxPercent,
      taxAmount: finalPricing.taxAmountINR,
      totalAmount: finalPricing.finalAmountINR,
      paymentStatus: normPaymentStatus.toUpperCase(),
      paymentMethod: paymentMethod || 'Institutional Invoice / NEFT',
      paymentReference: paymentReference || transactionId || '',
      transactionId: transactionId || paymentReference || '',
      status: normPaymentStatus.toUpperCase(),
    };

    job.couponCode = cleanCoupon;
    job.paymentMethod = paymentMethod || 'Institutional Invoice / NEFT';
    job.paymentStatus = normPaymentStatus;
    job.status = 'completed';
    job.completedAt = new Date();
    await job.save();

    return normalizeJobDoc(job);
  },

  /**
   * 4. Get Past Bulk Imports History (Unified across Admin & User Portal)
   */
  getImportHistory: async ({ page = 1, limit = 10, search = '' }) => {
    const query = {};
    if (search && search.trim()) {
      const regex = new RegExp(search.trim(), 'i');
      query.$or = [
        { jobId: regex },
        { batchReference: regex },
        { fileName: regex },
        { uploadedFileName: regex },
        { institutionName: regex },
      ];
    }

    const pageNumber = Math.max(1, parseInt(page, 10));
    const pageSize = Math.max(1, Math.min(50, parseInt(limit, 10)));
    const skip = (pageNumber - 1) * pageSize;

    const [rawJobs, total] = await Promise.all([
      BulkImport.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(pageSize)
        .populate('importedBy', 'name email role')
        .lean(),
      BulkImport.countDocuments(query),
    ]);

    const jobs = rawJobs.map(normalizeJobDoc);

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
   * 5. Get Bulk Import Job Details by ID
   */
  getImportJobById: async (id) => {
    const job = await findJobSafely(id).populate('importedBy', 'name email role');
    if (!job) throw new Error('Bulk import job not found');
    return normalizeJobDoc(job);
  },

  /**
   * 6. Generate Downloadable Excel Error Report
   */
  generateErrorReport: async (jobIdentifier) => {
    const job = await findJobSafely(jobIdentifier);
    if (!job) throw new Error('Bulk import job not found');

    const normalized = normalizeJobDoc(job);
    const invalidRecords = normalized.records.filter(
      (r) => r.status === 'invalid' || r.status === 'failed'
    );
    if (invalidRecords.length === 0) {
      throw new Error('There are no errors or invalid records in this batch.');
    }

    const headers = [
      'Row #',
      'Full Name',
      'Email Address',
      'Mobile Number',
      'Category / Role',
      'Roll / Employee ID',
      'Department',
      'Failure Reason(s)',
    ];

    const rows = invalidRecords.map((r) => [
      r.rowNumber,
      r.name,
      r.email,
      r.phoneNumber || r.phone,
      r.roleOrCategory || r.userType,
      r.rollOrEmployeeId || '',
      r.department || '',
      Array.isArray(r.errors) && r.errors.length > 0 ? r.errors.join('; ') : r.remarks || '',
    ]);

    const wsData = [headers, ...rows];
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Error_Report');

    return XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
  },
};

export default bulkImportService;
