import mongoose from 'mongoose';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../../.env') });

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/nfi';
const DUMP_FILE = path.join(__dirname, 'database-dump.json');

export const importDatabase = async () => {
  try {
    console.log('====================================================');
    console.log('[Import DB] Starting Database Restore...');
    console.log(`[Target Database] URI: ${MONGO_URI}`);
    console.log(`[Dump File] Path: ${DUMP_FILE}`);
    console.log('====================================================');

    if (!fs.existsSync(DUMP_FILE)) {
      throw new Error(`Dump file not found at: ${DUMP_FILE}. Please ensure database-dump.json is present.`);
    }

    const rawData = fs.readFileSync(DUMP_FILE, 'utf-8');
    const dump = JSON.parse(rawData);

    await mongoose.connect(MONGO_URI);
    const db = mongoose.connection.db;

    console.log(`Dump was generated at: ${dump.exportedAt || 'N/A'}`);
    const collectionNames = Object.keys(dump.collections || {});

    console.log(`\nFound ${collectionNames.length} collections to restore:`);

    for (const colName of collectionNames) {
      const docs = dump.collections[colName];
      if (!Array.isArray(docs) || docs.length === 0) {
        console.log(`  - '${colName}': 0 documents (skipped)`);
        continue;
      }

      const collection = db.collection(colName);

      // Clean existing data in collection before importing
      await collection.deleteMany({});

      // Insert all documents from the dump
      await collection.insertMany(docs);
      console.log(`  ✓ Restored '${colName}': ${docs.length} documents inserted.`);
    }

    console.log('\n====================================================');
    console.log('🎉 [SUCCESS] ALL DATABASE COLLECTIONS RESTORED SUCCESSFULLY!');
    console.log('====================================================\n');

    process.exit(0);
  } catch (error) {
    console.error('\n❌ [IMPORT ERROR] Failed to import database:', error);
    process.exit(1);
  }
};

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  importDatabase();
}
