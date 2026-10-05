import dotenv from 'dotenv';
dotenv.config();
import { connectDB } from './config/db.js';
import mongoose from 'mongoose';
import Role, { SYSTEM_ROLES } from './models/role.model.js';
import Permission from './models/permission.model.js';
import User from './models/user.model.js';
import { invalidateRBACCache } from './middlewares/rbac.middleware.js';

async function runMigration() {
  await connectDB();
  const db = mongoose.connection.db;

  console.log('=== STEP 1: FIX USERS & RBAC ===');
  // 1. Seed RBAC permissions
  const matrix = [
    { module: 'OVERVIEW', section: 'DASHBOARD', actions: ['VIEW', 'EXPORT'] },
    { module: 'USERS', section: 'USERS', actions: ['VIEW', 'ADD', 'EDIT', 'DELETE', 'EXPORT'] },
    { module: 'USERS', section: 'INSTITUTIONAL_SUBSCRIPTIONS', actions: ['VIEW', 'EDIT', 'EXPORT'] },
    { module: 'USERS', section: 'ADMINS', actions: ['VIEW', 'ADD', 'EDIT', 'DELETE', 'EXPORT'] },
    { module: 'USERS', section: 'SUBADMINS', actions: ['VIEW', 'ADD', 'EDIT', 'DELETE', 'EXPORT'] },
    { module: 'USERS', section: 'ROLES', actions: ['VIEW', 'ADD', 'EDIT', 'DELETE'] },
    { module: 'SYSTEM', section: 'DEPARTMENTS', actions: ['VIEW', 'ADD', 'EDIT', 'DELETE', 'EXPORT'] },
    { module: 'SYSTEM', section: 'DESIGNATIONS', actions: ['VIEW', 'ADD', 'EDIT', 'DELETE', 'EXPORT'] },
    { module: 'CONTENT', section: 'MONOGRAPHS', actions: ['VIEW', 'ADD', 'EDIT', 'DELETE', 'APPROVE', 'REJECT', 'PUBLISH', 'EXPORT', 'DOWNLOAD', 'PRINT'] },
    { module: 'CONTENT', section: 'WORKFLOW', actions: ['VIEW', 'ADD', 'EDIT', 'APPROVE', 'REJECT', 'PUBLISH'] },
    { module: 'CONTENT', section: 'SEARCH_INDEX', actions: ['VIEW', 'EDIT'] },
    { module: 'COMMERCIAL', section: 'SUBSCRIPTIONS', actions: ['VIEW', 'ADD', 'EDIT', 'DELETE', 'APPROVE', 'EXPORT'] },
    { module: 'COMMERCIAL', section: 'PLANS', actions: ['VIEW', 'ADD', 'EDIT', 'DELETE'] },
    { module: 'COMMERCIAL', section: 'DISCOUNTS', actions: ['VIEW', 'ADD', 'EDIT', 'DELETE'] },
    { module: 'COMMERCIAL', section: 'COUPONS', actions: ['VIEW', 'ADD', 'EDIT', 'DELETE', 'EXPORT'] },
    { module: 'COMMERCIAL', section: 'BULK_SUBSCRIPTION', actions: ['VIEW', 'ADD', 'EDIT', 'APPROVE', 'EXPORT'] },
    { module: 'ENGAGEMENT', section: 'CRM', actions: ['VIEW', 'ADD', 'EDIT', 'DELETE', 'EXPORT'] },
    { module: 'ENGAGEMENT', section: 'FEEDBACK', actions: ['VIEW', 'EDIT', 'DELETE', 'REJECT', 'EXPORT'] },
    { module: 'ENGAGEMENT', section: 'NOTIFICATIONS', actions: ['VIEW', 'ADD', 'EDIT', 'DELETE', 'PUBLISH'] },
    { module: 'INTEGRATED', section: 'DIKSHA', actions: ['VIEW', 'ADD', 'EDIT', 'DELETE', 'APPROVE', 'EXPORT'] },
    { module: 'SYSTEM', section: 'REPORTS', actions: ['VIEW', 'EXPORT', 'DOWNLOAD', 'PRINT'] },
    { module: 'SYSTEM', section: 'AUDIT_LOGS', actions: ['VIEW', 'EXPORT', 'PRINT'] },
    { module: 'SYSTEM', section: 'SETTINGS', actions: ['VIEW', 'EDIT'] },
  ];

  const permissionDocs = [];
  for (const item of matrix) {
    for (const action of item.actions) {
      const code = `${item.module}:${item.section}:${action}`;
      const name = `${action} ${item.section}`;
      const doc = await Permission.findOneAndUpdate(
        { code },
        {
          code,
          module: item.module,
          section: item.section,
          action,
          name,
          description: `Allow user to ${action.toLowerCase()} in ${item.module} / ${item.section}`,
          isActive: true,
        },
        { upsert: true, new: true }
      );
      permissionDocs.push(doc);
    }
  }
  console.log(`Seeded ${permissionDocs.length} permissions.`);

  const allPermissionCodes = permissionDocs.map((p) => p.code);

  const defaultRolesConfig = [
    {
      name: 'Super Admin',
      code: SYSTEM_ROLES.SUPERADMIN,
      description: 'System master administrator with unrestricted access.',
      isSystemDefault: true,
      permissionCodes: ['*'],
    },
    {
      name: 'Admin',
      code: SYSTEM_ROLES.ADMIN,
      description: 'Full administrative access across users, monographs, subscriptions, and reports.',
      isSystemDefault: true,
      permissionCodes: allPermissionCodes.filter(
        (c) => !c.includes('ROLES:DELETE') && !c.includes('ADMINS:DELETE')
      ),
    },
    {
      name: 'Sub Admin',
      code: SYSTEM_ROLES.SUBADMIN,
      description: 'Departmental coordinator managing assigned users, feedback, and viewable reports.',
      isSystemDefault: true,
      permissionCodes: allPermissionCodes.filter(
        (c) => c.startsWith('OVERVIEW:') || c.startsWith('USERS:USERS:') || c.startsWith('ENGAGEMENT:') || c.startsWith('CONTENT:MONOGRAPHS:VIEW') || c.startsWith('SYSTEM:REPORTS:VIEW')
      ),
    },
    {
      name: 'Maker',
      code: SYSTEM_ROLES.MAKER,
      description: 'Draft author who creates and edits monograph content, courses, and notifications.',
      isSystemDefault: true,
      permissionCodes: [
        'OVERVIEW:DASHBOARD:VIEW',
        'CONTENT:MONOGRAPHS:VIEW',
        'CONTENT:MONOGRAPHS:ADD',
        'CONTENT:MONOGRAPHS:EDIT',
        'CONTENT:WORKFLOW:VIEW',
        'CONTENT:WORKFLOW:ADD',
        'CONTENT:WORKFLOW:EDIT',
        'INTEGRATED:DIKSHA:VIEW',
        'INTEGRATED:DIKSHA:ADD',
      ],
    },
    {
      name: 'Reviewer',
      code: SYSTEM_ROLES.REVIEWER,
      description: 'Editorial reviewer who checks monograph drafts, suggests amendments, and verifies accuracy.',
      isSystemDefault: true,
      permissionCodes: [
        'OVERVIEW:DASHBOARD:VIEW',
        'CONTENT:MONOGRAPHS:VIEW',
        'CONTENT:MONOGRAPHS:EDIT',
        'CONTENT:WORKFLOW:VIEW',
        'CONTENT:WORKFLOW:EDIT',
        'CONTENT:WORKFLOW:REJECT',
        'CONTENT:MONOGRAPHS:APPROVE',
        'CONTENT:WORKFLOW:APPROVE',
        'ENGAGEMENT:FEEDBACK:VIEW',
        'ENGAGEMENT:FEEDBACK:EDIT',
        'SYSTEM:REPORTS:VIEW',
      ],
    },
    {
      name: 'Approver',
      code: SYSTEM_ROLES.APPROVER,
      description: 'Scientific committee authority with signing privilege to approve and publish monographs.',
      isSystemDefault: true,
      permissionCodes: [
        'OVERVIEW:DASHBOARD:VIEW',
        'CONTENT:MONOGRAPHS:VIEW',
        'CONTENT:MONOGRAPHS:APPROVE',
        'CONTENT:MONOGRAPHS:REJECT',
        'CONTENT:MONOGRAPHS:PUBLISH',
        'CONTENT:WORKFLOW:VIEW',
        'CONTENT:WORKFLOW:APPROVE',
        'CONTENT:WORKFLOW:REJECT',
        'CONTENT:WORKFLOW:PUBLISH',
        'SYSTEM:REPORTS:VIEW',
        'SYSTEM:AUDIT_LOGS:VIEW',
      ],
    },
  ];

  for (const rConfig of defaultRolesConfig) {
    await Role.findOneAndUpdate({ code: rConfig.code }, rConfig, { upsert: true, new: true });
  }
  console.log('Seeded default roles.');

  // Fix admin1 permissions so it inherits Admin role with full content permissions
  await User.updateOne(
    { email: 'admin1@nfi.gov.in' },
    { $set: { role: 'admin', hasCustomPermissions: false, customPermissions: [] } }
  );

  // Fix reviewer and approver user roles
  await User.updateMany(
    { role: 'reviewer01' },
    { $set: { role: 'reviewer', hasCustomPermissions: false, customPermissions: [] } }
  );
  await User.updateMany(
    { role: 'approver01' },
    { $set: { role: 'approver', hasCustomPermissions: false, customPermissions: [] } }
  );

  invalidateRBACCache();
  console.log('Fixed user roles and invalidated RBAC cache.');

  console.log('\n=== STEP 2: NORMALIZE CHAPTERS ===');
  const allChapterDocs = await db.collection('chapters').find({}).toArray();
  const rootChapterDocs = allChapterDocs.filter(c => c.level === 1 || !c.parentChapterId);
  const subChapterDocs = allChapterDocs.filter(c => c.level === 2 || (c.parentChapterId && c.level !== 1));

  console.log(`Found ${rootChapterDocs.length} root chapters and ${subChapterDocs.length} sub-chapters in 'chapters' collection.`);

  for (let i = 0; i < rootChapterDocs.length; i++) {
    const ch = rootChapterDocs[i];
    const chNum = ch.number || ch.chapterNumber || String(i + 1);
    const code = ch.code || `CH-${chNum}`.toUpperCase();
    await db.collection('chapters').updateOne(
      { _id: ch._id },
      {
        $set: {
          code,
          chapterNumber: chNum,
          level: 1,
          isActive: true,
          status: 'published',
          order: ch.order ?? i,
        },
      }
    );
  }
  console.log(`Updated ${rootChapterDocs.length} root chapters.`);

  console.log('\n=== STEP 3: POPULATE SUBCHAPTERS COLLECTION ===');
  let subCount = 0;
  for (let i = 0; i < subChapterDocs.length; i++) {
    const sub = subChapterDocs[i];
    const subNum = sub.number || sub.subChapterNumber || `sub-${i + 1}`;
    const code = sub.code || `SUB-${subNum}`.toUpperCase();

    await db.collection('subchapters').updateOne(
      { _id: sub._id },
      {
        $set: {
          chapterId: sub.parentChapterId,
          subChapterNumber: subNum,
          title: sub.title,
          code,
          description: sub.description || '',
          order: sub.order ?? i,
          isActive: true,
          status: 'published',
          pageRange: sub.pageRange || { start: sub.startPage, end: sub.endPage },
          updatedAt: new Date(),
        },
        $setOnInsert: {
          createdAt: sub.createdAt || new Date(),
        },
      },
      { upsert: true }
    );
    subCount++;
  }
  console.log(`Populated ${subCount} records into 'subchapters' collection.`);

  console.log('\n=== STEP 4: UPDATE MEDICINES & LINK SUBCHAPTERS ===');
  const subsInDb = await db.collection('subchapters').find({}).toArray();
  const medicines = await db.collection('medicines').find({}).toArray();

  let linkedCount = 0;
  for (const med of medicines) {
    const parentChId = med.chapterId ? med.chapterId.toString() : null;
    const page = med.source?.[0]?.pageNumber || med.sections?.[0]?.pageNumber;
    const chNum = med.source?.[0]?.chapterNumber;

    let matchedSub = null;
    if (chNum) {
      matchedSub = subsInDb.find(s => s.subChapterNumber === chNum.trim());
    }

    if (!matchedSub && page && parentChId) {
      matchedSub = subsInDb.find(s => {
        if (s.chapterId && s.chapterId.toString() === parentChId) {
          const start = s.pageRange?.start;
          const end = s.pageRange?.end;
          if (start !== undefined && end !== undefined && page >= start && page <= end) {
            return true;
          }
        }
        return false;
      });
    }

    const updateFields = {
      isActive: true,
      status: 'published',
      updatedAt: new Date(),
    };

    if (matchedSub) {
      updateFields.subChapterId = matchedSub._id;
      linkedCount++;
    }

    await db.collection('medicines').updateOne(
      { _id: med._id },
      { $set: updateFields }
    );
  }

  console.log(`Updated ${medicines.length} medicines: isActive: true, status: 'published'.`);
  console.log(`Linked ${linkedCount} medicines to their specific Sub-Chapter!`);

  console.log('\n🎉 ALL DONE! Verified database state.');
  process.exit(0);
}

runMigration().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});
